
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Screen, MoodEntry, Points, ReflectionEntry, AgeGroup, StoryEntry, Language } from '../types';
import { Chat } from '@google/genai';

interface AppContextType {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  moodHistory: MoodEntry[];
  addMood: (mood: MoodEntry) => void;
  reflections: ReflectionEntry[];
  addReflection: (reflection: ReflectionEntry) => void;
  stories: StoryEntry[];
  addStory: (story: StoryEntry) => void;
  points: Points;
  addPoints: (category: keyof Points, amount: number) => void;
  totalPoints: number;
  toastMessage: string | null;
  showToast: (message: string) => void;
  streakDays: number;
  birthDate: string | null;
  setBirthDate: (date: string) => void;
  age: number | null;
  ageGroup: AgeGroup | null;
  isBirthdayToday: boolean;
  language: Language | null;
  setLanguage: (language: Language) => void;
  storyInProgress: string[];
  chatSession: Chat | null;
  startNewStory: (chat: Chat, firstSentence: string) => void;
  continueStory: (userSentence: string, aiSentence: string) => void;
  finishStory: (finalSentence: string) => void;
  resetApp: () => void;
  t: (key: string, fallback?: string) => any;
  isInstallable: boolean;
  installApp: () => void;
  activeTasks: Record<string, string | null>;
  setActiveTask: (category: string, task: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageStorage] = useLocalStorage<Language | null>('language', null);
  const [birthDate, setBirthDateStorage] = useLocalStorage<string | null>('birthDate', null);
  
  const [translationsData, setTranslationsData] = useState<Record<string, any> | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Persistence for active tasks (Kindness, Move, Gratitude)
  const [activeTasks, setActiveTasks] = useLocalStorage<Record<string, string | null>>('activeTasks', {
    kindness: null,
    move: null,
    gratitude: null
  });

  const setActiveTask = useCallback((category: string, task: string | null) => {
    setActiveTasks(prev => ({ ...prev, [category]: task }));
  }, [setActiveTasks]);

  // Derived state for age
  const age = useMemo(() => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [birthDate]);

