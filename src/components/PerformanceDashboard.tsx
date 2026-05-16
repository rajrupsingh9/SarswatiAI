import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Target, ShieldAlert, 
  TrendingUp, Activity, RotateCcw, 
  ChevronLeft, BarChart3, PieChart,
  Users, Flame, Sparkles, ArrowRight,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { PerformanceMetrics, UserProfile } from '../types/academic';

interface Props {
  metrics: PerformanceMetrics | null;
  profile: UserProfile | null;
  onBack: () => void;
}

const COGNITIVE_STYLES = {
  Intuitive: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Predicts answers from experience and pattern recognition.' },
  Analytical: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Breaks down complex problems into verifiable steps.' },
  Visual: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Thinks in diagrams, structures, and spatial relationships.' },
  Procedural: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', desc: 'Follows rigorous methods and thrives on structured rules.' },
  Balanced: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', desc: 'Equally adept at multiple solving styles.' }
};

const COLORS = {
  strong: '#10b981', // emerald-500
  average: '#f59e0b', // amber-500
  weak: '#ef4444'     // red-500
};

const NeuralMapNode = ({ x, y, label, status, index }: { x: number, y: number, label: string, status: string, index: number }) => (
  <motion.g
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.2 }}
  >
    <defs>
      <filter id={`glow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle 
      cx={x} 
      cy={y} 
      r="6" 
      fill={status === 'strong' ? '#10b981' : status === 'average' ? '#f59e0b' : '#ef4444'} 
      filter={`url(#glow-${index})`}
      className="animate-pulse"
    />
    <text 
      x={x} 
      y={y + 20} 
      textAnchor="middle" 
      className="text-[8px] font-black uppercase tracking-widest fill-slate-500"
    >
      {label}
    </text>
  </motion.g>
);

const NeuralRoadmap = ({ data }: { data: { name: string, status: string }[] }) => {
  const points = data.map((_, i) => ({
    x: 50 + (i * 120),
    y: 100 + Math.sin(i * 1.5) * 40
  }));

  const pathD = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ""
  );

  return (
    <div className="w-full bg-slate-900/30 rounded-[3rem] border border-white/5 p-10 relative overflow-hidden h-[350px]">
      <div className="absolute inset-0 bg-gradient-to-r from-nyra-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <Zap className="text-nyra-primary" size={20} />
              3D Neural Progress Path
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your custom learning roadmap rendered in real-time</p>
          </div>
          <div className="flex gap-4">
            {['Weak', 'Average', 'Strong'].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s === 'Strong' ? 'bg-emerald-500' : s === 'Average' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="w-full h-full overflow-x-auto custom-scrollbar overflow-y-hidden">
            <svg className="h-full" width={points.length * 150} viewBox={`0 0 ${points.length * 150} 200`}>
              {/* Animated Glow Path */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="2"
                strokeDasharray="1000"
                strokeDashoffset="1000"
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              
              {points.map((p, i) => (
                <NeuralMapNode 
                  key={i} 
                  index={i}
                  x={p.x} 
                  y={p.y} 
                  label={data[i].name} 
                  status={data[i].status} 
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PerformanceDashboard({ metrics, profile, onBack }: Props) {
  // Sample data if metrics are null for visualization
  const defaultMetrics: PerformanceMetrics = metrics || {
    eri: 72,
    readinessIndex: 0.85,
    heatMap: {
      "Rotation": "weak",
      "Calculus": "strong",
      "Thermodynamics": "average",
      "Kinematics": "strong",
      "Optics": "weak"
    },
    memoryDecay: {
      "Organic Chemistry": "2024-03-10",
      "Waves": "2024-01-15"
    },
    lastAnalyzed: new Date().toISOString()
  };

  const heatmapData = Object.entries(defaultMetrics.heatMap).map(([name, status]) => ({
    name,
    value: status === 'strong' ? 100 : status === 'average' ? 60 : 30,
    status
  }));

  const pieData = [
    { name: 'Strong', value: heatmapData.filter(d => d.status === 'strong').length, color: COLORS.strong },
    { name: 'Average', value: heatmapData.filter(d => d.status === 'average').length, color: COLORS.average },
    { name: 'Weak', value: heatmapData.filter(d => d.status === 'weak').length, color: COLORS.weak }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200 p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-slate-400 hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                Neural Intelligence Profile
                <span className="px-2 py-0.5 bg-nyra-primary/20 border border-nyra-primary/30 rounded-full text-[10px] font-black text-nyra-primary uppercase tracking-[0.2em]">Neural ID</span>
              </h1>
              <p className="text-slate-500 font-medium">Deep cognitive analysis of your academic neural roadmap.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-nyra-primary/20 flex items-center justify-center text-nyra-primary">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Last Synced</p>
              <p className="text-sm font-bold text-white">
                {new Date(defaultMetrics.lastAnalyzed).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Top Row: ERI and Comparative Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ERI Gauge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-nyra-primary/10 to-transparent p-10 rounded-[3rem] border border-nyra-primary/20 flex flex-col items-center justify-center text-center gap-6 group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit size={160} className="text-nyra-primary" />
            </div>

            <div className="relative">
              <div className="w-48 h-48 rounded-full border-8 border-nyra-primary/10 flex items-center justify-center relative">
                <div className="absolute inset-2 rounded-full border-4 border-nyra-primary border-t-transparent animate-spin-slow" />
                <div className="text-center">
                  <span className="text-6xl font-black text-white">{defaultMetrics.eri}%</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-nyra-primary mt-1">Ready</p>
                </div>
              </div>
            </div>

            <div className="max-w-md">
              <h3 className="text-2xl font-bold text-white mb-2">
                {profile?.focusGoal === 'JEE' ? 'Rank Prediction Protocol' : 
                 profile?.focusGoal === 'BOARDS' ? 'Academic Mastery Scale' : 
                 'Examination Readiness Index (ERI)'}
              </h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                {profile?.focusGoal === 'JEE' ? 
                  `Your concept mastery and solve speed place you in the top 15% of the batch. Focus on Time-Value Sync to break into Top 5,000.` : 
                 profile?.focusGoal === 'BOARDS' ? 
                  `Your step-wise presentation is excellent. Current mastery level projects a 95%+ score in school finals.` : 
                  `Aap concept mastery aur consistency ke basis par ${defaultMetrics.eri}% ready hain. Focus on difficult topics to boost this.`}
              </p>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                <Flame size={18} className="text-orange-500" />
                <span className="text-sm font-bold text-white">8 Day Streak</span>
              </div>
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                <Users size={18} className="text-blue-500" />
                <span className="text-sm font-bold text-white">Top 15% Batch</span>
              </div>
            </div>
          </motion.div>

          {/* Comparative analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col gap-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Peer Comparison</h3>
              <Users size={20} className="text-slate-500" />
            </div>

            <div className="flex flex-col gap-6">
              {[
                { label: 'Accuracy', user: 88, avg: 72, color: 'text-emerald-500' },
                { label: 'Problem Solving', user: 92, avg: 65, color: 'text-nyra-primary' },
                { label: 'Consistency', user: 70, avg: 75, color: 'text-amber-500' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>{stat.label}</span>
                    <span className={stat.color}>{stat.user}% vs {stat.avg}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.user}%` }}
                      className={`h-full ${stat.color.replace('text', 'bg')}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto p-6 bg-nyra-primary/10 rounded-[2rem] border border-nyra-primary/20">
              <p className="text-xs font-medium text-slate-300 italic leading-relaxed">
                "Bhai, tumhara problem solving average se kaafi aage hai, lekin consistency thodi d ढीली pad rahi hai. Rozana ek test do!"
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-nyra-primary mt-3">— Nyra's Advice</p>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {defaultMetrics.memoryDecay && Object.keys(defaultMetrics.memoryDecay).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-nyra-primary/20 border-2 border-nyra-primary/40 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-nyra-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 animate-pulse">
                <Sparkles size={80} className="text-nyra-primary" />
              </div>

              <div className="w-20 h-20 rounded-3xl bg-nyra-primary flex items-center justify-center text-white shadow-xl shadow-nyra-primary/50 shrink-0">
                <BrainCircuit size={40} />
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 bg-nyra-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full">Proactive Alert</span>
                  <h3 className="text-2xl font-black text-white italic">"Time for a Neural Refresh!"</h3>
                </div>
                <p className="text-slate-300 font-medium">
                  Nyra detects memory decay in <span className="text-nyra-primary font-bold">{Object.keys(defaultMetrics.memoryDecay)[0]}</span>. 
                  Don't let your hard work fade. It takes only 20 mins to restore 90% retention today.
                </p>
              </div>

              <div className="flex gap-4 shrink-0">
                <button className="px-10 py-4 bg-nyra-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-nyra-primary/40 flex items-center gap-2">
                   Revise for 20 Mins <ArrowRight size={16} />
                </button>
                <button className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                   Remind in 1 Hr
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Neural Roadmap */}
        <NeuralRoadmap data={heatmapData} />

        {/* Intelligence Profiling Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cognitive Core Radar */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="lg:col-span-1 bg-slate-900 border border-white/5 p-10 rounded-[3rem] relative overflow-hidden group"
            >
                <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-500">
                    <BrainCircuit size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cognitive Core</span>
                </div>

                <div className="h-60 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                            { subject: 'Calculation', A: profile?.intelligenceProfile?.calculationAbility || 70 },
                            { subject: 'Thinking', A: profile?.intelligenceProfile?.thinkingAbility || 65 },
                            { subject: 'Concepts', A: profile?.intelligenceProfile?.conceptualStrength || 85 },
                            { subject: 'Reasoning', A: profile?.intelligenceProfile?.reasoningAbility || 75 },
                            { subject: 'Persistence', A: profile?.intelligenceProfile?.learningPersistence || 90 },
                        ]}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} />
                            <Radar
                                name="Mastery"
                                dataKey="A"
                                stroke="#7c3aed"
                                fill="#7c3aed"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs font-bold text-slate-300">Neural Sync Balance</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-8 h-1 rounded-full ${i <= 4 ? 'bg-nyra-primary' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Cognitive Style & Deep Insights */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
                <div className="bg-white/5 border border-white/5 p-8 rounded-[3rem] space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black italic text-white">Dominant Cognitive Style</h4>
                        <Target size={20} className="text-nyra-primary" />
                    </div>
                    
                    {(() => {
                        const styleKey = (profile?.intelligenceProfile?.cognitiveStyle || 'Analytical') as keyof typeof COGNITIVE_STYLES;
                        const style = COGNITIVE_STYLES[styleKey] || COGNITIVE_STYLES.Analytical;
                        return (
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-3 px-4 py-2 ${style.bg} ${style.border} rounded-2xl`}>
                                    <Sparkles size={16} className={style.color} />
                                    <span className={`text-sm font-black uppercase tracking-widest ${style.color}`}>{styleKey}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-400 leading-relaxed italic">
                                    "{style.desc}"
                                </p>
                            </div>
                        )
                    })()}

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Speed vs Accuracy</span>
                            <span className="text-[10px] font-black text-nyra-primary uppercase tracking-widest">{profile?.intelligenceProfile?.speedAccuracyBalance || 72}% Optimal</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${profile?.intelligenceProfile?.speedAccuracyBalance || 72}%` }}
                              className="h-full bg-gradient-to-r from-nyra-primary to-emerald-500"
                           />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-nyra-primary/10 p-8 rounded-[3rem] relative overflow-hidden group">
                    <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <BrainCircuit size={120} className="text-nyra-primary" />
                    </div>
                    
                    <h4 className="text-lg font-black italic text-white flex items-center gap-3 mb-6">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Neural Forecast
                    </h4>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Mastery Trajectory</p>
                            <p className="text-xl font-bold text-white tracking-tight">On track for IIT-JEE Advanced Eligibility</p>
                        </div>
                        
                        <div className="p-4 bg-nyra-primary/5 rounded-2xl border border-nyra-primary/10 italic text-sm text-slate-300">
                            "Bhai, tumhare logical gaps kam ho rahe hain. Agar reasoning ability 5% aur badha li, toh Calculus me full marks pakke!"
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Lower Row: Heatmap and Memory Decay */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Concept Heatmap */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 p-8 rounded-[3rem] border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white">Concept Heatmap</h3>
                <p className="text-xs text-slate-500 font-medium">Strength distribution across sub-topics.</p>
              </div>
              <PieChart size={24} className="text-slate-500" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 flex flex-col gap-4">
                {heatmapData.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-slate-300">{topic.name}</span>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${
                         topic.status === 'strong' ? 'bg-emerald-500' :
                         topic.status === 'average' ? 'bg-amber-500' : 'bg-red-500'
                       }`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                         topic.status === 'strong' ? 'text-emerald-500' :
                         topic.status === 'average' ? 'text-amber-500' : 'text-red-500'
                       }`}>{topic.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Memory Decay & Alerts */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col gap-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Memory Decay Alerts</h3>
                <p className="text-xs text-slate-500 font-medium">Topics you haven't touched in 15+ days.</p>
              </div>
              <RotateCcw size={24} className="text-slate-500" />
            </div>

            <div className="flex flex-col gap-4">
              {Object.entries(defaultMetrics.memoryDecay).map(([topic, date], i) => (
                <div key={i} className="p-6 bg-red-500/5 rounded-[2rem] border border-red-500/20 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                       <ShieldAlert size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-white">{topic}</h4>
                       <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Last mastery: {new Date(date).toLocaleDateString()}</p>
                     </div>
                   </div>
                   <button className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                     Revise Now
                   </button>
                </div>
              ))}
            </div>

            <div className="p-8 bg-amber-500/5 rounded-[2rem] border border-amber-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Target size={48} className="text-amber-500" />
               </div>
               <h4 className="text-lg font-bold text-white mb-2 underline decoration-amber-500/50 decoration-4 underline-offset-4">Readiness Tip</h4>
               <p className="text-sm font-medium text-slate-400 leading-relaxed">
                 "Bhai, tumne **Organic Chemistry** ko March ke baad haath nahi lagaya hai. Formulae bhul rahe ho kya? Kal ek mock test setup kardo warna exam ke din 'Reaction' nahi milega!"
               </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
