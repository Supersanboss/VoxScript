import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Volume2, RefreshCw } from 'lucide-react';
import { audioBufferToWav } from '../services/audioUtils';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioBuffer, 
  isGenerating, 
  onGenerate,
  canGenerate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Initialize Audio Context lazily
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const playAudio = async () => {
    if (!audioBuffer) return;
    
    // Resume context if suspended (browser policy)
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Stop currently playing
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    source.start(0);
    startTimeRef.current = audioContextRef.current.currentTime;
    sourceRef.current = source;
    setIsPlaying(true);

    // Progress Loop
    const updateProgress = () => {
      if (audioContextRef.current && isPlaying) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const duration = audioBuffer.duration;
        const p = Math.min((elapsed / duration) * 100, 100);
        setProgress(p);
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };
    rafRef.current = requestAnimationFrame(updateProgress);
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  const handleDownload = () => {
    if (!audioBuffer) return;
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voxscript-${new Date().getTime()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-indigo-500/30 p-4 md:p-6 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        
        {/* Main Action Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          className={`
            relative px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95
            flex items-center gap-3 min-w-[180px] justify-center overflow-hidden group
            ${isGenerating || !canGenerate 
              ? 'bg-slate-700 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 ring-1 ring-white/20'
            }
          `}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Volume2 size={24} className={canGenerate ? "animate-pulse" : ""} />
              <span>Generate Audio</span>
            </>
          )}
        </button>

        {/* Playback Controls */}
        <div className="flex-grow flex items-center gap-4 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <button
                onClick={handleTogglePlay}
                disabled={!audioBuffer}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    !audioBuffer ? 'bg-slate-700 text-slate-500' : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>

            {/* Visualizer / Progress Bar */}
            <div className="flex-grow h-12 bg-slate-900 rounded-md relative overflow-hidden flex items-center px-4">
                {!audioBuffer ? (
                    <div className="w-full text-center text-xs text-slate-600 font-mono tracking-widest uppercase">
                        Waiting for generation...
                    </div>
                ) : (
                    <>
                        {/* Waveform fake effect */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 gap-1">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-1 bg-indigo-500 rounded-full transition-all duration-75"
                                    style={{ 
                                        height: isPlaying ? `${Math.random() * 80 + 10}%` : '10%'
                                    }}
                                />
                            ))}
                        </div>
                        {/* Progress Overlay */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 border-r border-indigo-400 transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </>
                )}
            </div>

            <button
                onClick={handleDownload}
                disabled={!audioBuffer}
                className={`p-3 rounded-lg border transition-colors ${
                    !audioBuffer 
                    ? 'border-slate-700 text-slate-600' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="Download WAV"
            >
                <Download size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