  const isBirthdayToday = useMemo(() => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
  }, [birthDate]);

  const ageGroup = useMemo((): AgeGroup | null => {
    if (age === null) return null;
    if (age < 9) return '7-9';
    if (age < 13) return '10-12';
    return '12+';
  }, [age]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  useEffect(() => {
    const fetchTranslations = async () => {
        try {
            const [en, mk, tr] = await Promise.all([
                fetch('/locales/en.json').then(res => res.json()),
                fetch('/locales/mk.json').then(res => res.json()),
                fetch('/locales/tr.json').then(res => res.json())
            ]);
            setTranslationsData({ en, mk, tr });
        } catch (error) {
            console.error("Failed to load translation files:", error);
            setTranslationsData({ en: {}, mk: {}, tr: {} }); 
        }
    };
    fetchTranslations();
  }, []);

  const determineInitialScreen = () => {
    const savedLang = localStorage.getItem('language');
    const savedBirth = localStorage.getItem('birthDate');
    if (!savedLang || savedLang === 'null' || savedLang === 'undefined') return Screen.LanguageSelection;
    if (!savedBirth || savedBirth === 'null' || savedBirth === 'undefined') return Screen.AgeSelection;
    return Screen.Home;
  };
  
  const [currentScreen, setCurrentScreen] = useState<Screen>(determineInitialScreen());
  const [moodHistory, setMoodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [reflections, setReflections] = useLocalStorage<ReflectionEntry[]>('reflections', []);
  const [stories, setStories] = useLocalStorage<StoryEntry[]>('stories', []);
  const [points, setPoints] = useLocalStorage<Points>('points', { gratitude: 0, physical: 0, kindness: 0, creativity: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storyInProgress, setStoryInProgress] = useState<string[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const streakDays = useMemo(() => {
    if (moodHistory.length === 0) return 0;
    const dates = moodHistory
      .map(entry => {
        const d = new Date(entry.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .sort((a, b) => b - a);
    const uniqueDates = Array.from(new Set(dates));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (uniqueDates[0] < yesterday.getTime()) return 0;
    let streak = 0;
    let expectedDate = uniqueDates[0];
    for (let i = 0; i < uniqueDates.length; i++) {
        if (uniqueDates[i] === expectedDate) {
            streak++;
            const nextExpected = new Date(expectedDate);
            nextExpected.setDate(nextExpected.getDate() - 1);
            expectedDate = nextExpected.getTime();
        } else {
            break;
        }
    }
    return streak;
  }, [moodHistory]);
  
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const t = useCallback((key: string, fallback?: string): any => {
    if (!translationsData) return fallback || key;
    const currentTranslations = language ? translationsData[language] : translationsData.en;
    if (!key || !currentTranslations) return fallback || key;
    const keys = key.split('.');
    let result: any = currentTranslations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return fallback || key;
    }
    return result;
  }, [language, translationsData]);
  
  const setLanguage = useCallback((lang: Language) => {
    setLanguageStorage(lang);
    setCurrentScreen(Screen.AgeSelection);
  }, [setLanguageStorage]);

  const setBirthDate = useCallback((date: string) => {
    setBirthDateStorage(date);
    setCurrentScreen(Screen.Home);
  }, [setBirthDateStorage]);

  const addMood = useCallback((mood: MoodEntry) => {
    setMoodHistory(prevHistory => [...prevHistory, mood]);
    showToast(t('mood_check_screen.save_toast', 'Mood saved! ✨'));
  }, [setMoodHistory, showToast, t]);

  const addReflection = useCallback((reflection: ReflectionEntry) => {
    setReflections(prev => [...prev, reflection]);
    showToast(t('reflections_screen.save_toast', 'Journal updated! 📝'));
  }, [setReflections, showToast, t]);

  const addStory = useCallback((story: StoryEntry) => {
    setStories(prev => [...prev, story]);
  }, [setStories]);

  const addPoints = useCallback((category: keyof Points, amount: number) => {
    setPoints(prevPoints => ({
      ...prevPoints,
      [category]: prevPoints[category] + amount,
    }));
  }, [setPoints]);
  
  const startNewStory = useCallback((chat: Chat, firstSentence: string) => {
    setChatSession(chat);
    setStoryInProgress([firstSentence]);
  }, []);

  const continueStory = useCallback((userSentence: string, aiSentence: string) => {
    setStoryInProgress(prev => [...prev, userSentence, aiSentence]);
  }, []);

  const finishStory = useCallback((finalSentence: string) => {
    if (storyInProgress.length === 0) return;
    const finalStoryParts = [...storyInProgress, finalSentence];
    const title = finalStoryParts[0].split(' ').slice(0, 5).join(' ') + '...';
    const newStory: StoryEntry = {
        title,
        content: finalStoryParts,
        date: new Date().toISOString(),
    };
    addStory(newStory);
    setStoryInProgress([]);
    setChatSession(null);
  }, [storyInProgress, addStory]);

  const totalPoints = useMemo(() => {
    return points.gratitude + points.physical + points.kindness + points.creativity;
  }, [points]);

  const resetApp = useCallback(() => {
    setLanguageStorage(null);
    setBirthDateStorage(null);
    setMoodHistory([]);
    setReflections([]);
    setStories([]);
    setPoints({ gratitude: 0, physical: 0, kindness: 0, creativity: 0 });
    setStoryInProgress([]);
    setChatSession(null);
    setActiveTasks({ kindness: null, move: null, gratitude: null });
    setCurrentScreen(Screen.LanguageSelection);
    localStorage.clear();
  }, [setLanguageStorage, setBirthDateStorage, setMoodHistory, setReflections, setStories, setPoints, setActiveTasks]);

  if (!translationsData) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-amber-50 text-teal-700 font-black uppercase tracking-widest text-xl">
              Moody Buddy Loading...
          </div>
      )
  }

  return (
    <AppContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      moodHistory,
      addMood,
      reflections,
      addReflection,
      stories,
      addStory,
      points,
      addPoints,
      totalPoints,
      toastMessage,
      showToast,
      streakDays,
      birthDate,
      setBirthDate,
      age,
      ageGroup,
      isBirthdayToday,
      language,
      setLanguage,
      storyInProgress,
      chatSession,
      startNewStory,
      continueStory,
      finishStory,
      resetApp,
      t,
      isInstallable: !!deferredPrompt,
      installApp,
      activeTasks,
      setActiveTask
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
