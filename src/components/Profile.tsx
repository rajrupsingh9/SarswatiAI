import { motion } from 'motion/react';
import { 
  User, 
  BookOpen, 
  Award, 
  MapPin, 
  Mail, 
  Shield, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Clock,
  X,
  Target,
  Brain
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserProfile, ClassData } from '../types/academic';

interface ProfileProps {
  profile: UserProfile | null;
  classes: ClassData[];
  onBack: () => void;
  onLogout: () => void;
  onPerformanceIntel: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const progressData = [
  { name: 'Completed', value: 75, color: '#7c3aed' },
  { name: 'Remaining', value: 25, color: '#1e293b' },
];

export default function Profile({ profile, classes, onBack, onLogout, onPerformanceIntel, onUpdateProfile }: ProfileProps) {
  const selectedClass = classes.find(c => c.id === profile?.selectedClassId);
  const enrolledSubjects = selectedClass?.subjects || [];

  const subjectGradients = [
    'from-blue-500/20 to-cyan-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-green-500/20 to-emerald-500/20'
  ];

  return (
    <div className="min-h-screen bg-nyra-dark text-slate-200 pb-20">
      {/* Header - Personal Identity */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-nyra-primary/30 to-nyra-dark" />
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 flex flex-col md:flex-row items-end gap-6">
          {/* Avatar with Neon Glow */}
          <div className="relative group">
            <div className="absolute inset-0 bg-nyra-primary rounded-full blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative w-32 h-32 rounded-full border-4 border-nyra-primary p-1 bg-nyra-panel">
              <div className="w-full h-full rounded-full bg-nyra-dark flex items-center justify-center overflow-hidden">
                <User className="w-16 h-16 text-nyra-primary" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-nyra-dark" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-display font-bold text-white">{profile?.displayName || 'Guest Student'}</h1>
              <span className="px-3 py-1 bg-nyra-primary/20 text-nyra-primary rounded-full text-xs font-bold border border-nyra-primary/30 uppercase tracking-wider">
                {selectedClass?.name || 'Unassigned Class'}
              </span>
            </div>
            <p className="text-white/60 font-mono text-lg tracking-widest uppercase">ID: {profile?.uid.substring(0, 8).toUpperCase() || '#PENDING'}</p>
          </div>
        </div>
      </div>

      <div className="px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column: Stats Dashboard & Enrolled Subjects */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Dashboard - Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-nyra-panel/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-12 h-12" />
              </div>
              <div className="w-32 h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">75%</span>
                </div>
              </div>
              <span className="text-white/60 text-sm font-medium">Learning Progress</span>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-nyra-panel/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center"
            >
              <div className="bg-blue-500/20 p-4 rounded-2xl mb-4">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{enrolledSubjects.length}</h3>
              <p className="text-white/60 text-sm">Active Subjects</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-nyra-panel/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center"
            >
              <div className="bg-amber-500/20 p-4 rounded-2xl mb-4">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center border border-amber-500/50">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-sm mt-4">Achievements</p>
            </motion.div>
          </div>
          
          {/* Neural ID Summary Card */}
          <div className="bg-gradient-to-br from-nyra-primary/10 to-indigo-500/10 border border-nyra-primary/30 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Brain size={120} className="text-nyra-primary" />
            </div>
            
            <div className="flex-1 space-y-4 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-nyra-primary/20 rounded-2xl border border-nyra-primary/30">
                        <Sparkles size={24} className="text-nyra-primary" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-white">Neural Intelligence ID</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cognitive Blueprint Verified</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dominant Style</p>
                        <p className="text-lg font-bold text-white">{profile?.intelligenceProfile?.cognitiveStyle || 'Calculating...'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IQ/EQ Balance</p>
                        <p className="text-lg font-bold text-white">{profile?.intelligenceProfile ? 'Optimal Sync' : 'Syncing...'}</p>
                    </div>
                </div>
            </div>
            
            <div className="w-full md:w-auto">
                <button 
                  onClick={onPerformanceIntel}
                  className="w-full px-8 py-4 bg-nyra-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-nyra-primary/20 hover:scale-105 transition-all"
                >
                    View Neural Map
                </button>
            </div>
          </div>

          {/* Enrolled Subjects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-white">My Enrolled Subjects</h2>
              <button className="text-nyra-primary text-sm hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledSubjects.length > 0 ? enrolledSubjects.map((sub, idx) => (
                <motion.div
                  key={sub.id}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-gradient-to-br ${subjectGradients[idx % subjectGradients.length]} backdrop-blur-md border border-white/10 rounded-2xl p-6 relative group overflow-hidden`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{sub.name}</h3>
                      <p className="text-white/60 text-sm flex items-center gap-2 italic">
                        {sub.chapters.length} Chapters Active
                      </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-white/40">
                        <span>Average Progress</span>
                        <span>{60 + (idx * 5)}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${60 + (idx * 5)}%` }}
                          className="h-full bg-white transition-all duration-1000"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <p className="text-white/40">Latest Topic</p>
                        <p className="text-white/80 font-medium truncate max-w-[100px]">
                          {sub.chapters[0]?.name || 'Intro'}
                        </p>
                      </div>
                      <button className="bg-white text-nyra-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-nyra-primary hover:text-white transition-colors">
                        Resume
                      </button>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-700">
                  <p className="text-slate-500 italic">No subjects enrolled in this class yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Personal Info */}
        <div className="space-y-8">
          {/* Nyra Insight (AI Section) */}
          <div className="bg-nyra-primary/10 border border-nyra-primary/20 rounded-3xl p-6 relative overflow-hidden group">
            {/* Animated Glow Background */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-nyra-primary blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
            
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="bg-nyra-primary p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-display font-bold text-white">Nyra Insight</h2>
            </div>
            
            <div className="space-y-4 relative">
              <p className="text-slate-300 leading-relaxed italic">
                "{profile?.displayName.split(' ')[0] || 'Student'}, your consistency in learning is exceptional. You've completed 75% of your goals. I recommend focusing on your weakest subject next for a balanced score."
              </p>
              <div className="pt-4 border-t border-white/5">
                <button className="w-full bg-nyra-primary/20 hover:bg-nyra-primary/30 text-nyra-primary py-3 rounded-2xl font-bold transition-all border border-nyra-primary/20">
                  Ask Nyra for Plan
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-nyra-panel/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-6">
            <h2 className="text-xl font-display font-bold text-white">Personal Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded-xl">
                  <User className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-white/40">Status</p>
                  <p className="text-white/80 font-medium">Verified Student</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded-xl">
                  <Mail className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-white/40">Email Address</p>
                  <p className="text-white/80 font-medium">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded-xl">
                  <User className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-white/40">User ID</p>
                  <p className="text-white/80 font-medium">{profile?.uid}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded-xl">
                  <MapPin className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <p className="text-white/40">Access Level</p>
                  <p className="text-white/80 font-medium text-xs leading-tight">Full Interactive Access</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-nyra-primary" />
                  <span className="text-sm font-medium">Security Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Interests Section */}
          <div className="bg-nyra-panel/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-6">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
              <Brain className="w-5 h-5 text-nyra-primary" />
              Contextual Interests
            </h2>
            <p className="text-xs text-slate-500 italic leading-relaxed">
              Nyra uses these to generate personalized examples (like Virat Kohli or Gaming potions) to make concepts easier.
            </p>

            <div className="flex flex-wrap gap-2">
              {profile?.interests?.map(interest => (
                <span key={interest} className="px-3 py-1.5 bg-nyra-primary/20 text-nyra-primary text-[10px] font-black uppercase rounded-lg flex items-center gap-2 border border-nyra-primary/30">
                  {interest}
                  <button onClick={() => {
                    const newInterests = profile.interests?.filter(i => i !== interest);
                    onUpdateProfile?.({ interests: newInterests });
                  }} className="hover:text-white transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {(!profile?.interests || profile.interests.length === 0) && (
                <p className="text-xs text-slate-600 italic">No interests added. Nyra is guessing your vibe!</p>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                id="profileInterestInput"
                placeholder="e.g. Cricket, Anime..."
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' && e.target.value) {
                    const newInterests = [...(profile?.interests || []), e.target.value.trim()];
                    onUpdateProfile?.({ interests: newInterests });
                    e.currentTarget.value = '';
                  }
                }}
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-nyra-primary transition-all text-slate-300"
              />
              <button 
                onClick={() => {
                  const el = document.getElementById('profileInterestInput') as HTMLInputElement;
                  if (el.value) {
                    const newInterests = [...(profile?.interests || []), el.value.trim()];
                    onUpdateProfile?.({ interests: newInterests });
                    el.value = '';
                  }
                }}
                className="px-4 bg-nyra-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest"
              >Add</button>
            </div>
          </div>

          {/* Logout Section */}
          <div className="p-6">
            <button 
              onClick={onLogout}
              className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl font-bold hover:bg-rose-500 hover:text-white transition-all shadow-lg"
            >
              Sign Out from Neural Net
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
