import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Zap, Sparkles, BrainCircuit, Maximize2 } from 'lucide-react';

interface UploaderProps {
  onFiles: (files: FileList) => void;
}

export default function Uploader({ onFiles }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div 
             animate={{ 
               rotate: [0, -1, 1, 0],
               y: [0, -4, 0]
             }}
             transition={{ duration: 5, repeat: Infinity }}
             className="inline-flex items-center gap-2 bg-nyra-primary/10 text-nyra-primary px-3 py-1.5 rounded-lg border border-nyra-primary/30"
          >
            <Zap size={14} fill="currentColor" className="opacity-80" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Sleek Interactive Classroom</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl font-sans font-bold tracking-tighter leading-tight text-white">
            Transform Files with <span className="text-nyra-primary underline decoration-4 underline-offset-8">Nyra</span>.
          </h1>
          
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Revolutionize your study sessions. Nyra "sees" your documents and explains them 
            with her trademark <span className="text-slate-200">wit and sassy logic</span>.
          </p>
        </div>

        <div 
          onClick={() => inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer group p-16 rounded-3xl border border-slate-800 transition-all duration-500
            ${isDragging 
              ? 'border-nyra-primary bg-nyra-primary/5 scale-[1.02] ring-8 ring-nyra-primary/5 shadow-2xl shadow-nyra-primary/10' 
              : 'bg-slate-900 shadow-xl hover:border-slate-700 hover:bg-slate-900/80'}
          `}
        >
          <input 
            type="file" 
            ref={inputRef} 
            className="hidden" 
            multiple 
            onChange={(e) => e.target.files && onFiles(e.target.files)} 
          />
          
          <div className="flex flex-col items-center gap-8">
            <div className={`
              w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl
              ${isDragging ? 'bg-nyra-primary text-white rotate-12 scale-110 shadow-nyra-primary/30' : 'bg-slate-800 text-nyra-primary group-hover:scale-105 group-hover:rotate-3'}
            `}>
              <Upload size={32} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white tracking-tight uppercase tracking-widest">Drop your files, darling</h3>
              <p className="text-slate-500 text-xs font-mono tracking-tighter">SUPPORTED: PDF • JPEG • PNG • WEBP</p>
            </div>

            <div className="flex gap-3">
               {['Visual OCR', 'Layout Analysis', 'Witty Tutor'].map((tag, i) => (
                 <div key={i} className="px-3 py-1 bg-slate-950/50 rounded-md border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400 group-hover:border-slate-700 transition-colors">
                   {tag}
                 </div>
               ))}
            </div>
          </div>

          <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BrainCircuit size={120} strokeWidth={1} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
           {[
             { title: "Native Vision", icon: <BrainCircuit className="text-nyra-primary" />, desc: "Advanced image processing for complex charts and messy handwriting." },
             { title: "Sleek Workspace", icon: <Maximize2 className="text-nyra-primary" />, desc: "Minimalist, focused classroom environment for deep study sessions." },
             { title: "Nyra Persona", icon: <Sparkles className="text-nyra-secondary" />, desc: "Witty, sharp, and engaging educational feedback with light sarcasm." }
           ].map((feat, i) => (
             <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all hover:bg-slate-900/50 group">
               <div className="mb-4 group-hover:scale-110 transition-transform">{feat.icon}</div>
               <h4 className="font-bold text-sm text-slate-200 mb-2 uppercase tracking-widest">{feat.title}</h4>
               <p className="text-slate-500 text-xs leading-relaxed font-medium">{feat.desc}</p>
             </div>
           ))}
        </div>
      </motion.div>
    </div>
  );
}
