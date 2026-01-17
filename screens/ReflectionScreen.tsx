
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import PointsSummary from '../components/PointsSummary';
import { MOOD_EMOJIS, MOOD_COLORS } from '../constants';
import { MoodEntry, ReflectionEntry, StoryEntry, Mood } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const MOOD_HEX_COLORS: Record<Mood, string> = {
  Happy: '#FACC15',
  Sad: '#60A5FA',
  Angry: '#F87171',
  Worried: '#C084FC',
  Tired: '#9CA3AF',
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
};

const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

const MoodChart: React.FC<{ history: MoodEntry[], isOlderGroup: boolean }> = ({ history, isOlderGroup }) => {
    const { t } = useTranslation();
    const data = useMemo(() => {
        if (history.length === 0) return [];
        const counts: Record<string, number> = {};
        history.forEach(entry => { counts[entry.mood] = (counts[entry.mood] || 0) + 1; });
        const total = history.length;
        let accumulatedPercent = 0;
        return Object.keys(counts).map(mood => {
            const count = counts[mood];
            const percent = count / total;
            const startPercent = accumulatedPercent;
            accumulatedPercent += percent;
            return { mood: mood as Mood, count, percent, startPercent };
        });
    }, [history]);

    if (history.length === 0) return null;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const containerClasses = isOlderGroup 
        ? "bg-white/80 backdrop-blur-md border border-white shadow-md mx-0 mb-6 pt-6"
        : "bg-white shadow-md mx-1 mb-6 transform rotate-1 pt-6 rounded-xl border border-gray-100";
    
    const badgeClasses = isOlderGroup
        ? "bg-teal-100 text-teal-800"
        : "bg-yellow-100 text-yellow-800 shadow-sm transform -rotate-2 border border-yellow-200";

    return (
        <div className={`flex flex-col items-center justify-center py-4 rounded-xl relative ${containerClasses}`}>
             <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold z-30 whitespace-nowrap rounded-full ${badgeClasses}`}>
                {t('reflections_screen.mood_chart_title')}
            </div>
            <div className="flex flex-row items-center justify-center gap-4 p-2 w-full">
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full" style={{ overflow: 'visible' }}>
                        {data.map((slice, index) => {
                            const [startX, startY] = getCoordinatesForPercent(slice.startPercent);
                            const [endX, endY] = getCoordinatesForPercent(slice.startPercent + slice.percent);
                            if (slice.percent === 1) return <circle cx="0" cy="0" r="1" fill={MOOD_HEX_COLORS[slice.mood]} key={index} />;
                            const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
                            const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `Z`].join(' ');
                            return <path d={pathData} fill={MOOD_HEX_COLORS[slice.mood]} key={index} stroke="white" strokeWidth="0.05" />;
                        })}
                        <circle cx="0" cy="0" r="0.6" fill={isOlderGroup ? "#f8fafc" : "white"} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-xl font-bold text-gray-700 leading-none mb-0.5">{history.length}</span>
                        <span className="text-[0.6rem] uppercase text-gray-500 font-bold leading-none tracking-tighter">Total</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-grow">
                    {data.sort((a,b) => b.count - a.count).map((slice) => (
                        <div key={slice.mood} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: MOOD_HEX_COLORS[slice.mood] }}></div>
                            <span className="text-xs font-bold text-gray-600 leading-tight">{t(`moods.${slice.mood}`)}</span>
                            <span className="text-xs text-gray-400 font-mono flex-shrink-0">({slice.count})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ReflectionScreen: React.FC = () => {
  const { moodHistory, reflections, stories, addReflection, ageGroup } = useAppContext();
  const { t } = useTranslation();
  const [newReflection, setNewReflection] = useState('');
  const [expandedStoryDate, setExpandedStoryDate] = useState<string | null>(null);

  const screenTitle = t(`home.age_${ageGroup}.reflections_title`);
  const isOlderGroup = ageGroup === '10-12';

  const prompt = useMemo(() => {
    const promptsArray = t('reflections_screen.prompts');
    if (Array.isArray(promptsArray) && promptsArray.length > 0) {
        return promptsArray[Math.floor(Math.random() * promptsArray.length)];
    }
    return "What was the best part of your day?";
  }, [t]);

  const handleAddReflection = () => {
    if (newReflection.trim()) {
      addReflection({ prompt, text: newReflection, date: new Date().toISOString() });
      setNewReflection('');
    }
  };

  const toggleStoryExpansion = (date: string) => {
    setExpandedStoryDate(currentDate => currentDate === date ? null : date);
  };

  const combinedEntries = useMemo(() => {
    return [...moodHistory, ...reflections, ...stories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [moodHistory, reflections, stories]);

  const mainContainerClass = isOlderGroup 
    ? 'bg-slate-50 rounded-xl shadow-lg border border-slate-200' 
    : 'bg-[#fdfbf7] rounded-r-lg rounded-l-md shadow-2xl border-l-8 border-teal-800/80';
  
  const renderEntry = (entry: MoodEntry | ReflectionEntry | StoryEntry, index: number) => {
    const rotation = (!isOlderGroup && index % 2 === 0) ? '-rotate-1' : (!isOlderGroup ? 'rotate-1' : '');
    const headerDateStyle = "text-[11px] text-gray-400 font-sans mb-1 font-medium";
    const entryTitleStyle = "text-xl font-bold text-[#064e3b] leading-tight mb-1";
    const entryBodyStyle = "text-[15px] text-slate-600 leading-relaxed italic opacity-90 whitespace-pre-wrap break-words";

    const entryContainerClass = isOlderGroup 
        ? "mb-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100"
        : `mb-6 relative pl-4 pr-4 transform ${rotation} hover:rotate-0 transition-transform`;

    if ('mood' in entry) {
        return (
            <div className={entryContainerClass}>
                <p className={headerDateStyle}>
                    {formatDate(entry.date)} • {formatTime(entry.date)}
                </p>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full text-2xl ${MOOD_COLORS[entry.mood]} shadow-md border-2 border-white`}>
                        {MOOD_EMOJIS[entry.mood]}
                    </div>
                    <h3 className={entryTitleStyle}>
                        {t('reflections_screen.feeling_mood').replace('{mood}', t(`moods.${entry.mood}`))}
                    </h3>
                </div>
                {entry.note && (
                    <p className={entryBodyStyle}>
                        "{ entry.note }"
                    </p>
                )}
                {!isOlderGroup && <div className="w-full h-px bg-teal-900/10 mt-4"></div>}
            </div>
        );
    }

    if ('content' in entry) {
        const isExpanded = expandedStoryDate === entry.date;
        const storyHeaderBg = isOlderGroup ? "bg-white" : "bg-purple-50/50 p-5 rounded-r-lg border-l-4 border-purple-300 shadow-sm";
        return (
             <div className={`mb-4 group cursor-pointer transition-all ${isExpanded ? 'ring-2 ring-purple-100' : ''} rounded-xl shadow-sm border border-purple-100 p-4 ${storyHeaderBg}`} onClick={() => toggleStoryExpansion(entry.date)}>
                <p className={headerDateStyle}>{formatDate(entry.date)}</p>
                <div className="flex items-start justify-between gap-4">
                     <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-2xl bg-purple-100 rounded-lg p-2 flex-shrink-0">📖</span>
                        <div className="min-w-0">
                            <h3 className={entryTitleStyle}>{entry.title}</h3>
                        </div>
                    </div>
                    <span className="text-purple-400 text-xl flex-shrink-0">{isExpanded ? '−' : '+'}</span>
                </div>
                {!isExpanded && <p className="text-gray-500 mt-2 text-sm truncate opacity-70 italic">"{entry.content[0]}..."</p>}
                {isExpanded && (
                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto story-scroll pr-2">
                        {entry.content.map((part, partIndex) => (
                            <p key={partIndex} className={`text-base whitespace-pre-wrap break-words ${partIndex % 2 === 0 ? 'text-gray-700 font-medium' : 'text-purple-700 italic'}`}>
                               {part}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={entryContainerClass}>
            <p className={headerDateStyle}>{formatDate(entry.date)}</p>
            <h3 className={entryTitleStyle}>{entry.prompt || t('reflections_screen.reflection_title')}</h3>
            <p className={entryBodyStyle}>"{entry.text}"</p>
            {!isOlderGroup && <div className="w-full h-px bg-teal-900/10 mt-4"></div>}
        </div>
    );
  }

  return (
    <ScreenWrapper title={screenTitle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        .font-handwriting { font-family: 'Dancing Script', cursive; }
        .lined-paper { background-color: #fdfbf7; background-image: linear-gradient(#e5e5e5 1px, transparent 1px); background-size: 100% 2.5rem; }
        .notebook-holes { background-image: radial-gradient(#f3f4f6 20%, transparent 20%); background-size: 100% 40px; background-position: 10px 10px; }
        .story-scroll { scrollbar-width: thin; scrollbar-color: #d8b4fe transparent; }
      `}</style>
      <div className="flex flex-col flex-grow h-full">
        <div className="mb-4"> <PointsSummary /> </div>
        <div className={`flex-grow overflow-hidden flex flex-col relative ${mainContainerClass}`}>
            {!isOlderGroup && <div className="absolute left-0 top-0 bottom-0 w-8 z-10 notebook-holes border-r border-gray-200/50"></div>}
            <div className={`p-6 pb-0 relative z-0 ${!isOlderGroup ? 'pl-10' : ''}`}>
                {isOlderGroup ? (
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-sm font-semibold text-slate-500 mb-2">{prompt}</p>
                         <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all resize-none" rows={3} placeholder={t('reflections_screen.reflection_placeholder')} value={newReflection} onChange={(e) => setNewReflection(e.target.value)} />
                        <div className="flex justify-end mt-2">
                             <button onClick={handleAddReflection} disabled={!newReflection.trim()} className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg text-sm shadow hover:bg-teal-700 transition-colors disabled:opacity-50">
                                {t('reflections_screen.save_reflection_button')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`relative bg-yellow-200 p-4 pb-12 shadow-md transform -rotate-1 transition-transform focus-within:rotate-0 focus-within:scale-[1.02] duration-300`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 rotate-2 z-10 pointer-events-none">
                            <div className="w-full h-full bg-white/40 backdrop-blur-[1px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-l border-r border-white/60"></div>
                        </div>
                        <p className="font-handwriting text-xl text-gray-800 mb-2 opacity-75 text-center mt-2">"{prompt}"</p>
                        <textarea className={`w-full bg-transparent border-b border-gray-400/30 focus:border-gray-500 focus:outline-none text-2xl font-handwriting text-gray-900 leading-relaxed placeholder-gray-500/50 resize-none`} rows={2} placeholder={t('reflections_screen.reflection_placeholder')} value={newReflection} onChange={(e) => setNewReflection(e.target.value)} />
                        <div className="absolute bottom-2 right-2">
                            <button onClick={handleAddReflection} disabled={!newReflection.trim()} className="bg-teal-700 text-white font-bold py-1 px-4 rounded-full text-sm shadow hover:bg-teal-800 transition-colors disabled:opacity-50 font-sans">
                                {t('reflections_screen.save_reflection_button')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className={`flex-grow overflow-y-auto p-6 relative ${!isOlderGroup ? 'pl-12 lined-paper' : ''}`}>
                <MoodChart history={moodHistory} isOlderGroup={isOlderGroup} />
                <h2 className={`text-center text-teal-800 mb-6 ${isOlderGroup ? 'text-xl font-bold font-sans' : 'text-3xl font-handwriting underline decoration-wavy decoration-teal-300/50'}`}>
                    {t('reflections_screen.journal_title')}
                </h2>
                <div className="space-y-2">
                {combinedEntries.length > 0 ? (
                    combinedEntries.map((entry, index) => <div key={entry.date}>{renderEntry(entry, index)}</div>)
                ) : (
                    <div className="text-center py-10 opacity-50">
                        <p className={`${isOlderGroup ? 'text-base font-sans' : 'font-handwriting text-2xl'} text-gray-500`}>{t('reflections_screen.journal_empty')}</p>
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default ReflectionScreen;
