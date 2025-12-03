import React from 'react';
import { Speaker, AVAILABLE_VOICES, VoiceName, VoiceProfile } from '../types';
import { Users, User, Mic2, Wand2, Play, Volume2 } from 'lucide-react';

interface SpeakerManagerProps {
  speakers: Speaker[];
  customProfiles: VoiceProfile[];
  onUpdateSpeaker: (id: string, updates: Partial<Speaker>) => void;
  onPreviewVoice?: (voice: string, customProfileId?: string) => void;
  isPreviewing?: boolean;
}

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({ 
    speakers, 
    customProfiles, 
    onUpdateSpeaker,
    onPreviewVoice,
    isPreviewing 
}) => {
  if (speakers.length === 0) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center text-slate-400 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Users size={24} className="opacity-50" />
        </div>
        <p className="text-sm">No speakers detected in script yet.</p>
        <p className="text-xs text-slate-500">Type "Name: Hello" to start.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm">
        <Users size={18} className="text-indigo-400" />
        <h3 className="font-semibold text-slate-200">Cast & Voices</h3>
        <span className="ml-auto text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-500">
          {speakers.length} Active
        </span>
      </div>
      
      <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
        {speakers.map((speaker) => (
          <div key={speaker.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <User size={14} />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-slate-200 truncate max-w-[120px]" title={speaker.name}>
                    {speaker.name}
                </span>
                {speaker.customProfileId && (
                    <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                        <Wand2 size={8} /> Custom
                    </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPreviewVoice?.(speaker.voice, speaker.customProfileId)}
                disabled={isPreviewing}
                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-md transition-colors"
                title="Preview Voice"
              >
                {isPreviewing ? <Volume2 size={14} className="animate-pulse" /> : <Play size={14} fill="currentColor" />}
              </button>
              <select
                value={speaker.customProfileId ? `custom:${speaker.customProfileId}` : speaker.voice}
                onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith('custom:')) {
                        const profileId = value.split(':')[1];
                        onUpdateSpeaker(speaker.id, { customProfileId: profileId, voice: 'Puck' }); // Base voice fallback
                    } else {
                        onUpdateSpeaker(speaker.id, { voice: value as VoiceName, customProfileId: undefined });
                    }
                }}
                className="bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer hover:border-slate-500 transition-colors max-w-[120px]"
              >
                <optgroup label="Standard Voices">
                    {AVAILABLE_VOICES.map((voice) => (
                    <option key={voice} value={voice}>
                        {voice}
                    </option>
                    ))}
                </optgroup>
                {customProfiles.length > 0 && (
                    <optgroup label="Custom Voices">
                        {customProfiles.map(p => (
                            <option key={p.id} value={`custom:${p.id}`}>{p.name}</option>
                        ))}
                    </optgroup>
                )}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};