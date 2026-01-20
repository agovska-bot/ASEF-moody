
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTranslation } from '../hooks/useTranslation';

declare const __API_KEY__: string;

const RapBattleScreen: React.FC = () => {
  const { ageGroup, showToast } = useAppContext();
  const { t, language } = useTranslation();
  
  const [name, setName] = useState('');
  const [mood, setMood] = useState('');
  const [rapLyrics, setRapLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateRhyme = async () => {
    if (!name.trim() || !mood.trim()) return;
    
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    
    if (!apiKey) {
        showToast("AI is offline. (Missing API Key)");
        return;
    }

    setIsLoading(true);
    setRapLyrics('');

    try {
        const ai = new GoogleGenAI({ apiKey });
        let langCode = language === 'mk' ? "Macedonian" : (language === 'tr' ? "Turkish" : "English");
        
        // Optimized prompt for speed and fun rhymes
        const prompt = `You are Buddy, a cool rhythmic rapper. Write a very short, fun, 4-line rhyme for a kid named ${name} who is feeling ${mood}. Make it super energetic! Language: ${langCode}. Output ONLY the 4 lines of lyrics, no other text.`;

        const textRes = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                temperature: 1.0,
                thinkingConfig: { thinkingBudget: 0 } // Fast response
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
  const cardTitle = language === 'mk' ? `РИМИТЕ НА ${name || 'БАДИ'}` : (language === 'tr' ? `${name || 'BUDDY'}'NİN KAFİYELERİ` : `${name || 'BUDDY'}'S RHYME`);

  return (
    <ScreenWrapper title={t(`home.age_${currentAgeKey}.rap_battle_title`)}>
      <div className="flex flex-col items-center justify-start pt-4 text-center space-y-6 flex-grow">
        
        {!rapLyrics && !isLoading ? (
            <div className="bg-white/80 p-8 rounded-[2.5rem] shadow-xl w-full max-w-sm border-4 border-fuchsia-100 animate-fadeIn">
                <div className="text-7xl mb-6 animate-bounce drop-shadow-lg">🎤</div>
                <h2 className="text-xl font-black text-fuchsia-800 mb-6 uppercase tracking-wider">
                    {language === 'mk' ? 'АИ Рап Студио' : 'AI Rap Studio'}
                </h2>
                
                <div className="space-y-4">
                    <div className="relative">
                        <input 
                            placeholder={t('rap_battle_screen.name_placeholder')} 
                            value={name} 
                            onChange={e=>setName(e.target.value)} 
                            className="w-full p-4 bg-fuchsia-50 border-2 border-fuchsia-100 rounded-2xl text-center font-bold text-fuchsia-900 focus:outline-none focus:border-fuchsia-400 transition-all placeholder:text-fuchsia-200" 
                        />
                    </div>
                    <div className="relative">
                        <input 
                            placeholder={t('rap_battle_screen.mood_placeholder')} 
                            value={mood} 
                            onChange={e=>setMood(e.target.value)} 
                            className="w-full p-4 bg-fuchsia-50 border-2 border-fuchsia-100 rounded-2xl text-center font-bold text-fuchsia-900 focus:outline-none focus:border-fuchsia-400 transition-all placeholder:text-fuchsia-200" 
                        />
                    </div>
                    
                    <button 
                        onClick={generateRhyme} 
                        disabled={isLoading || !name || !mood} 
                        className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-fuchsia-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 uppercase tracking-widest"
                    >
                        <span>{t('rap_battle_screen.generate_button')}</span>
                    </button>
                </div>
            </div>
        ) : (
            <div className="w-full max-w-sm flex flex-col items-center animate-fadeIn">
                {isLoading ? (
                    <div className="bg-white/80 p-12 rounded-[2.5rem] shadow-xl w-full flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-8 border-fuchsia-100 border-t-fuchsia-600 rounded-full animate-spin"></div>
                        <p className="text-fuchsia-600 font-black text-xl animate-pulse uppercase tracking-widest">
                            {t('rap_battle_screen.loading')}
                        </p>
                    </div>
                ) : (
                    <div className="w-full space-y-6">
                        {/* THE RAP CARD */}
                        <div className="relative group overflow-hidden">
                            {/* Neon Glow Background */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            
                            <div className="relative bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl border border-white/10 text-center min-h-[300px] flex flex-col items-center justify-center">
                                <div className="absolute top-4 right-6 opacity-20 text-4xl">🎵</div>
                                <div className="absolute bottom-4 left-6 opacity-20 text-4xl rotate-12">✨</div>
                                
                                <h3 className="text-fuchsia-400 font-black text-xs uppercase tracking-[0.3em] mb-8">
                                    {cardTitle}
                                </h3>
                                
                                <p className="text-3xl font-black italic whitespace-pre-line leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,0,255,0.3)]">
                                    {rapLyrics}
                                </p>
                                
                                <div className="mt-8 opacity-40">
                                    <span className="text-2xl">🔥🎵🔥</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => { setRapLyrics(''); setMood(''); }} 
                            className="text-fuchsia-600 font-black text-xs uppercase tracking-[0.2em] py-4 px-8 bg-white/50 rounded-full border border-fuchsia-100 hover:bg-white transition-all active:scale-95"
                        >
                            ← {language === 'mk' ? 'Пробај друга рима' : 'New Rhyme'}
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ScreenWrapper>
  );
};

export default RapBattleScreen;
