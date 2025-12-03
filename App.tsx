import React, { useState, useEffect } from 'react';
import { ScriptEditor } from './components/ScriptEditor';
import { SpeakerManager } from './components/SpeakerManager';
import { Controls } from './components/Controls';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceLab } from './components/VoiceLab';
import { LiveSession } from './components/LiveSession';
import { Speaker, GenerationConfig, AVAILABLE_VOICES, AppView, VoiceProfile } from './types';
import { generateSpeech } from './services/geminiService';
import { Sparkles, Command, FileText, Mic, Wand2 } from 'lucide-react';

// Default Script
const DEFAULT_SCRIPT = `Narrator: In a world made entirely of crystal, a young explorer finds a hidden door.
Explorer: *gasps* Is this... real?
Guardian: (whispering) Only if you believe it is.
Explorer: Who said that? Show yourself!
Guardian: [long pause] I am everywhere.`;

const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 1,
  speed: 1,
  systemInstruction: "Create a cinematic and immersive audio experience. Distinguish clearly between characters.",
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('script');
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [customProfiles, setCustomProfiles] = useState<VoiceProfile[]>([]);
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to detect speakers
  const detectSpeakers = (text: string) => {
      const detected = new Set<string>();
      // Regex for "Name:" pattern, slightly improved to avoid capturing times or generic words if possible,
      // but keeping it flexible for names.
      const regex = /^([a-zA-Z0-9_\- ]{2,20}):/gm;
      let match;
      while ((match = regex.exec(text)) !== null) {
          const name = match[1].trim();
          if (name.toLowerCase() !== 'http' && name.toLowerCase() !== 'https') {
              detected.add(name);
          }
      }
      return detected;
  };

  // Parse speakers from script
  useEffect(() => {
    const detectedNames = detectSpeakers(script);

    setSpeakers(prev => {
      const newSpeakers: Speaker[] = [];
      const prevMap = new Map<string, Speaker>(prev.map(s => [s.name, s] as [string, Speaker]));
      
      let voiceIndex = 0;

      Array.from(detectedNames).forEach(name => {
        if (prevMap.has(name)) {
          newSpeakers.push(prevMap.get(name)!);
        } else {
          // Assign a new voice round-robin style
          newSpeakers.push({
            id: `s-${Date.now()}-${Math.random()}`,
            name: name,
            voice: AVAILABLE_VOICES[voiceIndex % AVAILABLE_VOICES.length]
          });
          voiceIndex++;
        }
      });
      return newSpeakers;
    });
  }, [script]);

  const handleUpdateSpeaker = (id: string, updates: Partial<Speaker>) => {
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleUpdateConfig = (updates: Partial<GenerationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setAudioBuffer(null);

    // Inject custom voice instructions into the system prompt
    let enhancedConfig = { ...config };
    const customSpeakerInstructions = speakers
        .filter(s => s.customProfileId)
        .map(s => {
            const profile = customProfiles.find(p => p.id === s.customProfileId);
            return profile ? `Character "${s.name}" should sound like: ${profile.description}. Gender: ${profile.gender}.` : '';
        })
        .join('\n');

    if (customSpeakerInstructions) {
        enhancedConfig.systemInstruction = `${config.systemInstruction}\n\nVOICE DIRECTIVES:\n${customSpeakerInstructions}`;
    }

    try {
      const buffer = await generateSpeech(script, speakers, enhancedConfig);
      setAudioBuffer(buffer);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate speech. Please check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-32 font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-indigo-500/20 shadow-lg">
              <Command size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                VoxScript AI
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Gemini 2.5 Engine</p>
            </div>
          </div>
          
          {/* Nav Tabs */}
          <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
             <button 
                onClick={() => setView('script')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'script' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <FileText size={14} /> Script
             </button>
             <button 
                onClick={() => setView('voicelab')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'voicelab' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Wand2 size={14} /> Voice Lab
             </button>
             <button 
                onClick={() => setView('live')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'live' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Mic size={14} /> Live
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                <Sparkles className="text-red-400" size={20} />
                <p>{error}</p>
            </div>
        )}

        {view === 'script' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] min-h-[600px]">
                <div className="lg:col-span-8 h-full">
                    <ScriptEditor 
                    value={script} 
                    onChange={setScript} 
                    onInsertExpression={(expr) => setScript(prev => prev + expr)}
                    detectedSpeakers={speakers.map(s => s.name)}
                    />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-1">
                    <SpeakerManager 
                        speakers={speakers} 
                        customProfiles={customProfiles}
                        onUpdateSpeaker={handleUpdateSpeaker} 
                    />
                    <Controls 
                        config={config} 
                        onConfigChange={handleUpdateConfig} 
                    />
                </div>
            </div>
        )}

        {view === 'voicelab' && (
            <div className="h-[calc(100vh-12rem)]">
                <VoiceLab 
                    profiles={customProfiles}
                    onAddProfile={(p) => setCustomProfiles([...customProfiles, p])}
                    onDeleteProfile={(id) => setCustomProfiles(prev => prev.filter(p => p.id !== id))}
                />
            </div>
        )}

        {view === 'live' && (
            <div className="h-[calc(100vh-12rem)]">
                <LiveSession apiKey={process.env.API_KEY || ''} />
            </div>
        )}

      </main>

      {/* Footer Player - Only visible in Script View */}
      {view === 'script' && (
        <AudioPlayer 
            audioBuffer={audioBuffer} 
            isGenerating={isGenerating} 
            onGenerate={handleGenerate}
            canGenerate={script.length > 5}
        />
      )}
    </div>
  );
};

export default App;