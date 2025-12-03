import { GoogleGenAI, Modality } from "@google/genai";
import { Speaker, GenerationConfig } from "../types";

// Initialize the client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Context Singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, // Gemini TTS output is often 24kHz
    });
  }
  return audioContext;
};

// Base64 decoding helper
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  // Convert raw PCM to AudioBuffer
  // Note: Gemini TTS output is raw PCM. We need to interpret the Int16 Little Endian PCM.
  const int16Data = new Int16Array(data.buffer);
  const float32Data = new Float32Array(int16Data.length);
  
  for (let i = 0; i < int16Data.length; i++) {
    // Convert Int16 to Float32 [-1.0, 1.0]
    float32Data[i] = int16Data[i] / 32768.0;
  }

  const buffer = ctx.createBuffer(1, float32Data.length, 24000);
  buffer.copyToChannel(float32Data, 0);
  return buffer;
}

export const generateSpeech = async (
  script: string,
  speakers: Speaker[],
  config: GenerationConfig
): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  
  // Construct the prompt
  const fullPrompt = `
    Generate a spoken audio performance for the following script.
    Follow these directions: ${config.systemInstruction}
    
    Script:
    ${script}
  `;

  // Build Speaker Config
  const speakerConfigs = speakers.map(s => ({
    speaker: s.name,
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: s.voice }
    }
  }));

  // Use simple voiceConfig for single speaker scenarios (like previews) to reduce complexity/errors
  // Use multiSpeakerVoiceConfig only when necessary for dialogue
  const speechConfig = speakerConfigs.length > 1 
    ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerConfigs
        }
      }
    : {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: speakers[0]?.voice || 'Puck' }
        }
      };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        temperature: config.temperature,
        speechConfig: speechConfig,
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      console.error("Gemini API Response missing audio data:", response);
      throw new Error("No audio data received from Gemini API. The model may have refused the request or generated only text.");
    }

    const rawBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(rawBytes, ctx);
    
    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};