/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, enableNetwork, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import Classroom from './components/Classroom';
import LandingScreen from './components/LandingScreen';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import Profile from './components/Profile';
import PerformanceDashboard from './components/PerformanceDashboard';
import { Loader2, ShieldAlert, WifiOff } from 'lucide-react';
import { ClassData, ViewRole, TextLayer, UserProfile, PerformanceMetrics } from './types/academic';
import { analyzeStudentWork, generateMacroAnalysis } from './lib/analysisService';

export default function App() {
  const [view, setView] = useState<ViewRole>('landing');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [academicData, setAcademicData] = useState<ClassData[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [submissionPages, setSubmissionPages] = useState<string[]>([]);
  const [isSubmission, setIsSubmission] = useState(false);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentChapterTopics, setCurrentChapterTopics] = useState<any[]>([]);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [currentTopicFocus, setCurrentTopicFocus] = useState<'BOARDS' | 'JEE' | 'FOUNDATION' | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Firebase Auth State Changed:", user?.email);
      
      if (user) {
        const normalizedEmail = user.email?.toLowerCase().trim();
        const ADMIN_EMAIL = 'nikhiliitjee.21@gmail.com';
        const isTeacher = normalizedEmail === ADMIN_EMAIL;
        
        console.log("Admin Check:", { normalizedEmail, isTeacher });

        // Immediate view setting for admin to prevent UI lag
        if (isTeacher) {
          setView('teacher');
        }

        const userRef = doc(db, 'users', user.uid);
        try {
          setErrorStatus(null);
          const userSnap = await getDoc(userRef).catch(e => handleFirestoreError(e, OperationType.GET, userRef.path));
          
          if (userSnap.exists()) {
            const profile = userSnap.data() as UserProfile;
            console.log("User Profile Found:", profile.role, "Enrolled:", profile.isEnrolled);
            
            // Update local profile state
            setUserProfile(profile);

            // Only set the view if we haven't done initial sync OR if we are currently on landing
            if (!initialSyncDone || view === 'landing') {
              if (isTeacher) {
                console.log("Setting view to teacher (Admin)");
                setView('teacher');
              } else if (profile.isEnrolled) {
                console.log("Setting view to student (Enrolled)");
                setView('student');
              } else {
                console.log("Setting view to landing (Not enrolled)");
                setView('landing');
              }
              setInitialSyncDone(true);
            }
          } else {
            console.log("No profile found - Creating default");
            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || (isTeacher ? 'Teacher' : 'Student'),
              email: user.email || '',
              photoURL: user.photoURL || '',
              role: isTeacher ? 'teacher' : 'student',
              isEnrolled: isTeacher,
            };

            await setDoc(userRef, initialProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, userRef.path));
            setUserProfile(initialProfile);
            
            if (!initialSyncDone || view === 'landing') {
              if (isTeacher) {
                setView('teacher');
              } else {
                setView('landing');
              }
              setInitialSyncDone(true);
            }
          }
        } catch (error: any) {
          console.error("Profile sync error details:", error);
          if (!initialSyncDone || view === 'landing') {
            if (isTeacher) setView('teacher');
          }
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            setErrorStatus("offline");
          } else {
            setErrorStatus("generic");
          }
        }
      } else {
        console.log("No active session - Showing LandingScreen");
        setUserProfile(null);
        setView('landing');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Global Academic Data
  useEffect(() => {
    // Attempt to listen
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const data: ClassData[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data(), id: doc.id } as ClassData);
      });
      setAcademicData(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'classes'));

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    console.log("handleGoogleLogin initiated");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      console.log("signInWithPopup result success");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Sign-in process cancelled by user.");
        return;
      }
      
      console.error("handleGoogleLogin detailed error:", error);
      
      let message = error.message || 'Unknown error';
      if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized in your Firebase Console. \n\nFIX: Click the 'Open in New Tab' icon at the top right of this preview to resolve this.";
      } else if (error.message?.includes('offline')) {
        message = "Firebase is reporting 'Offline'. \n\nFIX: Please click the 'Open in New Tab' icon at the top right. Using a direct tab usually fixes connectivity issues.";
      }
      
      alert(`Login failed: ${message}`);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile || !auth.currentUser) return;
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    try {
      await setDoc(userRef, updatedProfile, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, userRef.path));
    } catch (e) {
      console.error("Failed to update profile", e);
    }
  };

  const handleStudentSignup = async (profile: UserProfile) => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const updatedProfile = { ...profile, uid: auth.currentUser.uid, isEnrolled: true };
    await setDoc(userRef, updatedProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, userRef.path));
    setUserProfile(updatedProfile);
    setLoading(false);
    setView('student');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('landing');
  };

  const updateAcademicData = async (newData: ClassData[]) => {
    // In a real multi-user app, we'd update specific docs. 
    // Here we'll just save to Firestore for whichever class was changed.
    setLoading(true);
    try {
      for (const cls of newData) {
        const clsRef = doc(db, 'classes', cls.id);
        await setDoc(clsRef, cls).catch(e => handleFirestoreError(e, OperationType.WRITE, clsRef.path));
      }
    } catch (e) {
      console.error("Failed to update classes", e);
    }
    setLoading(false);
  };

  const handleStartClass = async (topic: any, chapterTopics: any[] = []) => {
    setLoading(true);
    
    let docId = currentDocId;
    let processedSubmissionPages: string[] = [];

    // Handle student submission files if present
    if (topic.isSubmission && topic.submissionPages) {
      const files = topic.submissionPages as FileList;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        processedSubmissionPages.push(base64);
      }
    }
    
    // If this is a new upload/session, save document metadata to Firestore
    if (auth.currentUser) {
      const newDocId = topic.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();
      const docRef = doc(db, 'users', auth.currentUser.uid, 'documents', newDocId);
      
      try {
        await setDoc(docRef, {
          id: newDocId,
          name: topic.name,
          uploadedAt: new Date().toISOString(),
          userId: auth.currentUser.uid,
          textLayers: topic.textLayers || []
        }).catch(e => handleFirestoreError(e, OperationType.WRITE, docRef.path));
        docId = newDocId;
      } catch (err) {
        console.error("Failed to save doc metadata", err);
      }
    }

    setCurrentDocId(docId);
    setCurrentChapterTopics(chapterTopics);
    setCurrentTopicId(topic.id || null);
    setCurrentTopicFocus(topic.focus);
    setPages(topic.pages || []);
    setSubmissionPages(processedSubmissionPages);
    setIsSubmission(!!topic.isSubmission);
    setTextLayers(topic.textLayers || []);

    // If it's a submission, run quick analysis to generate flashcards
    if (topic.isSubmission && processedSubmissionPages.length > 0 && userProfile) {
      try {
        const result = await analyzeStudentWork(processedSubmissionPages, topic.name);
        if (result.suggestedFlashcards && result.suggestedFlashcards.length > 0) {
          const newCards = result.suggestedFlashcards.map((f: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            front: f.front,
            back: f.back,
            category: f.category || 'Review',
            nextReview: new Date().toISOString(),
            interval: 1,
            easeFactor: 2.5,
            reps: 0
          }));
          handleUpdateProfile({ flashcards: [...(userProfile.flashcards || []), ...newCards] });
        }
      } catch (err) {
        console.warn("Failed to generate auto-flashcards", err);
      }
    }
    
    setTimeout(() => {
      setLoading(false);
      setView('classroom');
    }, 1500);
  };

  const handleExitClass = () => {
    setCurrentDocId(null);
    setView('student');
  };

  const handlePerformanceIntel = async () => {
    if (!userProfile || !auth.currentUser) return;
    setLoading(true);
    try {
      // Fetch all submissions for real analysis
      const q = query(collection(db, 'submissions'), where('studentId', '==', auth.currentUser.uid));
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await getDoc(userRef).catch(e => handleFirestoreError(e, OperationType.GET, userRef.path)); // Dummy to trigger if needed
      
      // Actually use getDocs for one-time fetch
      const { getDocs } = await import('firebase/firestore');
      const subsSnap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.GET, 'submissions'));
      const pastSubmissions = subsSnap.docs.map(d => d.data());

      // Fetch student work submissions from classes (DPPs/Exercises)
      const studentWork: any[] = [];
      academicData.forEach(cls => {
        cls.subjects.forEach(sub => {
          sub.chapters.forEach(ch => {
            if (ch.studentSubmissions) {
              studentWork.push(...ch.studentSubmissions.filter(s => true)); // Filter by studentId if we had it there
            }
          });
        });
      });

      const report = await generateMacroAnalysis(studentWork, pastSubmissions); 
      
      const metrics: PerformanceMetrics = {
        ...report,
        readinessIndex: report.eri / 100,
        memoryDecay: {}, // topics are in report.decayAlerts
        lastAnalyzed: new Date().toISOString()
      };

      // Save intelligence profile to UserProfile
      if (report.intelligenceProfile) {
        await handleUpdateProfile({
          intelligenceProfile: {
            ...report.intelligenceProfile,
            cognitiveStyle: report.intelligenceProfile.cognitiveStyle as any,
            knowledgeDepth: {}, // To be developed further
            lastUpdated: new Date().toISOString()
          }
        });
      }

      setPerformanceMetrics(metrics);
      setView('analysis');
    } catch (e) {
      console.error("Failed to generate macro intel", e);
      alert("Nyra had trouble syncing your intelligence map. Try moving to a new tab.");
    } finally {
      setLoading(false);
    }
  };

  // Filter data for student based on enrolled class
  const studentData = userProfile?.selectedClassId 
    ? academicData.filter(c => c.id === userProfile.selectedClassId)
    : academicData;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {(authLoading || loading || errorStatus === 'offline') ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center text-center p-12 ${errorStatus === 'offline' ? 'bg-red-950' : 'bg-nyra-dark'}`}
          >
            {errorStatus === 'offline' ? (
              <div className="max-w-md">
                <WifiOff className="w-16 h-16 text-red-500 mb-6 mx-auto" />
                <h2 className="text-2xl font-bold text-white mb-4">Connectivity Issue</h2>
                <p className="text-white/70 mb-8 leading-relaxed">Nyra could not reach the Firestore database. This often occurs due to iframe restrictions.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 mb-6 shadow-xl shadow-red-900/40"
                >
                  Retry Connection
                </button>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-sm text-white/50 mb-1">PRO TIP:</p>
                  <p className="text-sm text-white/80">Click the <strong>"Open in New Tab"</strong> icon (square with arrow) at the top right.</p>
                </div>
              </div>
            ) : (
              <>
                <Loader2 className="w-16 h-16 text-nyra-primary animate-spin mb-6" />
                <h2 className="text-3xl font-display font-bold text-white mb-2">{authLoading ? 'Authenticating...' : 'Syncing Classroom Material...'}</h2>
                <p className="text-white/40 italic">"Patience is a virtue, unlike your handwriting."</p>
              </>
            )}
          </motion.div>
        ) : view === 'landing' ? (
          <LandingScreen 
            classes={academicData}
            user={userProfile}
            onLogin={handleGoogleLogin}
            onSelectRole={setView} 
            onStudentSignup={handleStudentSignup}
          />
        ) : view === 'teacher' ? (
          <TeacherDashboard 
            data={academicData} 
            onUpdateData={updateAcademicData} 
            onExit={() => setView('landing')} 
            onLogout={handleLogout}
            onSwitchToStudent={() => setView('student')}
          />
        ) : view === 'student' ? (
          <StudentDashboard 
            profile={userProfile}
            classes={studentData} 
            onSelectTopic={(topic, chapterTopics) => handleStartClass(topic, chapterTopics)} 
            onProfile={() => setView('profile')}
            onUpdateProfile={handleUpdateProfile}
            onPerformanceIntel={handlePerformanceIntel}
            onLogout={handleLogout} 
            onAdminSwitch={() => setView('teacher')}
          />
        ) : view === 'analysis' ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
          >
            <PerformanceDashboard 
              metrics={performanceMetrics}
              profile={userProfile}
              onBack={() => setView('student')}
            />
          </motion.div>
        ) : view === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Profile 
              profile={userProfile}
              classes={academicData}
              onBack={() => setView('student')} 
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
              onPerformanceIntel={handlePerformanceIntel}
            />
          </motion.div>
        ) : view === 'classroom' && pages.length > 0 ? (
          <motion.div 
            key="classroom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Classroom 
              pages={pages} 
              submissionPages={submissionPages}
              isSubmission={isSubmission}
              textLayers={textLayers} 
              docId={currentDocId}
              userId={userProfile?.uid || null}
              studentProfile={userProfile}
              topicFocus={currentTopicFocus}
              topicName={currentChapterTopics.find(t => t.id === currentTopicId)?.name}
              onExit={handleExitClass} 
              chapterTopics={currentChapterTopics}
              currentTopicId={currentTopicId || undefined}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Retro background grid */}
      <div className="fixed inset-0 -z-50 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #7c3aed 1px, transparent 1px), linear-gradient(to bottom, #7c3aed 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>
    </div>
  );
}
