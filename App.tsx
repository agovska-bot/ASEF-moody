
import React, { useEffect, useState } from 'react';
import { useAppContext } from './context/AppContext';
import { Screen } from './types';
import HomeScreen from './screens/HomeScreen';
import MoodCheckScreen from './screens/MoodCheckScreen';
import GratitudeScreen from './screens/GratitudeScreen';
import MoveScreen from './screens/MoveScreen';
import CalmZoneScreen from './screens/CalmZoneScreen';
import KindnessScreen from './screens/KindnessScreen';
import ReflectionScreen from './screens/ReflectionScreen';
import StoryCreatorScreen from './screens/StoryCreatorScreen';
import RapBattleScreen from './screens/RapBattleScreen';
import Toast from './components/Toast';
import WelcomeScreen from './screens/LanguageSelectionScreen';

const App: React.FC = () => {
  const { currentScreen, toastMessage, ageGroup, language, birthDate } = useAppContext();
  const [keyMissing, setKeyMissing] = useState(false);

  useEffect(() => {
    // Check for a valid key. 
    // Vite's 'define' replaces process.env.API_KEY with a string literal during build.
    const apiKey = (process.env.API_KEY || "").trim();
    const isPlaceholder = apiKey === "" || apiKey === "YOUR_API_KEY" || apiKey === "undefined" || apiKey === "null";
    
    if (isPlaceholder) {
      setKeyMissing(true);
      console.error("[Moody Buddy] CRITICAL: API_KEY is missing or invalid in the build environment.");
    } else {
      setKeyMissing(false);
      const obscuredKey = apiKey.length > 8 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` 
        : "***";
      console.log(`[Moody Buddy] AI System Initialized. Key: ${obscuredKey} (Len: ${apiKey.length})`);
    }
  }, []);

  const getBackgroundColor = () => {
    if (!ageGroup) return 'bg-amber-50';
    switch (ageGroup) {
      case '7-9': return 'bg-amber-50';
      case '10-12': return 'bg-slate-50';
      case '12+': return 'bg-slate-100';
      default: return 'bg-amber-50';
    }
  }

  if (!language || !birthDate) {
    return (
      <div className="bg-amber-50 min-h-screen font-sans">
        <WelcomeScreen />
        {toastMessage && <Toast message={toastMessage} />}
      </div>
    );
  }

  const renderContent = () => {
    switch (currentScreen) {
      case Screen.Home:
        return <HomeScreen />;
      case Screen.MoodCheck:
        return <MoodCheckScreen />;
      case Screen.Gratitude:
        return <GratitudeScreen />;
      case Screen.Move:
        return <MoveScreen />;
      case Screen.CalmZone:
        return <CalmZoneScreen />;
      case Screen.Kindness:
        return <KindnessScreen />;
      case Screen.Reflection:
        return <ReflectionScreen />;
      case Screen.StoryCreator:
        return <StoryCreatorScreen />;
      case Screen.RapBattle:
        return <RapBattleScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className={`${getBackgroundColor()} min-h-screen font-sans relative`}>
      {keyMissing && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-[11px] py-1.5 px-4 z-[9999] text-center font-bold uppercase tracking-wider shadow-xl flex items-center justify-center gap-2">
          <span>⚠️ AI OFFLINE</span>
          <span className="opacity-80 font-normal normal-case">Check Vercel Environment Variables (API_KEY)</span>
        </div>
      )}
      {renderContent()}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};

export default App;
