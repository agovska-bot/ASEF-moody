
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { POINTS_PER_ACTIVITY } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

declare const __API_KEY__: string;

const KindnessScreen: React.FC = () => {
  const { addPoints, showToast, ageGroup, activeTasks, setActiveTask } = useAppContext();
  const { t, language } = useTranslation();
  const [task, setTask] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const currentAgeKey = ageGroup || '7-9';
  const screenTitle = t(`home.age_${currentAgeKey}.kindness_act_title`);

  const getNewTask = useCallback(async (forceRefresh: boolean = false) => {
      if (!forceRefresh && activeTasks.kindness) {
        setTask(activeTasks.kindness);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
      
      if (!apiKey) {
        const fallbackTasks = t('kindness_screen.fallback_tasks');
        const fallback = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
        setTask(fallback);
        setActiveTask('kindness', fallback);
        setIsLoading(false);
        return;
      }
      
      try {
        const ai = new GoogleGenAI({apiKey: apiKey});
        const themes = ["a family member", "a friend", "helping at home", "giving a compliment", "sharing", "saying thank you"];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        let languageInstruction = "English.";
        if (language === 'mk') languageInstruction = "Македонски јазик.";
        
        const prompt = `Generate a single short act of kindness for a child aged ${currentAgeKey} about ${randomTheme}. ${languageInstruction} Max 1 sentence command.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
              temperature: 0.9,
              thinkingConfig: { thinkingBudget: 0 }
          }
        });
        const generatedTask = response.text?.trim() || "Do something kind today.";
        setTask(generatedTask);
        setActiveTask('kindness', generatedTask);
      } catch (error) {
        const fallbackTasks = t('kindness_screen.fallback_tasks');
        const fallback = fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
        setTask(fallback);
        setActiveTask('kindness', fallback);
      } finally {
        setIsLoading(false);
      }
    }, [currentAgeKey, language, t, activeTasks.kindness, setActiveTask]);

  useEffect(() => {
    getNewTask();
  }, [getNewTask]);

  const handleComplete = () => {
    addPoints('kindness', POINTS_PER_ACTIVITY);
    showToast(`+${POINTS_PER_ACTIVITY} points! 💖`);
    setActiveTask('kindness', null);
  };

  const theme = {
    '7-9': { blob1: 'bg-emerald-200', blob2: 'bg-rose-200', text: 'text-emerald-900', button: 'bg-emerald-500 hover:bg-emerald-600', button2: 'bg-emerald-100/50 text-emerald-800' },
    '10-12': { blob1: 'bg-rose-100', blob2: 'bg-rose-200', text: 'text-rose-900', button: 'bg-rose-500 hover:bg-rose-600', button2: 'bg-rose-100/50 text-rose-800' },
    '12+': { blob1: 'bg-rose-300', blob2: 'bg-emerald-300', text: 'text-rose-950', button: 'bg-rose-600 hover:bg-rose-700', button2: 'bg-rose-100/50 text-rose-800' }
  }[currentAgeKey];

  return (
    <ScreenWrapper title={screenTitle}>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(60px, -40px) scale(1.1); }
          66% { transform: translate(-30px, 60px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 12s infinite alternate ease-in-out; }
      `}</style>

      {/* BACKGROUND BLOBS */}
      <div className={`fixed top-[-5%] left-[-10%] w-[25rem] h-[25rem] ${theme.blob1} rounded-full opacity-30 filter blur-[70px] animate-blob pointer-events-none`}></div>
      <div className={`fixed bottom-[-5%] right-[-10%] w-[25rem] h-[25rem] ${theme.blob2} rounded-full opacity-30 filter blur-[70px] animate-blob animation-delay-4000 pointer-events-none`}></div>

      <div className="relative flex flex-col items-center justify-start space-y-10 flex-grow z-10">
        
        <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] shadow-xl shadow-emerald-900/5 min-h-[160px] flex items-center justify-center w-full border border-white">
          {isLoading ? (
            <p className={`text-xl font-bold ${theme.text} animate-pulse`}>{t('kindness_screen.loading')}</p>
          ) : (
            <p className={`text-2xl font-black ${theme.text} leading-snug`}>{task}</p>
          )}
        </div>

        <div className="w-full pt-4 space-y-4">
            <button onClick={handleComplete} disabled={isLoading} className={`w-full ${theme.button} text-white font-black py-6 px-4 rounded-[2rem] transition shadow-2xl active:scale-95 disabled:opacity-30 uppercase tracking-[0.15em] text-lg border-b-4 border-black/10`}>
                {t('kindness_screen.complete_button')}
            </button>
            <button onClick={() => getNewTask(true)} disabled={isLoading} className={`w-full ${theme.button2} backdrop-blur-md font-black py-4 px-4 rounded-[1.5rem] transition disabled:bg-gray-200 text-xs uppercase tracking-[0.2em] border border-white/50`}>
                {t('kindness_screen.another_button')}
            </button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default KindnessScreen;
