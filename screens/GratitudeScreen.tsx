
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { POINTS_PER_ACTIVITY } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

declare const __API_KEY__: string;

const GratitudeScreen: React.FC = () => {
  const { addPoints, addReflection, showToast, ageGroup, age, activeTasks, setActiveTask } = useAppContext();
  const { t, language } = useTranslation();
  const [task, setTask] = useState<string>('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const currentAgeKey = ageGroup || '7-9';
  const screenTitle = t(`home.age_${currentAgeKey}.gratitude_jar_title`);

  const getNewTask = useCallback(async (forceRefresh: boolean = false) => {
    if (!forceRefresh && activeTasks.gratitude) {
      setTask(activeTasks.gratitude);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setResponse('');
    
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    
    if (!apiKey) {
      const fallbackTasks = t('gratitude_screen.fallback_tasks');
      const fallback = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
      setTask(fallback);
      setActiveTask('gratitude', fallback);
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const topics = ["a color", "a song", "a feeling", "a friend", "funny moment", "tasty food", "nature", "happy memory"];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      let languageInstruction = language === 'mk' ? "Одговори на македонски." : "Response in English.";
      const prompt = `Generate one short unique gratitude question for a ${age}-year-old about ${randomTopic}. ${languageInstruction} Max 1 sentence.`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            temperature: 1.0,
            thinkingConfig: { thinkingBudget: 0 }
        }
      });
      const generatedTask = res.text?.trim() || "Think of something nice!";
      setTask(generatedTask);
      setActiveTask('gratitude', generatedTask);
    } catch (error) {
      console.error("Gemini Gratitude Error:", error);
      const fallbackTasks = t('gratitude_screen.fallback_tasks');
      const fallback = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
      setTask(fallback);
      setActiveTask('gratitude', fallback);
    } finally {
      setIsLoading(false);
    }
  }, [age, language, t, activeTasks.gratitude, setActiveTask]);
  
  useEffect(() => {
    getNewTask();
  }, [getNewTask]);

  const handleComplete = () => {
    addPoints('gratitude', POINTS_PER_ACTIVITY);
    
    if (response.trim()) {
        addReflection({
            prompt: task,
            text: response,
            date: new Date().toISOString(),
            category: 'gratitude'
        });
    }

    showToast(`+${POINTS_PER_ACTIVITY} points! 🌟`);
    setActiveTask('gratitude', null);
  };
  
  const theme = {
    '7-9': { blob1: 'bg-amber-200', blob2: 'bg-amber-300', text: 'text-amber-900', button: 'bg-amber-500 hover:bg-amber-600', button2: 'bg-amber-100/50 text-amber-800', inputBg: 'bg-white/80', inputBorder: 'border-white focus:border-amber-400' },
    '10-12': { blob1: 'bg-cyan-100', blob2: 'bg-cyan-200', text: 'text-cyan-900', button: 'bg-cyan-500 hover:bg-cyan-600', button2: 'bg-cyan-100/50 text-cyan-800', inputBg: 'bg-white/80', inputBorder: 'border-white focus:border-cyan-400' },
    '12+': { blob1: 'bg-indigo-200', blob2: 'bg-indigo-300', text: 'text-indigo-900', button: 'bg-indigo-600 hover:bg-indigo-700', button2: 'bg-indigo-100/50 text-indigo-800', inputBg: 'bg-white/80', inputBorder: 'border-white focus:border-indigo-400' }
  }[currentAgeKey];

  return (
    <ScreenWrapper title={screenTitle}>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -80px) scale(1.2); }
          66% { transform: translate(-40px, 40px) scale(0.8); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 15s infinite alternate ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>

      {/* BACKGROUND BLOBS - Now freely floating in the whole viewport */}
      <div className={`fixed top-[-10%] left-[-15%] w-[30rem] h-[30rem] ${theme.blob1} rounded-full opacity-30 filter blur-[80px] animate-blob pointer-events-none`}></div>
      <div className={`fixed bottom-[-10%] right-[-15%] w-[30rem] h-[30rem] ${theme.blob2} rounded-full opacity-30 filter blur-[80px] animate-blob animation-delay-2000 pointer-events-none`}></div>

      <div className="relative flex flex-col items-center justify-start space-y-8 flex-grow z-10">
        
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-amber-900/5 min-h-[140px] flex items-center justify-center w-full border border-white">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
                <div className={`w-10 h-10 border-4 ${currentAgeKey === '7-9' ? 'border-amber-200 border-t-amber-500' : 'border-indigo-200 border-t-indigo-500'} rounded-full animate-spin`}></div>
                <p className={`text-lg font-bold ${theme.text} animate-pulse`}>
                    {language === 'mk' ? 'Смислувам нешто убаво...' : t('gratitude_screen.loading')}
                </p>
            </div>
          ) : (
            <p className={`text-2xl font-black ${theme.text} leading-tight`}>{task}</p>
          )}
        </div>

        {!isLoading && (
            <div className="w-full animate-fadeIn">
                <textarea
                    className={`w-full p-6 ${theme.inputBg} border-2 ${theme.inputBorder} rounded-[2rem] shadow-lg shadow-amber-900/5 text-teal-900 text-lg transition-all resize-none focus:outline-none focus:ring-4 focus:ring-amber-200/50 placeholder:text-slate-300 min-h-[160px] font-medium`}
                    rows={4}
                    placeholder={t('gratitude_screen.placeholder')}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                />
            </div>
        )}

        <div className="w-full pt-4 space-y-4">
            <button 
                onClick={handleComplete} 
                disabled={isLoading || !response.trim()} 
                className={`w-full ${theme.button} text-white font-black py-5 px-4 rounded-[2rem] transition disabled:opacity-30 shadow-2xl active:scale-95 uppercase tracking-[0.15em] text-lg border-b-4 border-black/10`}
            >
              {t('gratitude_screen.save_to_journal')}
            </button>
            <button 
                onClick={() => getNewTask(true)} 
                disabled={isLoading} 
                className={`w-full ${theme.button2} backdrop-blur-md font-black py-4 px-4 rounded-[1.5rem] transition disabled:bg-gray-200 text-xs uppercase tracking-[0.2em] border border-white/50`}
            >
              {t('gratitude_screen.another_button')}
            </button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default GratitudeScreen;
