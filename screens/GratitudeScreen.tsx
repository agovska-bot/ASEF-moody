
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { POINTS_PER_ACTIVITY } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

declare const __API_KEY__: string;

const GratitudeScreen: React.FC = () => {
  const { addPoints, showToast, ageGroup, age } = useAppContext();
  const { t, language } = useTranslation();
  const [task, setTask] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const currentAgeKey = ageGroup || '7-9';
  const screenTitle = t(`home.age_${currentAgeKey}.gratitude_jar_title`);

  const getNewTask = useCallback(async () => {
    setIsLoading(true);
    
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    
    if (!apiKey) {
      const fallbackTasks = t('gratitude_screen.fallback_tasks');
      setTask(fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)]);
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const topics = ["a color", "a song", "a feeling", "a friend", "funny moment", "tasty food", "nature", "happy memory"];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      let languageInstruction = language === 'mk' ? "Одговори на македонски. БИДЕ ЕКСТРЕМНО ВНИМАТЕЛЕН СО ГРАМАТИКАТА." : "Response in English.";
      const prompt = `Generate one unique gratitude question for a ${age}-year-old about ${randomTopic}. ${languageInstruction} Max 1 sentence question.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 1.0 }
      });
      setTask(response.text?.trim() || "Think of something nice!");
    } catch (error) {
      console.error("Gemini Gratitude Error:", error);
      const fallbackTasks = t('gratitude_screen.fallback_tasks');
      setTask(fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)]);
    } finally {
      setIsLoading(false);
    }
  }, [age, language, t]);
  
  useEffect(() => {
    getNewTask();
  }, [getNewTask]);

  const handleComplete = () => {
    addPoints('gratitude', POINTS_PER_ACTIVITY);
    showToast(`+${POINTS_PER_ACTIVITY} points! 🌟`);
    getNewTask();
  };
  
  const theme = {
    '7-9': { blob1: 'bg-amber-100', blob2: 'bg-amber-200', text: 'text-amber-900', button: 'bg-amber-500 hover:bg-amber-600', button2: 'bg-amber-100 text-amber-800' },
    '10-12': { blob1: 'bg-teal-100', blob2: 'bg-teal-200', text: 'text-teal-900', button: 'bg-teal-500 hover:bg-teal-600', button2: 'bg-teal-100 text-teal-800' },
    '12+': { blob1: 'bg-indigo-100', blob2: 'bg-indigo-200', text: 'text-indigo-900', button: 'bg-indigo-600 hover:bg-indigo-700', button2: 'bg-indigo-100 text-indigo-800' }
  }[currentAgeKey];

  return (
    <ScreenWrapper title={screenTitle}>
      <div className="relative flex flex-col items-center justify-start pt-8 text-center space-y-8 flex-grow overflow-hidden">
        <div className={`absolute top-20 -left-16 w-72 h-72 ${theme.blob1} rounded-full opacity-50 filter blur-xl animate-blob`}></div>
        <div className={`absolute top-40 -right-16 w-72 h-72 ${theme.blob2} rounded-full opacity-50 filter blur-xl animate-blob animation-delay-2000`}></div>
        
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-inner min-h-[120px] flex items-center justify-center w-full max-w-sm z-10 mx-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                <p className={`text-xl ${theme.text} animate-pulse mt-2`}>
                    {language === 'mk' ? 'Смислувам нешто убаво...' : t('gratitude_screen.loading')}
                </p>
            </div>
          ) : (
            <p className={`text-xl font-bold ${theme.text}`}>{task}</p>
          )}
        </div>

        <div className="w-full pt-4 z-10 space-y-3 max-w-sm mx-4">
            <button 
                onClick={handleComplete} 
                disabled={isLoading} 
                className={`w-full ${theme.button} text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-400 shadow-md`}
            >
              {t('gratitude_screen.complete_button')}
            </button>
            <button 
                onClick={getNewTask} 
                disabled={isLoading} 
                className={`w-full ${theme.button2} font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-200`}
            >
              {t('gratitude_screen.another_button')}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </ScreenWrapper>
  );
};

export default GratitudeScreen;
