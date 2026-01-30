
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { MOOD_OPTIONS, MOOD_EMOJIS, MOOD_COLORS } from '../constants';
import { Mood, Screen } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import BuddyIcon from '../components/BuddyIcon';
import TTSButton from '../components/TTSButton';

declare const __API_KEY__: string;

const MoodCheckScreen: React.FC = () => {
  const { addMood, setCurrentScreen, age, ageGroup, language, showToast } = useAppContext();
  const { t } = useTranslation();
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [note, setNote] = useState('');
  const [buddyResponse, setBuddyResponse] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const screenTitle = t(`home.age_${ageGroup}.mood_check_title`);

  const moodThemeColors: Record<Mood, { blob1: string, blob2: string }> = {
    Happy: { blob1: 'bg-yellow-100', blob2: 'bg-orange-100' },
    Sad: { blob1: 'bg-blue-100', blob2: 'bg-cyan-50' },
    Angry: { blob1: 'bg-red-100', blob2: 'bg-orange-100' },
    Worried: { blob1: 'bg-purple-100', blob2: 'bg-indigo-50' },
    Tired: { blob1: 'bg-gray-100', blob2: 'bg-slate-200' },
  };

  const toggleMood = (mood: Mood) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood) 
        : [...prev, mood]
    );
  };

  const generateBuddySupport = async (moods: Mood[], userNote: string) => {
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    
    if (!apiKey) {
      showToast("Buddy's brain is not connected. (Missing API Key)");
      return;
    }

    setIsGeneratingResponse(true);
    setStreamedText('');
    setBuddyResponse(''); // Trigger the response view early
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      let languageInstruction = "Write in English.";
      if (language === 'mk') {
        languageInstruction = "Одговори исклучиво на македонски јазик. Користи топол јазик соодветен за дете.";
      } else if (language === 'tr') {
        languageInstruction = "Write in Turkish. Use warm language.";
      }
      
      const moodString = moods.join(" and ");
      const prompt = `You are Buddy, a supportive friend for a ${age}-year-old child. User is feeling a mix of emotions: ${moodString}. User note: "${userNote}". Provide a warm, short empathetic response (max 2 sentences) acknowledging all their feelings. ${languageInstruction}`;
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
            temperature: 0.7,
            thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      let fullText = "";
      for await (const chunk of responseStream) {
          const chunkResponse = chunk as GenerateContentResponse;
          const text = chunkResponse.text;
          if (text) {
              fullText += text;
              setStreamedText(fullText);
          }
      }
      setBuddyResponse(fullText);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      showToast("Buddy is taking a nap. Try again in a bit!");
      setBuddyResponse(null);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedMoods.length > 0) {
      addMood({ moods: selectedMoods, note: note, date: new Date().toISOString() });
      await generateBuddySupport(selectedMoods, note);
    }
  };

  const groupTheme = {
    '7-9': { blob1: 'bg-teal-50', blob2: 'bg-amber-50', button: 'bg-teal-600', text: 'text-teal-900' },
    '10-12': { blob1: 'bg-cyan-50', blob2: 'bg-blue-50', button: 'bg-blue-500', text: 'text-blue-900' },
    '12+': { blob1: 'bg-indigo-50', blob2: 'bg-blue-50', button: 'bg-indigo-600', text: 'text-indigo-900' }
  }[ageGroup || '7-9'];

  // Background color based on first selected mood or theme default
  const activeBlob1 = selectedMoods.length > 0 ? moodThemeColors[selectedMoods[0]].blob1 : groupTheme.blob1;
  const activeBlob2 = selectedMoods.length > 0 ? moodThemeColors[selectedMoods[0]].blob2 : groupTheme.blob2;

  if (buddyResponse !== null) {
    return (
      <ScreenWrapper title={t('mood_check_screen.buddy_support')}>
        <div className="flex flex-col items-center justify-center space-y-8 py-8 flex-grow">
          <div className="relative">
             <BuddyIcon className={`w-32 h-32 ${isGeneratingResponse ? 'animate-pulse' : 'animate-bounce'}`} />
             <div className="absolute -top-4 -right-4 flex gap-1">
                {selectedMoods.slice(0, 2).map((m, i) => (
                    <div key={m} className="bg-white rounded-full p-2 shadow-sm border border-gray-100 -ml-2 first:ml-0" style={{ zIndex: 10 - i }}>
                        <span className="text-2xl">{MOOD_EMOJIS[m]}</span>
                    </div>
                ))}
                {selectedMoods.length > 2 && (
                    <div className="bg-white rounded-full p-2 shadow-sm border border-gray-100 -ml-2 flex items-center justify-center text-[10px] font-black text-teal-600">
                        +{selectedMoods.length - 2}
                    </div>
                )}
             </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-inner border border-gray-50 w-full max-w-sm">
             <p className="text-xl text-teal-900 font-medium italic text-center leading-relaxed min-h-[3rem]">
                {streamedText || "..."}
             </p>
             {!isGeneratingResponse && streamedText && (
                 <div className="flex justify-center mt-6">
                    <TTSButton textToSpeak={streamedText} className="bg-teal-500 text-white w-12 h-12 shadow-sm" />
                 </div>
             )}
          </div>
          <button
            onClick={() => setCurrentScreen(Screen.Home)}
            disabled={isGeneratingResponse}
            className={`w-full max-w-sm ${groupTheme.button} text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50`}
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
                {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMoods.includes(mood);
                    return (
                        <button
                            key={mood}
                            onClick={() => toggleMood(mood)}
                            className={`flex items-center p-4 rounded-xl transition-all border-2 ${
                                isSelected 
                                ? `${MOOD_COLORS[mood]} border-white shadow-lg scale-[1.02]` 
                                : 'bg-white border-gray-50 opacity-90'
                            }`}
                        >
                            <span className="text-3xl mr-3">{MOOD_EMOJIS[mood]}</span>
                            <span className={`text-sm font-black uppercase tracking-tight text-left ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                {t(`moods.${mood}`)}
                            </span>
                        </button>
                    );
                })}
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
                disabled={selectedMoods.length === 0 || isGeneratingResponse}
                className={`w-full py-4 px-8 rounded-xl font-bold text-lg text-white shadow-lg transition transform active:scale-95 disabled:bg-gray-300 flex items-center justify-center gap-3 ${
                selectedMoods.length > 0 ? MOOD_COLORS[selectedMoods[0]] : groupTheme.button
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
