
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Save, X, Upload, ChevronRight, BookOpen, Brain, 
  Clock, Target, Sparkles, FileText, BarChart3, AlertCircle,
  Zap, ChevronLeft, CheckCircle2, ShieldCheck, Timer, Info
} from 'lucide-react';
import { FocusGoal, Test, Question, UserProfile, TestSubmission } from '../types/academic';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, onSnapshot, query, where, setDoc } from 'firebase/firestore';

interface ExaminationHallProps {
  profile: UserProfile | null;
  availableTests: Test[];
  onBackToStudy: () => void;
}

const ExaminationHall: React.FC<ExaminationHallProps> = ({ profile, availableTests, onBackToStudy }) => {
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [examState, setExamState] = useState<'lobby' | 'taking' | 'completed'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [questionTimes, setQuestionTimes] = useState<{ [key: string]: number }>({});
  const [violations, setViolations] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Visibility tracking (Tab Lock simulation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && examState === 'taking') {
        setViolations(prev => prev + 1);
        console.warn("Integrity Alert: Background transition detected.");
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examState]);

  // Filter tests matching student class and focus goal
  const filteredTests = useMemo(() => {
    return availableTests.filter(t => 
        t.status === 'Published' && 
        t.classId === profile?.selectedClassId
    );
  }, [availableTests, profile?.selectedClassId]);

  const isTestLocked = (test: Test) => {
    if (!test.prerequisiteTopicId || !profile?.progress?.topicMastery) return false;
    return profile.progress.topicMastery[test.prerequisiteTopicId] !== 'Mastered';
  };

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examState === 'taking' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examState === 'taking') {
      handleSubmitTest();
    }
    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  const handleStartTest = (test: Test) => {
    if (isTestLocked(test)) {
      alert("Checkpoint Active: You must complete and master the prerequisite topic first.");
      return;
    }
    
    // Shuffle questions for this session
    const shuffled = [...test.questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    
    setActiveTest(test);
    setTimeLeft(test.duration * 60);
    setAnswers({});
    setQuestionTimes({});
    setViolations(0);
    setCurrentQuestionIndex(0);
    setExamState('taking');
    setStartTime(Date.now());
    setIsReviewMode(false);
  };

  // Track time per question
  useEffect(() => {
    if (examState !== 'taking' || !shuffledQuestions[currentQuestionIndex]) return;
    
    const startQTime = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startQTime) / 1000);
      const qid = shuffledQuestions[currentQuestionIndex].id;
      setQuestionTimes(prev => ({
        ...prev,
        [qid]: (prev[qid] || 0) + duration
      }));
    };
  }, [currentQuestionIndex, examState, shuffledQuestions]);

  const handleSubmitTest = async () => {
    if (!activeTest || !profile) return;
    
    setExamState('completed');
    
    const score = activeTest.questions.reduce((acc, q) => {
      if (answers[q.id] === q.correctAnswer) {
        return acc + (activeTest.totalMarks / activeTest.questions.length);
      }
      return acc;
    }, 0);

    const submissionData: TestSubmission = {
      id: 'sub-' + Date.now(),
      testId: activeTest.id,
      studentId: profile.uid,
      answers,
      score: Math.round(score * 100) / 100,
      totalMarks: activeTest.totalMarks,
      timeSpent: (activeTest.duration * 60) - timeLeft,
      status: 'COMPLETED',
      submittedAt: new Date().toISOString(),
      analysis: {
        accuracy: (Object.keys(answers).filter(qid => {
            const q = activeTest.questions.find(quest => quest.id === qid);
            return q?.correctAnswer === answers[qid];
        }).length / activeTest.questions.length) * 100,
        speedScore: Math.max(0, 100 - ((activeTest.duration * 60 - timeLeft) / (activeTest.duration * 60)) * 50),
        timePerQuestion: questionTimes,
        integrityViolations: violations,
        strengthAreas: activeTest.questions.filter(q => answers[q.id] === q.correctAnswer).map(q => q.topicId),
        weakAreas: activeTest.questions.filter(q => answers[q.id] !== q.correctAnswer).map(q => q.topicId),
        nyraSummary: violations > 2 
            ? "Multiple integrity flags detected during the scan. This might invalidate the session. Focus on steady concentration."
            : "You performed strongly in core concepts. Focus on calculation speed during HARD problems.",
        mistakeAnalysis: {},
        mistakeCategories: {
          conceptual: activeTest.questions.filter(q => answers[q.id] !== q.correctAnswer && q.difficulty !== 'EASY').length,
          calculation: activeTest.questions.filter(q => answers[q.id] !== q.correctAnswer && q.difficulty === 'HARD').length,
          careless: activeTest.questions.filter(q => answers[q.id] !== q.correctAnswer && q.difficulty === 'EASY').length,
          timeManagement: Object.values(questionTimes).filter(t => t > 120).length // more than 2 mins on one Q
        }
      }
    };

    try {
      // Use a composite ID to ensure one submission per student per test, or unique ID for history
      const submissionId = `${activeTest.id}_${profile.uid}`;
      const submissionDocRef = doc(db, 'submissions', submissionId);
      await setDoc(submissionDocRef, submissionData)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, submissionDocRef.path));
      setSubmission(submissionData);
    } catch (err) {
      console.error("Critical: Failed to sync mission data to orbit.", err);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (examState === 'taking' && activeTest) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    return (
      <div className="fixed inset-0 bg-nyra-dark z-[100] flex flex-col font-sans">
        {/* NTA STYLE HEADER */}
        <header className="bg-slate-900 border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-nyra-primary rounded-xl flex items-center justify-center shadow-lg shadow-nyra-primary/20">
                <ShieldCheck className="text-white" size={20} />
             </div>
             <div>
                <h2 className="font-display font-bold text-lg leading-tight uppercase tracking-tight">{activeTest.title}</h2>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{activeTest.examType} PROCTORING ACTIVE</p>
                    {violations > 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                            <AlertCircle size={10} /> {violations} Flags Detected
                        </span>
                    )}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                <Timer className={timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-nyra-primary"} size={20} />
                <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? "text-rose-500" : "text-white"}`}>
                    {formatTime(timeLeft)}
                </span>
             </div>
             <button 
                onClick={() => {
                    if (window.confirm("Do you want to end the test session now?")) {
                        handleSubmitTest();
                    }
                }}
                className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
             >
                Submit Mission
             </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* QUESTION AREA */}
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.02),transparent)]">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-nyra-primary/20 text-nyra-primary rounded-xl font-black text-sm">
                        Q.{currentQuestionIndex + 1}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {currentQuestion.difficulty}
                    </span>
                </div>
                
                <div className="text-xl font-medium leading-relaxed text-slate-200">
                    {currentQuestion.text}
                </div>

                {currentQuestion.imageUrl && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden">
                        <img src={currentQuestion.imageUrl} alt="Diagram" className="max-w-full h-auto rounded-xl mx-auto" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
                    {currentQuestion.options.map((opt, i) => (
                        <button 
                            key={i}
                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: i }))}
                            className={`flex items-center gap-4 p-6 rounded-[2rem] border transition-all text-left group ${
                                answers[currentQuestion.id] === i 
                                ? 'bg-nyra-primary border-nyra-primary text-white shadow-xl shadow-nyra-primary/20' 
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:border-nyra-primary/30 hover:bg-white/5'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                answers[currentQuestion.id] === i ? 'bg-white text-nyra-primary' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                            }`}>
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="font-medium">{opt}</span>
                        </button>
                    ))}
                </div>
            </div>
          </div>

          {/* PALETTE SIDEBAR */}
          <div className="w-[380px] bg-slate-900 border-l border-white/10 p-8 flex flex-col gap-8 shadow-2xl">
             <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Navigation Hub</h3>
                <div className="grid grid-cols-5 gap-3">
                    {shuffledQuestions.map((_, i) => (
                        <button 
                            key={i}
                            onClick={() => setCurrentQuestionIndex(i)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs transition-all border ${
                                currentQuestionIndex === i 
                                ? 'bg-white text-nyra-dark border-white shadow-lg' 
                                : answers[shuffledQuestions[i].id] !== undefined
                                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                    : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
             </div>

             <div className="flex-1" />

             <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Neural Status</p>
                 <div className="space-y-2">
                     <div className="flex items-center justify-between text-[10px]">
                         <span className="text-slate-400">Time on current Q:</span>
                         <span className="font-mono text-nyra-primary">{formatTime(Math.floor((Date.now() - (startTime + (timeLeft * 1000))) / -1000) % 60)}s</span>
                     </div>
                     <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                            className="h-full bg-nyra-primary"
                            animate={{ width: `${(answers[shuffledQuestions[currentQuestionIndex].id] !== undefined ? 100 : 0)}%` }}
                         />
                     </div>
                 </div>
             </div>

             <div className="mb-4">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Color Key</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" /> Answered
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="w-3 h-3 rounded-full bg-white/10" /> Unanswered
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
                <button 
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex items-center justify-center gap-2 px-4 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <button 
                    disabled={currentQuestionIndex === shuffledQuestions.length - 1}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center justify-center gap-2 px-4 py-4 bg-nyra-primary/10 text-nyra-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-nyra-primary hover:text-white disabled:opacity-30 transition-all border border-nyra-primary/20"
                >
                    Next <ChevronRight size={16} />
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'completed' && submission && activeTest) {
      return (
          <div className="space-y-8 animate-in fade-in duration-700">
              <div className="p-12 bg-slate-900 border border-white/5 rounded-[4rem] text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </div>
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg"
                    >
                        <Sparkles size={16} />
                    </motion.div>
                </div>

                <div>
                    <h2 className="text-4xl font-display font-bold mb-2">Neural Scan Complete</h2>
                    <p className="text-slate-400 tracking-wide">Mission data has been processed and analyzed by Nyra</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    <div className="p-6 bg-nyra-dark rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Score</p>
                        <p className="text-2xl font-bold font-mono">{submission.score} / {submission.totalMarks}</p>
                    </div>
                    <div className="p-6 bg-nyra-dark rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Accuracy</p>
                        <p className="text-2xl font-bold font-mono text-emerald-400">{Math.round(submission.analysis?.accuracy || 0)}%</p>
                    </div>
                    <div className="p-6 bg-nyra-dark rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Spent</p>
                        <p className="text-2xl font-bold font-mono">{Math.floor(submission.timeSpent / 60)}m {submission.timeSpent % 60}s</p>
                    </div>
                    <div className="p-6 bg-nyra-dark rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Percentile</p>
                        <p className="text-2xl font-bold font-mono text-nyra-primary">92%</p>
                    </div>
                </div>

                <div className="p-8 bg-nyra-primary/5 border border-nyra-primary/10 rounded-[2.5rem] max-w-2xl mx-auto text-left relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-nyra-primary opacity-20">
                        <Sparkles size={32} />
                    </div>
                    <h4 className="text-sm font-black text-nyra-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Brain size={16} />
                        Nyra's Neural Debrief
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{submission.analysis?.nyraSummary}"
                    </p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <button 
                        onClick={() => setIsReviewMode(!isReviewMode)}
                        className="px-10 py-5 bg-nyra-primary text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-nyra-primary/90 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)]"
                    >
                        {isReviewMode ? "Hide Insights" : "Detailed Insights"}
                    </button>
                    <button 
                         onClick={() => {
                             setExamState('lobby');
                             setActiveTest(null);
                             setSubmission(null);
                             setIsReviewMode(false);
                         }}
                         className="px-10 py-5 bg-white/5 border border-white/5 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        Back to Lobby
                    </button>
                </div>

                <AnimatePresence>
                    {isReviewMode && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-12 text-left space-y-8 overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <BarChart3 className="text-nyra-primary" />
                                    Post-Mission Debrief
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full">
                                        <CheckCircle2 size={12} /> Correct
                                    </span>
                                    <span className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest px-3 py-1 bg-rose-500/10 rounded-full">
                                        <X size={12} /> Incorrect
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {activeTest.questions.map((q, idx) => {
                                    const isCorrect = answers[q.id] === q.correctAnswer;
                                    const timeOnQ = questionTimes[q.id] || 0;
                                    return (
                                        <div key={q.id} className="p-8 bg-nyra-dark border border-white/5 rounded-[3rem] space-y-6 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center font-black text-xs text-slate-500">
                                                        {idx + 1}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                        isCorrect ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    }`}>
                                                        {isCorrect ? 'Logic Verified' : 'Collision Detected'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                        Time: {timeOnQ}s
                                                    </span>
                                                </div>
                                                <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                    {q.difficulty}
                                                </div>
                                            </div>

                                            <p className="font-medium text-slate-300 leading-relaxed">{q.text}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt, i) => {
                                                    const isSelected = answers[q.id] === i;
                                                    const isRight = q.correctAnswer === i;
                                                    let borderClass = 'border-white/5';
                                                    if (isSelected && isCorrect) borderClass = 'border-emerald-500 bg-emerald-500/5';
                                                    else if (isSelected && !isCorrect) borderClass = 'border-rose-500 bg-rose-500/5';
                                                    else if (isRight) borderClass = 'border-emerald-500/50 bg-emerald-500/5';

                                                    return (
                                                        <div key={i} className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${borderClass}`}>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-slate-600">{String.fromCharCode(65 + i)}</span>
                                                                <span className={isSelected ? 'font-bold' : 'text-slate-400'}>{opt}</span>
                                                            </div>
                                                            {isRight && <CheckCircle2 size={16} className="text-emerald-500" />}
                                                            {isSelected && !isCorrect && <X size={16} className="text-rose-500" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="p-6 bg-nyra-primary/5 border border-nyra-primary/10 rounded-[2rem] space-y-2">
                                                <h4 className="text-[10px] font-black text-nyra-primary uppercase tracking-widest flex items-center gap-2">
                                                    <Sparkles size={12} />
                                                    Nyra's Neural Root
                                                </h4>
                                                <p className="text-xs text-slate-400 leading-relaxed italic">
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <Zap size={12} /> Live Examination Sector
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tight">The Neural Hall</h2>
          <p className="text-slate-500 max-w-xl">Simulated exam environment with NTA patterns. Integrity proctoring and real-time analysis enabled.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Hall Status</p>
                    <p className="text-xs font-bold text-emerald-500">OPERATIONAL</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[4rem] opacity-30">
                <ShieldCheck size={64} className="mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-2">No Active Missions</h3>
                <p className="text-sm">Check back later or complete prerequisites.</p>
            </div>
        ) : (
            filteredTests.map((test) => (
                <div key={test.id} className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] group hover:border-nyra-primary/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-white opacity-[0.03] group-hover:opacity-[0.08] transition-all rotate-12">
                        <FileText size={120} />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="px-3 py-1 bg-nyra-primary/10 border border-nyra-primary/20 text-nyra-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                            {test.examType}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Clock size={12} /> {test.duration}m
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-4 group-hover:text-nyra-primary transition-colors">{test.title}</h3>
                    <p className="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed">{test.description}</p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Max Potential</span>
                            <span className="font-mono text-sm font-bold">{test.totalMarks} Points</span>
                        </div>
                        <button 
                            onClick={() => handleStartTest(test)}
                            className="px-6 py-3 bg-nyra-primary/10 border border-nyra-primary/20 text-nyra-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-nyra-primary hover:text-white transition-all shadow-xl shadow-nyra-primary/5"
                        >
                            Initiate Exam
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[3rem] flex items-start gap-6">
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Info size={24} />
          </div>
          <div className="space-y-2">
              <h4 className="font-bold text-amber-400">Mission Protocols (Student Guidelines)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                  The Neural Hall uses advanced behavioral tracking. Switching tabs, minimizing the window, or using external AI assistants may trigger an integrity alarm. Ensure a stable neural link (internet) before initiating high-frequency assessments.
              </p>
          </div>
      </div>
    </div>
  );
};

export default ExaminationHall;
