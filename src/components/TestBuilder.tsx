
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, X, Upload, ChevronRight, BookOpen, Brain, Clock, Target, Sparkles, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { FocusGoal, Test, Question, ClassData } from '../types/academic';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface TestBuilderProps {
  classes: ClassData[];
  existingTests: Test[];
  onClose: () => void;
  onEdit?: (test: Test) => void;
}

const TestBuilder: React.FC<TestBuilderProps> = ({ classes, existingTests, onClose }) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [currentTest, setCurrentTest] = useState<Partial<Test>>({
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    examType: 'JEE',
    questions: [],
    status: 'Draft'
  });

  const [isParsing, setIsParsing] = useState(false);

  const handleSaveTest = async () => {
    if (!currentTest.title || !currentTest.classId) {
      alert("Please enter a title and select a class.");
      return;
    }

    try {
      const testData = {
        ...currentTest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (currentTest.id) {
        const testDocRef = doc(db, 'tests', currentTest.id);
        await updateDoc(testDocRef, testData)
          .catch(err => handleFirestoreError(err, OperationType.UPDATE, testDocRef.path));
      } else {
        const testsRef = collection(db, 'tests');
        await addDoc(testsRef, testData)
          .catch(err => handleFirestoreError(err, OperationType.CREATE, testsRef.path));
      }
      setIsCreatingNew(false);
      setCurrentTest({
        title: '',
        description: '',
        duration: 60,
        totalMarks: 100,
        examType: 'JEE',
        questions: [],
        status: 'Draft'
      });
    } catch (err) {
      console.error("Error saving test:", err);
      alert("System Overload: Failed to save test data.");
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: 'q-' + Date.now(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      topicId: '',
      difficulty: 'MEDIUM',
      skillsChecked: []
    };
    setCurrentTest(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...(currentTest.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setCurrentTest(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...(currentTest.questions || [])];
    updatedQuestions.splice(index, 1);
    setCurrentTest(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test? This is irreversible.")) return;
    try {
      const testDocRef = doc(db, 'tests', id);
      await deleteDoc(testDocRef)
        .catch(err => handleFirestoreError(err, OperationType.DELETE, testDocRef.path));
    } catch (err) {
      console.error("Error deleting test:", err);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      // Simulate Nyra helping to parse
      setIsParsing(true);
      setTimeout(() => {
          setIsParsing(false);
          alert("Nyra has analyzed the source. Ready to structure the questions.");
          // In a real scenario, we'd use Gemini to extract questions from PDF/Excel
      }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!isCreatingNew ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold">Exam Command Center</h2>
              <p className="text-slate-500">Design, deploy, and monitor high-stakes assessments</p>
            </div>
            <button 
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center gap-3 px-6 py-3 bg-nyra-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nyra-primary/90 transition-all shadow-xl shadow-nyra-primary/40"
            >
              <Plus size={16} />
              Construct New Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingTests.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-40 border-2 border-dashed border-white/5 rounded-[3rem]">
                <Brain size={48} className="mx-auto mb-4" />
                <p className="text-lg font-bold tracking-tight">No active test missions found</p>
              </div>
            ) : (
              existingTests.map(test => (
                <div key={test.id} className="p-6 bg-slate-900 border border-white/5 rounded-[2.5rem] hover:border-nyra-primary/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
                    <Brain size={48} />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      test.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {test.status}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {test.examType}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2 group-hover:text-nyra-primary transition-colors">{test.title}</h3>
                  <p className="text-xs text-slate-500 mb-6 line-clamp-2">{test.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={14} />
                      {test.duration} Min
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Target size={14} />
                      {test.totalMarks} Marks
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <button 
                      onClick={() => {
                          setCurrentTest(test);
                          setIsCreatingNew(true);
                      }}
                      className="text-[10px] font-black text-nyra-primary uppercase tracking-widest hover:underline"
                    >
                      Configure
                    </button>
                    <button 
                      onClick={() => handleDeleteTest(test.id)}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsCreatingNew(false)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Operation Cancel</span>
            </button>
            <div className="flex items-center gap-3">
               <button 
                onClick={handleSaveTest}
                className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
              >
                <Save size={16} />
                Finalize & Deploy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Metadata Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Brain size={18} className="text-nyra-primary" />
                    Mission Intel
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Test Title</label>
                      <input 
                        type="text"
                        value={currentTest.title}
                        onChange={(e) => setCurrentTest(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., JEE Mains Mock 1, Unit Test - Force"
                        className="w-full bg-nyra-dark border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Class</label>
                      <select 
                        value={currentTest.classId || ""}
                        onChange={(e) => setCurrentTest(prev => ({ ...prev, classId: e.target.value }))}
                        className="w-full bg-nyra-dark border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all"
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Duration (Min)</label>
                        <input 
                          type="number"
                          value={currentTest.duration}
                          onChange={(e) => setCurrentTest(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          className="w-full bg-nyra-dark border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Total Marks</label>
                        <input 
                          type="number"
                          value={currentTest.totalMarks}
                          onChange={(e) => setCurrentTest(prev => ({ ...prev, totalMarks: parseInt(e.target.value) }))}
                          className="w-full bg-nyra-dark border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Focus Goal</label>
                      <div className="flex gap-2">
                        {['BOARDS', 'JEE', 'FOUNDATION'].map((goal) => (
                          <button
                            key={goal}
                            onClick={() => setCurrentTest(prev => ({ ...prev, examType: goal as FocusGoal }))}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                              currentTest.examType === goal 
                                ? 'bg-nyra-primary border-nyra-primary text-white' 
                                : 'bg-nyra-dark border-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                          >
                            {goal}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                        <select 
                            value={currentTest.status}
                            onChange={(e) => setCurrentTest(prev => ({ ...prev, status: e.target.value as 'Draft' | 'Published' }))}
                            className="w-full bg-nyra-dark border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-nyra-primary outline-none transition-all"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                        </select>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] space-y-4">
                  <div className="flex items-center gap-3 text-blue-400">
                    <Sparkles size={24} />
                    <span className="font-bold">Neural Bulk Upload</span>
                  </div>
                  <p className="text-xs text-blue-300/70 leading-relaxed italic">
                    Let Nyra scan your PDF or Excel questions. She will extract diagrams, text, and categorize complexity automatically.
                  </p>
                  <label className="block">
                    <input 
                        type="file" 
                        accept=".pdf,.xlsx,.xls" 
                        className="hidden" 
                        onChange={handleBulkUpload}
                    />
                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all cursor-pointer shadow-lg shadow-blue-500/20">
                        {isParsing ? (
                            <div className="flex items-center gap-2">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <Sparkles size={14} />
                                </motion.div>
                                Analyzing Logic...
                            </div>
                        ) : (
                            <>
                                <Upload size={14} />
                                Import PDF / Excel
                            </>
                        )}
                    </div>
                  </label>
                </div>

                <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] space-y-4">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Brain size={24} />
                    <span className="font-bold">Nyra's Intelligence</span>
                  </div>
                  <div className="space-y-4">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Test Blueprint (Nishkarsh)</div>
                      <p className="text-xs text-slate-400 italic leading-relaxed">
                          "{currentTest.questions?.length === 0 ? "Building intelligence profile..." : "This test covers conceptual depth in Mechanial Properties. Focus is 60% Numerical / 40% Theoretical. High emphasis on 'Constraint Logic'."}"
                      </p>
                      <div className="flex flex-wrap gap-2">
                          {['Calculation Speed', 'Critical Thinking', 'Recall'].map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full">{tag}</span>
                          ))}
                      </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText size={18} className="text-nyra-primary" />
                  Question Bank ({currentTest.questions?.length || 0})
                </h3>
                <button 
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-nyra-primary/10 border border-nyra-primary/20 text-nyra-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-nyra-primary hover:text-white transition-all shadow-lg shadow-nyra-primary/5"
                >
                  <Plus size={14} />
                  New Question
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                {currentTest.questions?.length === 0 ? (
                  <div className="py-20 text-center opacity-30 italic">
                    Bank empty. Add questions or use Neural Upload.
                  </div>
                ) : (
                  currentTest.questions?.map((q, idx) => (
                    <motion.div 
                      key={q.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] space-y-6 relative"
                    >
                      <button 
                        onClick={() => removeQuestion(idx)}
                        className="absolute top-8 right-8 p-3 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-nyra-primary/20 text-nyra-primary rounded-2xl flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex gap-2">
                          {['EASY', 'MEDIUM', 'HARD'].map(diff => (
                            <button
                              key={diff}
                              onClick={() => updateQuestion(idx, { difficulty: diff as any })}
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                q.difficulty === diff 
                                  ? diff === 'HARD' ? 'bg-rose-500 border-rose-500 text-white' : diff === 'MEDIUM' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                              }`}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Problem Statement</label>
                          <textarea 
                            value={q.text}
                            onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                            placeholder="Enter the question text here..."
                            rows={3}
                            className="w-full bg-nyra-dark border border-slate-800 rounded-3xl px-6 py-6 text-sm focus:border-nyra-primary outline-none transition-all resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="relative group">
                              <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                q.correctAnswer === optIdx ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <input 
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(idx, { options: newOpts });
                                }}
                                onClick={() => updateQuestion(idx, { correctAnswer: optIdx })}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                className={`w-full bg-nyra-dark border rounded-2xl pl-14 pr-6 py-4 text-sm transition-all focus:border-nyra-primary outline-none ${
                                  q.correctAnswer === optIdx ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-800'
                                }`}
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Detailed Solution / Logic Explanation</label>
                          <textarea 
                            value={q.explanation}
                            onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                            placeholder="Explain the logic behind the correct answer..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/5 rounded-3xl px-6 py-4 text-xs text-slate-400 focus:border-nyra-primary outline-none transition-all resize-none italic"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestBuilder;
