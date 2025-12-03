import React, { useState } from 'react';
import { VoiceProfile, AVAILABLE_VOICES, VoiceName } from '../types';
import { Mic, Save, Trash2, Wand2, Play } from 'lucide-react';

interface VoiceLabProps {
  profiles: VoiceProfile[];
  onAddProfile: (profile: VoiceProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export const VoiceLab: React.FC<VoiceLabProps> = ({ profiles, onAddProfile, onDeleteProfile }) => {
  const [name, setName] = useState('');
  const [baseVoice, setBaseVoice] = useState<VoiceName>('Puck');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Neutral'>('Neutral');

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
    // Reset form
    setName('');
    setDescription('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
      {/* Creator Panel */}
      <div className="md:col-span-5 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-5">
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
            <p className="text-[10px] text-slate-500 mt-1">The AI will use this description to modify the base voice during generation.</p>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name || !description}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save Voice Profile
          </button>
        </div>
      </div>

      {/* Library Panel */}
      <div className="md:col-span-7 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
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
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white">{profile.name}</h4>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                      Based on {profile.baseVoice}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{profile.description}</p>
                </div>
                <button 
                  onClick={() => onDeleteProfile(profile.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};