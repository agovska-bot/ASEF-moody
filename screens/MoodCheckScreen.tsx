
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
  const { addMood, setCurrentScreen, age, language } = useAppContext();
  const { t } = useTranslation();
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [note, setNote] = useState('');
  const [buddyResponse, setBuddyResponse] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  // GEMINI ИНТЕГРАЦИЈА: Ова е срцето на вештачката интелигенција
  const generateBuddySupport = async (moods: Mood[], userNote: string) => {
    const apiKey = typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : "";
    setIsGeneratingResponse(true);
    setStreamedText('');
    
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // PROMPT ENGINEERING: Му кажуваме на АИ како да се однесува.
      const prompt = `You are Buddy, a supportive friend for a ${age}-year-old. 
                      User feels: ${moods.join(", ")}. Note: "${userNote}". 
                      Respond in ${language === 'mk' ? 'Macedonian' : 'English'}. Max 2 sentences.`;
      
      // STREAMING: Го влечеме одговорот дел по дел за подобар UX.
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      let fullText = "";
      for await (const chunk of responseStream) {
          const text = (chunk as GenerateContentResponse).text;
          if (text) {
              fullText += text;
              setStreamedText(fullText); // Веднаш го ажурираме екранот
          }
      }
      setBuddyResponse(fullText);
    } catch (error) {
      console.error("AI Error:", error);
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

  return (
    <ScreenWrapper title={t('mood_check_screen.buddy_support')}>
      {/* Приказ на одговорот и Бади иконата */}
      <div className="flex flex-col items-center space-y-6">
        {buddyResponse ? (
          <>
            <div className="p-6 bg-white rounded-2xl shadow-inner italic">
              {streamedText}
            </div>
            {/* TTS (Text-to-Speech): Овозможува гласовно читање */}
            <TTSButton textToSpeak={streamedText} />
            <button onClick={() => setCurrentScreen(Screen.Home)} className="bg-teal-600 text-white p-4 rounded-xl">Продолжи</button>
          </>
        ) : (
          <div className="w-full space-y-4">
            {/* Избор на емоции */}
            <div className="grid grid-cols-2 gap-2">
              {MOOD_OPTIONS.map(m => (
                <button key={m} onClick={() => setSelectedMoods([m])} className={`p-4 rounded-xl ${selectedMoods.includes(m) ? 'bg-teal-100' : 'bg-white'}`}>
                  {MOOD_EMOJIS[m]} {t(`moods.${m}`)}
                </button>
              ))}
            </div>
            <textarea className="w-full p-4 border rounded-xl" placeholder="..." value={note} onChange={e => setNote(e.target.value)} />
            <button onClick={handleSubmit} disabled={isGeneratingResponse} className="w-full bg-teal-600 text-white p-4 rounded-xl">
              {isGeneratingResponse ? 'Бади размислува...' : 'Зачувај'}
            </button>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
};

export default MoodCheckScreen;
