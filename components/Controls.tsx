import React from 'react';
import { GenerationConfig } from '../types';
import { Sliders, Activity, Info } from 'lucide-react';

interface ControlsProps {
  config: GenerationConfig;
  onConfigChange: (updates: Partial<GenerationConfig>) => void;
}

export const Controls: React.FC<ControlsProps> = ({ config, onConfigChange }) => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <Sliders size={18} className="text-indigo-400" />
        <h3 className="font-semibold text-slate-200">Director Controls</h3>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Temperature / Expressiveness */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Activity size={14} /> Expressiveness
                </label>
                <span className="text-xs text-indigo-400 font-mono bg-indigo-900/30 px-1.5 py-0.5 rounded">
                    {Math.round(config.temperature * 100)}%
                </span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                value={config.temperature}
                onChange={(e) => onConfigChange({ temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
             <p className="text-xs text-slate-500 mt-1">
                Higher values create more varied, emotional, and unpredictable performances.
            </p>
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Info size={14} /> Direction Notes
            </label>
            <textarea 
                value={config.systemInstruction}
                onChange={(e) => onConfigChange({ systemInstruction: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                placeholder="E.g., Speak quickly and enthusiastically. Use a dramatic tone for Speaker 1."
            />
        </div>
      </div>
    </div>
  );
};
