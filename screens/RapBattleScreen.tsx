
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../hooks/useTranslation';

declare const __API_KEY__: string;

// --- Web Audio API Helpers for the Beat ---
const createDrumMachine = (ctx: AudioContext) => {
    const playKick = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.5);
    };

    const playSnare = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);

        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(time);
    };

    const playHiHat = (time: number, open: boolean = false) => {
        const bufferSize = ctx.sampleRate * (open ? 0.3 : 0.05);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + (open ? 0.3 : 0.05));
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(time);
    };

    const playBass = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.4);
    };

    return { playKick, playSnare, playHiHat, playBass };
};

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
}
  
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
}

const RapBattleScreen: React.FC = () => {
  const { ageGroup, showToast } = useAppContext();
  const { t, language } = useTranslation();
  
  const [name, setName] = useState('');
  const [mood, setMood] = useState('');
  const [rapLyrics, setRapLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const vocalSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (vocalSourceRef.current) { try { vocalSourceRef.current.stop(); } catch(e) {} }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
  };

  const generateRap = async () => {
    if (!name.trim() || !mood.trim()) return;
    
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    
    if (!apiKey) {
        showToast("AI is offline. (Missing API Key)");
        return;
    }

    setIsLoading(true);
    setAudioData(null);
    stopPlayback();

    try {
        const ai = new GoogleGenAI({ apiKey });
        let langCode = language === 'mk' ? "Macedonian" : (language === 'tr' ? "Turkish" : "English");
        
        const prompt = `You are Buddy, a cool rhythmic rapper. Write a short 4-line rap for ${name} who is feeling ${mood}. Use simple rhymes. Language: ${langCode}. Output only the lyrics.`;

        const textRes = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { temperature: 1.0 }
        });

        const lyrics = textRes.text?.trim() || "";
        setRapLyrics(lyrics);

        const audioRes = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Check this out! ${lyrics}` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
            },
          });

        const base64Audio = audioRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) setAudioData(base64Audio);

    } catch (error: any) {
        console.error("Rap Battle AI Error:", error);
        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
          showToast(language === 'mk' ? "Бади е малку уморен од рапување! Пробај пак за неколку секунди. 🎤" : "Buddy is a bit tired from all the rapping! Please try again in a few seconds.");
        } else {
          showToast(language === 'mk' ? "Микрофонот не работи! Провери ја конекцијата." : "Mic failed! Check connection.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const playRapWithBeat = async () => {
      if (!audioData) return;
      if (isPlaying) { stopPlayback(); return; }

      setIsPlaying(true);
      isPlayingRef.current = true;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current!;
      const drumMachine = createDrumMachine(ctx);
      const tempo = 90;
      const secondsPerBeat = 60.0 / tempo;

      const vocalBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
      
      let nextNoteTime = ctx.currentTime + 0.1;
      let beat = 0;

      const scheduler = () => {
        if (!isPlayingRef.current) return;
        while (nextNoteTime < ctx.currentTime + 0.1) {
            const b = beat % 16;
            if (b % 2 === 0) drumMachine.playHiHat(nextNoteTime, b === 14);
            if (b === 0 || b === 10) drumMachine.playKick(nextNoteTime);
            if (b === 4 || b === 12) drumMachine.playSnare(nextNoteTime);
            if (b === 0) drumMachine.playBass(nextNoteTime, 65.41);
            nextNoteTime += 0.25 * secondsPerBeat;
            beat++;
        }
        setTimeout(scheduler, 25);
      };

      scheduler();

      const source = ctx.createBufferSource();
      source.buffer = vocalBuffer;
      source.connect(ctx.destination);
      source.start(ctx.currentTime + (secondsPerBeat * 4));
      vocalSourceRef.current = source;
      source.onended = () => setTimeout(stopPlayback, 2000);
  };

  return (
    <ScreenWrapper title={t(`home.age_${ageGroup}.rap_battle_title`)}>
      <div className="flex flex-col items-center justify-start pt-4 text-center space-y-6">
        <div className="bg-white/80 p-6 rounded-2xl shadow-lg w-full max-w-sm">
            {!rapLyrics ? (
                <div className="space-y-4">
                    <div className="text-6xl animate-bounce">🎤</div>
                    <input placeholder={t('rap_battle_screen.name_placeholder')} value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center" />
                    <input placeholder={t('rap_battle_screen.mood_placeholder')} value={mood} onChange={e=>setMood(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center" />
                    <button onClick={generateRap} disabled={isLoading || !name || !mood} className="w-full bg-fuchsia-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                        {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {isLoading ? 'Dropping beats...' : t('rap_battle_screen.generate_button')}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <p className="text-lg italic whitespace-pre-line">{rapLyrics}</p>
                    <button onClick={playRapWithBeat} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${isPlaying ? 'bg-red-500' : 'bg-fuchsia-600'}`}>
                        {isPlaying ? 'Stop' : 'Play Rap Song! 🎵'}
                    </button>
                    <button onClick={() => setRapLyrics('')} className="text-gray-500 underline text-sm">Try Again</button>
                </div>
            )}
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default RapBattleScreen;
