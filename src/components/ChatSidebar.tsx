import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Sparkles, ChevronRight, ChevronLeft, MinusCircle, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'nyra';
  text: string;
  timestamp: Date;
  interactive?: {
    type: 'mcq' | 'text-input';
    question?: string;
    options?: string[];
    correctIndex?: number;
    prompt?: string;
    expected?: string;
    submitted?: boolean;
    userChoice?: string;
  };
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  messages: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  onSendMessage: () => void;
  onInteractiveSubmit?: (id: string, response: string) => void;
  loading: boolean;
  selectedFile?: File | null;
  setSelectedFile?: (file: File | null) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  isOpen, 
  onToggle, 
  isExpanded = false,
  onExpandToggle,
  messages,
  input,
  setInput,
  onSendMessage,
  loading,
  selectedFile = null,
  setSelectedFile,
  onInteractiveSubmit
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && setSelectedFile) {
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    if (setSelectedFile) setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Define widths for different states
  const sidebarWidth = isExpanded ? 'w-[50vw]' : 'w-80 md:w-96';

  return (
    <div 
      className={`h-full transition-all duration-500 ease-in-out flex bg-nyra-panel shadow-2xl relative ${
        isOpen ? sidebarWidth : 'w-0'
      }`}
    >
      <style>{`
        .scientific-chat .katex-display {
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 1rem;
          border: 1px solid rgba(51, 204, 255, 0.1);
          overflow-x: auto;
          overflow-y: hidden;
        }
        .scientific-chat .katex {
          font-size: 1.1em;
          color: #fff;
        }
        .scientific-chat .katex-html {
          white-space: nowrap;
        }
        /* Custom scrollbar for math/code blocks */
        .scientific-chat pre::-webkit-scrollbar,
        .scientific-chat .katex-display::-webkit-scrollbar {
          height: 4px;
        }
        .scientific-chat pre::-webkit-scrollbar-thumb,
        .scientific-chat .katex-display::-webkit-scrollbar-thumb {
          background: rgba(51, 204, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-nyra-panel border border-nyra-border border-r-0 p-2 rounded-l-xl hover:bg-slate-800 transition-colors shadow-lg group z-[60]"
        id="sidebar-toggle"
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5 text-nyra-primary group-hover:scale-110 transition-transform" />
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Sparkles className="w-5 h-5 text-nyra-primary animate-pulse" />
            <span className="[writing-mode:vertical-lr] font-display text-xs font-bold tracking-widest text-nyra-primary/70 uppercase">
              Nyra's Notes
            </span>
            <ChevronLeft className="w-5 h-5 text-nyra-primary" />
          </div>
        )}
      </button>

      {/* Sidebar Content */}
      <div className="w-full h-full bg-nyra-panel border-l border-nyra-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-nyra-border bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-nyra-primary/20 flex items-center justify-center border border-nyra-primary/30">
              <Sparkles className="w-4 h-4 text-nyra-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-tight">Nyra's Notes</h3>
              <p className="text-[10px] text-nyra-secondary font-medium tracking-widest uppercase opacity-70">
                Triple-Layer Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isOpen && onExpandToggle && (
              <button 
                onClick={onExpandToggle}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-nyra-primary"
                title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
            <button 
              onClick={onToggle}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-rose-500"
              title="Close Sidebar"
            >
              <MinusCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-50">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm font-medium">
                  Nyra abhi sun rahi hai... <br />
                  Jab woh bolegi, uske sassy notes yahan dikhenge!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'nyra' ? 'items-start' : 'items-end'}`}
                >
                  <div className={`flex items-center gap-2 mb-1 px-1 ${msg.role === 'nyra' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      msg.role === 'nyra' ? 'bg-nyra-primary/20 text-nyra-primary' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {msg.role === 'nyra' ? <Sparkles className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {msg.role === 'nyra' ? 'Nyra' : 'Champ'}
                    </span>
                  </div>
                  
                  <div className={`max-w-[92%] rounded-2xl p-4 text-sm shadow-xl relative overflow-hidden group transition-all hover:scale-[1.01] hover:shadow-2xl ${
                    msg.role === 'nyra' 
                      ? msg.text.length % 4 === 0 
                        ? 'bg-nyra-primary/10 border-l-4 border-l-nyra-primary border-t border-r border-b border-white/5 text-slate-200' 
                        : msg.text.length % 3 === 0
                          ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500 border-t border-r border-b border-white/5 text-slate-200'
                          : msg.text.length % 2 === 0
                            ? 'bg-amber-500/10 border-l-4 border-l-amber-500 border-t border-r border-b border-white/5 text-slate-200'
                            : 'bg-rose-500/10 border-l-4 border-l-rose-500 border-t border-r border-b border-white/5 text-slate-200'
                      : 'bg-slate-800/80 border border-slate-700/50 text-slate-300'
                  }`}>
                    {/* Decorative Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
                       <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-nyra-border scientific-chat relative z-10">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          h1: ({ children }) => <h1 className="text-nyra-primary font-display font-black text-lg mb-3 mt-4 border-b-2 border-dashed border-nyra-primary/30 pb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-nyra-secondary font-display font-bold text-base mb-2 mt-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rotate-45 bg-nyra-secondary" />{children}</h2>,
                          h3: ({ children }) => <h3 className="text-amber-400 font-display font-bold text-sm mb-2 mt-3 tracking-wide uppercase italic border-b border-amber-400/20 w-fit">{children}</h3>,
                          p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-200/90 font-medium">{children}</p>,
                          ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4 list-none">{children}</ul>,
                          li: ({ children }) => (
                            <li className="flex gap-2 text-slate-300 group">
                              <span className="text-nyra-primary mt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">✦</span>
                              <span>{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => <strong className="text-white font-black bg-white/10 px-1.5 py-0.5 rounded shadow-sm border border-white/20 inline-block rotate-[-0.5deg]">{children}</strong>,
                          blockquote: ({ children }) => (
                            <div className="my-4 p-4 border-l-4 border-nyra-secondary bg-nyra-secondary/5 rounded-r-xl italic text-slate-400 font-serif relative">
                               <div className="absolute top-2 right-2 opacity-10">
                                  <Sparkles size={24} />
                               </div>
                               {children}
                            </div>
                          ),
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const content = String(children).replace(/\n/g, ' ');
                            
                            if (!inline && match && match[1] === 'svg') {
                              return (
                                <div 
                                  className="my-4 p-6 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl border-4 border-slate-100 overflow-auto max-w-full"
                                >
                                   <div dangerouslySetInnerHTML={{ __html: content }} className="w-full h-full flex items-center justify-center" />
                                   <div className="mt-3 text-[10px] text-slate-400 font-bold tracking-widest uppercase">Diagram Generated</div>
                                </div>
                              );
                            }
                            
                            if (!inline && content.trim().startsWith('<svg')) {
                              return (
                                <div 
                                  className="my-4 p-6 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl border-4 border-slate-100 overflow-auto max-w-full"
                                >
                                   <div dangerouslySetInnerHTML={{ __html: content }} className="w-full h-full flex items-center justify-center" />
                                   <div className="mt-3 text-[10px] text-slate-400 font-bold tracking-widest uppercase">Vector Visualization</div>
                                </div>
                              );
                            }

                            if (inline) {
                              return (
                                <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-700" {...props}>
                                  {children}
                                </code>
                              );
                            }

                            return (
                              <div className="relative group">
                                <div className="absolute -top-2 right-4 px-2 py-0.5 bg-slate-800 text-[10px] text-slate-500 rounded border border-slate-700 z-10 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                  {match ? match[1] : 'code'}
                                </div>
                                <pre className="bg-slate-900 border border-nyra-border p-4 rounded-xl overflow-x-auto my-4 shadow-inner">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            );
                          }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>

                      {/* Interactive Components */}
                      {msg.interactive && (
                        <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3 relative z-20">
                          {msg.interactive.type === 'mcq' && (
                            <>
                              <p className="font-bold text-nyra-primary text-xs mb-2 italic">Quick Quiz: {msg.interactive.question}</p>
                              <div className="grid grid-cols-1 gap-2">
                                {msg.interactive.options?.map((opt, idx) => (
                                  <button
                                    key={idx}
                                    disabled={msg.interactive?.submitted}
                                    onClick={() => onInteractiveSubmit?.(msg.id, opt)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-xs font-medium transition-all flex items-center justify-between group/opt ${
                                      msg.interactive?.submitted 
                                        ? msg.interactive.userChoice === opt
                                          ? 'bg-nyra-primary/20 border-nyra-primary text-nyra-primary'
                                          : 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-50'
                                        : 'bg-slate-800 border-slate-700 hover:border-nyra-primary hover:bg-nyra-primary/10 text-slate-300'
                                    } border`}
                                  >
                                    <span>{opt}</span>
                                    {!msg.interactive?.submitted && (
                                      <ChevronRight className="w-3 h-3 opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}

                          {msg.interactive.type === 'text-input' && (
                            <div className="space-y-2">
                              <p className="font-bold text-amber-400 text-xs italic">{msg.interactive.prompt}</p>
                              {!msg.interactive.submitted ? (
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Type your answer..."
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-nyra-primary transition-all"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        onInteractiveSubmit?.(msg.id, (e.target as HTMLInputElement).value);
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={(e) => {
                                      const input = (e.currentTarget.previousSibling as HTMLInputElement).value;
                                      if (input) onInteractiveSubmit?.(msg.id, input);
                                    }}
                                    className="p-2 bg-nyra-primary text-slate-900 rounded-lg hover:bg-nyra-primary/80 transition-colors"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-400 text-xs italic">
                                  Response sent: <span className="text-nyra-primary font-bold">{msg.interactive.userChoice}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-[8px] text-slate-600 font-mono text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-nyra-primary/10 border border-nyra-primary/20 p-2 px-3 rounded-xl animate-pulse">
                   <div className="flex gap-1.5 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 bg-nyra-primary rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-nyra-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-nyra-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-nyra-border bg-slate-900/50">
          <AnimatePresence>
            {selectedFile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="mb-3 p-2 bg-slate-950 border border-nyra-border rounded-xl flex items-center gap-3 relative overflow-hidden"
              >
                {filePreview ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-nyra-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-nyra-primary" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split('/')[1]?.toUpperCase()}
                  </p>
                </div>

                <button 
                  onClick={clearFile}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Progress bar effect for aesthetic */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-nyra-primary/30 w-full animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-xl border transition-all ${
                selectedFile 
                  ? 'border-nyra-primary bg-nyra-primary/10 text-nyra-primary shadow-[0_0_15px_rgba(51,204,255,0.2)]' 
                  : 'border-nyra-border bg-slate-950 text-slate-500 hover:border-nyra-primary/50'
              }`}
              title="Upload photo or PDF of your work"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                placeholder={selectedFile ? "Tell Nyra about this file..." : "Ask anything..."}
                className="w-full bg-slate-950 border border-nyra-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-nyra-primary transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={onSendMessage}
                disabled={loading || (!input.trim() && !selectedFile)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-nyra-primary hover:bg-nyra-primary/20 rounded-lg transition-all disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-center text-slate-500 italic">
            "Don't worry, I won't bite... unless it's a snack! 🍪"
          </div>
        </div>

        {/* Passive Status */}
        <div className="p-3 bg-slate-900/80 border-t border-nyra-border flex items-center justify-center">
          <div className="flex items-center gap-2 py-1 px-3 bg-nyra-secondary/5 rounded-full border border-nyra-secondary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-nyra-secondary animate-pulse" />
            <span className="text-[9px] font-bold text-nyra-secondary uppercase tracking-[0.2em]">
              Real-time Sync Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
