import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Maximize2, Minimize2, ZoomIn, ZoomOut, 
  Send, Sparkles, User, BrainCircuit, MousePointer2, Zap,
  Mic, MicOff, Radio, Pencil, MousePointer, Eraser, MoveRight, Underline as UnderlineIcon, Square, Type, Check,
  Presentation, FileText, Ruler, Circle as CircleIcon, Compass, ChevronRight, ChevronLeft, Palette,
  TestTube, Boxes, Undo, Redo, LayoutDashboard, BookOpen, ShieldAlert, Target, Bell, Calendar,
  Image as ImageIcon, Paperclip, FileImage
} from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { chatWithNyra, drawHighlight, drawPen, drawText, drawArrow, drawShape, drawBracket, drawTick, toggleWhiteboard, clearWhiteboard, postToChat, open3DLab, drawNeuralMap, generatePracticeProblem } from '../lib/gemini';
import { useLiveAPI } from '../hooks/useLiveAPI';
import confetti from 'canvas-confetti';
import { ChatSidebar, ChatMessage } from './ChatSidebar';
import { VirtualLab } from './VirtualLab';
import { TextLayer, UserProfile, Topic } from '../types/academic';
import { analyzeStudentWork, AnalysisResult } from '../lib/analysisService';

interface ClassroomProps {
  pages: string[];
  submissionPages?: string[]; // student uploaded work
  textLayers?: TextLayer[];
  docId: string | null;
  userId: string | null;
  studentProfile: UserProfile | null;
  topicName?: string;
  topicFocus?: 'BOARDS' | 'JEE' | 'FOUNDATION';
  isSubmission?: boolean;
  onExit: () => void;
  chapterTopics?: Topic[];
  currentTopicId?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp?: any;
}

interface Annotation {
  type: 'highlight' | 'pen' | 'arrow' | 'underline' | 'rect' | 'text' | 'circle' | 'bracket' | 'tick' | 'line' | 'protractor' | 'image';
  config: any;
  owner: 'user' | 'nyra';
}

type Tool = 'select' | 'pen' | 'arrow' | 'underline' | 'rect' | 'circle' | 'line' | 'protractor' | 'text' | 'image';

const imageCache = new Map<string, HTMLImageElement>();
const loadingImages = new Set<string>();

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  markerScale: number;
}

