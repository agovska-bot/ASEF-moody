
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { POINTS_PER_ACTIVITY } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

declare const __API_KEY__: string;

const KindnessScreen: React.FC = () => {
  const { addPoints, showToast, ageGroup } = useAppContext();
  const { t, language } = useTranslation();
  const [task, setTask] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const currentAgeKey = ageGroup || '7-9';
  const screenTitle = t(`home.age_${currentAgeKey}.kindness_act_title`);

  const getNewTask = useCallback(async () => {
      setIsLoading(true);
      const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
      if (!apiKey) {
        const fallbackTasks = t('kindness_screen.fallback_tasks');
        setTask(fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)]);
        setIsLoading(false);
        return;
      }
      
      try {
        const ai = new GoogleGenAI({apiKey: apiKey});
        const themes = [
            "a family member (parent, sibling)",
            "a friend or neighbor",
            "helping with a small chore at home",
            "giving a genuine compliment",
            "being kind to the environment or nature",
            "sharing something",
            "being kind to yourself",
            "saying thank you for something specific"
        ];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        let languageInstruction = "English.";
        if (language === 'mk') languageInstruction = "Македонски јазик. Внимавај на граматика.";
        
        const prompt = `Generate a single, short act of kindness for a child aged ${currentAgeKey} about ${randomTheme}. ${languageInstruction} Max 1 sentence direct instruction.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { temperature: 0.9 }
        });
        setTask(response.text?.trim() || "Do something kind today.");
      } catch (error) {
        const fallbackTasks = t('kindness_screen.fallback_tasks');
        setTask(fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)]);
      } finally {
        setIsLoading(false);
      }
    }, [currentAgeKey, language, t]);

  useEffect(() => {
    getNewTask();
  }, [getNewTask]);

  const handleComplete = () => {
    addPoints('kindness', POINTS_PER_ACTIVITY);
    showToast(`+${POINTS_PER_ACTIVITY} points! 💖`);
    getNewTask();
  };

  const theme = {
    '7-9': { blob1: 'bg-emerald-100', blob2: 'bg-rose-100', text: 'text-emerald-800', button: 'bg-emerald-500 hover:bg-emerald-600', button2: 'bg-emerald-100 text-emerald-800' },
    '10-12': { blob1: 'bg-rose-50', blob2: 'bg-rose-100', text: 'text-rose-800', button: 'bg-rose-500 hover:bg-rose-600', button2: 'bg-rose-100 text-rose-800' },
    '12+': { blob1: 'bg-rose-200', blob2: 'bg-emerald-200', text: 'text-rose-900', button: 'bg-rose-600 hover:bg-rose-700', button2: 'bg-rose-100 text-rose-800' }
  }[currentAgeKey];

  return (
    <ScreenWrapper title={screenTitle}>
      <div className="relative flex flex-col items-center justify-start pt-8 text-center space-y-8 flex-grow overflow-hidden">
        <div className={`fixed top-[-10%] left-[-20%] w-[50rem] h-[50rem] ${theme.blob1}/40 rounded-full filter blur-[100px] animate-blob z-0 pointer-events-none`}></div>
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-inner min-h-[120px] flex items-center justify-center w-full max-w-sm z-10 mx-4">
          {isLoading ? (
            <p className={`text-xl ${theme.text} animate-pulse`}>{t('kindness_screen.loading')}</p>
          ) : (
            <p className={`text-xl font-bold ${theme.text}`}>{task}</p>
          )}
        </div>
        <div className="w-full pt-4 z-10 space-y-3 max-w-sm mx-4">
            <button onClick={handleComplete} disabled={isLoading} className={`w-full ${theme.button} text-white font-bold py-3 px-4 rounded-lg transition shadow-md disabled:bg-gray-400`}>
                {t('kindness_screen.complete_button')}
            </button>
            <button onClick={getNewTask} disabled={isLoading} className={`w-full ${theme.button2} font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-200`}>
                {t('kindness_screen.another_button')}
            </button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default KindnessScreen;
