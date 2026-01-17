
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { POINTS_PER_ACTIVITY } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

const KindnessScreen: React.FC = () => {
  const { addPoints, showToast, ageGroup } = useAppContext();
  const { t, language } = useTranslation();
  const [task, setTask] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const currentAgeKey = ageGroup || '7-9';
  const screenTitle = t(`home.age_${currentAgeKey}.kindness_act_title`);

  const getNewTask = useCallback(async () => {
      setIsLoading(true);
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        console.error("API_KEY is missing from environment variables.");
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

        let agePromptSegment = "";
        switch (currentAgeKey) {
          case '7-9':
            agePromptSegment = `for a child aged 7-9. Focus specifically on this type of kindness: '${randomTheme}'. Keep it simple and sweet.`;
            break;
          case '10-12':
            agePromptSegment = `for a child aged 10-12. Focus specifically on this type of kindness: '${randomTheme}'. It can involve social awareness or emotional intelligence.`;
            break;
          default:
            agePromptSegment = `for a mature person. Focus on a meaningful act of kindness: '${randomTheme}'.`;
        }

        let languageInstruction = "Use simple, clear language.";
        if (language === 'mk') {
          languageInstruction = "The response must be in the Macedonian language.";
        } else if (language === 'tr') {
          languageInstruction = "The response must be in the Turkish language.";
        }
        
        const prompt = `Generate a single, short, simple act of kindness instruction ${agePromptSegment}. ${languageInstruction} The response must be only one sentence and a direct instruction. For example: 'Can you draw a happy picture for someone in your family?' Do not use lists or bullet points.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              temperature: 1.1,
          }
        });
        const text = response.text;
        setTask(text.trim());
      } catch (error) {
        console.error("Error fetching kindness task:", error);
        const fallbackTasks = t('kindness_screen.fallback_tasks');
        if (Array.isArray(fallbackTasks) && fallbackTasks.length > 0) {
          setTask(fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)]);
        } else {
          setTask("Say something nice to someone today.");
        }
      } finally {
        setIsLoading(false);
      }
    }, [currentAgeKey, language, t]);

  useEffect(() => {
    getNewTask();
  }, [getNewTask]);

  const handleComplete = () => {
    addPoints('kindness', POINTS_PER_ACTIVITY);
    showToast(`+${POINTS_PER_ACTIVITY} points for kindness! 💖`);
    getNewTask();
  };

  const theme = {
    '7-9': {
      blob1: 'bg-emerald-100', blob2: 'bg-rose-100', text: 'text-emerald-800',
      button: 'bg-emerald-500 hover:bg-emerald-600',
      button2: 'bg-emerald-100 text-emerald-800',
    },
    '10-12': {
      blob1: 'bg-rose-100', blob2: 'bg-emerald-100', text: 'text-rose-800',
      button: 'bg-rose-500 hover:bg-rose-600',
      button2: 'bg-rose-100 text-rose-800',
    },
    '12+': {
      blob1: 'bg-rose-200', blob2: 'bg-emerald-200', text: 'text-rose-900',
      button: 'bg-rose-600 hover:bg-rose-700',
      button2: 'bg-rose-100 text-rose-800',
    }
  }[currentAgeKey];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
      {/* Background Animated Blobs - Specifically Emerald and Rose for Kindness */}
      <div className={`fixed top-[-10%] left-[-20%] w-[50rem] h-[50rem] ${theme.blob1}/40 rounded-full filter blur-[100px] animate-blob z-0 pointer-events-none`}></div>
      <div className={`fixed bottom-[-10%] right-[-20%] w-[50rem] h-[50rem] ${theme.blob2}/40 rounded-full filter blur-[100px] animate-blob animation-delay-4000 z-0 pointer-events-none`}></div>

      <ScreenWrapper title={screenTitle}>
        <div className="relative flex flex-col items-center justify-start pt-8 text-center space-y-8 flex-grow z-10">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-inner min-h-[120px] flex items-center justify-center w-full max-w-sm mx-4">
            {isLoading ? (
              <p className={`text-xl ${theme.text} animate-pulse`}>
                {language === 'mk' ? 'Смислувам добра идеја...' : t('kindness_screen.loading')}
              </p>
            ) : (
              <p className={`text-xl font-bold ${theme.text}`}>{task}</p>
            )}
          </div>
          <div className="w-full pt-4 space-y-3 max-w-sm mx-4">
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className={`w-full ${theme.button} text-white font-bold py-3 px-4 rounded-lg transition shadow-md disabled:bg-gray-400`}
              >
                {t('kindness_screen.complete_button')}
              </button>
              <button
                onClick={getNewTask}
                disabled={isLoading}
                className={`w-full ${theme.button2} font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-200`}
              >
                {t('kindness_screen.another_button')}
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
          .animate-blob { animation: blob 15s infinite alternate ease-in-out; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </ScreenWrapper>
    </div>
  );
};

export default KindnessScreen;
