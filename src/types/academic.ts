
export interface TextItem {
  text: string;
  transform: number[];
  width: number;
  height: number;
}

export interface TextLayer {
  items: TextItem[];
}

export interface Topic {
  id: string;
  name: string;
  focus: FocusGoal;
  pages: string[]; // Array of base64 image strings
  textLayers?: TextLayer[]; // Text information for each page
  dpp?: {
    id: string;
    name: string;
    pages: string[];
    textLayers?: TextLayer[];
  };
  solvedExamples?: {
    id: string;
    name: string;
    pages: string[];
    textLayers?: TextLayer[];
  };
  unsolvedExercises?: {
    id: string;
    name: string;
    pages: string[];
    textLayers?: TextLayer[];
  };
}

export interface Chapter {
  id: string;
  name: string;
  focus: FocusGoal;
  topics: Topic[];
  exercise?: {
    id: string;
    name: string;
    pages: string[];
    textLayers?: TextLayer[];
  };
  studentSubmissions?: {
    id: string;
    name: string;
    pages: string[]; // images uploaded by student
    timestamp: string;
    type: 'DPP' | 'EXERCISE';
    feedback?: string;
  }[];
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface ClassData {
  id: string;
  name: string;
  subjects: Subject[];
}

export type ViewRole = 'landing' | 'teacher' | 'student' | 'classroom' | 'profile' | 'signup-student' | 'analysis';
export type FocusGoal = 'BOARDS' | 'JEE' | 'FOUNDATION' | 'UNIVERSAL';

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number; // index of options
  explanation: string;
  topicId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  skillsChecked: string[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  examType: FocusGoal;
  chapterId: string;
  subjectId: string;
  classId: string;
  questions: Question[];
  prerequisiteTopicId?: string; // Locker feature
  status: 'Draft' | 'Published';
  createdAt: string;
  solutionsPdf?: string; // Optional detailed PDF solution
}

export interface TestSubmission {
  id: string;
  testId: string;
  studentId: string;
  answers: { [questionId: string]: number }; // questionId: selectedIndex
  score: number;
  totalMarks: number;
  timeSpent: number; // in seconds
  status: 'COMPLETED' | 'IN_PROGRESS';
  submittedAt: string;
  analysis?: {
    accuracy: number;
    speedScore: number;
    timePerQuestion: { [questionId: string]: number };
    integrityViolations: number;
    strengthAreas: string[];
    weakAreas: string[];
    nyraSummary: string;
    mistakeAnalysis: { [questionId: string]: string };
    mistakeCategories: {
      conceptual: number;
      calculation: number;
      careless: number;
      timeManagement: number;
    };
  };
}

export interface PerformanceMetrics {
  eri: number;
  heatMap: { [topic: string]: 'weak' | 'average' | 'strong' };
  memoryDecay: { [topic: string]: string }; // topic: last active date
  readinessIndex: number;
  lastAnalyzed: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  avatarUrl?: string;
  role?: 'teacher' | 'student';
  selectedClassId?: string;
  focusGoal?: FocusGoal;
  isEnrolled?: boolean;
  interests?: string[];
  flashcards?: {
    id: string;
    front: string;
    back: string;
    category: 'conceptual' | 'fact' | 'formula' | 'mistake';
    nextReview: string;
    interval: number; // in days
    easeFactor: number;
    reps: number;
    subjectId?: string;
  }[];
  intelligenceProfile?: {
    calculationAbility: number; // 0-100
    thinkingAbility: number;    // 0-100
    conceptualStrength: number; // 0-100
    reasoningAbility: number;   // 0-100
    speedAccuracyBalance: number; // 0-100
    learningPersistence: number; // 0-100
    knowledgeDepth: { [subjectId: string]: number }; // 0-100
    cognitiveStyle: 'Intuitive' | 'Analytical' | 'Visual' | 'Procedural' | 'Balanced';
    lastUpdated: string;
  };
  progress?: {
    streak: number;
    lastActive: string;
    totalStudyTime: number; // in minutes
    badges: { id: string; name: string; icon: string; date: string }[];
    topicMastery: { [topicId: string]: 'Mastered' | 'Learning' | 'Needs Focus' | 'New' };
    selfAssessments: { [topicId: string]: number }; // 1-5 stars
    dailyActivity: { date: string; minutes: number }[];
    difficultTopics: string[]; // topic IDs
  };
}
