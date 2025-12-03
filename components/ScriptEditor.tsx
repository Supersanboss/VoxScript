import React, { useRef, useState } from 'react';
import { Sparkles, MessageSquare, AlertCircle, Lightbulb, X, Plus } from 'lucide-react';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertExpression: (expr: string) => void;
  detectedSpeakers: string[];
}

const EXPRESSIONS = [
  // Emotions
  { label: 'Gasp', value: '*gasps*' },
  { label: 'Laugh', value: '*laughs*' },
  { label: 'Sigh', value: '*sighs*' },
  { label: 'Cry', value: '*crying*' },
  { label: 'Clear Throat', value: '*clears throat*' },
  // Tones
  { label: 'Whisper', value: '(whispering) ' },
  { label: 'Shout', value: '(shouting) ' },
  { label: 'Sarcastic', value: '(sarcastic tone) ' },
  { label: 'Excited', value: '(excitedly) ' },
  { label: 'Angry', value: '(angrily) ' },
  { label: 'Nervous', value: '(nervously) ' },
  // Pacing
  { label: 'Pause (Short)', value: '[pause]' },
  { label: 'Pause (Long)', value: '[long pause]' },
  { label: 'Fast', value: '(speaking quickly) ' },
  { label: 'Slow', value: '(speaking slowly) ' },
];

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ 
  value, 
  onChange, 
  onInsertExpression,
  detectedSpeakers
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTip, setShowTip] = useState(true);

  const handleInsert = (expr: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = value.substring(0, start) + expr + value.substring(end);
      onChange(newValue);
      
      // Restore focus and cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + expr.length, start + expr.length);
        }
      }, 0);
    } else {
      onInsertExpression(expr);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* Toolbar */}
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <MessageSquare size={16} />
          <span>Script Editor</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
            {EXPRESSIONS.map((exp) => (
              <button
                key={exp.label}
                onClick={() => handleInsert(exp.value)}
                className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold rounded bg-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1 border border-slate-600 hover:border-indigo-500"
                title={`Insert ${exp.label}`}
              >
                {exp.label}
              </button>
            ))}
            <button
                onClick={() => handleInsert('(insert emotion here) ')}
                className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold rounded bg-slate-800 text-indigo-400 border border-dashed border-indigo-500/50 hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                title="Create your own"
              >
                <Plus size={10} /> Custom
              </button>
        </div>

        {/* Pro Tip Banner */}
        {showTip && (
            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3 flex items-start gap-3 relative animate-in fade-in slide-in-from-top-1">
                <div className="mt-0.5 p-1 bg-indigo-500/20 rounded-full text-indigo-400">
                    <Lightbulb size={14} fill="currentColor" className="opacity-80" />
                </div>
                <div className="pr-6">
                    <h4 className="text-xs font-bold text-indigo-300 mb-1">Pro Tip: Create your own expressions</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        You aren't limited to the buttons above! The AI understands natural language. 
                        Try typing directions like <span className="text-indigo-200 font-mono bg-indigo-900/50 px-1 rounded">*adjusts glasses*</span>, 
                        <span className="text-indigo-200 font-mono bg-indigo-900/50 px-1 rounded">(whispering ominously)</span>, or 
                        <span className="text-indigo-200 font-mono bg-indigo-900/50 px-1 rounded">[struggling to speak]</span> directly into the script.
                    </p>
                </div>
                <button 
                    onClick={() => setShowTip(false)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        )}
      </div>

      {/* Editor Area */}
      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your script here...&#10;&#10;Speaker 1: Hello! How are you?&#10;Speaker 2: *gasps* I didn't see you there!&#10;Speaker 1: (whispering) I've been here the whole time."
          className="w-full h-full bg-slate-950 p-6 text-slate-200 font-mono text-base resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
          spellCheck={false}
        />
        
        {/* Helper Overlay / Footer */}
        <div className="absolute bottom-4 right-6 pointer-events-none opacity-80">
           {detectedSpeakers.length > 0 ? (
             <div className="flex flex-col items-end gap-1">
               <span className="text-xs text-indigo-300 bg-indigo-950/90 px-3 py-1.5 rounded-full border border-indigo-500/50 shadow-lg backdrop-blur-sm">
                 <Sparkles size={10} className="inline mr-1" />
                 {detectedSpeakers.length} Speakers Detected
               </span>
             </div>
           ) : (
             <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded">
               <AlertCircle size={12} /> Format: "Name: Text"
             </span>
           )}
        </div>
      </div>
    </div>
  );
};