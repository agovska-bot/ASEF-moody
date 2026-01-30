
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Screen } from '../types';

interface ScreenWrapperProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  footerContent?: React.ReactNode;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, title, showBackButton = true, footerContent }) => {
  const { setCurrentScreen } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full relative overflow-x-hidden">
        {/* Main Content Container - No more 'boxed' frame background/shadow */}
        <div className="w-full max-w-md px-6 py-8 flex flex-col min-h-screen relative z-10">
            <main className="flex-grow flex flex-col">
                {title && (
                    <header className="relative flex items-center justify-center mb-8">
                        {showBackButton && (
                            <button
                            onClick={() => setCurrentScreen(Screen.Home)}
                            className="absolute left-0 w-12 h-12 flex items-center justify-center bg-white/40 backdrop-blur-md rounded-full text-teal-700 hover:text-teal-900 text-3xl transition-all active:scale-90 shadow-sm border border-white/50"
                            aria-label="Back to Home"
                            >
                            ‹
                            </button>
                        )}
                        <h1 className="text-3xl font-black text-center text-teal-900 px-14 leading-tight drop-shadow-sm">
                            {title}
                        </h1>
                    </header>
                )}
                <div className="flex-grow flex flex-col relative">
                    {children}
                </div>
            </main>
            {footerContent && (
                <footer className="text-center pt-8 text-gray-400 mt-auto opacity-70">
                    {footerContent}
                </footer>
            )}
        </div>
    </div>
  );
};

export default ScreenWrapper;
