
import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Screen } from '../types';
import ScreenWrapper from '../components/ScreenWrapper';
import PointsSummary from '../components/PointsSummary';
import TaskCard from '../components/TaskCard';
import { useTranslation } from '../hooks/useTranslation';
import AnimatedTaskCard from '../components/AnimatedTaskCard';

const HomeScreen: React.FC = () => {
  const { setCurrentScreen, ageGroup, resetApp, isInstallable, installApp, isBirthdayToday, showToast } = useAppContext();
  const { t } = useTranslation();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const hasShowedBirthdayToast = useRef(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    if (isBirthdayToday && !hasShowedBirthdayToast.current) {
        hasShowedBirthdayToast.current = true;
        setTimeout(() => {
            showToast(t('home.birthday_toast', "Happy Birthday! 🥳"));
        }, 800);
    }
  }, [isBirthdayToday, showToast, t]);

  const themesMapping = {
    '12+': {
      storyCreator: "bg-indigo-600 text-white",
      rapBattle: "bg-slate-700 text-white",
      gratitude: "bg-teal-600 text-white",
      move: "bg-blue-700 text-white",
      kindness: "bg-rose-600 text-white",
      calmZone: "bg-slate-600 text-white",
    },
    '10-12': {
      storyCreator: "bg-purple-500 text-white",
      rapBattle: "bg-fuchsia-600 text-white",
      gratitude: "bg-teal-500 text-white",
      move: "bg-indigo-500 text-white",
      kindness: "bg-rose-500 text-white",
      calmZone: "bg-green-600 text-white",
    },
    '7-9': {
      storyCreator: "bg-indigo-500 text-white",
      rapBattle: "bg-fuchsia-500 text-white",
      gratitude: "bg-yellow-400 text-yellow-900",
      move: "bg-lime-500 text-white",
      kindness: "bg-emerald-500 text-white",
      calmZone: "bg-sky-400 text-white",
    }
  };
  
  const currentAgeKey = ageGroup || '7-9';
  const theme = themesMapping[currentAgeKey] || themesMapping['7-9'];
  const ageGroupKey = `home.age_${currentAgeKey}`;

  const footerContent = (
    <div className="pb-4">
      <p className="text-sm">
        by <span className="font-semibold text-teal-700">Nikolas Georgievski & Damjan Agovski</span>
      </p>
      <p className="text-xs mt-1">
        FIRSTEP Macedonia Project Competition 2025
      </p>
      
      <div className="flex flex-col gap-3 mt-6 items-center w-full">
        {isInstallable && (
          <button 
            onClick={installApp}
            className="bg-teal-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2 text-sm animate-pulse w-full justify-center max-w-xs"
          >
            <span>📲</span> Install App
          </button>
        )}

        {isIOS && !isStandalone && (
            <div className="bg-white/50 p-3 rounded-2xl text-[10px] text-gray-500 max-w-xs border border-teal-100">
                <p className="font-bold text-gray-700 mb-1 uppercase tracking-tighter">Додај на почетен екран (iPhone):</p>
                <p>1. Допри го копчето <span className="font-bold text-blue-500">Share</span> долу</p>
                <p>2. Избери <span className="font-bold text-gray-800">"Add to Home Screen"</span></p>
            </div>
        )}
        
        <button 
          onClick={resetApp}
          className="text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-red-500 transition-colors mt-4"
        >
          {t('home.reset_button_text')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
      {/* Background Animated Blobs */}
      <div className="fixed top-[-10%] left-[-20%] w-[50rem] h-[50rem] bg-yellow-100/40 rounded-full filter blur-[100px] animate-blob z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-20%] w-[50rem] h-[50rem] bg-blue-100/40 rounded-full filter blur-[100px] animate-blob animation-delay-4000 z-0 pointer-events-none"></div>

      <ScreenWrapper title="" showBackButton={false} footerContent={footerContent}>
        <style>{`
          @keyframes living-flame {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-living-flame {
              background-size: 200% 200%;
              animation: living-flame 5s ease infinite;
          }
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(70px, -90px) scale(1.1); }
            66% { transform: translate(-60px, 60px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 15s infinite alternate ease-in-out;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          @keyframes blink-home { 
            0%, 90%, 100% { transform: scaleY(1); } 
            95% { transform: scaleY(0.1); } 
          }
          .buddy-eye-home { 
            animation: blink-home 5s infinite ease-in-out; 
            transform-origin: center center; 
          }
        `}</style>

        {/* 1. Header & Identity */}
        <div className="flex flex-col items-center text-center pt-2 mb-8 relative z-10">
            <div className="flex flex-row items-center justify-center gap-1">
              <div className="relative flex items-center justify-center h-24 w-24">
                <svg viewBox="0 0 85 55" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45.7,21.9c0-12.1-9.8-21.9-21.9-21.9S2,9.8,2,21.9c0,9.1,5.6,16.9,13.6,20.2l-0.7,5.7c-0.1,0.8,0.5,1.5,1.3,1.5c0.1,0,0.2,0,0.3-0.1l7.3-5.2c1.3,0.2,2.6,0.2,4,0.2C35.9,43.8,45.7,34,45.7,21.9z" fill="#50C878" stroke="#004D40" strokeWidth="3" />
                  {/* Fixed duplicate cx attribute by changing second cx to cy */}
                  <circle className="buddy-eye-home" cx="15.8" cy="20.5" r="3" fill="#004D40" />
                  <circle className="buddy-eye-home" cx="32.8" cy="20.5" r="3" fill="#004D40" />
                  <path d="M18.8,29.5c0,0,3,4,8,0" fill="none" stroke="#004D40" strokeWidth="3" strokeLinecap="round" />
                  <g transform="translate(42, 26) scale(0.68)">
                    <path d="M15,2v26 M2,15h26" fill="none" stroke="#004D40" strokeWidth="17" strokeLinecap="round"/>
                    <path d="M15,2v26 M2,15h26" fill="none" stroke="#FFCB05" strokeWidth="11" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              <div className="flex flex-col items-start leading-[0.85] ml-1">
                  <span className="text-[2.2rem] font-black text-[#004D40] tracking-tighter">Moody</span>
                  <span className="text-[2.2rem] font-black text-[#004D40] tracking-tighter">Buddy</span>
              </div>
            </div>
            <p className="text-[12px] font-black text-teal-800 uppercase tracking-[0.15em] mt-1">
              {t('home.subtitle')}
            </p>
        </div>

        <div className="space-y-6 relative z-10">
          <section className="bg-white/40 backdrop-blur-md rounded-3xl p-4 border border-white/60 shadow-inner">
              <PointsSummary />
              <button
                  onClick={() => setCurrentScreen(Screen.MoodCheck)}
                  className="w-full p-6 mt-4 rounded-2xl flex items-center space-x-4 text-white bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-living-flame group relative overflow-hidden text-left"
              >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
                      <span className="text-8xl">❤️‍🩹</span>
                  </div>
                  <span className="text-5xl drop-shadow-lg z-10 flex-shrink-0">❤️‍🩹</span>
                  <div className="z-10 flex flex-col justify-center overflow-hidden">
                      <p className="text-2xl font-black leading-tight drop-shadow-sm break-words">{t(`${ageGroupKey}.mood_check_title`)}</p>
                      <p className="text-sm font-bold opacity-90 mt-1 line-clamp-2">{t(`${ageGroupKey}.mood_check_description`)}</p>
                  </div>
              </button>
          </section>

          <div className="flex items-center gap-4 px-2">
              <div className="h-px bg-teal-200 flex-grow"></div>
              <h2 className="text-xs font-black text-teal-800 uppercase tracking-[0.2em] whitespace-nowrap">
                  {t('home.more_activities_title', 'Авантури')}
              </h2>
              <div className="h-px bg-teal-200 flex-grow"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatedTaskCard 
                title={t(`${ageGroupKey}.story_creator_title`)}
                description={t(`${ageGroupKey}.story_creator_description`)}
                icon="📖"
                color={theme.storyCreator}
                animationType="story-bubbles"
                onClick={() => setCurrentScreen(Screen.StoryCreator)}
            />
            
            {/* Added Rap Battle to Activity Hub */}
            <div className="grid grid-cols-2 gap-4">
                <AnimatedTaskCard 
                    title={t(`${ageGroupKey}.rap_battle_title`)}
                    icon="🎤"
                    color={theme.rapBattle}
                    isGrid={true}
                    animationType="mood-bubbles"
                    onClick={() => setCurrentScreen(Screen.RapBattle)}
                />
                <AnimatedTaskCard 
                    title={t(`${ageGroupKey}.gratitude_jar_title`)}
                    icon="🌟"
                    color={theme.gratitude}
                    isGrid={true}
                    animationType="rising-stars"
                    onClick={() => setCurrentScreen(Screen.Gratitude)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <AnimatedTaskCard 
                    title={t(`${ageGroupKey}.get_moving_title`)}
                    icon="💪"
                    color={theme.move}
                    isGrid={true}
                    animationType="running-man"
                    onClick={() => setCurrentScreen(Screen.Move)}
                />
                <AnimatedTaskCard 
                    title={t(`${ageGroupKey}.kindness_act_title`)}
                    icon="💖"
                    color={theme.kindness}
                    isGrid={true}
                    animationType="fireworks"
                    onClick={() => setCurrentScreen(Screen.Kindness)}
                />
            </div>

            <AnimatedTaskCard 
                title={t(`${ageGroupKey}.calm_zone_title`)}
                description={t(`${ageGroupKey}.calm_zone_description`)}
                icon="🌬️"
                color={theme.calmZone}
                animationType="floating-cloud"
                onClick={() => setCurrentScreen(Screen.CalmZone)}
            />
          </div>

          <div className="pt-2">
              <AnimatedTaskCard
                  onClick={() => setCurrentScreen(Screen.Reflection)}
                  title={t(`${ageGroupKey}.reflections_title`)}
                  icon="📝"
                  color="bg-white border-2 border-teal-100 text-teal-800"
                  animationType="writing-pencil"
                  animationColor="text-orange-400"
              />
          </div>
        </div>
      </ScreenWrapper>
    </div>
  );
};

export default HomeScreen;
