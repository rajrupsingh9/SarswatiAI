import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Target, Zap, Brain, Sparkles, 
  Clock, BarChart3, PieChart as PieChartIcon, Activity,
  ChevronRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, 
  PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { UserProfile, TestSubmission, ClassData } from '../types/academic';

interface StudentAnalyticsProps {
  profile: UserProfile | null;
  submissions: TestSubmission[];
  classes: ClassData[];
}

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ profile, submissions, classes }) => {
  const analyticsData = useMemo(() => {
    if (submissions.length === 0) return null;

    // Calculate ERI (Excellence Readiness Index)
    const avgScore = submissions.reduce((acc, s) => acc + (s.score / s.totalMarks), 0) / submissions.length;
    const eri = Math.round(avgScore * 100);

    // Subject Performance
    const subjectStats: { [key: string]: { total: number, correct: number, count: number } } = {};
    submissions.forEach(s => {
      // In a real app, we'd look up subject by testId. 
      // For demo, we'll map strength/weak areas to subjects
      s.analysis?.strengthAreas.forEach(area => {
          if (!subjectStats[area]) subjectStats[area] = { total: 0, correct: 0, count: 0 };
          subjectStats[area].correct += 1;
          subjectStats[area].total += 1;
      });
      s.analysis?.weakAreas.forEach(area => {
          if (!subjectStats[area]) subjectStats[area] = { total: 0, correct: 0, count: 0 };
          subjectStats[area].total += 1;
      });
    });

    const heatmapData = Object.keys(subjectStats).map(name => ({
      name,
      accuracy: Math.round((subjectStats[name].correct / subjectStats[name].total) * 100)
    })).sort((a, b) => b.accuracy - a.accuracy);

    // Time-Accuracy Scatter
    const scatterData = submissions.map(s => ({
      accuracy: s.analysis?.accuracy || 0,
      speed: s.analysis?.speedScore || 0,
      marks: s.score,
      name: s.submittedAt
    }));

    // Mistake Analysis
    const totalMistakes = {
      conceptual: 0,
      calculation: 0,
      careless: 0,
      timeManagement: 0
    };
    submissions.forEach(s => {
      if (s.analysis?.mistakeCategories) {
        totalMistakes.conceptual += s.analysis.mistakeCategories.conceptual || 0;
        totalMistakes.calculation += s.analysis.mistakeCategories.calculation || 0;
        totalMistakes.careless += s.analysis.mistakeCategories.careless || 0;
        totalMistakes.timeManagement += s.analysis.mistakeCategories.timeManagement || 0;
      }
    });

    const mistakePieData = [
      { name: 'Conceptual', value: totalMistakes.conceptual, color: '#8b5cf6' },
      { name: 'Calculation', value: totalMistakes.calculation, color: '#3b82f6' },
      { name: 'Careless', value: totalMistakes.careless, color: '#f59e0b' },
      { name: 'Timing', value: totalMistakes.timeManagement, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return {
      eri,
      heatmapData,
      scatterData,
      mistakePieData,
      totalMistakes,
      recentTrend: submissions.slice(-5).map(s => ({
          date: new Date(s.submittedAt).toLocaleDateString(),
          score: (s.score / s.totalMarks) * 100
      }))
    };
  }, [submissions]);

  if (!analyticsData) {
    return (
      <div className="py-20 text-center space-y-4 opacity-40">
        <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
            <BarChart3 size={32} />
        </div>
        <h3 className="text-xl font-bold">Neural Data Insufficient</h3>
        <p className="text-sm max-w-xs mx-auto">Complete at least one test mission in the Neural Hall to generate deep analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ERI GAUGE & MASTER SUMMARY */}
        <div className="lg:col-span-1 space-y-8">
          <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-nyra-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Neural Readiness (ERI)</p>
            <div className="relative inline-block mb-6">
                <svg className="w-48 h-48 rotate-[-90deg]">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="#1e293b" strokeWidth="12" />
                    <circle 
                        cx="96" cy="96" r="80" fill="none" stroke="url(#eriGradient)" strokeWidth="12" 
                        strokeDasharray={2 * Math.PI * 80}
                        strokeDashoffset={2 * Math.PI * 80 * (1 - analyticsData.eri / 100)}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="eriGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-2">
                    <span className="text-5xl font-black font-display text-white">{analyticsData.eri}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector Score</span>
                </div>
            </div>
            
            <div className="p-4 bg-nyra-primary/5 border border-nyra-primary/10 rounded-2xl flex items-center justify-between text-left">
                <div>
                   <p className="text-[9px] font-black text-nyra-primary uppercase tracking-widest">Target Delta</p>
                   <p className="text-lg font-bold text-white">Top 2%</p>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <TrendingUp size={16} />
                </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Brain size={16} className="text-nyra-primary" />
                Nyra's Remedial Plan
            </h3>
            <div className="space-y-4">
                {analyticsData.heatmapData.slice(-2).map(item => (
                    <div key={item.name} className="flex gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl max-h-fit">
                            <AlertCircle size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Action Required</p>
                            <p className="text-xs font-bold text-white">Focus on {item.name}</p>
                            <p className="text-[10px] text-slate-500 leading-tight">Mastery dropped below 60%. Schedule a 'Neural Re-Scan' within 48 hours.</p>
                        </div>
                    </div>
                ))}
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-xs font-black text-slate-400 uppercase tracking-widest rounded-2xl transition-all border border-white/5">
                    View Complete Strategy
                </button>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Performance Trend</h3>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                        +12% Gain
                    </div>
                </div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.recentTrend}>
                            <defs>
                                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem]">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8">Subject Heatmap</h3>
                <div className="space-y-4">
                    {analyticsData.heatmapData.slice(0, 4).map((item, idx) => (
                        <div key={item.name} className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className={idx < 2 ? 'text-emerald-500' : 'text-amber-500'}>{item.name}</span>
                                <span className="text-slate-500 font-mono">{item.accuracy}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.accuracy}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                    className={`h-full rounded-full ${idx < 2 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Mistake Analysis</h3>
                  <PieChartIcon size={16} className="text-nyra-primary opacity-50" />
                </div>
                
                {analyticsData.mistakePieData.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analyticsData.mistakePieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {analyticsData.mistakePieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {analyticsData.mistakePieData.map((item) => (
                          <div key={item.name} className="space-y-1">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.name}</span>
                             </div>
                             <p className="text-lg font-bold text-white pl-4">{item.value}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-600 italic text-xs">
                     No mistakes detected yet. Keep up the accuracy!
                  </div>
                )}
            </div>
          </div>

          <div className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem]">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-xl font-bold">Neural Efficiency Grid</h3>
                   <p className="text-xs text-slate-500">Mapping accuracy against response speed for optimal strategy</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-nyra-primary" /> Speed (X)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Accuracy (Y)
                    </div>
                </div>
             </div>
             
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis type="number" dataKey="speed" name="Speed" unit="%" stroke="#475569" fontSize={10} tickLine={false} />
                        <YAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" stroke="#475569" fontSize={10} tickLine={false} />
                        <ZAxis type="number" dataKey="marks" range={[60, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <Scatter name="Tests" data={analyticsData.scatterData} fill="#3b82f6" shape="circle" />
                    </ScatterChart>
                </ResponsiveContainer>
             </div>

             <div className="grid grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/5">
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-3 text-nyra-primary mb-4">
                        <Zap size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">The "Rush" Zone</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        "Your speed is high, but logic is fractured. In the last session, you spent 12% less time than needed on HARD problems, leading to avoidable collisions."
                    </p>
                </div>
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center gap-3 text-emerald-500 mb-4">
                        <CheckCircle2 size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Mastery Pulse</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        "Numerical analysis remains your strongest sector. You are currently 84% ready for the 'Constraint Logic' challenge in the next Exam Phase."
                    </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
