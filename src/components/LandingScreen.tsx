
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { 
  GraduationCap, Users, Sparkles, User, ArrowRight, ArrowLeft, 
  Zap, Brain, Microscope, BarChart3, Fingerprint, Globe,
  ShieldCheck, MessageSquare, PlayCircle, Star,
  Atom, FlaskConical, Calculator, Dna, Trophy, Medal,
  Activity, BookOpen, ShieldAlert, Monitor, Terminal, Book, Globe2, Shapes
} from 'lucide-react';
import { ViewRole, ClassData, UserProfile, FocusGoal } from '../types/academic';
import { auth } from '../lib/firebase';

interface LandingScreenProps {
  classes: ClassData[];
  user: UserProfile | null;
  onLogin: () => void;
  onSelectRole: (role: ViewRole) => void;
  onStudentSignup: (profile: UserProfile) => void;
}

const ADMIN_EMAIL = 'nikhiliitjee.21@gmail.com';

// --- Sub-components for Enhanced UI ---

const WordReveal = ({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) => {
  const words = text.split(" ");
  return (
    <div className={`flex flex-wrap justify-center overflow-hidden h-fit ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: "110%", rotateX: 45 }}
          animate={{ y: 0, rotateX: 0 }}
          transition={{ 
            duration: 1.2, 
            delay: delay + (i * 0.08), 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className="inline-block mr-[0.2em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const InteractiveBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: e.clientX / window.innerWidth, 
        y: e.clientY / window.innerHeight 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#020617]">
      {/* Dynamic Blobs */}
      <motion.div 
        animate={{ 
          x: (mousePos.x - 0.5) * 100, 
          y: (mousePos.y - 0.5) * 100,
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-nyra-primary/10 blur-[150px] rounded-full mix-blend-screen opacity-40 animate-glow"
      />
      <motion.div 
        animate={{ 
          x: (mousePos.x - 0.5) * -150, 
          y: (mousePos.y - 0.5) * -150,
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[180px] rounded-full mix-blend-screen opacity-30"
      />
      
      {/* Tech Grid */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" 
      />
      
      {/* Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

const MagneticButton = ({ children, onClick, className = "", variant = "primary" }: { children: React.ReactNode, onClick: () => void, className?: string, variant?: "primary" | "secondary" | "glass" }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    // Limits the pull effect
    const pull = 0.3;
    setPosition({ x: distanceX * pull, y: distanceY * pull });
  };

  const handleMouseOut = () => setPosition({ x: 0, y: 0 });

  const variants = {
    primary: "bg-nyra-primary text-white shadow-nyra-primary/20",
    secondary: "bg-white text-black",
    glass: "bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10"
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseOut}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all transform active:scale-95 shadow-2xl ${variants[variant]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      {variant === "primary" && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full hover:animate-[shimmer_2s_infinite] transition-transform" />
      )}
    </motion.button>
  );
};

const PulseVisualizer = () => (
  <div className="flex items-center gap-1 h-6">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          height: [4, 16, 4],
          opacity: [0.3, 1, 0.3]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          delay: i * 0.15,
          ease: "easeInOut" 
        }}
        className="w-1 bg-nyra-primary rounded-full shadow-[0_0_8px_rgba(124,58,237,0.5)]"
      />
    ))}
  </div>
);

const FloatingLabs = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-20%", "20%"],
            x: [null, "10%", "-10%"],
            opacity: [0, 0.1, 0],
            rotate: [0, 45, 0]
          }}
          transition={{ 
            duration: 15 + Math.random() * 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: i * 2
          }}
          className="absolute w-64 h-64 border border-nyra-primary/5 rounded-full"
        />
      ))}
    </div>
  );
};

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) => (
  <div className="text-center mb-24 space-y-6">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-nyra-primary text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-md"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-nyra-primary animate-pulse" />
      {subtitle || "Excellence Guaranteed"}
    </motion.div>
    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none text-gradient px-4">
      {children}
    </h2>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity ${color}`} />
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border border-white/10 transition-transform group-hover:rotate-6 ${color.replace('bg-', 'bg-opacity-20 ')}`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-').replace('-500', '-400')}`} />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-xs leading-relaxed font-medium">{desc}</p>
  </motion.div>
);

const LandingScreen: React.FC<LandingScreenProps> = ({ classes, user, onLogin, onSelectRole, onStudentSignup }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<FocusGoal | null>(null);
  const { scrollYProgress } = useScroll();
  
  const isUserAdmin = 
    user?.email?.toLowerCase().trim() === ADMIN_EMAIL ||
    auth.currentUser?.email?.toLowerCase().trim() === ADMIN_EMAIL;

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
    if (user?.selectedClassId) setSelectedClassId(user.selectedClassId);
    if (user?.focusGoal) setSelectedGoal(user.focusGoal);
    if (isUserAdmin && showSignup) {
      setShowSignup(false);
    }
  }, [user, isUserAdmin]);

  const handleEducatorAccess = () => {
    if (!user) { onLogin(); return; }
    if (isUserAdmin) { onSelectRole('teacher'); } 
    else {
      alert("Access Denied: Only authorized educators can access the Teacher Studio.");
      if (user.isEnrolled) onSelectRole('student');
      else setShowSignup(true);
    }
  };

  const handleStudentAccess = () => {
    if (!user) { onLogin(); return; }
    if (user.isEnrolled || isUserAdmin) onSelectRole('student');
    else setShowSignup(true);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedClassId || !selectedGoal) return;
    onStudentSignup({
      ...user,
      uid: user?.uid || '',
      displayName: name,
      email: user?.email || '',
      photoURL: user?.photoURL || '',
      selectedClassId: selectedClassId,
      focusGoal: selectedGoal,
      role: 'student',
      isEnrolled: true
    });
  };

  const currentClassNode = classes.find(c => c.id === selectedClassId);
  const isHighSchool = currentClassNode && (currentClassNode.name.includes('11') || currentClassNode.name.includes('12'));
  const isFoundationAge = currentClassNode && (['7', '8', '9', '10'].some(n => currentClassNode.name.includes(n)));

  return (
    <div className="min-h-screen bg-nyra-dark selection:bg-nyra-primary/30 selection:text-white transition-colors duration-700">
      <InteractiveBackground />

      {/* Modern Header */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 transition-all duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 pointer-events-auto cursor-pointer group"
          >
            <div className="w-10 h-10 bg-nyra-primary rounded-xl flex items-center justify-center shadow-2xl shadow-nyra-primary/40 overflow-hidden relative border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
              <Sparkles size={20} className="text-white group-hover:scale-125 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tighter leading-none font-display">NYRA.AI</span>
              <span className="text-[7px] font-black text-nyra-primary/80 uppercase tracking-[0.4em] mt-1">Neural Labs</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6 pointer-events-auto px-5 py-2 nyra-glass rounded-2xl shadow-2xl shadow-black/40 border border-white/5"
          >
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-6 mr-4 border-r border-white/10 pr-6">
                  <button 
                    onClick={handleEducatorAccess}
                    className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all"
                  >
                    Teacher Portal
                  </button>
                  <button 
                    onClick={handleStudentAccess}
                    className="px-6 py-2.5 bg-nyra-primary text-white hover:brightness-110 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-xl shadow-nyra-primary/20"
                  >
                    {user.isEnrolled ? "Go to Academy" : "Access Academy"}
                  </button>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-white tracking-tight">{user.displayName || 'User'}</span>
                  <span className="text-[7px] font-black text-nyra-primary uppercase tracking-[0.3em] opacity-80">Cognitive ID Active</span>
                </div>
                <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden shadow-lg p-0.5 bg-white/5 transition-transform hover:rotate-12">
                  <img className="w-full h-full rounded-md object-cover" src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" referrerPolicy="no-referrer" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleEducatorAccess}
                  className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all"
                >
                  Teacher Portal
                </button>
                <button 
                  onClick={handleStudentAccess}
                  className="px-6 py-2.5 bg-white text-black hover:bg-nyra-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-xl shadow-white/5"
                >
                  Access Academy
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 pt-32 pb-32 px-6">
        <AnimatePresence mode="wait">
          {!showSignup ? (
            <div className="max-w-7xl mx-auto space-y-24">
              
              {/* HERO SECTION */}
              <div className="text-center space-y-12 max-w-5xl mx-auto pt-24 pb-16 min-h-[85vh] flex flex-col justify-center items-center relative">
                {/* Hero Specific Decorative Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-nyra-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="group relative inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/[0.03] border border-white/10 nyra-glass shadow-2xl mb-4 hover:border-white/20 transition-all cursor-default"
                >
                  <PulseVisualizer />
                  <span className="text-nyra-gradient text-[11px] font-black uppercase tracking-[0.5em] ml-2">Neural Link Established</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-nyra-primary/0 via-nyra-primary/10 to-nyra-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </motion.div>

                <div className="space-y-10 relative">
                  <h1 
                    className="text-[4.5rem] md:text-[8.5rem] lg:text-[11rem] font-display font-black text-white tracking-tighter leading-[0.78] flex flex-col items-center"
                  >
                    <WordReveal text="Evolution" delay={0.2} className="text-gradient" />
                    <motion.div 
                      className="overflow-hidden py-2 -mt-6 md:-mt-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.span
                         initial={{ y: "110%", rotateX: -30 }}
                         animate={{ y: 0, rotateX: 0 }}
                         transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                         className="italic text-nyra-primary relative inline-block drop-shadow-[0_10px_40px_rgba(124,58,237,0.4)]"
                      >
                        of Learning.
                        <motion.div 
                          animate={{ 
                            left: ['-20%', '120%'],
                            opacity: [0, 1, 0]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                          className="absolute bottom-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent w-full blur-sm"
                        />
                      </motion.span>
                    </motion.div>
                  </h1>
                  
                  <div className="max-w-4xl mx-auto px-6">
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.02,
                            delayChildren: 0.8
                          }
                        }
                      }}
                      className="text-slate-400 text-xl md:text-3xl font-medium leading-[1.4] tracking-tight"
                    >
                      {"Nyra is your".split(" ").map((w, i) => (
                        <motion.span key={i} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="inline-block mr-2">{w}</motion.span>
                      ))}
                      <motion.span 
                        variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                        className="text-white font-extrabold italic bg-white/[0.07] px-3 py-1 rounded-xl border border-white/10 mx-2 shadow-[0_0_30px_rgba(124,58,237,0.15)] relative group cursor-pointer inline-flex items-center gap-2"
                      >
                        <Sparkles size={20} className="text-nyra-primary animate-pulse" />
                        Neural Partner
                        <motion.div 
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-nyra-primary/0 via-nyra-primary/20 to-nyra-primary/0"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.span>
                      {"—decoding cognitive patterns to build a personalized academic roadmap for JEE, Boards, and beyond.".split(" ").map((w, i) => (
                        <motion.span key={i} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="inline-block mr-2">{w}</motion.span>
                      ))}
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-6"
                >
                  <MagneticButton 
                    onClick={handleStudentAccess}
                    variant="primary"
                    className="text-[12px] px-14 py-6 shadow-[0_20px_50px_rgba(124,58,237,0.2)]"
                  >
                    {user?.isEnrolled ? "Enter Neural Academy" : "Initialize Neural ID"}
                  </MagneticButton>
                  <MagneticButton 
                    onClick={() => {
                        const el = document.getElementById('bento-grid');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    variant="glass"
                    className="text-[12px] px-14 py-6"
                  >
                    Explore Protocol
                  </MagneticButton>
                </motion.div>
                
                {/* Dynamic Scroll Indicator */}
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 0.3 }}
                   transition={{ delay: 2, duration: 1 }}
                   className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Decrypting Features</span>
                    <div className="w-px h-12 bg-gradient-to-b from-nyra-primary to-transparent" />
                </motion.div>
              </div>


              {/* BENTO GRID FEATURES */}
              <section id="bento-grid" className="pt-20 relative">
                <FloatingLabs />
                <SectionTitle subtitle="Neural Infrastructure">Advanced Cognitive Protocols</SectionTitle>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[300px]">
                  {/* Card 1: Main Feature (Big) */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -10, transition: { duration: 0.4 } }}
                    className="md:col-span-8 md:row-span-2 nyra-card relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-nyra-primary/5 blur-[120px] rounded-full -mr-40 -mt-40 group-hover:bg-nyra-primary/10 transition-colors duration-1000" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="space-y-8">
                        <div className="w-20 h-20 bg-nyra-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-nyra-primary/30 border border-white/20">
                          <Brain size={40} className="text-white" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] tracking-tight">Adaptive Neural<br/><span className="text-nyra-primary">Curriculum Engine</span></h3>
                            <p className="text-slate-400 text-lg max-w-lg font-medium leading-relaxed">
                            Nyra maps your brain's unique logic flows to create a non-linear textbook that evolves as you learn. No more rigid chapters.
                            </p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-nyra-primary animate-pulse" />
                           <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Matrix Version 4.0</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Low Latency Synthesis</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2: Medium Feature */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ y: -10 }}
                    className="md:col-span-4 md:row-span-2 nyra-card flex flex-col justify-between group"
                  >
                    <div className="space-y-8">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group-hover:rotate-12 transition-transform">
                        <ShieldAlert size={32} className="text-emerald-500" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-display font-black text-white tracking-tight">AI Step-Grader</h3>
                        <p className="text-slate-400 text-sm font-medium leading-[1.6]">
                            Instant analysis of your hand-written work. Nyra spots precise calculation slips and concept gaps before they become habits.
                        </p>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <div className="flex -space-x-3">
                         {[...Array(5)].map((_, i) => (
                           <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden shadow-xl ring-1 ring-white/5">
                             <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="opacity-80" />
                           </div>
                         ))}
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Live Validation</span>
                         <span className="text-white font-black text-xs">99.4% Acc</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 3: Wide Feature */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                    className="md:col-span-6 md:row-span-1 nyra-card flex items-center gap-8 group"
                  >
                    <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center border border-rose-500/20 shrink-0 group-hover:scale-110 transition-transform shadow-xl shadow-rose-500/5">
                      <BarChart3 size={48} className="text-rose-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-display font-black text-white tracking-tight">Neural Dashboard</h3>
                      <p className="text-slate-400 text-xs font-medium leading-[1.5]">Visualizing your Examination Readiness Index (ERI) and memory decay heatmaps in real-time.</p>
                    </div>
                  </motion.div>

                  {/* Card 4: Wide Feature */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                    className="md:col-span-6 md:row-span-1 nyra-card flex items-center gap-8 group"
                  >
                    <div className="w-24 h-24 bg-sky-500/10 rounded-[2rem] flex items-center justify-center border border-sky-500/20 shrink-0 group-hover:scale-110 transition-transform shadow-xl shadow-sky-500/5">
                      <Zap size={48} className="text-sky-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-display font-black text-white tracking-tight">Atomic Recall</h3>
                      <p className="text-slate-400 text-xs font-medium leading-[1.5]">ANKI-style spaced repetition that ensures you never forget a concept you once mastered.</p>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* CURRICULUM BADGE / HIGHLIGHT */}
              <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-nyra-primary/5 blur-[120px] rounded-full -z-10" />
                <div className="max-w-4xl mx-auto text-center space-y-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                  >
                    <div className="inline-block px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[12px] font-black uppercase tracking-[0.3em]">
                      Academic Battlefield Ready
                    </div>
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-[0.9]">
                      Conquer <span className="text-nyra-primary italic underline decoration-nyra-primary/30 decoration-8 underline-offset-4">Foundation</span>, <span className="text-nyra-primary italic underline decoration-nyra-primary/30 decoration-8 underline-offset-4">Boards</span> & <span className="text-nyra-primary italic underline decoration-nyra-primary/30 decoration-8 underline-offset-4">JEE</span>
                    </h2>
                    <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                      Precision-engineered paths for <span className="text-white font-bold">Classes 7th to 12th</span>. 
                      From mastering <span className="text-white font-bold">Boards</span> to cracking <span className="text-white font-bold">JEE (Main & Advanced)</span>, 
                      Nyra adapts to the exact rigor required for your target.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: "Foundation", sub: "Class 7th - 10th", color: "from-pink-500/20" },
                      { label: "CBSE Boards", sub: "Class 11th - 12th", color: "from-blue-500/20" },
                      { label: "JEE Prep", sub: "Entrance Labs", color: "from-emerald-500/20" }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className={`p-8 bg-gradient-to-br ${item.color} to-white/[0.02] border border-white/5 rounded-[2.5rem] text-center shadow-xl shadow-black/40`}
                      >
                        <h4 className="text-2xl font-black text-white mb-1 tracking-tight">{item.label}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SUBJECT UNIVERSE */}
              <section className="py-20 relative">
                <div className="absolute inset-0 bg-nyra-primary/5 blur-[100px] rounded-full -z-10" />
                <SectionTitle subtitle="Available Curriculum">Subject Universe</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {[
                    { name: 'Physics', icon: Atom, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { name: 'Chemistry', icon: FlaskConical, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { name: 'Mathematics', icon: Calculator, color: 'text-rose-400', bg: 'bg-rose-400/10' },
                    { name: 'Biology', icon: Dna, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    { name: 'Computer Sci', icon: Terminal, color: 'text-violet-400', bg: 'bg-violet-400/10' },
                    { name: 'English', icon: Book, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                    { name: 'Social Science', icon: Globe2, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    { name: 'Aptitude', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { name: 'Logical Reasoning', icon: Shapes, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                    { name: 'Neurology', icon: Brain, color: 'text-nyra-primary', bg: 'bg-nyra-primary/10' },
                  ].map((subject, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: (i % 5) * 0.1 }}
                      whileHover={{ y: -10, transition: { duration: 0.2 } }}
                      className="p-8 nyra-glass rounded-[2rem] flex flex-col items-center gap-6 transition-all border border-white/5 hover:border-white/20 group cursor-pointer"
                    >
                      <div className={`w-16 h-16 ${subject.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                        <subject.icon className={`w-8 h-8 ${subject.color}`} />
                      </div>
                      <span className="text-white font-black text-[11px] uppercase tracking-[0.2em]">{subject.name}</span>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* HOW IT WORKS */}
              <section className="py-20 relative">
                <SectionTitle subtitle="The Protocol">How it Works</SectionTitle>
                <div className="grid md:grid-cols-4 gap-8">
                  {[
                    { step: "01", title: "Initialize Identity", desc: "Connect your neural profile and select your learning cohort." },
                    { step: "02", title: "Gap Analysis", desc: "Nyra scans your current knowledge level to identify weak synapses." },
                    { step: "03", title: "Neural Learning", desc: "Engage with adaptive content and voice-guided labs." },
                    { step: "04", title: "Total Mastery", desc: "Reach 100% readiness and unlock advanced deep-dive modules." }
                  ].map((s, i) => (
                    <div key={i} className="relative group">
                      <div className="text-8xl font-black text-white/5 absolute -top-10 -left-4 group-hover:text-nyra-primary/10 transition-colors">{s.step}</div>
                      <div className="relative z-10 space-y-4 pt-10">
                        <h3 className="text-xl font-black text-white">{s.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-[55%] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              </section>

              {/* MISSION / MANIFESTO */}
              <section className="py-20 text-center max-w-4xl mx-auto border-y border-white/5">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">The Mission</div>
                  <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter leading-none italic">
                    "Decentralizing Intelligence, One Mind at a Time."
                  </h2>
                  <p className="text-slate-400 text-xl font-medium leading-relaxed">
                    Our mission is to replace legacy learning with neural-first protocols that respect the individual speed of discovery. We aren't just an LMS; we are your cognitive partner.
                  </p>
                </motion.div>
              </section>

              {/* WHY STUDENTS LOVE US */}
              <section className="py-20">
                <SectionTitle subtitle="Student Love">Why They Prefer Nyra</SectionTitle>
                <div className="grid md:grid-cols-2 gap-12">
                   <div className="space-y-12">
                      {[
                        { title: "No Cognitive Overload", desc: "Our 'Contextual Protocol Parser' hides complex JEE derivations when you are focusing on Boards, and vice versa. You only see what matters for your goal.", icon: Zap, color: "text-amber-500" },
                        { title: "Visual Mastery Mapping", desc: "Instead of simple progress bars, see your knowledge as a neural map. Watch concepts connect as your ERI (Examination Readiness Index) grows.", icon: Globe, color: "text-blue-500" }
                      ].map((reason, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="flex gap-6"
                        >
                          <div className={`w-14 h-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${reason.color}`}>
                            <reason.icon size={28} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white tracking-tight">{reason.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm font-medium">{reason.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                   </div>
                   <div className="space-y-12">
                      {[
                        { title: "Atomic Feedback Loop", desc: "Nyra doesn't just say you are 'Wrong'. She identifies if it was a calculation error, a conceptual gap, or a missing formula application.", icon: Brain, color: "text-emerald-500" },
                        { title: "Dual-Purpose Content", desc: "Access 'Universal' topics that cover both Boards and Prep requirements simultaneously, saving you from redundant study cycles.", icon: Sparkles, color: "text-pink-500" }
                      ].map((reason, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="flex gap-6"
                        >
                          <div className={`w-14 h-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${reason.color}`}>
                            <reason.icon size={28} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white tracking-tight">{reason.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm font-medium">{reason.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
              </section>

              {/* TESTIMONIALS */}
              <section className="py-20">
                <SectionTitle subtitle="Neural Impact">Student Success Stories</SectionTitle>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { name: "Aryan S.", role: "JEE Aspirant", text: "Nyra corrected my rotational mechanics in 4 days. The voice interaction feels like having a PhD next to you." },
                    { name: "Meera K.", role: "Science Student", text: "Virtual Labs are insane. I actually 'see' the invisible forces now. My readiness score is at 89%." },
                    { name: "Rahul V.", role: "High Achiever", text: "Finally an AI that isn't just a chatbot. Nyra knows exactly where I'm going to make a mistake." }
                  ].map((t, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.05 }}
                      className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6"
                    >
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-nyra-primary fill-nyra-primary" />)}
                      </div>
                      <p className="text-white/60 text-lg font-medium leading-relaxed italic">"{t.text}"</p>
                      <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <div className="w-10 h-10 rounded-full bg-nyra-primary/20 border border-nyra-primary/30 flex items-center justify-center text-nyra-primary font-black text-xs">{t.name[0]}</div>
                        <div>
                          <p className="text-white font-black text-sm">{t.name}</p>
                          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.role}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* NEURAL LEADERBOARD */}
              <section className="py-20 bg-nyra-primary/5 rounded-[4rem] border border-nyra-primary/10 px-8 md:px-16 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Trophy size={120} className="text-nyra-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <div className="space-y-4">
                      <div className="inline-block px-3 py-1 rounded-full bg-nyra-primary/20 text-nyra-primary text-[8px] font-black uppercase tracking-widest">Global Ranking</div>
                      <h2 className="text-4xl font-display font-black text-white tracking-tighter italic">Neural Leaderboard</h2>
                      <p className="text-slate-500 max-w-sm text-sm font-medium">Real-time tracking of students who have reached 'Master' level in their respective cohorts.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Master Count</span>
                       <span className="text-2xl font-black text-nyra-primary tabular-nums">1,240</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { rank: 1, name: "Ishan M.", score: "98%", status: "Mastered", color: "text-amber-400" },
                      { rank: 2, name: "Zara F.", score: "96%", status: "Mastered", color: "text-slate-300" },
                      { rank: 3, name: "Kunal J.", score: "94%", status: "Mastered", color: "text-orange-400" },
                      { rank: 4, name: "Ananya R.", score: "92%", status: "Mastered", color: "text-slate-500" }
                    ].map((st, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ x: 5 }}
                        className="bg-black/30 p-6 rounded-3xl border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`text-xl font-black ${st.color}`}>#{st.rank}</div>
                          <div className="flex flex-col">
                            <span className="text-white font-black text-sm">{st.name}</span>
                            <span className="text-emerald-500 text-[8px] font-black uppercase tracking-widest">{st.status}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-black text-xs uppercase tracking-widest">{st.score}</div>
                          <div className="text-slate-600 text-[8px] font-bold uppercase tracking-widest">Readiness</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* FAQs */}
              <section className="py-20 max-w-4xl mx-auto">
                <SectionTitle subtitle="Neural Debugger">Common Queries</SectionTitle>
                <div className="space-y-4">
                  {[
                    { q: "How accurate is Nyra's guidance?", a: "Nyra is powered by advanced neural models specifically fine-tuned on diverse academic datasets, providing 99% accuracy in STEM concepts." },
                    { q: "Is the Teacher access strictly monitored?", a: "Yes. Only verified institutional educators with valid credentials can access the Teacher Studio to manage cohorts and materials." },
                    { q: "Can I use Nyra for my competitive exams?", a: "Absolutely. Nyra has specific modules for JEE, NEET, and other high-level engineering and medical entrance exams." },
                    { q: "What exactly is 'Neural Mapping'?", a: "It's our proprietary algorithm that tracks your 'Eureka' moments and stumbling blocks to reorganize your curriculum in real-time for maximum retention." },
                    { q: "Does Nyra work offline?", a: "The core Neural Engine requires a connection for real-time updates, but your 'Atomic Recall' flashcards and offline-synced notes are available anytime." },
                    { q: "Is my data secure?", a: "All student data is encrypted at the neural level. We follow strict privacy protocols to ensure your learning patterns belong only to you." }
                  ].map((f, i) => (
                    <details key={i} className="group p-8 bg-white/[0.02] border border-white/5 rounded-3xl cursor-pointer">
                      <summary className="flex justify-between items-center font-black text-white text-lg list-none">
                        {f.q}
                        <ArrowRight size={18} className="text-slate-500 group-open:rotate-90 transition-transform" />
                      </summary>
                      <p className="mt-6 text-slate-400 text-base leading-relaxed font-medium">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* STATS SECTION */}
              <section className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-16 flex flex-col md:flex-row justify-around items-center gap-12 text-center md:text-left">
                {[
                  { label: "Neural Nodes Active", val: "24.8K" },
                  { label: "Topics Mastered Today", val: "1,240+" },
                  { label: "Avg. Readiness Boost", val: "32%" },
                  { label: "Global Users", val: "50,000+" }
                ].map((s, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-5xl font-black text-white slashed-zero tabular-nums">{s.val}</div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{s.label}</div>
                  </div>
                ))}
              </section>

            </div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="nyra-glass p-16 rounded-[4rem] relative overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-nyra-primary/20 blur-[100px] rounded-full animate-pulse" />
                
                <button 
                  onClick={() => setShowSignup(false)}
                  className="flex items-center gap-3 text-white/30 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] group mb-16"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
                  Return to Port
                </button>

                <div className="mb-16">
                  <h2 className="text-6xl font-display font-black text-white mb-6 tracking-tighter">Identity Initialization</h2>
                  <p className="text-slate-500 text-xl font-medium leading-relaxed">Nyra is preparing your cognitive blueprint. Select your cohort and goal to define your path.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-12">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-nyra-primary uppercase tracking-[0.4em] ml-1">Cognitive Designator</label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-nyra-primary to-indigo-500 rounded-[2rem] opacity-0 group-focus-within:opacity-20 transition-opacity blur-xl" />
                      <User className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-nyra-primary transition-colors" />
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter identification name"
                        className="w-full bg-black/60 border border-white/5 rounded-[2rem] py-8 pl-20 pr-8 text-white text-xl placeholder:text-white/10 focus:outline-none focus:border-nyra-primary/50 transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Assignment / Cohort</label>
                      <span className="text-[10px] font-black text-nyra-primary uppercase tracking-[0.2em]">{classes.length} Available</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            setSelectedGoal(null); // Reset goal when class changes
                          }}
                          className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left group ${
                            selectedClassId === cls.id 
                            ? 'bg-nyra-primary/10 border-nyra-primary text-white shadow-xl shadow-nyra-primary/10' 
                            : 'bg-black/20 border-white/5 text-white/40 hover:border-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedClassId === cls.id ? 'bg-nyra-primary text-white' : 'bg-white/5'}`}>
                            <GraduationCap size={20} />
                          </div>
                          <span className="font-black text-sm tracking-tight">{cls.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedClassId && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Academic Goal / Target</label>
                        <div className="grid grid-cols-1 gap-4">
                          {isHighSchool ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedGoal('BOARDS')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                                  selectedGoal === 'BOARDS' ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:border-white/10'
                                }`}
                              >
                                <div>
                                  <div className="font-black text-sm">Only CBSE Boards</div>
                                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">Focus on Class 11/12 Exams</div>
                                </div>
                                {selectedGoal === 'BOARDS' && <Zap size={16} className="text-blue-500" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedGoal('JEE')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                                  selectedGoal === 'JEE' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:border-white/10'
                                }`}
                              >
                                <div>
                                  <div className="font-black text-sm">Boards + JEE Prep</div>
                                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">Main + Advanced Intensive Protocol</div>
                                </div>
                                {selectedGoal === 'JEE' && <Zap size={16} className="text-amber-500" />}
                              </button>
                            </>
                          ) : isFoundationAge ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedGoal('BOARDS')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                                  selectedGoal === 'BOARDS' ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:border-white/10'
                                }`}
                              >
                                <div>
                                  <div className="font-black text-sm">Only School Boards</div>
                                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">Core Subject Mastery</div>
                                </div>
                                {selectedGoal === 'BOARDS' && <Zap size={16} className="text-blue-500" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedGoal('FOUNDATION')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                                  selectedGoal === 'FOUNDATION' ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:border-white/10'
                                }`}
                              >
                                <div>
                                  <div className="font-black text-sm">Boards + Foundation</div>
                                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">Advanced Competitive Base</div>
                                </div>
                                {selectedGoal === 'FOUNDATION' && <Zap size={16} className="text-emerald-500" />}
                              </button>
                            </>
                          ) : (
                            <button
                                type="button"
                                onClick={() => setSelectedGoal('BOARDS')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between group ${
                                  selectedGoal === 'BOARDS' ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-black/20 border-white/5 text-white/40 hover:border-white/10'
                                }`}
                              >
                                <div>
                                  <div className="font-black text-sm">General Curriculum</div>
                                  <div className="text-[10px] opacity-60 uppercase font-bold tracking-widest mt-1">Personalized Path</div>
                                </div>
                                {selectedGoal === 'BOARDS' && <Zap size={16} className="text-blue-500" />}
                              </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    disabled={!name || !selectedClassId || !selectedGoal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-nyra-primary hover:bg-nyra-primary/90 disabled:opacity-30 disabled:hover:bg-nyra-primary text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-nyra-primary/20"
                  >
                    <span>Connect to Academy</span>
                    <Zap size={18} fill="currentColor" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-8 max-w-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Sparkles size={20} className="text-nyra-primary" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter font-display">NYRA.AI</span>
           </div>
           <p className="text-slate-500 text-base leading-relaxed font-medium capitalize">Building the global neural infrastructure for decentralized intelligence. Personalized study, reimagined for the elite minds.</p>
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors" />
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors" />
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors" />
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-20 gap-y-10">
           <div className="space-y-6">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Protocol</p>
              <ul className="space-y-4">
                {['Neural Lab', 'Spaced Recall', 'Nano Simulations', 'Deep Analysis'].map(link => (
                  <li key={link}><a href="#" className="text-xs font-bold text-slate-500 hover:text-nyra-primary transition-colors">{link}</a></li>
                ))}
              </ul>
           </div>
           <div className="space-y-6">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Identity</p>
              <ul className="space-y-4">
                {['Neural ID', 'Dashboards', 'Classroom', 'Community'].map(link => (
                  <li key={link}><a href="#" className="text-xs font-bold text-slate-500 hover:text-nyra-primary transition-colors">{link}</a></li>
                ))}
              </ul>
           </div>
           <div className="space-y-6">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Company</p>
              <ul className="space-y-4">
                {['Research', 'Privacy', 'Compliance', 'Manifesto'].map(link => (
                  <li key={link}><a href="#" className="text-xs font-bold text-slate-500 hover:text-nyra-primary transition-colors">{link}</a></li>
                ))}
              </ul>
           </div>
        </div>
         <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
               © Nyra Intelligence. Protocol v2.4.0
            </div>
            <div className="flex items-center gap-8">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">System Status</span>
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingScreen;
