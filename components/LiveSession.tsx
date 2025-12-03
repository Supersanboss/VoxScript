import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Video, VideoOff, Power, Activity } from 'lucide-react';
import { VoiceName, AVAILABLE_VOICES } from '../types';

interface LiveSessionProps {
  apiKey: string;
}

// Audio helpers
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ apiKey }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [role, setRole] = useState("Helpful Assistant");
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const wsRef = useRef<any>(null); // To hold the live session
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  // Visualizer data
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  const startSession = async () => {
    if (!apiKey) return;
    
    setStatus('connecting');
    try {
      // 1. Setup Audio Input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }); // Input needs to be resampled usually, but we'll send raw and let API handle or use specific rate
      // Actually, Live API input typically expects 16kHz PCM.
      // We will handle resampling in the processor if needed, but context at 16k is easiest.
      audioContextRef.current = audioCtx;

      // Output Context (24kHz for better quality response)
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Setup Gemini Live
      const ai = new GoogleGenAI({ apiKey });
      
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: `You are acting as: ${role}. Keep responses concise and conversational.`,
        },
      });

      // 3. Setup Input Processing
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      // Analyser for visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Downsample or convert to PCM. 
        // We created context at 16kHz, so data is already 16kHz float32.
        // Convert to Int16 PCM
        const pcmData = floatTo16BitPCM(inputData);
        
        // Send to Gemini
        const base64Data = btoa(
            String.fromCharCode(...new Uint8Array(pcmData))
        );
        
        session.sendRealtimeInput({
            media: {
                mimeType: "audio/pcm",
                data: base64Data
            }
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      sourceRef.current = source;
      processorRef.current = processor;

      // 4. Handle Output
      // We need to override the onmessage of the session's internal implementation or use the stream if exposed.
      // The provided SDK pattern uses callbacks in `connect`.
      // Let's re-implement connection to use the callback pattern provided in system instructions.
      // IMPORTANT: The previous `connect` call above returns a session object, but to handle incoming messages properly with the SDK's pattern:

      // Re-doing connection with callbacks:
      const connectedSession = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: `You are acting as: ${role}. Keep responses concise and conversational.`,
        },
        callbacks: {
            onopen: () => {
                setStatus('connected');
                setIsActive(true);
            },
            onmessage: async (msg: LiveServerMessage) => {
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    const audioData = base64ToUint8Array(base64Audio);
                    // Decode 24kHz PCM from Gemini
                    // It is raw PCM Little Endian Int16 usually
                    const int16 = new Int16Array(audioData.buffer);
                    const float32 = new Float32Array(int16.length);
                    for(let i=0; i<int16.length; i++) {
                        float32[i] = int16[i] / 32768.0;
                    }
                    
                    const buffer = outputCtx.createBuffer(1, float32.length, 24000);
                    buffer.copyToChannel(float32, 0);

                    const src = outputCtx.createBufferSource();
                    src.buffer = buffer;
                    src.connect(outputCtx.destination);
                    
                    // Gapless playback logic
                    const currentTime = outputCtx.currentTime;
                    if (nextStartTimeRef.current < currentTime) {
                        nextStartTimeRef.current = currentTime;
                    }
                    src.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                }
            },
            onclose: () => {
                setStatus('disconnected');
                setIsActive(false);
            },
            onerror: (err) => {
                console.error(err);
                setStatus('error');
            }
        }
      });
      
      wsRef.current = connectedSession;
      drawVisualizer();

    } catch (e) {
      console.error("Failed to start live session", e);
      setStatus('error');
      stopSession();
    }
  };

  const stopSession = () => {
    if (wsRef.current) {
        // Unfortunately SDK doesn't expose clean close on session object easily in docs, 
        // but typically we stop sending audio and let it timeout or refresh.
        // If there is a close method:
        // wsRef.current.close(); 
        // For now we destroy refs.
        wsRef.current = null;
    }
    
    if (processorRef.current && audioContextRef.current) {
        processorRef.current.disconnect();
        sourceRef.current?.disconnect();
    }
    
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }

    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    
    if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
    }

    setIsActive(false);
    setStatus('disconnected');
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#0f172a'; // match bg
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        const r = barHeight + 25 * (i/bufferLength);
        const g = 250 * (i/bufferLength);
        const b = 50;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  useEffect(() => {
    return () => {
        stopSession();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 rounded-2xl border border-slate-800 p-8 relative overflow-hidden">
        
        {/* Connection Status Pulse */}
        <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full border ${
            status === 'connected' ? 'bg-green-900/30 border-green-500/50 text-green-400' :
            status === 'connecting' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400' :
            status === 'error' ? 'bg-red-900/30 border-red-500/50 text-red-400' :
            'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
            <div className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-green-500 animate-pulse' :
                status === 'connecting' ? 'bg-yellow-500 animate-bounce' :
                'bg-slate-500'
            }`}></div>
            <span className="text-xs font-mono uppercase">{status}</span>
        </div>

        {/* Visualizer Canvas */}
        <div className="w-full h-48 mb-8 relative flex items-center justify-center">
            {isActive ? (
                 <canvas ref={canvasRef} width={600} height={200} className="w-full h-full object-cover rounded-xl opacity-80" />
            ) : (
                <div className="text-slate-700">
                    <Activity size={80} strokeWidth={1} />
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="w-full max-w-md space-y-6 z-10">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">AI Voice</label>
                    <select 
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                        disabled={isActive}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                    >
                        {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Character Role</label>
                     <input 
                        type="text" 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isActive}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                        placeholder="e.g. Sarcastic Robot"
                     />
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={isActive ? stopSession : startSession}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 active:scale-95
                        ${isActive 
                            ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-900/50' 
                            : 'bg-indigo-500 hover:bg-indigo-600 ring-4 ring-indigo-900/50'
                        }
                    `}
                >
                    {isActive ? <Power size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                </button>
            </div>
            
            <p className="text-center text-xs text-slate-500">
                {isActive ? "Listening... Speak now." : "Tap microphone to start conversation"}
            </p>
        </div>
    </div>
  );
};