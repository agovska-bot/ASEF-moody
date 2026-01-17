
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { MOOD_OPTIONS, MOOD_EMOJIS, MOOD_COLORS } from '../constants';
import { Mood, Screen } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { GoogleGenAI } from "@google/genai";
import BuddyIcon from '../components/BuddyIcon';
import TTSButton from '../components/TTSButton';

const MoodCheckScreen: React.FC = () => {
  const { addMood, setCurrentScreen, age, ageGroup, language, showToast } = useAppContext();
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [buddyResponse, setBuddyResponse] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const screenTitle = t(`home.age_${ageGroup}.mood_check_title`);

  const moodThemeColors: Record<Mood, { blob1: string, blob2: string }> = {
    Happy: { blob1: 'bg-yellow-100', blob2: 'bg-orange-100' },
    Sad: { blob1: 'bg-blue-100', blob2: 'bg-cyan-50' },
    Angry: { blob1: 'bg-red-100', blob2: 'bg-orange-100' },
    Worried: { blob1: 'bg-purple-100', blob2: 'bg-indigo-50' },
    Tired: { blob1: 'bg-gray-100', blob2: 'bg-slate-200' },
  };

  const generateBuddySupport = async (mood: Mood, userNote: string) => {
    const rawKey = process.env.API_KEY || "";
    const apiKey = rawKey.trim();

    if (!apiKey) {
      console.error("Gemini API Key is missing");
      showToast("Buddy's brain is not connected.");
      return null;
    }

    setIsGeneratingResponse(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      let languageInstruction = "Write in English.";
      if (language === 'mk') {
        languageInstruction = "Одговори исклучиво на македонски јазик. БИДИ ЕКСТРЕМНО СТРОГ СО ГРАМАТИКАТА. Користи топол јазик соодветен за дете.";
      } else if (language === 'tr') {
        languageInstruction = "Write in Turkish. Use perfect grammar.";
      }
      
      const prompt = `You are Buddy, a supportive friend for a ${age}-year-old child. User is feeling ${mood}. User note: "${userNote}". Provide a warm, empathetic response in max 2 sentences. ${languageInstruction}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.8 }
      });
      
      return response.text.trim();
    } catch (error) {
      console.error("Gemini API Error:", error);
      showToast("Buddy is taking a nap. Try again in a bit!");
      return null;
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedMood) {
      const response = await generateBuddySupport(selectedMood, note);
      addMood({ mood: selectedMood, note: note, date: new Date().toISOString() });
      if (response) {
        setBuddyResponse(response);
      } else {
        setCurrentScreen(Screen.Home);
      }
    }
  };

  const groupTheme = {
    '7-9': { blob1: 'bg-teal-50', blob2: 'bg-amber-50', button: 'bg-teal-600', text: 'text-teal-900' },
    '10-12': { blob1: 'bg-slate-50', blob2: 'bg-indigo-50', button: 'bg-slate-600', text: 'text-slate-900' },
    '12+': { blob1: 'bg-indigo-50', blob2: 'bg-blue-50', button: 'bg-indigo-600', text: 'text-indigo-900' }
  }[ageGroup || '7-9'];

  const activeBlob1 = selectedMood ? moodThemeColors[selectedMood].blob1 : groupTheme.blob1;
  const activeBlob2 = selectedMood ? moodThemeColors[selectedMood].blob2 : groupTheme.blob2;

  if (buddyResponse) {
    return (
      <ScreenWrapper title={t('mood_check_screen.buddy_support')}>
        <div className="flex flex-col items-center justify-center space-y-8 py-8 flex-grow">
          <div className="relative">
             <BuddyIcon className="w-32 h-32 animate-bounce" />
             <div className="absolute -top-4 -right-4">
                <div className="bg-white rounded-full p-2 shadow-sm border border-gray-100">
                    <span className="text-3xl">{MOOD_EMOJIS[selectedMood!]}</span>
                </div>
             </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-inner border border-gray-50 w-full max-w-sm">
             <p className="text-xl text-teal-900 font-medium italic text-center leading-relaxed">
                "{buddyResponse}"
             </p>
             <div className="flex justify-center mt-6">
                <TTSButton textToSpeak={buddyResponse} className="bg-teal-500 text-white w-12 h-12 shadow-sm" />
             </div>
          </div>
          <button
            onClick={() => setCurrentScreen(Screen.Home)}
            className={`w-full max-w-sm ${groupTheme.button} text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-95`}
          >
            {t('mood_check_screen.continue')}
          </button>
        </div>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title={screenTitle}>
      <div className="relative flex flex-col items-center justify-start pt-4 flex-grow overflow-hidden px-2">
        <div className={`absolute top-0 -left-16 w-96 h-96 ${activeBlob1} rounded-full opacity-60 filter blur-3xl transition-colors duration-1000`}></div>
        <div className={`absolute bottom-0 -right-16 w-96 h-96 ${activeBlob2} rounded-full opacity-60 filter blur-3xl transition-colors duration-1000`}></div>
        
        <div className="flex flex-col items-center space-y-6 z-10 w-full pb-8 max-w-sm">
            <div className="grid grid-cols-2 gap-3 w-full">
                {MOOD_OPTIONS.map((mood) => (
                    <button
                        key={mood}
                        onClick={() => setSelectedMood(mood)}
                        className={`flex items-center p-4 rounded-xl transition-all border-2 ${
                            selectedMood === mood 
                            ? `${MOOD_COLORS[mood]} border-white shadow-lg scale-[1.02]` 
                            : 'bg-white border-gray-50 opacity-90'
                        }`}
                    >
                        <span className="text-3xl mr-3">{MOOD_EMOJIS[mood]}</span>
                        <span className={`text-sm font-black uppercase tracking-tight text-left ${selectedMood === mood ? 'text-white' : 'text-gray-700'}`}>
                            {t(`moods.${mood}`)}
                        </span>
                    </button>
                ))}
            </div>

            <div className="w-full relative">
                <textarea
                    className="w-full p-4 border-2 border-white rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-100 bg-white shadow-inner text-gray-800 text-base transition-all placeholder:text-gray-300 min-h-[100px]"
                    rows={3}
                    placeholder={t('mood_check_screen.placeholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!selectedMood || isGeneratingResponse}
                className={`w-full py-4 px-8 rounded-xl font-bold text-lg text-white shadow-lg transition transform active:scale-95 disabled:bg-gray-300 flex items-center justify-center gap-3 ${
                selectedMood ? MOOD_COLORS[selectedMood] : groupTheme.button
                }`}
            >
                {isGeneratingResponse ? (
                <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">{t('mood_check_screen.buddy_thinking')}</span>
                </>
                ) : (
                <>
                    <span>{t('mood_check_screen.save_button')}</span>
                    <span className="text-xl">✨</span>
                </>
                )}
            </button>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default MoodCheckScreen;
