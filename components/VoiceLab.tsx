import React, { useState } from 'react';
import { VoiceProfile, AVAILABLE_VOICES, VoiceName } from '../types';
import { Mic, Save, Trash2, Wand2, Play, Volume2, Copy, Download, Upload } from 'lucide-react';

interface VoiceLabProps {
  profiles: VoiceProfile[];
  onAddProfile: (profile: VoiceProfile) => void;
  onDeleteProfile: (id: string) => void;
  onPreviewVoice: (voice: string, customProfileId?: string, overrideDescription?: string) => void;
  isPreviewing: boolean;
}

export const VoiceLab: React.FC<VoiceLabProps> = ({ 
    profiles, 
    onAddProfile, 
    onDeleteProfile,
    onPreviewVoice,
    isPreviewing
}) => {
  const [name, setName] = useState('');
  const [baseVoice, setBaseVoice] = useState<VoiceName>('Puck');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Neutral'>('Neutral');
  const [importCode, setImportCode] = useState('');

  const handleCreate = () => {
    if (!name || !description) return;

    const newProfile: VoiceProfile = {
      id: `custom-${Date.now()}`,
      name,
      baseVoice,
      description,
      gender
    };

    onAddProfile(newProfile);
    setName('');
    setDescription('');
  };

  const handleTestVoice = () => {
    if (!description) return;
    onPreviewVoice(baseVoice, undefined, description);
  };

  const handleCopyCode = (profile: VoiceProfile) => {
    const code = btoa(JSON.stringify(profile));
    navigator.clipboard.writeText(code);
    alert('Voice ID Code copied to clipboard! Save this code to restore the voice later.');
  };

  const handleImport = () => {
      try {
          const json = atob(importCode);
          const profile = JSON.parse(json);
          if (profile.name && profile.description && profile.baseVoice) {
              // Ensure ID is unique upon import
              profile.id = `imported-${Date.now()}`;
              onAddProfile(profile);
              setImportCode('');
          } else {
              alert('Invalid voice code format');
          }
      } catch (e) {
          alert('Invalid voice code');
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
      {/* Creator Panel */}
      <div className="md:col-span-5 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-5 overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
          <Wand2 className="text-purple-400" size={24} />
          <div>
            <h2 className="text-lg font-bold text-white">Voice Lab</h2>
            <p className="text-xs text-slate-400">Design custom voice styles</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Voice Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Old Pirate, Nervous Robot"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Base Voice</label>
                <select 
                  value={baseVoice}
                  onChange={(e) => setBaseVoice(e.target.value as VoiceName)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gender Bias</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Neutral">Neutral</option>
                </select>
             </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Style Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the voice texture, speed, accent, and mood. E.g. 'A raspy, deep voice that speaks slowly with a southern drawl.'"
              className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
                onClick={handleTestVoice}
                disabled={!description || isPreviewing}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 border border-slate-600"
            >
                {isPreviewing ? <Volume2 size={16} className="animate-pulse" /> : <Play size={16} />}
                Test Voice
            </button>
            <button
                onClick={handleCreate}
                disabled={!name || !description}
                className="flex-[2] py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
                <Save size={16} />
                Save Voice
            </button>
          </div>
        </div>
      </div>

      {/* Library Panel */}
      <div className="md:col-span-7 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 overflow-hidden flex flex-col gap-4">
        
        {/* Import Section */}
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex gap-2">
            <input 
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste Voice ID Code here to restore..."
                className="flex-grow bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button 
                onClick={handleImport}
                disabled={!importCode}
                className="text-xs bg-slate-700 hover:bg-indigo-600 text-white px-3 py-1 rounded transition-colors flex items-center gap-1"
            >
                <Upload size={12} /> Import
            </button>
        </div>

        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Mic size={16} />
          Your Custom Voices
        </h3>

        <div className="overflow-y-auto pr-2 space-y-3 flex-grow">
          {profiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg p-8">
              <Wand2 size={32} className="mb-2 opacity-50" />
              <p>No custom voices yet.</p>
              <p className="text-xs">Create one to assign it to characters in your script.</p>
            </div>
          ) : (
            profiles.map(profile => (
              <div key={profile.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-start group hover:border-purple-500/50 transition-colors">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white">{profile.name}</h4>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                      {profile.baseVoice}
                    </span>
                    <button 
                        onClick={() => handleCopyCode(profile)}
                        className="text-slate-500 hover:text-indigo-400 ml-2"
                        title="Copy Voice ID Code"
                    >
                        <Copy size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{profile.description}</p>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPreviewVoice(profile.baseVoice, profile.id)}
                        disabled={isPreviewing}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Preview"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                    <button 
                        onClick={() => onDeleteProfile(profile.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};