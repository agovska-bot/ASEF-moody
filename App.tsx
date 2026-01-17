
import React from 'react';
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
import Toast from './components/Toast';
import WelcomeScreen from './screens/LanguageSelectionScreen';

const App: React.FC = () => {
  const { currentScreen, toastMessage, ageGroup, language, birthDate } = useAppContext();

  const getBackgroundColor = () => {
    if (!ageGroup) return 'bg-amber-50';
    switch (ageGroup) {
      case '7-9': return 'bg-amber-50';
      case '10-12': return 'bg-slate-50';
      case '12+': return 'bg-slate-100';
      default: return 'bg-amber-50';
    }
  }

  // Unified Onboarding check
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
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className={`${getBackgroundColor()} min-h-screen font-sans`}>
      {renderContent()}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};

export default App;
