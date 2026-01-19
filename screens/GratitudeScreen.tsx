
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
  const [response, setResponse] = useState<string>('');
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
        model: 'gemini-flash-lite-latest',
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
    getNewTask(true);
  };
  
  const theme = {
    '7-9': { blob1: 'bg-amber-100', blob2: 'bg-amber-200', text: 'text-amber-900', button: 'bg-amber-500 hover:bg-amber-600', button2: 'bg-amber-100 text-amber-800', inputBg: 'bg-amber-50/80', inputBorder: 'border-amber-100 focus:border-amber-400' },
    '10-12': { blob1: 'bg-cyan-50', blob2: 'bg-cyan-100', text: 'text-cyan-900', button: 'bg-cyan-500 hover:bg-cyan-600', button2: 'bg-cyan-100 text-cyan-800', inputBg: 'bg-white/80', inputBorder: 'border-cyan-50 focus:border-cyan-400' },
    '12+': { blob1: 'bg-indigo-100', blob2: 'bg-indigo-200', text: 'text-indigo-900', button: 'bg-indigo-600 hover:bg-indigo-700', button2: 'bg-indigo-100 text-indigo-800', inputBg: 'bg-white/80', inputBorder: 'border-indigo-50 focus:border-indigo-400' }
  }[currentAgeKey];

  return (
    <ScreenWrapper title={screenTitle}>
      <div className="relative flex flex-col items-center justify-start pt-8 text-center space-y-8 flex-grow overflow-hidden px-2">
        <div className={`absolute top-20 -left-16 w-72 h-72 ${theme.blob1} rounded-full opacity-50 filter blur-xl animate-blob`}></div>
        <div className={`absolute top-40 -right-16 w-72 h-72 ${theme.blob2} rounded-full opacity-50 filter blur-xl animate-blob animation-delay-2000`}></div>
        
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-inner min-h-[120px] flex items-center justify-center w-full max-w-sm z-10 mx-4 border border-white/50">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 border-4 ${currentAgeKey === '12+' || currentAgeKey === '10-12' ? 'border-indigo-300 border-t-indigo-600' : 'border-amber-300 border-t-amber-600'} rounded-full animate-spin`}></div>
                <p className={`text-xl ${theme.text} animate-pulse mt-2`}>
                    {language === 'mk' ? 'Смислувам нешто убаво...' : t('gratitude_screen.loading')}
                </p>
            </div>
          ) : (
            <p className={`text-xl font-black ${theme.text} leading-tight`}>{task}</p>
          )}
        </div>

        {!isLoading && (
            <div className="w-full max-w-sm z-10 animate-fadeIn px-2">
                <textarea
                    className={`w-full p-4 ${theme.inputBg} border-2 ${theme.inputBorder} rounded-2xl shadow-sm text-slate-800 text-base transition-all resize-none focus:outline-none focus:ring-4 focus:ring-opacity-20 placeholder:text-slate-300 min-h-[120px]`}
                    rows={4}
                    placeholder={t('gratitude_screen.placeholder')}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                />
            </div>
        )}

        <div className="w-full pt-4 z-10 space-y-3 max-w-sm mx-4">
            <button 
                onClick={handleComplete} 
                disabled={isLoading || !response.trim()} 
                className={`w-full ${theme.button} text-white font-black py-4 px-4 rounded-2xl transition disabled:opacity-30 shadow-xl active:scale-[0.98] uppercase tracking-widest text-sm`}
            >
              {t('gratitude_screen.save_to_journal')}
            </button>
            <button 
                onClick={() => getNewTask(true)} 
                disabled={isLoading} 
                className={`w-full ${theme.button2} font-black py-3 px-4 rounded-2xl transition disabled:bg-gray-200 text-xs uppercase tracking-widest`}
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
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </ScreenWrapper>
  );
};

export default GratitudeScreen;
