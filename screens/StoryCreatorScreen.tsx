
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { POINTS_PER_ACTIVITY } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

const StoryCreatorScreen: React.FC = () => {
    const { 
      addPoints, showToast, ageGroup, age,
      storyInProgress, chatSession, startNewStory, continueStory, finishStory
    } = useAppContext();
    const { t, language } = useTranslation();
    
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStoryFinished, setIsStoryFinished] = useState(false);
    const [streamingText, setStreamingText] = useState('');

    const currentAgeKey = ageGroup || '7-9';
    const screenTitle = t(`home.age_${currentAgeKey}.story_creator_title`);

    const handleStartNewStory = useCallback(async () => {
        setIsLoading(true);
        setIsStoryFinished(false);
        setStreamingText('');
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            const dummyChat = {} as Chat;
            startNewStory(dummyChat, "Once upon a time, in a land filled with candy clouds...");
            setIsLoading(false);
            return;
        }
        
        let languageInstruction = "Use simple, clear English.";
        if (language === 'mk') languageInstruction = "Use clear, simple Macedonian language.";
        if (language === 'tr') languageInstruction = "Use clear, simple Turkish language.";
        
        const systemInstruction = `You are a creative co-writer and storyteller. You are writing a story together with a user who is exactly ${age} years old. 
        Adjust your tone, vocabulary, and themes to match a ${age}-year-old. 
        - If they are a child, make it whimsical and adventurous. 
        - If they are a teenager, make it relatable, perhaps with elements of mystery, sci-fi, or personal growth. 
        - If they are an adult, use more sophisticated imagery and mature narrative structures.
        Continue the story one sentence at a time. ${languageInstruction} Never break character.`;

        const ai = new GoogleGenAI({apiKey: apiKey});
        const newChat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
            }
        });
        
        try {
            const response = await newChat.sendMessage({ message: `Start a new story appropriate for a ${age}-year-old. Give me just one exciting first sentence to begin.` });
            const firstSentence = response.text.trim();
            startNewStory(newChat, firstSentence);
        } catch (error) {
            console.error("Error starting story:", error);
            startNewStory(newChat, "Once upon a time, in a land filled with candy clouds...");
        } finally {
            setIsLoading(false);
        }
    }, [age, language, startNewStory]);

    useEffect(() => {
        if (storyInProgress.length === 0 && !isStoryFinished) {
            handleStartNewStory();
        }
    }, [handleStartNewStory, storyInProgress.length, isStoryFinished]);

    const handleAddSentence = async () => {
        if (!userInput.trim() || !chatSession) return;
        
        setIsLoading(true);
        const currentInput = userInput;
        setUserInput('');
        setStreamingText('');

        try {
            const streamResponse = await chatSession.sendMessageStream({ message: currentInput });
            let fullText = "";
            
            for await (const chunk of streamResponse) {
                const chunkResponse = chunk as GenerateContentResponse;
                const text = chunkResponse.text;
                if (text) {
                    fullText += text;
                    setStreamingText(fullText);
                }
            }
            
            continueStory(currentInput, fullText);
            setStreamingText('');
        } catch(error) {
             console.error("Error continuing story:", error);
             showToast("Buddy is having trouble thinking. Let's try that again!");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFinishStory = async () => {
        if (!chatSession) return;

        setIsLoading(true);
        setStreamingText('');
        try {
            const streamResponse = await chatSession.sendMessageStream({ message: `Let's write a great and appropriate ending for this story! Just give me one or two final sentences to wrap it up.`});
            let fullEnding = "";
            
            for await (const chunk of streamResponse) {
                const chunkResponse = chunk as GenerateContentResponse;
                const text = chunkResponse.text;
                if (text) {
                    fullEnding += text;
                    setStreamingText(fullEnding);
                }
            }
            
            finishStory(fullEnding);
            addPoints('creativity', POINTS_PER_ACTIVITY * 2);
            showToast(`+${POINTS_PER_ACTIVITY * 2} points! 🎨`);
            setIsStoryFinished(true);
            setStreamingText('');
        } catch(error) {
            console.error("Error finishing story:", error);
            showToast("Couldn't think of an ending!");
        } finally {
            setIsLoading(false);
        }
    };

    const getTheme = () => {
        switch (currentAgeKey) {
            case '7-9':
                return { blob1: 'bg-indigo-200', blob2: 'bg-indigo-300', buddyTextBg: 'bg-indigo-100 text-indigo-800', button: 'bg-indigo-500 hover:bg-indigo-600', title: 'text-indigo-800', inputBorder: 'focus:border-indigo-400' };
            case '10-12':
                return { blob1: 'bg-purple-200', blob2: 'bg-purple-300', buddyTextBg: 'bg-purple-100 text-purple-800', button: 'bg-purple-500 hover:bg-purple-600', title: 'text-purple-800', inputBorder: 'focus:border-purple-400' };
            default:
                 return { blob1: 'bg-slate-200', blob2: 'bg-slate-300', buddyTextBg: 'bg-slate-100 text-slate-800', button: 'bg-indigo-600 hover:bg-indigo-700', title: 'text-slate-900', inputBorder: 'focus:border-indigo-500' };
        }
    };

    const theme = getTheme();
    const userTextBg = 'bg-amber-100 text-amber-800';
    
  return (
    <ScreenWrapper title={screenTitle}>
        <div className="relative flex flex-col items-center justify-start pt-8 text-center flex-grow">
            <div className={`absolute top-20 -left-16 w-72 h-72 ${theme.blob1} rounded-full opacity-50 filter blur-xl animate-blob`}></div>
            <div className={`absolute top-40 -right-16 w-72 h-72 ${theme.blob2} rounded-full opacity-50 filter blur-xl animate-blob animation-delay-2000`}></div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-inner w-full flex-grow flex flex-col z-10">
                <h2 className={`text-xl font-bold ${theme.title} mb-4`}>{t('story_creator_screen.adventure_title')}</h2>
                <div className="story-content overflow-y-auto flex-grow space-y-3 pr-2 mb-4">
                    {storyInProgress.map((part, index) => (
                        <div key={index} className={`p-2 rounded-lg ${index % 2 === 0 ? theme.buddyTextBg : userTextBg} ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                           {index % 2 === 0 && <span className="font-bold text-xs opacity-70 block">{t('story_creator_screen.buddy_says')}</span>}
                           <div>{part}</div>
                           {index % 2 !== 0 && <span className="font-bold text-xs opacity-70 block text-right">{t('story_creator_screen.you_said')}</span>}
                        </div>
                    ))}
                    
                    {streamingText && (
                         <div className={`p-2 rounded-lg ${theme.buddyTextBg} text-left animate-pulse`}>
                            <span className="font-bold text-xs opacity-70 block">{t('story_creator_screen.buddy_says')}</span>
                            <div>{streamingText}</div>
                         </div>
                    )}

                    {isLoading && !streamingText && storyInProgress.length > 0 && <p className={`text-purple-600 animate-pulse text-left p-2`}>{t('story_creator_screen.buddy_thinks')}</p>}
                </div>
                
                {isLoading && storyInProgress.length === 0 && (
                     <div className="flex items-center justify-center h-full">
                        <p className={`text-xl ${theme.title} animate-pulse`}>{t('story_creator_screen.loading')}</p>
                    </div>
                )}

                {!isStoryFinished ? (
                     <div className="mt-auto pt-4 border-t border-purple-200">
                        <textarea
                            className={`w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none ${theme.inputBorder} text-gray-800 bg-white`}
                            rows={2}
                            placeholder={t('story_creator_screen.placeholder')}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <div className="flex space-x-2 mt-2">
                             <button
                                onClick={handleAddSentence}
                                disabled={isLoading || !userInput.trim()}
                                className={`flex-grow ${theme.button} text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-300`}
                            >
                                {t('story_creator_screen.add_sentence_button')}
                            </button>
                             <button
                                onClick={handleFinishStory}
                                disabled={isLoading || storyInProgress.length < 3}
                                className="bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 transition disabled:bg-gray-300"
                            >
                                {t('story_creator_screen.finish_button')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-auto pt-4 text-center">
                         <h3 className="text-2xl font-bold text-rose-600">{t('story_creator_screen.end_title')}</h3>
                         <p className="text-gray-700 my-2">{t('story_creator_screen.end_subtitle')}</p>
                         <button
                            onClick={handleStartNewStory}
                            className={`w-full ${theme.button} text-white font-bold py-3 px-4 rounded-lg transition`}
                        >
                            {t('story_creator_screen.another_story_button')}
                        </button>
                    </div>
                )}
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
            .story-content { scrollbar-width: thin; scrollbar-color: #A5B4FC #E0E7FF; }
        `}</style>
    </ScreenWrapper>
  );
};

export default StoryCreatorScreen;
