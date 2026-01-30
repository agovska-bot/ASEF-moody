
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../hooks/useTranslation';
import TTSButton from '../components/TTSButton';
import BuddyIcon from '../components/BuddyIcon';

declare const __API_KEY__: string;

const SoundWave: React.FC<{ active: boolean }> = ({ active }) => (
    <div className={`flex items-end justify-center gap-1.5 h-16 mb-6 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-30'}`}>
        {[...Array(15)].map((_, i) => (
            <div 
                key={i} 
                className={`w-2 bg-gradient-to-t from-fuchsia-600 to-pink-400 rounded-full ${active ? 'animate-soundwave' : ''}`} 
                style={{ 
                    height: active ? `${20 + Math.random() * 80}%` : '15%',
                    animationDelay: `${i * 0.07}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
            />
        ))}
    </div>
);

const RapBattleScreen: React.FC = () => {
  const { ageGroup, showToast, language, age } = useAppContext();
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [mood, setMood] = useState('');
  const [rapLyrics, setRapLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);

  const generateRhyme = async () => {
    if (!name.trim() || !mood.trim()) return;
    
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    
    if (!apiKey) {
        showToast("AI Studio is offline. (Missing API Key)");
        return;
    }

    setIsLoading(true);
    setRapLyrics('');

    try {
        const ai = new GoogleGenAI({ apiKey });
        let langCode = language === 'mk' ? "Macedonian" : (language === 'tr' ? "Turkish" : "English");
        
        const prompt = `You are Buddy, a cool rhythmic rapper. Write a very short, fun, 4-line rhyme for a kid named ${name} who is feeling ${mood}. Use slang appropriate for a ${age} year old. Make it super energetic! Language: ${langCode}. Output ONLY the 4 lines of lyrics, no other text.`;

        const textRes = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                temperature: 1.0,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const lyrics = textRes.text?.trim() || "";
        setRapLyrics(lyrics);
    } catch (error: any) {
        console.error("Rhyme AI Error:", error);
        showToast(language === 'mk' ? "Бади е малку зафатен! Пробај пак. 🎤" : "Buddy is a bit busy! Try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const currentAgeKey = ageGroup || '7-9';
  const resultTitle = language === 'mk' ? `РАП ПОСТЕР: ${name.toUpperCase()}` : (language === 'tr' ? `${name.toUpperCase()} RAP POSTERI` : `${name.toUpperCase()}'S RAP POSTER`);

  return (
    <ScreenWrapper title={t(`home.age_${currentAgeKey}.rap_battle_title`)}>
      <style>{`
        @keyframes soundwave {
            0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
            50% { transform: scaleY(1.2); opacity: 1; }
        }
        .animate-soundwave { animation: soundwave 0.6s ease-in-out infinite; }
        
        @keyframes neon-pulse {
            0%, 100% { filter: drop-shadow(0 0 5px #f0abfc) drop-shadow(0 0 10px #e879f9); }
            50% { filter: drop-shadow(0 0 15px #f0abfc) drop-shadow(0 0 30px #d946ef); }
        }
        .neon-text { animation: neon-pulse 2s infinite; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite alternate ease-in-out; }
      `}</style>

      <div className="relative flex flex-col items-center justify-start pt-4 text-center space-y-6 flex-grow overflow-hidden rounded-3xl bg-slate-950 p-6 shadow-2xl border border-white/10">
        
        {/* NEON BLOBS - The "floating balls" you remembered! */}
        <div className="absolute top-[-10%] left-[-20%] w-64 h-64 bg-fuchsia-600/20 rounded-full filter blur-[60px] animate-blob pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-64 h-64 bg-indigo-600/20 rounded-full filter blur-[60px] animate-blob animation-delay-4000 pointer-events-none"></div>

        {!rapLyrics && !isLoading ? (
            <div className="relative z-10 w-full max-w-sm animate-fadeIn space-y-8 py-4">
                <div className="relative flex justify-center">
                    <BuddyIcon className="w-40 h-40 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
                    <div className="absolute -top-4 -right-2 bg-fuchsia-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg rotate-12">LIVE!</div>
                </div>

                <div className="space-y-4">
                    <input
                        className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 outline-none text-white text-lg placeholder:text-gray-600 transition-all font-bold"
                        placeholder={t('rap_battle_screen.name_placeholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 outline-none text-white text-lg placeholder:text-gray-600 transition-all font-bold"
                        placeholder={t('rap_battle_screen.mood_placeholder')}
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                    />
                    <button
                        onClick={generateRhyme}
                        disabled={!name.trim() || !mood.trim()}
                        className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-fuchsia-900/20 active:scale-95 disabled:opacity-30 transition-all text-xl tracking-wider uppercase"
                    >
                        {t('rap_battle_screen.generate_button')}
                    </button>
                </div>
            </div>
        ) : isLoading ? (
            <div className="flex flex-col items-center justify-center flex-grow space-y-8 z-10">
                <div className="relative">
                    <BuddyIcon className="w-32 h-32 animate-pulse" />
                    <div className="absolute inset-0 bg-fuchsia-500/20 blur-xl rounded-full animate-ping"></div>
                </div>
                <div className="space-y-2">
                    <SoundWave active={true} />
                    <p className="text-fuchsia-400 font-black text-xl animate-pulse tracking-widest uppercase italic">
                        {t('rap_battle_screen.loading')}
                    </p>
                </div>
            </div>
        ) : (
            <div className="relative z-10 w-full animate-fadeIn flex flex-col items-center space-y-6">
                <div className="w-full p-8 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <span className="text-6xl">🎵</span>
                    </div>
                    
                    <h3 className="text-fuchsia-400 font-black text-xs tracking-[0.3em] uppercase mb-6 neon-text">
                        {resultTitle}
                    </h3>
                    
                    <div className="min-h-[160px] flex flex-col justify-center items-center">
                        <SoundWave active={isPerforming} />
                        <pre className="text-white text-2xl font-black leading-relaxed whitespace-pre-wrap font-sans italic tracking-tight">
                            {rapLyrics}
                        </pre>
                    </div>

                    <div className="mt-8 flex justify-center">
                         <TTSButton 
                            textToSpeak={rapLyrics} 
                            className="bg-fuchsia-600 text-white w-16 h-16 shadow-[0_0_20px_rgba(192,38,211,0.5)] scale-125" 
                         />
                    </div>
                </div>

                <button
                    onClick={() => { setRapLyrics(''); setName(''); setMood(''); }}
                    className="text-fuchsia-400 font-black text-sm uppercase tracking-widest border-b-2 border-fuchsia-500/30 pb-1 hover:text-white transition-colors"
                >
                    {t('rap_battle_screen.another_button')}
                </button>
            </div>
        )}
      </div>
    </ScreenWrapper>
  );
};

export default RapBattleScreen;
