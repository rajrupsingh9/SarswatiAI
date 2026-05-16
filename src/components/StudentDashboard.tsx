import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, GraduationCap, ArrowRight, BookOpen, ChevronRight, ChevronDown,
  LogOut, Info, User, Upload, Flame, Trophy, TrendingUp, 
  BarChart2, Clock, Target, Star, LayoutDashboard, AlertCircle,
  Mic, MicOff, MessageSquare, Sparkles, Bell, Zap, Calendar, X, Brain,
  CheckCircle2, Circle, Lock, Layers, ArrowLeft, Fingerprint, Activity
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useLiveAPI } from '../hooks/useLiveAPI';
import { collection, onSnapshot, query, orderBy, limit, collectionGroup, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ClassData, UserProfile, TextLayer, TestSubmission } from '../types/academic';
import ExaminationHall from './ExaminationHall';
import { StudentManual } from './UserManual';
import StudentAnalytics from './StudentAnalytics';

interface StudentDashboardProps {
  profile: UserProfile | null;
  classes: ClassData[];
  onLogout: () => void;
  onAdminSwitch?: () => void;
  onProfile: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onPerformanceIntel: () => void;
  onSelectTopic: (topic: any, chapterTopics?: any[]) => void;
}

// Mini Chat Component for Progress Review
const ProgressChat = ({ messages }: { messages: { role: string, text: string }[] }) => (
  <div className="flex flex-col gap-3 h-[300px] overflow-y-auto mb-4 p-4 bg-black/20 rounded-2xl border border-white/5 custom-scrollbar">
    {messages.map((m, i) => (
      <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${m.role === 'user' ? 'bg-nyra-primary/20 text-white self-end rounded-tr-none' : 'bg-white/5 text-slate-300 self-start rounded-tl-none'}`}>
        {m.text}
      </div>
    ))}
    {messages.length === 0 && (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
        <Sparkles size={32} className="mb-2" />
        <p className="text-[10px] uppercase font-black tracking-widest text-center">Nyra is analyzing your data...<br/>Talk to her below!</p>
      </div>
    )}
  </div>
);

const ADMIN_EMAIL = 'nikhiliitjee.21@gmail.com';

const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile, classes, onLogout, onAdminSwitch, onProfile, onUpdateProfile, onPerformanceIntel, onSelectTopic }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'hub' | 'exam-hall' | 'help' | 'syllabus' | 'flashcards'>('study');
  const [isReviewingWithNyra, setIsReviewingWithNyra] = useState(false);
  const [reviewMessages, setReviewMessages] = useState<{ role: string, text: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(profile?.selectedClassId || null);
  
  // Sync selectedClassId with profile changes
  useEffect(() => {
    if (profile?.selectedClassId && profile.selectedClassId !== selectedClassId) {
      setSelectedClassId(profile.selectedClassId);
    }
  }, [profile?.selectedClassId]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [testSubmissions, setTestSubmissions] = useState<TestSubmission[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showCardBack, setShowCardBack] = useState(false);
  const [isFlashcardReviewActive, setIsFlashcardReviewActive] = useState(false);

  const handleRateFlashcard = (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!profile || !onUpdateProfile) return;
    
    const card = profile.flashcards?.find(c => c.id === cardId);
    if (!card) return;

    let newInterval = 1;
    let newEase = card.easeFactor || 2.5;
    const currentDueCards = profile.flashcards?.filter(c => new Date(c.nextReview) <= new Date()) || [];

    switch(rating) {
      case 'again': newInterval = 0; newEase = Math.max(1.3, newEase - 0.2); break;
      case 'hard': newInterval = Math.max(1, card.interval * 1.2); newEase = Math.max(1.3, newEase - 0.15); break;
      case 'good': newInterval = Math.max(1, card.interval * newEase); break;
      case 'easy': newInterval = Math.max(1, card.interval * newEase * 1.3); newEase = Math.min(2.5, newEase + 0.15); break;
    }

    const nextDate = new Date();
    if (newInterval === 0) {
      nextDate.setMinutes(nextDate.getMinutes() + 1);
    } else {
      nextDate.setDate(nextDate.getDate() + Math.ceil(newInterval));
    }

    const updatedCards = profile.flashcards?.map(c => 
      c.id === cardId ? { 
        ...c, 
        interval: newInterval, 
        easeFactor: newEase, 
        reps: c.reps + 1,
        nextReview: nextDate.toISOString() 
      } : c
    );

    onUpdateProfile({ flashcards: updatedCards });
    
    if (currentFlashcardIndex < (currentDueCards.length - 1)) {
      setCurrentFlashcardIndex(prev => prev + 1);
      setShowCardBack(false);
    } else {
      setIsFlashcardReviewActive(false);
      setShowCardBack(false);
      setCurrentFlashcardIndex(0);
      alert("Session Complete! Your neurons are glowing.");
    }
  };

  const dueCards = profile?.flashcards?.filter(c => new Date(c.nextReview) <= new Date()) || [];

  // Sync announcements, tests, and student submissions
  useEffect(() => {
    const qAnn = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(5));
    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      const anns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(anns);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));

    const qTests = query(collection(db, 'tests'), orderBy('createdAt', 'desc'));
    const unsubTests = onSnapshot(qTests, (snapshot) => {
      const ts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTests(ts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tests'));

    if (profile?.uid) {
      const qSubs = query(
        collection(db, 'submissions'), 
        where('studentId', '==', profile.uid)
      );
      const unsubSubs = onSnapshot(qSubs, (snapshot) => {
        const subs = snapshot.docs.map(doc => doc.data() as TestSubmission);
        setTestSubmissions(subs);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'submissions'));
      return () => {
        unsubAnn();
        unsubTests();
        unsubSubs();
      };
    }

    return () => {
      unsubAnn();
      unsubTests();
    };
  }, [profile?.uid]);
  
  // The goal selection modal is removed because it's now handled in the registration form.
  const [showGoalSelection, setShowGoalSelection] = useState(false);

  // Sync profile goal if it exists in localStorage but not in profile
  useEffect(() => {
    if (profile && !profile.focusGoal) {
      const savedGoal = localStorage.getItem(`nyra_goal_${profile.uid}`);
      if (savedGoal && onUpdateProfile) {
        onUpdateProfile({ focusGoal: savedGoal as any });
      }
    }
  }, [profile, onUpdateProfile]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = selectedClass?.subjects.find(s => s.id === selectedSubjectId);
  
  // Contextual Filtering: Show content matching user goal OR universal content
  const filteredChapters = useMemo(() => {
    if (!selectedSubject) return [];
    return selectedSubject.chapters.filter(ch => {
      if (!ch.focus || ch.focus === 'UNIVERSAL') return true;
      if (ch.focus === profile?.focusGoal) return true;
      // Bonus: JEE students can see Boards content for basics
      if (profile?.focusGoal === 'JEE' && ch.focus === 'BOARDS') return true;
      return false;
    });
  }, [selectedSubject, profile?.focusGoal]);

  const selectedChapter = filteredChapters.find(ch => ch.id === selectedChapterId);

  const filteredTopics = useMemo(() => {
    if (!selectedChapter) return [];
    return (selectedChapter.topics || []).filter(t => {
      if (!t.focus || t.focus === 'UNIVERSAL') return true;
      if (t.focus === profile?.focusGoal) return true;
      if (profile?.focusGoal === 'JEE' && t.focus === 'BOARDS') return true;
      return false;
    });
  }, [selectedChapter, profile?.focusGoal]);

  const selectedTopic = filteredTopics.find(t => t.id === selectedTopicId);

  // Dynamic Theme Colors based on Goal
  const theme = useMemo(() => {
    switch (profile?.focusGoal) {
      case 'JEE': return { primary: 'amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', glow: 'shadow-amber-500/20', accent: 'amber' };
      case 'FOUNDATION': return { primary: 'emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', glow: 'shadow-emerald-500/20', accent: 'emerald' };
      default: return { primary: 'blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500', glow: 'shadow-blue-500/20', accent: 'blue' };
    }
  }, [profile?.focusGoal]);

  // Dynamic Labels based on Goal
  const labels = useMemo(() => {
    switch (profile?.focusGoal) {
      case 'JEE': return { 
        study: 'Combat Zone', 
        insights: 'Rank Intel',
        intelHeader: 'JEE Rank Sync',
        intelSub: 'Predictive Analysis',
        enterBtn: 'Enter Combat'
      };
      case 'FOUNDATION': return { 
        study: 'Discovery', 
        insights: 'Brain Power',
        intelHeader: 'Growth Map',
        intelSub: 'Conceptual Strength',
        enterBtn: 'Start Journey'
      };
      default: return { 
        study: 'Self Study', 
        insights: 'Mastery Tracker',
        intelHeader: 'Academic Sync',
        intelSub: 'Syllabus Progress',
        enterBtn: 'Enter Classroom'
      };
    }
  }, [profile?.focusGoal]);

  const allSubmissions = useMemo(() => {
    return classes.flatMap(c => 
      c.subjects.flatMap(s => 
        s.chapters.flatMap(ch => 
          (ch.studentSubmissions || []).map(sub => ({
            ...sub,
            chapterName: ch.name,
            subjectName: s.name
          }))
        )
      )
    );
  }, [classes]);

  const submissionSummary = useMemo(() => {
    if (allSubmissions.length === 0) return "No submissions yet.";
    const latestSub = [...allSubmissions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return `Total Submissions: ${allSubmissions.length} (${allSubmissions.filter(s => s.type === 'DPP').length} DPPs, ${allSubmissions.filter(s => s.type === 'EXERCISE').length} Exercises). Latest Submission: ${latestSub.chapterName} (${latestSub.type}) on ${new Date(latestSub.timestamp).toLocaleDateString()}. Latest Feedback: ${latestSub.feedback || 'Pending'}`;
  }, [allSubmissions]);

  const { start: startReview, stop: stopReview } = useLiveAPI({
    model: "gemini-3.1-flash-live-preview", // or preferred model
    systemInstruction: `Name: NYRA
Persona: एक सुपर-इंटेलिजेंट, हाजिरजवाब (witty), और थोड़ी 'Sassy' AI ट्यूटर।
CONTEXT: तुम छात्र की OVERALL PROGRESS को एनालाइज कर रही हो।

STUDENT PERFORMANCE DATA:
- STREAK: ${profile?.progress?.streak || 5} days.
- READINESS: 78%.
- MASTERED: ${Object.values(profile?.progress?.topicMastery || {}).filter(m => m === 'Mastered').length || 12} topics.
- NEEDS FOCUS: ${profile?.progress?.difficultTopics?.length || 5} topics (especially ${profile?.progress?.difficultTopics?.join(', ') || ['Rotational Mechanics', 'Compound Interest'].join(', ')}).
- SUBMISSIONS STATUS: ${submissionSummary}
- RECENT TIME: Last 7 days, they were most active on Friday.

YOUR GOAL IN THIS SESSION:
1. ANALYSIS: छात्र के साथ उनके हफ़्ते के Performance और उनके द्वारा सबमिट किए गए DPPs/Exercises पर चर्चा करो।
2. MOTIVATION: उनकी Streak और Consistency की सराहना करो (in your sassy style)।
3. TOUGH LOVE: उन टॉपिक्स की ओर ध्यान दिलाओ जहाँ स्कोर कम है या जहाँ आपने Feedback दिया है।
4. STRATEGY: उन्हें एक 'Revision Strategy' बताओ।
5. CHAT LOGS: अगर तुम कोई लिस्ट या स्टेपेस बताती हो, तो 'post_to_chat' टूल का उपयोग करके उसे चैट में भी लिखो।

EMOTIONAL TONE: Be encouraging but keep the sass. If they ask "How am I doing?", don't just say "Good". Dico de it with data.`,
    tools: [{
        name: "post_to_chat",
        description: "Post a suggestion, step-by-step revision plan, or summary to the chat box.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "The content to display in the chat sidebar." }
          },
          required: ["text"]
        }
    }],
    onToolCall: async (calls: any[]) => {
      const call = Array.isArray(calls) ? calls[0] : calls;
      if (call && call.name === "post_to_chat") {
        const text = call.args.text;
        setReviewMessages(prev => [...prev.slice(-10), { role: 'assistant', text }]);
        return { success: true };
      }
      return {};
    },
    onMessage: (msg: any) => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        const text = msg.text || '';
        if (text) {
          setReviewMessages(prev => [...prev.slice(-10), { role: msg.role, text }]);
        }
      }
    }
  });

  useEffect(() => {
    if (isReviewingWithNyra) {
      startReview();
    } else {
      stopReview();
    }
  }, [isReviewingWithNyra]);

  // Mock Progress Data for UI demonstration
  const mockProgress = {
    streak: 5,
    readiness: 78,
    timeData: [
      { day: 'Mon', mins: 45 },
      { day: 'Tue', mins: 120 },
      { day: 'Wed', mins: 90 },
      { day: 'Thu', mins: 60 },
      { day: 'Fri', mins: 150 },
      { day: 'Sat', mins: 30 },
      { day: 'Sun', mins: 10 },
    ],
    badges: [
      { id: '1', name: 'Chapter Finisher', icon: BookOpen, date: '2 days ago' },
      { id: '2', name: 'Quiz Master', icon: Trophy, date: '1 week ago' },
      { id: '3', name: 'Consistency King', icon: Flame, date: 'Just now' },
    ],
    mastery: {
      'Mastered': 12,
      'Learning': 8,
      'Needs Focus': 5
    }
  };

  const getChapterProgress = (chapter: any) => {
    if (!profile?.progress?.topicMastery) return 0;
    const topics = chapter.topics || [];
    if (topics.length === 0) return 0;
    
    let masteredCount = 0;
    topics.forEach((t: any) => {
      const mastery = profile.progress?.topicMastery?.[t.id];
      if (mastery === 'Mastered') masteredCount += 1;
      else if (mastery === 'Learning') masteredCount += 0.5;
    });

    return Math.round((masteredCount / topics.length) * 100);
  };

  const getSubjectProgress = (subject: any) => {
    if (!subject.chapters || subject.chapters.length === 0) return 0;
    const total = subject.chapters.reduce((acc: number, ch: any) => acc + getChapterProgress(ch), 0);
    return Math.round(total / (subject.chapters.length || 1));
  };

  const handleRateTopic = async (topicId: string, rating: number) => {
    if (!profile || !onUpdateProfile) return;
    
    const masteryLevel: 'New' | 'Learning' | 'Mastered' = 
      rating >= 4 ? 'Mastered' : rating >= 2 ? 'Learning' : 'New';

    const updatedProfile = {
      ...profile,
      progress: {
        ...profile.progress,
        topicMastery: {
          ...(profile.progress?.topicMastery || {}),
          [topicId]: masteryLevel
        }
      }
    };

    onUpdateProfile(updatedProfile);
  };

  return (
    <div className={`min-h-screen bg-nyra-dark text-white flex flex-col md:flex-row relative overflow-hidden theme-${theme.accent}`}>
      {/* Background Decor */}
      <div className={`absolute top-0 right-0 w-[50vw] h-[50vw] bg-${theme.primary}/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none`} />
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-white/5 flex flex-col z-[60] backdrop-blur-xl bg-black/20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 bg-${theme.primary}/20 rounded-xl flex items-center justify-center border border-${theme.primary}/30 shadow-lg shadow-${theme.primary}/20`}>
                <GraduationCap className={`text-${theme.primary}`} size={20} />
             </div>
             <div>
               <h1 className="font-display font-bold text-lg leading-none">NYRA</h1>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Academia</p>
             </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-2">
          {[
            { id: 'study', label: labels.study, icon: BookOpen },
            { id: 'hub', label: 'Neural Hub', icon: Activity },
            { id: 'syllabus', label: 'Syllabus', icon: LayoutDashboard },
            { id: 'flashcards', label: 'Flashcards', icon: Zap },
            { id: 'exam-hall', label: 'Exam Hall', icon: Target },
            { id: 'help', label: 'Help Center', icon: Info }
          ].map((nav) => (
             <button 
               key={nav.id}
               onClick={() => setActiveTab(nav.id as any)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all group ${
                 activeTab === nav.id 
                 ? `bg-${theme.primary} text-white shadow-lg shadow-${theme.primary}/20` 
                 : 'text-slate-500 hover:text-white hover:bg-white/5'
               }`}
             >
               <nav.icon size={16} className={activeTab === nav.id ? 'text-white' : `text-${theme.primary} opacity-60 group-hover:opacity-100 transition-opacity`} />
               {nav.label}
             </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
           {(profile?.role === 'teacher' || profile?.email?.toLowerCase().trim() === ADMIN_EMAIL) && onAdminSwitch && (
             <button 
               onClick={onAdminSwitch}
               className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
             >
               <LayoutDashboard size={16} />
               Teacher Dashboard
             </button>
           )}
           <button 
             onClick={onProfile}
             className={`w-full flex items-center gap-3 px-4 py-3 bg-${theme.primary}/10 border border-${theme.primary}/30 text-${theme.primary} rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-${theme.primary} hover:text-white transition-all`}
           >
             <User size={16} />
             Profile
           </button>
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
           >
             <LogOut size={16} />
             Sign Out
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for user context */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-md z-50">
          <div>
             <h2 className="text-xl font-display font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {profile?.displayName} • {classes.find(c => c.id === (profile?.selectedClassId || selectedClassId))?.name || 'Classroom'} • {
                  profile?.focusGoal === 'JEE' ? 'JEE Advanced' : 
                  profile?.focusGoal === 'FOUNDATION' ? 'Foundation' : 'Academic Boards'
                }
             </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-full text-amber-500">
               <Flame size={16} className="animate-pulse" />
               <span className="font-display font-black text-xs uppercase tracking-widest">{profile?.progress?.streak || mockProgress.streak} Day Streak</span>
             </div>
             
             <div className="p-10 w-px h-6 bg-white/10 hidden md:block" />
             
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-nyra-primary/10 border border-nyra-primary/20 flex items-center justify-center overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} className="text-nyra-primary" />
                    )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'study' ? (
              <div className="flex h-full overflow-hidden">
                {/* Left Sidebar: Syllabus Explorer */}
                <aside className="w-80 flex flex-col bg-slate-900/30 border-r border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subjects</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {selectedClass?.subjects.map((sub) => {
                      const isSelected = selectedSubjectId === sub.id;
                      return (
                        <div key={sub.id} className="space-y-1">
                          <button
                            onClick={() => {
                              setSelectedSubjectId(sub.id);
                              setSelectedChapterId(null);
                              setSelectedTopicId(null);
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all relative group ${
                              isSelected 
                              ? 'bg-nyra-primary/10 text-nyra-primary' 
                              : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-3 bottom-3 w-1 bg-nyra-primary rounded-full shadow-[0_0_8px_rgba(var(--nyra-primary-rgb),0.5)]" />
                            )}
                            <BookOpen size={18} className={isSelected ? 'text-nyra-primary' : 'text-slate-500 group-hover:text-slate-400'} />
                            <span className="text-sm font-bold tracking-tight">{sub.name}</span>
                          </button>

                          {/* Chapters/Units under active subject */}
                          {isSelected && (
                            <div className="pl-4 space-y-1 mt-2">
                              <div className="py-2 px-4 uppercase text-[9px] font-black text-slate-600 tracking-[0.15em]">Units</div>
                              {sub.chapters.map((ch, idx) => {
                                const isChapterActive = selectedChapterId === ch.id;
                                return (
                                  <div key={ch.id}>
                                    <button
                                      onClick={() => {
                                        setSelectedChapterId(isChapterActive ? null : ch.id);
                                        setSelectedTopicId(null);
                                      }}
                                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border border-transparent ${
                                        isChapterActive 
                                        ? 'bg-nyra-primary/20 text-white border-nyra-primary/10' 
                                        : 'text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-600 w-4">{idx + 1}</span>
                                        <span className="text-xs font-semibold">{ch.name}</span>
                                      </div>
                                      {isChapterActive ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    
                                    {/* Topic Quick List (Optional minified view if needed, but we'll show details in main area) */}
                                    {isChapterActive && (
                                       <div className="pl-7 pr-2 py-2 space-y-1">
                                          {ch.topics.map(topic => (
                                            <button 
                                              key={topic.id}
                                              onClick={() => setSelectedTopicId(topic.id)}
                                              className={`w-full text-left text-[10px] py-1 transition-all ${
                                                selectedTopicId === topic.id ? 'text-nyra-primary font-bold' : 'text-slate-600 hover:text-slate-400'
                                              }`}
                                            >
                                              • {topic.name}
                                            </button>
                                          ))}
                                       </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </aside>

                {/* Main Content Area: Topic Explorer & Status */}
                <section className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-10">
                   {!selectedSubjectId ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                         <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-2xl">
                            <Layers className="text-slate-400" size={48} strokeWidth={1} />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Neural Curriculum Map</h3>
                            <p className="text-xs text-slate-500 font-medium max-w-[240px] leading-relaxed">Select a subject from the left explorer to visualize your progression and units.</p>
                         </div>
                      </div>
                   ) : !selectedChapterId ? (
                      <div className="space-y-12">
                         <header className="flex items-end justify-between border-b border-white/5 pb-8">
                            <div className="space-y-2">
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-nyra-primary">Curriculum Overview</p>
                               <h2 className="text-5xl font-display font-black tracking-tighter text-white">{selectedSubject?.name}</h2>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right">
                                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mastery Index</p>
                                  <p className="text-2xl font-black text-white">{getSubjectProgress(selectedSubject!)}%</p>
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                   <Target className="text-nyra-primary" size={32} />
                                </div>
                            </div>
                         </header>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {selectedSubject?.chapters.map((ch, idx) => (
                               <motion.button
                                 key={ch.id}
                                 whileHover={{ y: -8, scale: 1.02 }}
                                 onClick={() => setSelectedChapterId(ch.id)}
                                 className="group p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-nyra-primary/30 transition-all text-left space-y-6"
                               >
                                  <div className="flex items-center justify-between">
                                     <div className="w-12 h-12 rounded-2xl bg-nyra-primary/10 text-nyra-primary flex items-center justify-center font-black">
                                        {idx + 1}
                                     </div>
                                     <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                        {ch.topics.length} Topics
                                     </div>
                                  </div>
                                  <div>
                                     <h4 className="text-xl font-bold text-white group-hover:text-nyra-primary transition-colors">{ch.name}</h4>
                                     <p className="text-xs text-slate-500 mt-2 line-clamp-2">Unit breakdown and resource mapping for optimized learning flow.</p>
                                  </div>
                                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-nyra-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                     <span>Explore Unit</span>
                                     <ArrowRight size={14} />
                                  </div>
                               </motion.button>
                            ))}
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-12 pb-20">
                         <header className="flex items-center justify-between">
                            <button 
                              onClick={() => setSelectedChapterId(null)}
                              className="group flex items-center gap-3 text-slate-500 hover:text-white transition-all"
                            >
                               <div className="p-2 bg-white/5 rounded-xl group-hover:bg-nyra-primary group-hover:text-white transition-all">
                                  <ArrowLeft size={16} />
                               </div>
                               <span className="text-xs font-black uppercase tracking-widest">Back to Units</span>
                            </button>
                            <div className="text-center">
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">{selectedSubject?.name}</p>
                               <h2 className="text-3xl font-display font-black tracking-tight text-white">{selectedChapter?.name}</h2>
                            </div>
                            <div className="w-[100px]" /> {/* Spacer for centering */}
                         </header>

                         <div className="max-w-3xl mx-auto space-y-4">
                            <div className="flex items-center justify-between px-6 mb-2">
                               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Actionable Topics</h4>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Progress Tracking Active</span>
                            </div>
                            
                            {selectedChapter?.topics.map((topic, tidx) => {
                               const mastery = profile?.progress?.topicMastery?.[topic.id];
                               const isCompleted = mastery === 'Mastered';
                               const isInProgress = mastery === 'Learning';
                               const isSelected = selectedTopicId === topic.id;
                               const progressPercentage = isInProgress ? 70 : 0; // Mock percentage for in-progress

                               return (
                                 <motion.div
                                   key={topic.id}
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: tidx * 0.05 }}
                                   onClick={() => setSelectedTopicId(topic.id)}
                                   className={`w-full group p-6 rounded-3xl border transition-all flex items-center gap-6 text-left relative overflow-hidden cursor-pointer ${
                                     isSelected 
                                     ? 'bg-nyra-primary/10 border-nyra-primary/30 shadow-2xl' 
                                     : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                   }`}
                                 >
                                    {/* Visual Status Indicator */}
                                    <div className="shrink-0">
                                       {isCompleted ? (
                                         <div className="flex flex-col items-center gap-1">
                                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                               <CheckCircle2 size={24} />
                                            </div>
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Completed</span>
                                         </div>
                                       ) : isInProgress ? (
                                         <div className="flex flex-col items-center gap-1">
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 relative">
                                               <Clock size={24} />
                                               <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-pulse" />
                                            </div>
                                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">In Progress</span>
                                         </div>
                                       ) : (
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="w-12 h-12 border-2 border-slate-700 rounded-full flex items-center justify-center text-slate-500">
                                               <Circle size={24} />
                                            </div>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Not Started</span>
                                         </div>
                                       )}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                       <div className="flex items-center justify-between">
                                          <h5 className={`text-lg font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>{topic.name}</h5>
                                          {isInProgress && (
                                             <span className="text-xs font-black text-blue-500">{progressPercentage}%</span>
                                          )}
                                       </div>
                                       
                                       {isInProgress && (
                                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                             <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercentage}%` }}
                                                className="h-full bg-blue-500 rounded-full"
                                             />
                                          </div>
                                       )}
                                       
                                       {isSelected && (
                                          <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="pt-2 flex items-center gap-4"
                                          >
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); onSelectTopic(topic, selectedChapter?.topics); }}
                                                className="px-6 py-2.5 bg-nyra-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-nyra-primary/20"
                                             >
                                                Enter Session
                                             </button>
                                             <span className="text-[10px] font-bold text-slate-500 italic">Neural interface ready for this topic...</span>
                                          </motion.div>
                                       )}
                                    </div>

                                    <div className={`ml-auto p-4 rounded-2xl transition-all ${isSelected ? 'bg-nyra-primary text-white' : 'bg-white/5 text-slate-600 group-hover:text-slate-400'}`}>
                                       <ChevronRight size={20} />
                                    </div>
                                 </motion.div>
                               );
                            })}
                         </div>

                         {/* Quick Review Card */}
                         <div className="max-w-3xl mx-auto p-8 rounded-[3rem] bg-gradient-to-br from-nyra-primary/20 to-transparent border border-nyra-primary/20 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 bg-nyra-primary/10 rounded-3xl flex items-center justify-center text-nyra-primary">
                                  <Brain size={32} />
                               </div>
                               <div>
                                  <h4 className="text-xl font-bold text-white">Topic Exercises</h4>
                                  <p className="text-xs text-slate-500 font-medium">Test your understanding with AI generated questions.</p>
                               </div>
                            </div>
                            <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-100 transition-all shadow-xl">
                               Start Drill
                               <Zap size={14} className="fill-current" />
                            </button>
                         </div>
                      </div>
                   )}
                </section>
              </div>
            ) : activeTab === 'flashcards' ? (
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          <div className="max-w-4xl mx-auto py-10 space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2 text-left">
                <h2 className="text-4xl font-display font-bold tracking-tight">AI Spaced Repetition</h2>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">Mistake Recovery • Dynamic Flashcards</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-nyra-primary/10 border border-nyra-primary/20 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-nyra-primary uppercase tracking-widest">Due Today</p>
                    <p className="text-2xl font-black">{dueCards.length}</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Collection</p>
                    <p className="text-2xl font-black">{profile?.flashcards?.length || 0}</p>
                 </div>
              </div>
            </div>

            {!isFlashcardReviewActive ? (
              <div className="space-y-8">
                 <div className="p-12 bg-slate-900 border border-white/5 rounded-[3.5rem] text-center space-y-6">
                    <div className="w-20 h-20 bg-nyra-primary/20 rounded-full flex items-center justify-center mx-auto border border-nyra-primary/30">
                       <Brain size={40} className="text-nyra-primary" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black">Neural Recall Session</h3>
                       <p className="text-slate-400 max-w-md mx-auto italic">Reviewing mistakes and facts at the optimal time helps you move them from short-term to infinite memory.</p>
                    </div>
                    
                    {dueCards.length > 0 ? (
                      <button 
                        onClick={() => setIsFlashcardReviewActive(true)}
                        className="px-12 py-5 bg-nyra-primary text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-nyra-primary/20 hover:scale-105 transition-all"
                      >
                        Start Review Session
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                         <p className="text-emerald-500 font-bold">You are all caught up! No cards due for review.</p>
                         <button className="px-8 py-3 bg-white/5 text-slate-400 rounded-2xl text-xs font-bold uppercase border border-white/10 opacity-50 cursor-not-allowed">
                            Flashcards Clean
                         </button>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {profile?.flashcards?.slice(-4).map(card => (
                      <div key={card.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-white/10 transition-all text-left">
                         <span className="text-[10px] font-black text-nyra-primary uppercase tracking-widest bg-nyra-primary/10 px-2 py-0.5 rounded-full">{card.category}</span>
                         <p className="mt-4 font-bold text-slate-300 line-clamp-2">{card.front}</p>
                         <div className="mt-6 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Review: {new Date(card.nextReview).toLocaleDateString()}</span>
                            <span>{card.reps} Reps</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-12">
                 <div className="w-full flex items-center justify-between px-6">
                    <button onClick={() => setIsFlashcardReviewActive(false)} className="text-slate-500 hover:text-white flex items-center gap-2">
                       <X size={16} /> <span className="text-xs font-black uppercase tracking-widest">Quit Session</span>
                    </button>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Card {currentFlashcardIndex + 1} of {dueCards.length}</p>
                    <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-nyra-primary transition-all duration-500" style={{ width: `${((currentFlashcardIndex + 1) / dueCards.length) * 100}%` }} />
                    </div>
                 </div>

                 <div className="w-full max-w-2xl" style={{ perspective: '1000px' }}>
                    <motion.div 
                      animate={{ rotateY: showCardBack ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="relative w-full h-[400px] cursor-pointer"
                      style={{ transformStyle: 'preserve-3d' }}
                      onClick={() => !showCardBack && setShowCardBack(true)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 bg-slate-900 border-2 border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
                         <span className="absolute top-8 text-[10px] font-black text-nyra-primary uppercase tracking-widest">QUESTION</span>
                         <p className="text-2xl font-bold leading-relaxed">{dueCards[currentFlashcardIndex]?.front}</p>
                         {!showCardBack && <p className="mt-12 text-[10px] text-slate-500 uppercase font-black tracking-widest animate-pulse">Click to Reveal Answer</p>}
                      </div>

                      {/* Back */}
                      <div className="absolute inset-0 bg-nyra-primary/10 border-2 border-nyra-primary/30 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                         <span className="absolute top-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest">EXPLANATION</span>
                         <p className="text-xl font-bold text-white leading-relaxed">{dueCards[currentFlashcardIndex]?.back}</p>
                      </div>
                    </motion.div>
                 </div>

                 <AnimatePresence>
                   {showCardBack && (
                     <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl"
                     >
                        {[
                          { id: 'again', label: 'Again', time: '1m', color: 'bg-rose-500/20 text-rose-500 border-rose-500/30' },
                          { id: 'hard', label: 'Hard', time: '1d', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
                          { id: 'good', label: 'Good', time: '3d', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
                          { id: 'easy', label: 'Easy', time: '7d', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => handleRateFlashcard(dueCards[currentFlashcardIndex].id, btn.id as any)}
                            className={`p-6 rounded-3xl border transition-all hover:scale-105 flex flex-col items-center gap-2 ${btn.color}`}
                          >
                             <span className="text-sm font-black uppercase tracking-widest">{btn.label}</span>
                             <span className="text-[10px] font-bold opacity-60">{btn.time}</span>
                          </button>
                        ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'syllabus' ? (
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 pb-20 pt-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-display font-bold">Curriculum Roadmap</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">Complete {selectedClass?.name || 'Class'} Syllabus • Academic Tracker</p>
          </div>

          {!selectedClassId ? (
            <div className="p-20 bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem] text-center text-slate-500 flex flex-col items-center justify-center gap-4">
              <AlertCircle size={48} className="opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest italic">Data Link Required</p>
              <button 
                onClick={() => setActiveTab('study')}
                className="px-8 py-4 bg-nyra-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-nyra-primary/20"
              >
                Go to Study Tab
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {selectedClass?.subjects.map(subject => (
                <div key={subject.id} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-nyra-primary/5 rounded-[1.5rem] flex items-center justify-center border border-nyra-primary/20`}>
                        <BookOpen size={24} className="text-nyra-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tight">{subject.name}</h3>
                        <div className="flex items-center gap-3">
                           <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{subject.chapters.length} Units</span>
                           <div className="w-1 h-1 rounded-full bg-white/20" />
                           <span className="text-nyra-primary text-[10px] font-black uppercase tracking-widest">{getSubjectProgress(subject)}% Mastery</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getSubjectProgress(subject)}%` }}
                        className="h-full bg-nyra-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subject.chapters.map((chapter, cIdx) => (
                      <motion.div 
                        key={chapter.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: cIdx * 0.05 }}
                        className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:border-nyra-primary/20 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                          <Brain size={60} />
                        </div>

                        <div className="flex items-center justify-between mb-6">
                          <span className="px-3 py-1 bg-white/5 text-[8px] font-black italic text-slate-500 uppercase tracking-widest rounded-full">Unit {(subject.chapters.indexOf(chapter) + 1).toString().padStart(2, '0')}</span>
                          {getChapterProgress(chapter) === 100 && (
                            <div className="flex items-center gap-1.5 text-emerald-500">
                               <Sparkles size={12} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Mastered</span>
                            </div>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-lg mb-6 leading-tight group-hover:text-nyra-primary transition-colors">{chapter.name}</h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                            <span className="uppercase tracking-widest text-[9px] font-black text-slate-500">Sub-Topics: {chapter.topics.length}</span>
                            <span className="font-bold">{getChapterProgress(chapter)}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${getChapterProgress(chapter)}%` }}
                              className={`h-full ${getChapterProgress(chapter) === 100 ? 'bg-emerald-500' : 'bg-nyra-primary/40'}`}
                            />
                          </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-2">
                          {chapter.topics.slice(0, 3).map(topic => (
                            <span 
                              key={topic.id}
                              className={`px-3 py-1 rounded-xl text-[9px] font-bold border transition-all ${
                                profile?.progress?.topicMastery?.[topic.id] === 'Mastered' 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                  : profile?.progress?.topicMastery?.[topic.id] === 'Learning'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                  : 'bg-white/5 border-white/5 text-slate-500'
                              }`}
                            >
                              {topic.name}
                            </span>
                          ))}
                          {chapter.topics.length > 3 && <span className="text-[9px] text-slate-600 font-bold self-center">+{chapter.topics.length - 3}</span>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : activeTab === 'hub' ? (
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 pb-20 pt-4 px-6 md:px-10">
          {/* Neural Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div className="space-y-2">
                <h2 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
                  <Brain className="text-nyra-primary" />
                  Neural Hub
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Personal Learning Command Center</p>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                   <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">ERI Readiness</div>
                   <div className="text-lg font-black text-white">{profile?.intelligenceProfile?.eri || 78}%</div>
                </div>
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                   <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Focus Mode</div>
                   <div className="text-lg font-black text-white">{profile?.focusGoal || 'UNIVERSAL'}</div>
                </div>
             </div>
          </div>

          {/* Bento Grid: Phase 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
            {/* ERI Widget */}
            <div className="md:col-span-1 md:row-span-1 p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative group overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-nyra-primary/50 to-transparent" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Excellence Index</p>
               <div className="relative mb-4">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="12" />
                    <circle 
                      cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" 
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 * (1 - (profile?.intelligenceProfile?.eri || 78) / 100)}
                      strokeLinecap="round"
                      className="text-nyra-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black">{profile?.intelligenceProfile?.eri || 78}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Sector Master</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <TrendingUp size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">+12% vs Prev Week</span>
               </div>
            </div>

            {/* Cognitive DNA (NID) Radar Placeholder / Visual */}
            <div className="md:col-span-1 md:row-span-1 p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint className="text-nyra-primary" size={14} />
                    Neural Intelligence ID
                  </h3>
                  <div className="w-6 h-6 rounded-full bg-nyra-primary/10 border border-nyra-primary/30 flex items-center justify-center">
                     <span className="text-[8px] font-black text-nyra-primary">ID</span>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {[
                    { label: 'Calculation', val: profile?.intelligenceProfile?.calculationAbility || 82, color: 'text-blue-500' },
                    { label: 'Conceptual', val: profile?.intelligenceProfile?.conceptualStrength || 75, color: 'text-nyra-primary' },
                    { label: 'Reasoning', val: profile?.intelligenceProfile?.reasoningPower || 68, color: 'text-amber-500' },
                    { label: 'Persistence', val: profile?.intelligenceProfile?.learningPersistence || 91, color: 'text-emerald-500' },
                  ].map(stat => (
                    <div key={stat.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">{stat.label}</span>
                        <span className="text-white">{stat.val}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.val}%` }}
                          className={`h-full ${stat.color.replace('text', 'bg')}`}
                        />
                      </div>
                    </div>
                  ))}
               </div>
               <div className="absolute bottom-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Activity size={80} />
               </div>
            </div>

            {/* Remedial Plan / Nyra Analysis */}
            <div className="md:col-span-1 md:row-span-2 p-8 bg-gradient-to-b from-nyra-primary/10 to-transparent border border-nyra-primary/20 rounded-[2.5rem] flex flex-col">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-nyra-primary/20 rounded-xl flex items-center justify-center border border-nyra-primary/30">
                     <Sparkles className="text-nyra-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest leading-none">Neural Link</h3>
                    <p className="text-[9px] text-slate-500 font-bold mt-1">Status: Synced with your DNA</p>
                  </div>
               </div>
               
               <div className="flex-1 space-y-4 mb-8">
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl relative">
                     <div className="absolute -left-2 top-6 w-4 h-4 bg-nyra-primary/20 rotate-45 border-l border-b border-nyra-primary/30" />
                     <p className="text-xs text-white leading-relaxed italic">
                        "Your **Calculation Ability** has spiked by 15% after yesterday's DPP. However, I see a latency in **Rotational Dynamics** conceptual recall. Shall we perform a 'Neural Re-Scan'?"
                     </p>
                  </div>
                  
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recommended Actions</p>
                     {[
                       { task: 'Revision: Chemical Bonding', icon: Zap, color: 'text-amber-500' },
                       { task: 'DPP: Projectile Motion', icon: BookOpen, color: 'text-nyra-primary' },
                       { task: 'Neural Session: Growth Map', icon: Brain, color: 'text-emerald-500' }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                          <item.icon size={14} className={item.color} />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">{item.task}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <button 
                  onClick={() => setIsReviewingWithNyra(true)}
                  className="w-full py-5 bg-nyra-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-2xl shadow-nyra-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
               >
                  <Mic size={16} />
                  Ignite Analysis
               </button>
            </div>

            {/* Submissions Stats / Streaks */}
            <div className="md:col-span-2 md:row-span-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Current Streak', val: `${profile?.progress?.streak || 5} Days`, icon: Flame, color: 'text-amber-500' },
                { label: 'Total Time', val: '42.5h', icon: Clock, color: 'text-blue-500' },
                { label: 'Accuracy', val: '86%', icon: Target, color: 'text-emerald-500' },
                { label: 'Badges', val: profile?.progress?.badges?.length || 12, icon: Trophy, color: 'text-nyra-primary' }
              ].map((stat, i) => (
                <div key={stat.label} className="p-6 bg-slate-900 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                   <div className={`p-3 rounded-xl ${stat.color.replace('text', 'bg')}/10 border ${stat.color.replace('text', 'border')}/20 w-fit mb-4`}>
                      <stat.icon size={20} className={stat.color} />
                   </div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className="text-2xl font-black tracking-tight">{stat.val}</p>
                   <div className="absolute bottom-0 right-0 p-4 opacity-5 translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform">
                      <stat.icon size={60} />
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Analytics View Injection */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded-lg">
                      <BarChart2 className="text-nyra-primary" size={16} />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest">Neural Efficiency & Patterns</h3>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                   Real-time Data Active
                </div>
             </div>
             <StudentAnalytics profile={profile} submissions={testSubmissions} classes={classes} />
          </div>
        </div>
      </div>
    ) : activeTab === 'exam-hall' ? (
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="max-w-6xl mx-auto py-10">
          <ExaminationHall 
            profile={profile} 
            availableTests={tests} 
            onBackToStudy={() => setActiveTab('study')} 
          />
        </div>
      </div>
    ) : activeTab === 'help' ? (
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="max-w-6xl mx-auto py-10">
          <StudentManual />
        </div>
      </div>
    ) : null}
  </main>

  <AnimatePresence>
    {isReviewingWithNyra && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-nyra-dark/95 backdrop-blur-2xl"
      >
        <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
           {/* Header */}
           <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-nyra-primary/10 rounded-2xl flex items-center justify-center border border-nyra-primary/30">
                    <Sparkles className="text-nyra-primary" size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">Neural Session: Nyra Intelligence</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Syllabus Sync Active</p>
                 </div>
              </div>
              <button 
                 onClick={() => { stopReview(); setIsReviewingWithNyra(false); }}
                 className="p-3 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-2xl transition-all"
              >
                 <X size={24} />
              </button>
           </div>

           {/* Review Body */}
           <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative">
                 <div className="w-32 h-32 bg-nyra-primary/5 rounded-[3rem] flex items-center justify-center relative z-10">
                    <Brain className="text-nyra-primary animate-pulse" size={48} />
                 </div>
                 <div className="absolute inset-0 bg-nyra-primary blur-3xl opacity-20 animate-pulse" />
              </div>
              
              <div className="space-y-4 max-w-lg">
                 <h4 className="text-2xl font-display font-bold italic">"Let me bridge the gaps in your knowledge..."</h4>
                 <p className="text-slate-400 text-sm leading-relaxed">
                    Nyra is analyzing your streak, your recent DPP submissions, and your mastery index. 
                    Stay focused. Listen closely to the remedial plan.
                 </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-md">
                 {reviewMessages.slice(-3).map((m, i) => (
                    <div key={i} className={`p-4 rounded-2xl text-left text-xs font-bold leading-relaxed ${
                       m.role === 'user' ? 'bg-white/5 text-slate-400 ml-8 border border-white/5' : 'bg-nyra-primary/10 text-nyra-primary mr-8 border border-nyra-primary/20'
                    }`}>
                       {m.text}
                    </div>
                 ))}
              </div>

              <div className="flex items-center gap-6 pt-8">
                 <button 
                   onClick={() => startReview()}
                   className="px-10 py-5 bg-nyra-primary text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-nyra-primary/90 transition-all shadow-2xl shadow-nyra-primary/40 flex items-center gap-3 active:scale-95"
                 >
                   <Zap size={20} />
                   Ignite Analysis
                 </button>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Link Ready</span>
                 </div>
              </div>
           </div>

           {/* Footer Info */}
           <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Powered by Gemini 3.1 Neural Engine • Voice Interaction Enabled</p>
           </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
</div>
);
};

export default StudentDashboard;