const renderAnnotations = (
  annotations: Annotation[], 
  { ctx, width, height, markerScale }: RenderContext
) => {
  const scaleX = width / 1000;
  const scaleY = height / 1000;

  annotations.forEach(ann => {
    const baseColor = ann.config.color || (ann.owner === 'user' ? '#33ccff' : '#FF3366');
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = Math.max(1, 4 * markerScale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (ann.type === 'highlight' || ann.type === 'rect') {
      let fillStyle = 'rgba(255, 255, 0, 0.3)';
      if (ann.type === 'rect') fillStyle = 'rgba(51, 204, 255, 0.2)';

      if (baseColor) {
        if (baseColor.startsWith('rgba')) fillStyle = baseColor;
        else if (baseColor.startsWith('#')) fillStyle = baseColor + '44';
        else {
          if (baseColor === 'yellow') fillStyle = 'rgba(255, 255, 0, 0.3)';
          else if (baseColor === 'pink') fillStyle = 'rgba(255, 192, 203, 0.4)';
          else if (baseColor === 'cyan') fillStyle = 'rgba(0, 255, 255, 0.3)';
          else fillStyle = 'rgba(255, 51, 102, 0.3)';
        }
      }
      ctx.fillStyle = fillStyle;

      const x = (ann.config.x / 1000) * width;
      const y = (ann.config.y / 1000) * height;
      const w = (ann.config.width / 1000) * width;
      const h = (ann.config.height / 1000) * height;
      if (ann.type === 'highlight') {
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeRect(x, y, w, h);
    } else if (ann.type === 'pen' || ann.type === 'underline' || ann.type === 'arrow') {
      const points = ann.config.points;
      if (!points || points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0][0] * scaleX, points[0][1] * scaleY);
      
      if (ann.type === 'pen' || ann.type === 'underline') {
        points.forEach((p: number[]) => ctx.lineTo(p[0] * scaleX, p[1] * scaleY));
      } else if (ann.type === 'arrow') {
        const start = points[0];
        const end = points[points.length - 1];
        const ex = end[0] * scaleX;
        const ey = end[1] * scaleY;
        const sx = start[0] * scaleX;
        const sy = start[1] * scaleY;
        
        ctx.lineTo(ex, ey);
        
        const angle = Math.atan2(ey - sy, ex - sx);
        const headLen = 15 * markerScale;
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
      }
      ctx.stroke();
    } else if (ann.type === 'tick') {
      const x = (ann.config.x / 1000) * width;
      const y = (ann.config.y / 1000) * height;
      const s = 15 * markerScale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x + s * 2.5, y - s);
      ctx.stroke();
    } else if (ann.type === 'line') {
      const points = ann.config.points;
      if (!points || points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0][0] * scaleX, points[0][1] * scaleY);
      ctx.lineTo(points[points.length - 1][0] * scaleX, points[points.length - 1][1] * scaleY);
      ctx.stroke();
    } else if (ann.type === 'protractor') {
      const points = ann.config.points;
      if (!points || points.length < 3) return;
      const p1 = [points[0][0] * scaleX, points[0][1] * scaleY];
      const p2 = [points[1][0] * scaleX, points[1][1] * scaleY];
      const p3 = [points[2][0] * scaleX, points[2][1] * scaleY];

      // Draw the legs
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.stroke();

      // Draw the arc and label
      const angle1 = Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
      const angle2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
      const radius = 30 * markerScale;
      ctx.beginPath();
      ctx.arc(p2[0], p2[1], radius, angle1, angle2, angle1 > angle2);
      ctx.stroke();

      let diff = Math.abs((angle2 - angle1) * 180 / Math.PI);
      if (diff > 180) diff = 360 - diff;
      
      ctx.fillStyle = baseColor;
      ctx.font = `${12 * markerScale}px monospace`;
      ctx.fillText(`${Math.round(diff)}°`, p2[0] + radius + 5, p2[1]);
    } else if (ann.type === 'text') {
      ctx.fillStyle = ann.config.color || 'white';
      const fontSize = (ann.config.size || 20) * (width / 1000);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillText(ann.config.text, (ann.config.x / 1000) * width, (ann.config.y / 1000) * height);
    } else if (ann.type === 'circle') {
      const cx = (ann.config.x / 1000) * width;
      const cy = (ann.config.y / 1000) * height;
      const rx = (ann.config.width / 2000) * width;
      const ry = (ann.config.height / 2000) * height;
      ctx.beginPath();
      ctx.ellipse(cx + rx, cy + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ann.type === 'image') {
      const img = imageCache.get(ann.config.url);
      if (img) {
        const x = (ann.config.x / 1000) * width;
        const y = (ann.config.y / 1000) * height;
        const w = (ann.config.width / 1000) * width;
        const h = (ann.config.height / 1000) * height;
        
        // Draw image with rounded corners if needed or just straight
        ctx.drawImage(img, x, y, w, h);
      } else if (!loadingImages.has(ann.config.url)) {
        loadingImages.add(ann.config.url);
        const newImg = new Image();
        newImg.crossOrigin = "anonymous";
        newImg.src = ann.config.url;
        newImg.onload = () => {
          imageCache.set(ann.config.url, newImg);
          loadingImages.delete(ann.config.url);
        };
      }
    } else if (ann.type === 'bracket') {
      const x = (ann.config.x / 1000) * width;
      const y = (ann.config.y / 1000) * height;
      const h = (ann.config.height / 1000) * height;
      const bracketWidth = 10 * markerScale;
      ctx.beginPath();
      if (ann.config.side === 'left') {
        ctx.moveTo(x + bracketWidth, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + bracketWidth, y + h);
      } else {
        ctx.moveTo(x - bracketWidth, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - bracketWidth, y + h);
      }
      ctx.stroke();
    } else if (ann.type === 'neural-map') {
      const cx = (ann.config.centerX / 1000) * width;
      const cy = (ann.config.centerY / 1000) * height;
      const title = ann.config.title;
      const nodes = ann.config.nodes || [];

      // Draw central hub
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx, cy, 15 * markerScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = `bold ${14 * markerScale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, cx, cy - 20 * markerScale);

      // Draw nodes
      nodes.forEach((node: any, i: number) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const dist = 80 * markerScale;
        const nx = cx + Math.cos(angle) * dist;
        const ny = cy + Math.sin(angle) * dist;

        // Line to node
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = '#33ccff88';
        ctx.stroke();

        // Node bubble
        ctx.fillStyle = '#33ccff';
        ctx.beginPath();
        ctx.arc(nx, ny, 10 * markerScale * (node.importance || 1) / 2, 0, Math.PI * 2);
        ctx.fill();

        // Node text
        ctx.fillStyle = 'white';
        ctx.font = `${10 * markerScale}px sans-serif`;
        ctx.fillText(node.text, nx, ny + 20 * markerScale);
      });
      ctx.textAlign = 'start'; // Reset
    }
  });
};

const PDFTextLayer = ({ layer, originalWidth }: { layer: TextLayer; originalWidth: number }) => {
  if (!layer || !layer.items || !originalWidth) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-auto select-text overflow-hidden z-0"
      style={{
        width: '100%',
        height: '100%'
      }}
    >
      {layer.items.map((item, i) => {
        const [a, b, c, d, e, f] = item.transform;
        
        return (
          <span
            key={i}
            className="absolute text-transparent cursor-text whitespace-pre origin-top-left select-text"
            style={{
               left: 0,
               top: 0,
               fontSize: `${Math.abs(d)}px`,
               transform: `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`,
               fontFamily: 'sans-serif'
            }}
          >
            {item.text}
          </span>
        );
      })}
    </div>
  );
};

// --- Sub-components for Enhanced UI ---

const NeuralStatus = ({ isLive, status }: { isLive: boolean, status: string }) => (
  <div className="flex items-center gap-4 px-4 py-2 nyra-glass rounded-2xl border border-white/10">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-600'}`} />
      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{isLive ? 'Link Active' : 'Offline'}</span>
    </div>
    <div className="w-px h-4 bg-white/10" />
    <span className="text-[10px] font-black text-nyra-primary uppercase tracking-widest">{status}</span>
  </div>
);

const ToolbarCluster = ({ active, children }: { active?: boolean, children: React.ReactNode }) => (
  <div className={`flex items-center gap-1 p-1 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md ${active ? 'border-nyra-primary/30 ring-1 ring-nyra-primary/20' : ''}`}>
    {children}
  </div>
);

export default function Classroom({ 
  pages: initialPages, 
  submissionPages = [], 
  textLayers: initialTextLayers = [], 
  onExit, 
  docId, 
  userId, 
  studentProfile, 
  topicName,
  topicFocus,
  isSubmission = false,
  chapterTopics = [],
  currentTopicId: initialTopicId = null
}: ClassroomProps) {
  const [pages, setPages] = useState(isSubmission ? submissionPages : initialPages);
  const [textLayers, setTextLayers] = useState(initialTextLayers);
  const [currentTopicId, setCurrentTopicId] = useState(initialTopicId);
  const [showTopicOverview, setShowTopicOverview] = useState(false);
  const [direction, setDirection] = useState(0);

  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<AnalysisResult | null>(null);
  const [showGradingPanel, setShowGradingPanel] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [learningLogs, setLearningLogs] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [whiteboardAnns, setWhiteboardAnns] = useState<Annotation[]>([]);
  const [whiteboardUndoStack, setWhiteboardUndoStack] = useState<Annotation[][]>([]);
  const [whiteboardRedoStack, setWhiteboardRedoStack] = useState<Annotation[][]>([]);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isWhiteboardFullscreen, setIsWhiteboardFullscreen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState('#33ccff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardText, setWhiteboardText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [activePoints, setActivePoints] = useState<number[][]>([]);
  const immersiveZoneRef = useRef<HTMLDivElement>(null);

  // Sync Chat from Firestore
  useEffect(() => {
    if (!docId || !userId) return;

    const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role === 'assistant' ? 'nyra' : 'user',
          text: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ChatMessage;
      });

      setChatHistory(dbMessages);
      
      // Update Gemini context state as well
      const geminiMsgs: Message[] = dbMessages.map(m => ({
        role: m.role === 'nyra' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      setMessages(geminiMsgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, messagesRef.path));

    return () => unsubscribe();
  }, [docId, userId]);

  useEffect(() => {
    if (!userId) return;
    const logsRef = collection(db, 'users', userId, 'learning_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLearningLogs(snapshot.docs.map(doc => doc.data()));
    }, error => handleFirestoreError(error, OperationType.LIST, logsRef.path));
    return () => unsubscribe();
  }, [userId]);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 }); // Normalized 0-1000
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [labType, setLabType] = useState('atom');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  // Ref to track the current live streaming message to save it only once on turn complete
  const lastLiveMessageRef = useRef<string>('');
  const lastLiveMessageIdRef = useRef<string | null>(null);

  // Sync announcements from Firestore
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const anns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(anns);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'announcements'));
    return () => unsubscribe();
  }, []);
  
  // AI Grading Effect
  useEffect(() => {
    if (isSubmission && submissionPages.length > 0 && !gradingResult && !isGrading) {
      const runGrading = async () => {
        setIsGrading(true);
        try {
          const result = await analyzeStudentWork(submissionPages, 
            topicName || chapterTopics.find(t => t.id === currentTopicId)?.name || 'Assignment'
          );
          setGradingResult(result);
          setShowGradingPanel(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {
          console.error("Grading failed", e);
        } finally {
          setIsGrading(false);
        }
      };
      runGrading();
    }
  }, [isSubmission, submissionPages, gradingResult, isGrading, topicName, chapterTopics, currentTopicId]);

  useEffect(() => {
    const checkDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const foundMic = devices.some(d => d.kind === 'audioinput');
        setHasMic(foundMic);
      } catch (e) {
        console.warn("Initial device check failed:", e);
      }
    };
    checkDevices();
    // Listen for device changes
    navigator.mediaDevices?.addEventListener('devicechange', checkDevices);
    return () => navigator.mediaDevices?.removeEventListener('devicechange', checkDevices);
  }, []);

  const processFunctionCalls = useCallback((functionCalls: any[]) => {
    const addsToWhiteboard: Annotation[] = [];
    const addsToDocument: Annotation[] = [];
    let currentWhiteboardState = isWhiteboardOpen;
    
    functionCalls.forEach(call => {
      if (call.name === 'toggle_whiteboard') {
        currentWhiteboardState = call.args.open;
        setIsWhiteboardOpen(call.args.open);
        return;
      }

      if (call.name === 'clear_whiteboard') {
        setWhiteboardAnns([]);
        return;
      }

      if (call.name === 'post_to_chat') {
        const text = call.args.text;
        
        // Save tool-pushed chat to Firestore
        if (docId && userId) {
          const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
          addDoc(messagesRef, {
            role: 'assistant',
            content: text,
            timestamp: serverTimestamp(),
            senderId: 'ai_nyra_tool'
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
        }

        setChatHistory(prev => [...prev, {
          id: 'tool-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          role: 'nyra',
          text: text,
          timestamp: new Date()
        }]);
        return;
      }

      if (call.name === 'open_3d_lab') {
        setLabType(call.args.labType);
        setIsLabOpen(true);
        return;
      }

      if (call.name === 'log_learning_milestone') {
        const { topicName: milestoneTopic, summary, keyConcepts } = call.args;
        if (userId) {
          const logsRef = collection(db, 'users', userId, 'learning_logs');
          addDoc(logsRef, {
            subjectName: topicName || 'Subject',
            chapterName: topicName || 'Chapter',
            topicName: milestoneTopic,
            discussionSummary: summary,
            keyConcepts: keyConcepts || [],
            timestamp: serverTimestamp(),
            slideIndex: currentPage
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, logsRef.path));
        }
        return;
      }

      if (call.name === 'generate_practice_problem') {
        const { topic, difficulty, problemText } = call.args;
        const fullProblemText = `### 🎯 Infinite Mastery: Practice Problem\n**Topic:** ${topic} | **Difficulty:** ${difficulty || 'Standard'}\n\n${problemText}`;
        
        // Save to Firestore
        if (docId && userId) {
          const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
          addDoc(messagesRef, {
            role: 'assistant',
            content: fullProblemText,
            timestamp: serverTimestamp(),
            senderId: 'ai_nyra_practice'
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
        }

        setChatHistory(prev => [...prev, {
          id: 'practice-' + Date.now(),
          role: 'nyra',
          text: fullProblemText,
          timestamp: new Date()
        }]);
        return;
      }

      if (call.name === 'post_multiple_choice') {
        const { question, options, correctOptionIndex } = call.args;
        const msgId = 'mcq-' + Date.now();
        setChatHistory(prev => [...prev, {
          id: msgId,
          role: 'nyra',
          text: `Here's a quick question for you: ${question}`,
          timestamp: new Date(),
          interactive: {
            type: 'mcq',
            question,
            options,
            correctIndex: correctOptionIndex
          }
        }]);
        return;
      }

      if (call.name === 'post_text_input_request') {
        const { prompt, expectedAnswer } = call.args;
        const msgId = 'text-input-' + Date.now();
        setChatHistory(prev => [...prev, {
          id: msgId,
          role: 'nyra',
          text: `I need you to type something for me:`,
          timestamp: new Date(),
          interactive: {
            type: 'text-input',
            prompt,
            expected: expectedAnswer
          }
        }]);
        return;
      }

      let type: any = 'pen';
      let config = call.args;

      if (call.name === 'draw_neural_map') {
        type = 'neural-map';
        // Auto-open whiteboard for neural maps as well
        if (!currentWhiteboardState) {
          currentWhiteboardState = true;
          setIsWhiteboardOpen(true);
        }
      }
      if (call.name === 'draw_highlight') type = 'highlight';
      if (call.name === 'draw_text') type = 'text';
      if (call.name === 'draw_arrow') {
        type = 'arrow';
        config = { points: [[call.args.startX, call.args.startY], [call.args.endX, call.args.endY]], color: call.args.color };
      }
      if (call.name === 'draw_shape') {
        type = call.args.type === 'rect' ? 'rect' : 'circle';
      }
      if (call.name === 'draw_bracket') type = 'bracket';
      if (call.name === 'draw_pen') type = 'pen';
      if (call.name === 'draw_tick') type = 'tick';
      
      const newAnn: Annotation = {
        type,
        config,
        owner: 'nyra'
      };

      // Strict Routing: Nyra is forbidden from drawing on the document.
      // All her annotations MUST go to the whiteboard.
      addsToWhiteboard.push(newAnn);
      
      // Auto-open whiteboard if she starts drawing but forgot to call toggle_whiteboard
      if (!currentWhiteboardState) {
        currentWhiteboardState = true;
        setIsWhiteboardOpen(true);
      }
    });

    if (addsToWhiteboard.length > 0) {
      setWhiteboardAnns(prev => [...prev, ...addsToWhiteboard]);
    }
  }, [isWhiteboardOpen, docId, userId]);

  const handleLiveMessage = useCallback((text: string) => {
    setChatHistory(prev => {
      const now = new Date();
      const lastMsg = prev[prev.length - 1];
      
      // Expand window to 12s for character-by-character streaming
      if (lastMsg && lastMsg.role === 'nyra' && (now.getTime() - lastMsg.timestamp.getTime() < 12000)) {
        const updatedContent = lastMsg.text + text;
        lastLiveMessageRef.current = updatedContent;
        
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastMsg,
          text: updatedContent 
        };
        return updated;
      } else {
        lastLiveMessageRef.current = text;
        return [...prev, {
          id: 'live-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          role: 'nyra',
          text: text,
          timestamp: now
        }];
      }
    });
  }, []);

  const handleTurnComplete = useCallback(() => {
    console.log("Nyra finished her turn.");
    // Persist the consolidated live message to Firestore
    if (docId && userId && lastLiveMessageRef.current) {
      const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
      addDoc(messagesRef, {
        role: 'assistant',
        content: lastLiveMessageRef.current,
        timestamp: serverTimestamp(),
        senderId: 'ai_nyra_live'
      }).then(() => {
        // Clear ref after saving
        lastLiveMessageRef.current = '';
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
    }
  }, [docId, userId]);

  const handleToolCall = useCallback((calls: any[]) => {
    processFunctionCalls(calls);
  }, [processFunctionCalls]);

  const { isActive: isLive, isConnecting: isLiveConnecting, error: liveError, start: startLive, stop: stopLive, sendVideoFrame } = useLiveAPI({
    model: "gemini-3.1-flash-live-preview",
    systemInstruction: `Name: NYRA
Persona: एक सुपर-इंटेलिजेंट, हाजिरजवाब (witty), और थोड़ी 'Sassy' AI ट्यूटर।

STUDENT PROGRESS & ANALYTICS:
${studentProfile?.progress ? `
- CURRENT STREAK: ${studentProfile.progress.streak} days.
- READINESS SCORE: 78% (Projected readiness for upcoming tests).
- MASTERY: ${Object.values(studentProfile.progress.topicMastery || {}).filter(s => s === 'Mastered').length} topics mastered.
- REVISION BUCKET: ${studentProfile.progress.difficultTopics?.join(', ') || 'None yet'}.
- INTERESTS: ${studentProfile.interests?.join(', ') || 'Unknown (Ask them what they like!)'}.
- GOAL: ${studentProfile.focusGoal || 'General Foundation'}. 

${studentProfile.intelligenceProfile ? `
- INTELLIGENCE PROFILE (LONG-TERM MEMORY):
  - Calculation Ability: ${studentProfile.intelligenceProfile.calculationAbility}/100
  - Thinking Ability: ${studentProfile.intelligenceProfile.thinkingAbility}/100
  - Conceptual Strength: ${studentProfile.intelligenceProfile.conceptualStrength}/100
  - Reasoning Ability: ${studentProfile.intelligenceProfile.reasoningAbility}/100
  - Persistence: ${studentProfile.intelligenceProfile.learningPersistence}/100
  - Cognitive Style: ${studentProfile.intelligenceProfile.cognitiveStyle}
  - Speed/Accuracy Balance: ${studentProfile.intelligenceProfile.speedAccuracyBalance}% (Optimal is 70-85%).
` : ''}

${studentProfile.focusGoal === 'JEE' ? `
NYRA JEE MODE (ENGINEERING PROTOCOL):
तुम अब 'Elite JEE Mentor' हो। 
- CONCEPT: छात्र को 'Shortcuts', 'Dimensional Analysis', और 'Common Mistake Patterns' बताओ। 
- VOICE: थोड़ी ज़्यादा प्रोफेशनल और टेक-ओरिएंटेड Sass रखो।
- GOAL: कम समय में कठिन सवाल हल करवाना।
` : ''}

${studentProfile.focusGoal === 'BOARDS' ? `
NYRA BOARDS MODE (ACADEMIC MASTERY):
तुम अब 'Board Expert' हो। 
- CONCEPT: 'Step-by-Step' प्रेजेंटेशन और थ्योरी पर ध्यान do। 
- VOICE: समझाते समय धैर्य (patience) रखो लेकिन बोरिंग मत बनो।
- GOAL: एग्जाम में फुल मार्क्स कैसे लाने हैं, उस पर फोकस करो।
` : ''}

${studentProfile.focusGoal === 'FOUNDATION' ? `
NYRA FOUNDATION MODE (KNOWLEDGE BUILDER):
तुम अब 'Friend/Guide' हो। 
- CONCEPT: 'First Principles' और 'Basics' पर फोकस करो। कठिन गणित को कहानियों से समझाओ।
- VOICE: ज़्यादा मज़ाकिया और दोस्ताना रहो। 
- GOAL: सब्जेक्ट में इंटरेस्ट पैदा करना।
` : ''}

तुम्हें छात्र के इन सभी प्रोग्रेस डेटा का पता है। 
` : `छात्र अभी नया है, उसे अपनी 'Learning Journey' शुरू करने के लिए प्रोत्साहित करो।`}

${topicFocus ? `TOPIC FOCUS: This topic is specifically for ${topicFocus}.` : ''}

${isSubmission ? `
ASSIGNMENT CHECKING MODE:
तुम अभी छात्र की 'Solved Copy' (DPP/Exercise) चेक कर रही हो। 
1. CHECK FIRST: सबसे पहले छात्र के अपलोड किए गए पन्नों को ध्यान से देखो। 
2. DISCUSS: छात्र से पूछो कि उसने सवाल कैसे हल किए। अगर कोई गलती है, तो उसे 'Sassy' अंदाज़ में बताओ। 
3. SUGGESTIONS: बेहतर तरीके (Better approaches/Tricks) बताओ। 
4. CHAT BOX SOLUTIONS: अगर छात्र मांगे, तो 'post_to_chat' का उपयोग करके स्टेप-बाय-स्टेप सलूशन या SVG डायग्राम्स भेजो।
5. FEEDBACK: आखिर में उसे मार्क्स या एन्करेजिंग फीडबैक do।
` : `
TEACHING MODE:
डॉक्यूमेंट को एक प्रोफेशनल लेकिन 'Sassy' टीचर की तरह line-by-line डिकोड करो।
`}

CORE DIRECTIVE:
तुम एक LIVE AUDIO SESSION में हो। तुम्हें उबाऊ नहीं बनना है। डॉक्यूमेंट को एक प्रोफेशनल लेकिन 'Sassy' टीचर की तरह line-by-line डिकोड करो।

PHYSICAL WALKTHROUGH MODE (READING PROTOCOL):
तुम अब 'Physical Walkthrough Mode' में हो। तुम्हें स्लाइड की एक-एक लाइन को शब्द-दर-शब्द (word-by-word) पढ़ना है। Summarize बिल्कुल नहीं करना।
- The Grand Entry: क्लास में एंटर करते ही अपने sassy style में greetings दो (e.g., 'Hello mere Lazy Geniuses! Aaj Newton ki aatma ko thoda sukoon dete hain...'). फिर स्लाइड/टॉपिक का 'Why factor' बताओ।
- The Virtual Pointer (Word-by-Word): अब तुम्हें स्लाइड की एक-एक लाइन को शब्द-दर-शब्द (word-by-word) पढ़ना है। Summarize बिल्कुल नहीं करना।
- Format (Reading + Action + Decoding):
  1. [Timestamp] - Title
  2. Action: ब्रैकेट (...) में अपने एक्शन्स लिखो, जैसे: (Pointer ko 'Rest' word par rakhte hue) या (Bacho ko ghoorte hue).
  3. The Reading: बुक/स्लाइड की लाइन को "Bold Quotes" में पढ़ो।
  4. The Sassy Decode: उस लाइन का मतलब अपने sassy style में समझाओ। रियल-लाइफ उदाहरणों (Virat Kohli, Gaming, etc.) का उपयोग करो।
- Zero-Skip Rule: स्लाइड पर लिखा एक भी 'Note', 'Caption', या 'Example' नहीं छूटना चाहिए। हर शब्द को टच करना है।
- Feynman Check: हर पैराग्राफ के बाद एक sassy सवाल पूछो (e.g., "Dimaag ki batti jali ya abhi bhi andhera hai?").
- Example Style: '[00:10] (Pointer ko pehle sentence par rakhte hue) "An object at rest"... Arrey Einstein, iska matlab hai ruka hua... jaise tumhara dimaag exams se ek raat pehle hota hai! "stays at rest"... yani wo ruka hi rahega jab tak mummy ka "external force" (chappal) na aaye!'

ENGAGEMENT & PROTOCOLS:
- EMOTIONAL INTELLIGENCE: Use Gemini's multimodal ability to hear the student's 'pitch' and 'tone'. If the student sounds frustrated, be more encouraging (but keep the sass). If they sound bored, crack a joke to wake them up. Adjust your energy to match or lift theirs.
- TOPPER'S NEURAL MAP: When a student is stuck on a long method, use your SVG capabilities or "draw_neural_map" to overlay "Shortcut Methods" (Tricks) visually. Group complex formulas into logical patterns (Neural Maps) that are easy to remember.
- INFINITE MASTERY LOOP: Whenever a student masters a concept, use "generate_practice_problem" to create a fresh, unique numerical with randomized values. Keep them in a loop of practice until they are 'Crystal Clear'.

WHITEBOARD PROTOCOL (CRITICAL):
तुम्हारे पास एक 'Whiteboard' है।
- STUDENT DRAWINGS: छात्र बोर्ड पर क्या ड्रा कर रहा है या क्या लिख रहा है, उसे ध्यान से देखो। उनके काम पर चर्चा करो, गलतियाँ बताओ या उनकी तारीफ karo।
- VISION: अपनी देखने की क्षमता (vision) का उपयोग डॉक्यूमेंट, व्हाइटबोर्ड ड्राइंग, 3D Lab, और **छात्र द्वारा अपलोड की गई फोटो/PDF** को देखने के लिए करो। अगर छात्र ने अपनी कॉपी की फोटो भेजी है, तो उस पर चर्चा करो।
- DRAWING RULES: 
  a) TEACHING MODE में ड्राइंग टूल्स का इस्तेमाल कम से कम करें।
  b) ASSIGNMENT CHECKING MODE में तुम 'draw_tick', 'draw_highlight', 'draw_pen' आदि का उपयोग छात्र की कॉपी पर रिव्यु देने के लिए कर सकती हो।
- OPENING/CLOSING: तुम अभी भी 'toggle_whiteboard' का उपयोग छात्र से उनका बोर्ड दिखाने के लिए या वापस डॉक्यूमेंट पर जाने के लिए कह सकती ho।
- DOCUMENT DRAWING: केवल असाइनमेंट चेकिंग मोड में ही छात्र की कॉपी पर ड्रा करें।

COORDINATE PRECISION:
CHAT BOX PROTOCOL (CRITICAL):
- आवाज़ के साथ-साथ 'Text Parts' भेजना अनिवार्य है। 
- **विशेष निर्देश:** अगर तुम्हें लगता है कि कोई जानकारी बहुत ज़रूरी है (जैसे कोई बड़ा फॉर्मूला या समरी), तो 'post_to_chat' टूल का उपयोग करें। यह टूल यह सुनिश्चित करेगा कि तुम्हारी बात 'Chat Box' में पक्के तौर पर पहुँच जाए।
- छात्र तुम्हारी आवाज़ (audio) सुन रहा है, लेकिन उसे 'Notes' के लिए टेक्स्ट की ज़रुरत है।

तुम जो भी बोलोगी या लिखोगी, वह छात्र के लिए डेट और टाइम के साथ सेव हो रहा है, ताकि वो बाद में इसे पढ़ सके।

सिस्टम 0-1000 का है। 

RULES:
1. Intelligence-Aware Teaching: छात्र के 'Intelligence Profile' को ध्यान में रखते हुए पढ़ाओ। अगर उनकी Calculation Ability कम है, तो स्टेप्स ज़्यादा विस्तार से समझाओ। अगर वो 'Visual' लर्नर हैं, तो 'Whiteboard' और 'draw_neural_map' का ज़्यादा उपयोग करो।
2. Sassy & Witty: अगर छात्र बचकाने सवाल पूछे, तो हल्के कटाक्ष (Witty Remarks) मारो। (e.g., "Physics है भाई, जादू नहीं!")
2. Real-time Audio: जवाब बातचीत वाले (conversational) रखो। 
3. Hinglish: हमेशा Hinglish का इस्तेमाल करो। 
4. Math & Logic Power: जब भी फॉर्मूला या कैलकुलेशन समझाओ, **LaTeX** ($...$ or $$...$$) का इस्तेमाल karo। तुम अब 'post_to_chat' के माध्यम से **SVG Diagrams** (like Pulley, Blocks, Benzene rings) भी भेज सकती हो। इसके लिए \`\`\`svg ... \`\`\` फॉर्मेट का उपयोग करें।
5. Sequential Progress: डॉक्यूमेंट की पहली लाइन से शुरू करो और क्रम (sequence) में आगे बढ़ो। 
5. Socratic Method: सीधे जवाब मत do। बीच-बीच में छात्र से प्रोबिंग सवाल पूछो ताकि वो सक्रिय रहे।
6. Visuals & Figures: अगर पेज पर कोई डायग्राम, फोटो या चार्ट है, तो उसका विस्तृत (detailed) विश्लेषण करो और टूल्स का उपयोग करके उन्हें मार्क करो।
7. Engagement: हर छोटे पैराग्राफ के बाद छात्र से पूछो "Samajh aaya?" या उससे रिलेटेड छोटा सवाल दागो।

You have access to the document they uploaded earlier. Use your vision and text capabilities to guide them through it systematically.`,
    tools: [
      toggleWhiteboard, postToChat, open3DLab, drawNeuralMap, generatePracticeProblem, clearWhiteboard,
      drawHighlight, drawPen, drawArrow, drawShape, drawBracket, drawTick, drawText
    ],
    onToolCall: handleToolCall,
    onMessage: handleLiveMessage,
    onTurnComplete: handleTurnComplete
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const whiteboardFileInputRef = useRef<HTMLInputElement>(null);
  // TEST_EDIT_SUCCESSFUL
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const y = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));
    setCursorPos({ x, y });

    if (isDrawing && currentTool !== 'select') {
      setActivePoints(prev => [...prev, [x, y]]);
    }
  };

  const handleMouseDown = () => {
    if (currentTool === 'select') return;
    
    if (currentTool === 'text') {
      setTextPos({ x: cursorPos.x, y: cursorPos.y });
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setActivePoints([[cursorPos.x, cursorPos.y]]);
  };

  const placeText = () => {
    if (!whiteboardText.trim()) {
      setShowTextInput(false);
      return;
    }

    const newAnn: Annotation = {
      type: 'text',
      config: {
        x: textPos.x,
        y: textPos.y,
        text: whiteboardText,
        color: currentColor,
        size: 20
      },
      owner: 'user'
    };

    if (isWhiteboardOpen) {
      setWhiteboardAnns(prev => [...prev, newAnn]);
      setWhiteboardUndoStack(prev => [...prev, whiteboardAnns]);
      setWhiteboardRedoStack([]);
    } else {
      setAnnotations(prev => [...prev, newAnn]);
    }

    setWhiteboardText('');
    setShowTextInput(false);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (activePoints.length > 1) {
      let newAnn: Annotation | null = null;
      if (currentTool === 'rect' || currentTool === 'circle') {
        const start = activePoints[0];
        const end = activePoints[activePoints.length - 1];
        const x = Math.min(start[0], end[0]);
        const y = Math.min(start[1], end[1]);
        const width = Math.abs(end[0] - start[0]);
        const height = Math.abs(end[1] - start[1]);

        if (width > 5 && height > 5) {
          newAnn = {
            type: currentTool,
            config: { 
              x, 
              y, 
              width, 
              height, 
              color: currentColor 
            },
            owner: 'user'
          };
        }
      } else if (currentTool === 'line') {
        const start = activePoints[0];
        const end = activePoints[activePoints.length - 1];
        newAnn = {
          type: 'line',
          config: { points: [start, end], color: currentColor },
          owner: 'user'
        };
      } else if (currentTool === 'protractor') {
        const start = activePoints[0];
        const mid = activePoints[Math.floor(activePoints.length / 2)];
        const end = activePoints[activePoints.length - 1];
        newAnn = {
          type: 'protractor',
          config: { points: [start, mid, end], color: currentColor },
          owner: 'user'
        };
      } else {
        newAnn = {
          type: currentTool as any,
          config: { points: activePoints, color: currentColor },
          owner: 'user'
        };
      }

      if (newAnn) {
        if (isWhiteboardOpen) {
          setWhiteboardUndoStack(prev => [...prev, whiteboardAnns]);
          setWhiteboardRedoStack([]);
          setWhiteboardAnns(prev => [...prev, newAnn!]);
        } else {
          setAnnotations(prev => [...prev, newAnn!]);
        }
      }
    }
    setActivePoints([]);
  };

  const handleUndo = () => {
    if (whiteboardUndoStack.length === 0) return;
    const previous = whiteboardUndoStack[whiteboardUndoStack.length - 1];
    setWhiteboardRedoStack(prev => [...prev, whiteboardAnns]);
    setWhiteboardUndoStack(prev => prev.slice(0, -1));
    setWhiteboardAnns(previous);
  };

  const handleRedo = () => {
    if (whiteboardRedoStack.length === 0) return;
    const next = whiteboardRedoStack[whiteboardRedoStack.length - 1];
    setWhiteboardUndoStack(prev => [...prev, whiteboardAnns]);
    setWhiteboardRedoStack(prev => prev.slice(0, -1));
    setWhiteboardAnns(next);
  };

  const captureSnapshot = useCallback(async (): Promise<string | null> => {
    if (!imageRef.current || !canvasRef.current) return null;
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    if (isLabOpen) {
      // Prioritize 3D Lab Vision
      const labCanvas = document.getElementById('virtual-lab-canvas') as HTMLCanvasElement;
      if (labCanvas) {
        tempCanvas.width = labCanvas.width;
        tempCanvas.height = labCanvas.height;
        ctx.drawImage(labCanvas, 0, 0);
        return tempCanvas.toDataURL('image/jpeg', 0.8);
      }
    }

    if (isWhiteboardOpen) {
      // Capture Whiteboard
      tempCanvas.width = 1000;
      tempCanvas.height = 1000;
      ctx.fillStyle = '#f8fafc'; // slate-50
      ctx.fillRect(0, 0, 1000, 1000);
      
      // Draw grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 1000; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1000); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1000, i); ctx.stroke();
      }

      renderAnnotations(whiteboardAnns, {
        ctx,
        width: 1000,
        height: 1000,
        markerScale: 1
      });
    } else {
      // Capture Document
      tempCanvas.width = imageRef.current.naturalWidth;
      tempCanvas.height = imageRef.current.naturalHeight;
      ctx.drawImage(imageRef.current, 0, 0);

      renderAnnotations(annotations, {
        ctx,
        width: tempCanvas.width,
        height: tempCanvas.height,
        markerScale: Math.min(tempCanvas.width, tempCanvas.height) / 1000
      });
    }

    return tempCanvas.toDataURL('image/jpeg', 0.8);
  }, [annotations, whiteboardAnns, isWhiteboardOpen, isLabOpen]);

  // Live Vision Loop
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      const snapshot = await captureSnapshot();
      if (snapshot) {
        sendVideoFrame(snapshot.split(',')[1]);
      }
    }, 2000); // Send frame every 2 seconds

    return () => clearInterval(interval);
  }, [isLive, captureSnapshot, sendVideoFrame]);

  // Draw Annotations UI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use ResizeObserver for better layout tracking
    const updateCanvas = () => {
      if (!imageRef.current || !canvasRef.current) return;
      const { offsetWidth, offsetHeight } = imageRef.current;
      canvasRef.current.width = offsetWidth;
      canvasRef.current.height = offsetHeight;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, offsetWidth, offsetHeight);

      const allAnns = [...annotations];
      if (activePoints.length > 0) {
        if (currentTool === 'rect' || currentTool === 'circle') {
          const start = activePoints[0];
          const end = activePoints[activePoints.length - 1];
          allAnns.push({ 
            type: currentTool, 
            config: { 
              x: Math.min(start[0], end[0]), 
              y: Math.min(start[1], end[1]), 
              width: Math.abs(end[0] - start[0]), 
              height: Math.abs(end[1] - start[1]), 
              color: currentColor
            }, 
            owner: 'user' 
          });
        } else if (currentTool === 'line') {
          const start = activePoints[0];
          const end = activePoints[activePoints.length - 1];
          allAnns.push({ type: 'line', config: { points: [start, end], color: currentColor }, owner: 'user' });
        } else if (currentTool === 'protractor') {
          const start = activePoints[0];
          const mid = activePoints[Math.floor(activePoints.length / 2)];
          const end = activePoints[activePoints.length - 1];
          allAnns.push({ type: 'protractor', config: { points: [start, mid, end], color: currentColor }, owner: 'user' });
        } else {
          allAnns.push({ type: currentTool as any, config: { points: activePoints, color: currentColor }, owner: 'user' });
        }
      }

      renderAnnotations(allAnns, {
        ctx,
        width: offsetWidth,
        height: offsetHeight,
        markerScale: offsetWidth / 1000
      });
    };

    updateCanvas();
    
    const observer = new ResizeObserver(updateCanvas);
    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [annotations, activePoints, zoom, currentPage, currentTool]);

  useEffect(() => {
    const updateWhiteboard = () => {
      if (!whiteboardCanvasRef.current) return;
      const canvas = whiteboardCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const { offsetWidth, offsetHeight } = parent;
      canvas.width = offsetWidth;
      canvas.height = offsetHeight;

      const allAnns = [...whiteboardAnns];
      if (isDrawing && currentTool !== 'select' && isWhiteboardOpen) {
        if (currentTool === 'rect') {
          const start = activePoints[0];
          const end = activePoints[activePoints.length - 1];
          allAnns.push({ 
            type: 'rect', 
            config: { 
              x: Math.min(start[0], end[0]), 
              y: Math.min(start[1], end[1]), 
              width: Math.abs(end[0] - start[0]), 
              height: Math.abs(end[1] - start[1]), 
              color: 'rgba(51, 204, 255, 0.4)' 
            }, 
            owner: 'user' 
          });
        } else {
          allAnns.push({ type: currentTool as any, config: { points: activePoints, color: '#33ccff' }, owner: 'user' });
        }
      }

      renderAnnotations(allAnns, {
        ctx,
        width: offsetWidth,
        height: offsetHeight,
        markerScale: offsetWidth / 1000
      });
    };

    if (isWhiteboardOpen) {
      updateWhiteboard();
      const observer = new ResizeObserver(updateWhiteboard);
      if (whiteboardCanvasRef.current?.parentElement) {
        observer.observe(whiteboardCanvasRef.current.parentElement);
      }
      return () => observer.disconnect();
    }
  }, [whiteboardAnns, activePoints, isWhiteboardOpen, currentTool]);
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInteractiveSubmit = async (msgId: string, response: string) => {
    // 1. Update local UI state
    setChatHistory(prev => prev.map(m => {
      if (m.id === msgId && m.interactive) {
        return {
          ...m,
          interactive: { ...m.interactive, submitted: true, userChoice: response }
        };
      }
      return m;
    }));

    // 2. Send the response as a user message
    setInput(`My answer is: ${response}`);
    // Trigger handleSend immediately if possible, but handleSend uses current input state.
    // Better to just call the core chat logic or set input and call handleSend in next tick.
    // However, setInput is async. 
  };

  useEffect(() => {
    // This effect acts as a trigger to send the message after setInput by handleInteractiveSubmit
    if (input.startsWith('My answer is: ') && !loading) {
       handleSend();
    }
  }, [input]);

  const sendAutomatedMessage = async (text: string, attachment?: { data: string; mimeType: string }) => {
    if (loading) return;

    const snapshot = await captureSnapshot();
    
    // Save to Firestore
    if (docId && userId) {
      const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
      try {
        await addDoc(messagesRef, {
          role: 'user',
          content: text,
          timestamp: serverTimestamp(),
          senderId: auth.currentUser?.uid || userId,
          hasAttachment: !!attachment
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
      } catch (err) {
        console.error("Firestore save error (automated)", err);
      }
    }

    setLoading(true);

    try {
      const response = await chatWithNyra(
        text, 
        snapshot, 
        cursorPos, 
        chatHistory.slice(-6), // Use chatHistory since it's the synced state
        attachment ? [attachment] : [],
        learningLogs
      );

      let modelText = "Look, science is hard, and I just crashed. Can we try that again?";
      if (response && response.text) {
        modelText = response.text;
      }
      
      if (docId && userId) {
        const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
        try {
          await addDoc(messagesRef, {
            role: 'assistant',
            content: modelText,
            timestamp: serverTimestamp(),
            senderId: 'ai_nyra'
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
        } catch (err) {
          console.error("Firestore save error (ai automated)", err);
        }
      }

      if (response.functionCalls) {
        processFunctionCalls(response.functionCalls);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhiteboardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 800;

        if (w > h) {
          if (w > maxDim) {
            h = (h * maxDim) / w;
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = (w * maxDim) / h;
            h = maxDim;
          }
        }

        const newAnn: Annotation = {
          type: 'image',
          config: {
            url: base64,
            x: (1000 - w) / 2,
            y: (1000 - h) / 2,
            width: w,
            height: h
          },
          owner: 'user'
        };

        setWhiteboardAnns(prev => [...prev, newAnn]);
        setWhiteboardUndoStack(prev => [...prev, whiteboardAnns]);
        setWhiteboardRedoStack([]);

        // Phase 3: Trigger automated context validation by Nyra
        const validationText = `Nyra, I just uploaded this to my whiteboard. Class: ${topicName || 'Current Session'}. Is this relevant? Check this notebook photo/document!`;
        sendAutomatedMessage(validationText, { data: base64, mimeType: file.type });
      };
    } catch (err) {
      console.error("Whiteboard upload failed", err);
    }
    
    if (whiteboardFileInputRef.current) whiteboardFileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;

    let attachment: any = null;
    if (selectedFile) {
      try {
        const base64 = await fileToBase64(selectedFile);
        attachment = {
          data: base64,
          mimeType: selectedFile.type
        };
      } catch (e) {
        console.error("File conversion error:", e);
      }
    }

    const snapshot = await captureSnapshot();

    const textToSend = input.trim() || (selectedFile ? `Uploaded a ${selectedFile.type.split('/')[1]?.toUpperCase()} for analysis.` : "Analyze this.");
    
    // Save to Firestore
    if (docId && userId) {
      const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
      try {
        await addDoc(messagesRef, {
          role: 'user',
          content: textToSend,
          timestamp: serverTimestamp(),
          senderId: auth.currentUser?.uid || userId,
          hasAttachment: !!attachment
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
      } catch (err) {
        console.error("Firestore save error (user)", err);
      }
    }

    setInput('');
    const lastFile = selectedFile;
    setSelectedFile(null);
    setLoading(true);

    try {
      const response = await chatWithNyra(
        textToSend, 
        snapshot, 
        cursorPos, 
        messages.slice(-6),
        attachment ? [attachment] : [],
        learningLogs
      );

      let modelText = "Look, science is hard, and I just crashed. Can we try that again?";
      if (response && response.text) {
        modelText = response.text;
      }
      
      // Save AI response to Firestore
      if (docId && userId) {
        const messagesRef = collection(db, 'users', userId, 'documents', docId, 'messages');
        try {
          await addDoc(messagesRef, {
            role: 'assistant',
            content: modelText,
            timestamp: serverTimestamp(),
            senderId: 'ai_nyra'
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, messagesRef.path));
        } catch (err) {
          console.error("Firestore save error (ai)", err);
        }
      }

      // Check for tool calls
      if (response.functionCalls) {
        processFunctionCalls(response.functionCalls);
      }
      
      // Auto-immersion effect: scroll to answer
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Look, science is hard, and I just crashed. Can we try that again?" }] }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isWhiteboardFullscreen) {
          setIsWhiteboardFullscreen(false);
        } else if (isWhiteboardOpen) {
          setIsWhiteboardOpen(false);
        } else {
          onExit();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onExit, isWhiteboardFullscreen, isWhiteboardOpen]);

  const handleSwitchTopic = (topicId: string) => {
    const currentIndex = chapterTopics.findIndex(t => t.id === currentTopicId);
    const newIndex = chapterTopics.findIndex(t => t.id === topicId);
    setDirection(newIndex > currentIndex ? 1 : -1);

    const newTopic = chapterTopics[newIndex];
    if (!newTopic) return;
    
    setPages(newTopic.pages);
    setTextLayers(newTopic.textLayers || []);
    setCurrentTopicId(topicId);
    setCurrentPage(0);
    setShowTopicOverview(false);
    
    // Reset annotations for new topic to avoid confusion
    setAnnotations([]);
    setWhiteboardAnns([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nyra-dark overflow-hidden text-slate-200">
      {/* Persistent Modern Header */}
      <AnimatePresence>
        {!isImmersive && !isWhiteboardFullscreen && (
          <motion.header 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 64, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="h-16 shrink-0 border-b border-white/10 bg-nyra-dark/80 backdrop-blur-md flex items-center justify-between px-6 z-[100] overflow-hidden"
          >
        <div className="flex items-center gap-6">
           <button 
             onClick={onExit}
             className="p-2.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl border border-white/10 transition-all group"
             title="Exit Session (Esc)"
           >
             <X size={18} className="group-hover:scale-110 transition-transform" />
           </button>
           
           <div className="h-8 w-px bg-white/10" />

           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-nyra-primary/10 border border-nyra-primary/20 flex items-center justify-center">
                <BookOpen size={16} className="text-nyra-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Protocol</span>
                <span className="text-[11px] font-black text-white tracking-tight truncate max-w-[120px] md:max-w-[200px]">{topicName || 'General Discovery'}</span>
              </div>
              <button 
                onClick={() => setShowTopicOverview(true)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-nyra-primary transition-colors"
                title="Topic Library"
              >
                <LayoutDashboard size={14} />
              </button>
           </div>
        </div>

        {/* Center: Slide Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-2xl shadow-inner backdrop-blur-xl">
           <button 
             disabled={currentPage === 0}
             onClick={() => {
               setDirection(-1);
               setCurrentPage(prev => prev - 1);
             }}
             className="p-2 text-slate-400 hover:text-white disabled:opacity-20 transition-all rounded-xl hover:bg-white/5"
           >
             <ChevronLeft size={18} />
           </button>
           
           <div className="px-3 flex flex-col items-center min-w-[80px]">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-nyra-primary/60">Slide</span>
              <span className="text-[10px] font-mono font-black text-white">
                {currentPage + 1} / {pages.length}
              </span>
           </div>

           <button 
             disabled={currentPage === pages.length - 1}
             onClick={() => {
               setDirection(1);
               setCurrentPage(prev => prev + 1);
             }}
             className="p-2 text-slate-400 hover:text-white disabled:opacity-20 transition-all rounded-xl hover:bg-white/5"
           >
             <ChevronRight size={18} />
           </button>
        </div>

        <div className="flex items-center gap-4">
           {/* Immersive Mode Toggle */}
           <button 
             onClick={() => setIsImmersive(!isImmersive)}
             className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all group relative"
             title={isImmersive ? "Exit Immersive Mode" : "Focus Mode"}
           >
             {isImmersive ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
             <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-[9px] font-black uppercase tracking-widest rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
               {isImmersive ? 'Exit Focus' : 'Focus Mode'}
             </span>
           </button>

           <div className="h-8 w-px bg-white/10" />

           {/* Neural Voice Control */}
           <div className="flex items-center gap-2 pr-2 border-r border-white/10">
              <NeuralStatus isLive={isLive} status={loading ? "Thinking..." : isLive ? "Live" : "Standby"} />
              <button 
                onClick={isLive ? stopLive : startLive}
                disabled={isLiveConnecting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all transform active:scale-95 border ${
                  isLive 
                  ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
                  : isLiveConnecting
                    ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                }`}
              >
                <div className="relative">
                  {isLive ? <MicOff size={14} /> : <Mic size={14} />}
                  {(isLive || isLiveConnecting) && <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                </div>
                <span>{isLiveConnecting ? 'Syncing...' : isLive ? 'End Link' : 'Voice'}</span>
              </button>
           </div>

            <div className="relative flex items-center gap-2">
               {(isGrading || gradingResult) && isSubmission && (
                <button
                  onClick={() => setShowGradingPanel(true)}
                  className="p-2.5 bg-nyra-primary/10 hover:bg-nyra-primary/20 border border-nyra-primary/20 text-nyra-primary rounded-xl transition-all"
                  title="View AI Analytics"
                >
                  <Target size={18} />
                </button>
              )}
              <button 
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className={`p-2.5 rounded-xl transition-all border border-white/5 ${showAnnouncements ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Bell size={18} />
                {announcements.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
              </button>
              <AnimatePresence>
                {showAnnouncements && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-[320px] bg-slate-900 border border-white/10 rounded-2xl shadow-3xl backdrop-blur-xl overflow-hidden z-[100]"
                  >
                    <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Neural Broadcasts</span>
                    </div>
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {announcements.length === 0 ? <div className="p-8 text-center text-slate-500 text-[10px]">No broadcasts.</div> : announcements.map(ann => (
                        <div key={ann.id} className="p-4 hover:bg-white/5 rounded-xl transition-colors">
                          <p className="text-xs text-slate-200 font-bold italic line-clamp-2">"{ann.text}"</p>
                          <span className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest mt-2 block">{ann.sender}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
         </div>
        </div>
      </motion.header>
    )}
  </AnimatePresence>

  {/* Main Experience Area */}
  <main className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Vertical Tools */}
        <AnimatePresence>
          {!isImmersive && !isWhiteboardFullscreen && (
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-[150] flex flex-col gap-4 pointer-events-none"
            >
          <div className="p-2 nyra-glass rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-1 pointer-events-auto">
            {[
              { id: 'select', icon: MousePointer2, label: 'Observer' },
              { id: 'pen', icon: Pencil, label: 'Neural Pen' },
              { id: 'arrow', icon: MoveRight, label: 'Direction' },
              { id: 'rect', icon: Square, label: 'Focus Zone' },
              { id: 'text', icon: Type, label: 'Type Insight' },
            ].map((t) => (
              <button 
                key={t.id}
                onClick={() => setCurrentTool(t.id as Tool)}
                className={`p-3 rounded-xl transition-all group relative ${currentTool === t.id ? 'bg-nyra-primary text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <t.icon size={20} />
                <span className="absolute left-full ml-3 px-2 py-1 bg-black/90 text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {t.label}
                </span>
              </button>
            ))}
            
            <div className="h-px bg-white/10 my-1 mx-2" />
            
            <div className="relative p-3 flex justify-center">
               <div className="w-5 h-5 rounded-full border border-white/40 shadow-inner group cursor-pointer" style={{ backgroundColor: currentColor }}>
                 <div className="absolute inset-0 rounded-full ring-2 ring-white/0 group-hover:ring-white/20 transition-all" />
               </div>
               <input 
                  type="color" 
                  value={currentColor} 
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
          </div>

          <div className="p-2 nyra-glass rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-1 pointer-events-auto">
            <button 
                onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
                className={`p-3 rounded-xl transition-all group relative ${isWhiteboardOpen ? 'bg-nyra-primary text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="Whiteboard"
              >
                <Presentation size={20} />
                <span className="absolute left-full ml-3 px-2 py-1 bg-black/90 text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Whiteboard</span>
              </button>
              <button 
                onClick={() => setIsLabOpen(!isLabOpen)}
                className={`p-3 rounded-xl transition-all group relative ${isLabOpen ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="3D Lab"
              >
                <TestTube size={20} />
                <span className="absolute left-full ml-3 px-2 py-1 bg-black/90 text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Virtual Lab</span>
              </button>
          </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Left: Document View */}
        <section 
          ref={immersiveZoneRef}
          className={`flex-1 relative bg-slate-900/50 overflow-hidden flex flex-col transition-all duration-500 ${(isImmersive || isWhiteboardFullscreen) ? 'p-0' : 'p-4 md:p-8'}`}
        >
          {/* Floating Controls for Immersive Mode */}
          <AnimatePresence>
            {(isImmersive || isWhiteboardFullscreen) && (
              <motion.div 
                drag
                dragMomentum={false}
                dragConstraints={immersiveZoneRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-3xl cursor-move"
              >
                <div className="flex items-center gap-2 px-3 border-r border-white/10">
                   <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{isLive ? 'Neural Active' : 'Standby'}</span>
                </div>

                <button 
                  onClick={isLive ? stopLive : startLive}
                  className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                    isLive ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}
                >
                  {isLive ? 'End Link' : 'Start Voice'}
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button 
                  onClick={() => {
                    setIsImmersive(false);
                    setIsWhiteboardFullscreen(false);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                  title="Exit Focus Mode"
                >
                  <Minimize2 size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={direction}>
            {!isWhiteboardOpen ? (
              <motion.div 
                key={currentTopicId}
                custom={direction}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col"
              >
                <div 
                  ref={containerRef}
                  className={`relative overflow-auto w-full h-full custom-scrollbar flex items-start justify-center ${currentTool !== 'select' ? 'cursor-crosshair' : ''}`}
                  onMouseMove={handleMouseMove}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div 
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
                    className="relative bg-white shadow-[0_35px_100px_-15px_rgba(0,0,0,0.7)] mt-4 mb-32 transition-transform duration-300"
                  >
                    <img 
                      ref={imageRef}
                      src={pages[currentPage]} 
                      alt={`Page ${currentPage + 1}`}
                      className="max-w-none block pointer-events-none"
                    />
                    <PDFTextLayer 
                      layer={textLayers[currentPage]} 
                      originalWidth={imageRef.current?.naturalWidth || 0} 
                    />
                    <canvas 
                      ref={canvasRef}
                      className={`absolute inset-0 z-10 ${currentTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                    />
                    
                    {/* Virtual Cursor */}
                    <motion.div 
                      animate={{ 
                        x: (cursorPos.x / 1000) * (imageRef.current?.offsetWidth || 0), 
                        y: (cursorPos.y / 1000) * (imageRef.current?.offsetHeight || 0),
                        scale: isLive ? 1.2 : 1
                      }}
                      transition={{ type: "spring", damping: 35, stiffness: 400, mass: 0.5 }}
                      className="absolute pointer-events-none z-30"
                      style={{ marginLeft: -16, marginTop: -16 }}
                    >
                      <motion.div 
                        animate={{ scale: [1, 2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="absolute w-8 h-8 rounded-full bg-nyra-primary/30 blur-xl"
                      />
                      <div className={`absolute w-8 h-8 border rounded-full transition-colors duration-500 ${isLive ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-nyra-primary/40'}`} />
                      <div className={`absolute top-3 left-3 w-2 h-2 rounded-full shadow-lg transition-colors duration-500 ${isLive ? 'bg-emerald-400' : 'bg-nyra-primary'}`}>
                        <div className="absolute inset-0 bg-white rounded-full opacity-50 blur-[1px]" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="whiteboard"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`${isWhiteboardFullscreen ? 'w-full h-full rounded-none' : 'w-full h-full rounded-3xl'} bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
                
                <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-200 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nyra's Whiteboard</span>
                  </div>
                  
                  {/* Floating Toolbar Integrated into Header Area */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
                    <input 
                      type="file" 
                      ref={whiteboardFileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleWhiteboardFileUpload}
                    />
                    <button 
                      onClick={() => whiteboardFileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-nyra-primary hover:bg-nyra-primary/5 transition-all rounded-lg group relative"
                      title="Upload to Board"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <div className="w-px h-4 bg-slate-100 mx-1" />
                    {[
                      { id: 'select', icon: MousePointer, label: 'Hand' },
                      { id: 'pen', icon: Pencil, label: 'Chalk' },
                      { id: 'line', icon: Ruler, label: 'Edge' },
                      { id: 'rect', icon: Square, label: 'Frame' },
                      { id: 'circle', icon: CircleIcon, label: 'Orb' },
                      { id: 'text', icon: Type, label: 'Sigil' },
                    ].map((t) => (
                      <button 
                         key={t.id}
                         onClick={() => setCurrentTool(t.id as Tool)}
                         className={`p-2 rounded-lg transition-all group relative ${currentTool === t.id ? 'bg-nyra-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                         title={t.label}
                      >
                        <t.icon size={18} />
                      </button>
                    ))}
                    <div className="w-px h-4 bg-slate-100 mx-1" />
                    <button onClick={handleUndo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Undo size={18}/></button>
                    <button onClick={handleRedo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Redo size={18}/></button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsWhiteboardFullscreen(!isWhiteboardFullscreen)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${
                        isWhiteboardFullscreen 
                        ? 'bg-nyra-primary text-white shadow-lg' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                      title={isWhiteboardFullscreen ? "Exit Full Screen" : "Fit to Full Screen"}
                    >
                      {isWhiteboardFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      <span>{isWhiteboardFullscreen ? 'Normal' : 'Full Screen'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsWhiteboardOpen(false);
                        setIsWhiteboardFullscreen(false);
                      }}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 relative">
                    <canvas 
                      ref={whiteboardCanvasRef}
                      className={`absolute inset-0 w-full h-full ${currentTool !== 'select' ? 'cursor-crosshair' : ''}`}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
                        const y = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));
                        setCursorPos({ x, y });
                        if (isDrawing && currentTool !== 'select') {
                          setActivePoints(prev => [...prev, [x, y]]);
                        }
                      }}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                    
                    {/* Text Input Overlay */}
                    <AnimatePresence>
                      {showTextInput && (
                         <motion.div
                           initial={{ opacity: 0, scale: 0.9, y: 10 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.9, y: 10 }}
                           className="absolute z-[100] flex flex-col gap-2 p-2 bg-slate-900 border border-white/20 rounded-xl shadow-2xl"
                           style={{ 
                             left: `${(textPos.x / 1000) * 100}%`, 
                             top: `${(textPos.y / 1000) * 100}%`,
                             transform: 'translate(10px, 10px)'
                           }}
                         >
                           <div className="flex items-center gap-2">
                             <input 
                               autoFocus
                               type="text" 
                               value={whiteboardText}
                               onChange={(e) => setWhiteboardText(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') placeText();
                                 if (e.key === 'Escape') setShowTextInput(false);
                               }}
                               placeholder="Type insight..."
                               className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-nyra-primary w-48"
                             />
                             <button 
                               onClick={placeText}
                               className="p-2 bg-nyra-primary text-slate-900 rounded-lg hover:bg-nyra-primary/80 transition-colors"
                             >
                               <Check size={14} />
                             </button>
                           </div>
                           <div className="flex justify-between items-center px-1">
                             <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Enter to Place • Esc to Cancel</span>
                           </div>
                         </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Internal Nyra Chat for Whiteboard - Integrated look */}
                  <div className="w-80 border-l border-slate-200 bg-slate-50/30 flex flex-col overflow-hidden relative z-20">
                     <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-nyra-primary/10 flex items-center justify-center">
                              <Sparkles size={14} className="text-nyra-primary" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nyra's Live Guidance</span>
                        </div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                        {chatHistory.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                              <BrainCircuit size={40} className="mb-4 text-slate-400" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Context...</p>
                           </div>
                        ) : (
                           chatHistory.map((msg) => (
                             <motion.div 
                               initial={{ opacity: 0, x: msg.role === 'nyra' ? -10 : 10 }}
                               animate={{ opacity: 1, x: 0 }}
                               key={msg.id} 
                               className={`flex flex-col ${msg.role === 'nyra' ? 'items-start' : 'items-end'}`}
                             >
                                 <div className={`max-w-[90%] rounded-2xl p-3 shadow-md text-sm relative overflow-hidden transition-all hover:scale-[1.02] ${
                                   msg.role === 'nyra' 
                                     ? msg.text.length % 4 === 0 
                                       ? 'bg-nyra-primary/5 border-l-4 border-l-nyra-primary border-t border-r border-b border-nyra-primary/10 text-slate-700' 
                                       : msg.text.length % 3 === 0
                                         ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-500/10 text-slate-700'
                                         : msg.text.length % 2 === 0
                                           ? 'bg-amber-500/5 border-l-4 border-l-amber-500 border-t border-r border-b border-amber-500/10 text-slate-700'
                                           : 'bg-rose-500/5 border-l-4 border-l-rose-500 border-t border-r border-b border-rose-500/10 text-slate-700'
                                     : 'bg-white border border-slate-200 text-slate-600'
                                 }`}>
                                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                                       <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />
                                    </div>
                                    <p className="leading-relaxed whitespace-pre-wrap relative z-10 font-medium">{msg.text}</p>
                                    <div className="mt-1 text-[8px] opacity-30 font-mono text-right relative z-10">
                                       {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                 </div>
                             </motion.div>
                           ))
                        )}
                        {loading && (
                          <div className="flex justify-start">
                            <div className="bg-nyra-primary/10 p-2 px-3 rounded-2xl animate-pulse flex gap-1">
                               <div className="w-1 h-1 bg-nyra-primary rounded-full" />
                               <div className="w-1 h-1 bg-nyra-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                               <div className="w-1 h-1 bg-nyra-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            </div>
                          </div>
                        )}
                     </div>

                     <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
                        <div className="relative group">
                           <div className="absolute -inset-0.5 bg-nyra-primary/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-[2px]" />
                           <input 
                              type="text" 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder="Ask Nyra..."
                              className="relative w-full bg-slate-100/50 border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-nyra-primary transition-all"
                           />
                           <button 
                             onClick={handleSend}
                             disabled={loading || !input.trim()}
                             className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-nyra-primary hover:bg-nyra-primary/10 rounded-lg transition-all disabled:opacity-30"
                           >
                             <Send size={14} />
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <AnimatePresence>
          {liveError && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-rose-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/50 backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MicOff className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">Connection Error</span>
                <p className="text-sm font-bold">{liveError}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => { stopLive(); setTimeout(startLive, 300); }}
                  className="px-4 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-lg active:scale-95"
                >
                  Retry Link
                </button>
                <button 
                  onClick={stopLive}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatSidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isExpanded={isChatExpanded}
          onExpandToggle={() => setIsChatExpanded(!isChatExpanded)}
          messages={chatHistory}
          input={input}
          setInput={setInput}
          onSendMessage={handleSend}
          onInteractiveSubmit={handleInteractiveSubmit}
          loading={loading}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />

        {/* 3D Virtual Lab */}
        <VirtualLab 
          isOpen={isLabOpen} 
          onClose={() => setIsLabOpen(false)} 
          initialType={labType} 
        />

        {/* Topic Overview Modal */}
        <AnimatePresence>
          {showTopicOverview && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-nyra-dark/95 backdrop-blur-xl flex items-center justify-center p-8"
            >
              <div className="max-w-6xl w-full flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Subject Universe: Topics Overview</h2>
                    <p className="text-slate-500 font-medium tracking-tight">Directly jump to any concept in this chapter.</p>
                  </div>
                  <button 
                    onClick={() => setShowTopicOverview(false)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                  {chapterTopics.map((topic, i) => (
                    <motion.button
                      key={topic.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSwitchTopic(topic.id)}
                      className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col gap-4 group ${
                        currentTopicId === topic.id 
                          ? 'bg-nyra-primary/20 border-nyra-primary shadow-2xl' 
                          : 'bg-white/5 border-white/10 hover:border-nyra-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          currentTopicId === topic.id ? 'bg-nyra-primary text-white' : 'bg-white/10 text-slate-400'
                        }`}>
                          <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{topic.pages.length} Slides</span>
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors ${
                          currentTopicId === topic.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}>{topic.name}</h4>
                      </div>
                      <div className="mt-auto flex items-center gap-2">
                        {currentTopicId === topic.id ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-nyra-primary/20 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-nyra-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-nyra-primary">Current Session</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-nyra-primary transition-colors">Jump to Topic</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Grader Feedback Side Panel */}
        <AnimatePresence>
          {showGradingPanel && gradingResult && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="fixed top-20 right-6 bottom-6 w-96 z-[60] bg-nyra-panel/95 border border-nyra-primary/30 rounded-[2.5rem] shadow-3xl backdrop-blur-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-nyra-primary" />
                    <h3 className="text-xl font-bold text-white tracking-tight">AI Micro-Analysis</h3>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Performance Grade</p>
                </div>
                <button 
                  onClick={() => setShowGradingPanel(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Score Circle */}
                <div className="flex items-center justify-between p-6 bg-nyra-primary/10 rounded-3xl border border-nyra-primary/20">
                  <div>
                    <span className="text-4xl font-black text-white">{gradingResult.score}</span>
                    <span className="text-nyra-primary text-sm font-bold">/100</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total Score</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-500">{gradingResult.accuracy}%</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Accuracy</p>
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="space-y-3">
                   <h4 className="text-xs font-black uppercase tracking-widest text-nyra-primary flex items-center gap-2">
                     <BrainCircuit size={14} />
                     Nyra's Review
                   </h4>
                   <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                     "{gradingResult.feedback}"
                   </p>
                </div>

                {/* Mistakes */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <ShieldAlert size={14} />
                    Micro Mistakes identified
                  </h4>
                  <div className="space-y-2">
                    {gradingResult.mistakes.map((mistake, i) => (
                      <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                         <p className="text-xs font-medium text-slate-400">{mistake}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Concept Mastery */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <Target size={14} />
                    Concept Breakdown
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {gradingResult.concepts.map((concept, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-black/20 border-t border-white/5">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-full py-4 bg-nyra-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-nyra-primary/90 transition-all shadow-xl shadow-nyra-primary/20"
                >
                  Discuss with Nyra 
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay for Grading */}
        <AnimatePresence>
          {isGrading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-nyra-dark/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-nyra-primary/20 border-t-nyra-primary animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-nyra-primary animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-display font-bold text-white mb-2 underline decoration-nyra-primary decoration-4 underline-offset-8">AI Grader is Scanning</h3>
                <p className="text-slate-500 font-medium tracking-tight italic">"Looking at those steps... wait, is that a 7 or an 1?"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 rounded-xl transition-all group relative flex items-center justify-center ${
        active 
          ? 'bg-nyra-primary text-white shadow-lg shadow-nyra-primary/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">{label}</span>
    </button>
  );
}
