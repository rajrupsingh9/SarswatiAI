
import React from 'react';
import { Book, Shield, Brain, Zap, Clock, Target, Plus, BarChart3, Bell, Send, BookOpen, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TeacherManual = () => (
  <div className="space-y-12 max-w-6xl mx-auto">
    <div className="flex items-center gap-6 p-8 bg-nyra-primary/5 border border-nyra-primary/10 rounded-[3rem]">
      <div className="p-6 bg-nyra-primary/20 text-nyra-primary rounded-[2rem] shadow-xl shadow-nyra-primary/10">
        <Book size={32} />
      </div>
      <div>
        <h2 className="text-4xl font-display font-bold tracking-tight">Teacher's Studio Manual</h2>
        <p className="text-slate-500 font-medium tracking-wide">Operation: Academic Excellence • Master the Command Center</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-nyra-primary/20 transition-all group"
      >
        <div className="w-14 h-14 bg-nyra-primary/10 text-nyra-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpen size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">1. Curriculum Management</h3>
        <p className="text-slate-400 leading-relaxed">
          The foundation of your studio. Create classes, add subjects, and build your curriculum block by block. 
          <br /><br />
          <span className="text-nyra-primary font-bold">Pro Tip:</span> When adding topics, upload high-quality PDFs. Nyra's Neural Scan will index every word, sentence, and diagram, making them interactive for students.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-amber-500/20 transition-all group"
      >
        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Zap size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">2. Exam Builder Hall</h3>
        <p className="text-slate-400 leading-relaxed">
          Design high-stakes assessments. Use manual entry for precision or 'Neural Bulk Upload' for speed—let AI scan your existing papers.
          <br /><br />
          <span className="text-amber-500 font-bold">Checkpoint System:</span> Lock tests behind specific topic mastery. Students can't enter the Exam Hall until they've proven readiness in the related curriculum.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-emerald-500/20 transition-all group"
      >
        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <BarChart3 size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">3. Neural Analytics</h3>
        <p className="text-slate-400 leading-relaxed">
          Access deep student intel. See who is struggling with 'ERI' scores and visual Heatmaps. 
          <br /><br />
          Nyra analyzes student work (DPPs/Exercises) and provides you with a summary of the most common concepts where the class is failing, allowing you to fine-tune your teaching mission.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-blue-500/20 transition-all group"
      >
        <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Send size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">4. Admin Controls</h3>
        <p className="text-slate-400 leading-relaxed">
          Manage announcements and class settings. Use 'Neural Broadcast' to send urgent updates to all enrolled students instantly.
          <br /><br />
          Switch between Teacher and Student views anytime using the top navigation to verify student experience and curriculum flow.
        </p>
      </motion.div>
    </div>
  </div>
);

export const StudentManual = () => (
  <div className="space-y-12 max-w-6xl mx-auto">
    <div className="flex items-center gap-6 p-8 bg-nyra-primary/5 border border-nyra-primary/10 rounded-[3rem]">
      <div className="p-6 bg-nyra-primary/20 text-nyra-primary rounded-[2rem] shadow-xl shadow-nyra-primary/10">
        <Zap size={32} />
      </div>
      <div>
        <h2 className="text-4xl font-display font-bold tracking-tight">Student Dashboard Manual</h2>
        <p className="text-slate-500 font-medium tracking-wide">Operation: Neural Growth • Unleash Your Potential</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-emerald-500/20 transition-all group"
      >
        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpen size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">1. The Learning Hub</h3>
        <p className="text-slate-400 leading-relaxed">
          Access your courses, chapters, and topics. Everything is filtered based on your goal (JEE, Boards, etc.).
          <br /><br />
          <span className="text-emerald-500 font-bold">Classroom Mode:</span> Enter the classroom to study interactive slides. Nyra AI sits right next to you, ready to explain complex notes or solve doubts via voice or chat.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-amber-500/20 transition-all group"
      >
        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <ShieldCheck size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">2. The Neural Hall</h3>
        <p className="text-slate-400 leading-relaxed">
          The proving ground. Take timed tests with NTA-style interfaces. 
          <br /><br />
          <span className="text-amber-500 font-bold">Checkpoint Logic:</span> If a test is locked, you must master the prerequisite study topic first. Complete the topic in the Learning Hub to 'unlock' your mission.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-nyra-primary/20 transition-all group"
      >
        <div className="w-14 h-14 bg-nyra-primary/10 text-nyra-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Sparkles size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">3. Neural Feedback Loops</h3>
        <p className="text-slate-400 leading-relaxed">
          Upload photo submissions of your DPPs and exercises. Nyra will scan your handwriting, provide detailed feedback on your logic, and suggest correct paths.
          <br /><br />
          Check 'Recent Submissions' on your dashboard to see Nyra's corrections and topic mastery updates.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-6 hover:border-blue-500/20 transition-all group"
      >
        <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <TrendingUp size={28} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">4. Mastery Intel</h3>
        <p className="text-slate-400 leading-relaxed">
          Your performance data, visualized. Track your streak, readiness index, and heatmaps in the 'Rank Intel' tab.
          <br /><br />
          Nyra hosts a weekly 'Neural Debrief' via live voice. Talk to her to get a personalized remedial plan to turn your weak areas into strengths.
        </p>
      </motion.div>
    </div>
  </div>
);
