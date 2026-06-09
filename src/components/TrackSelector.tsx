import React from 'react';
import { TRACKS } from '../tracks';
import { GameState } from '../types';
import { audio } from './SoundManager';
import { Check, Star, Play, Compass, RefreshCw } from 'lucide-react';

interface TrackSelectorProps {
  gameState: GameState;
  onSelectTrack: (trackId: string) => void;
  selectedTrackId: string;
  isPracticeMode: boolean;
  onTogglePractice: (practice: boolean) => void;
  onStartEvent: () => void;
  difficulty: 'easy' | 'normal' | 'hard';
  onSelectDifficulty: (difficulty: 'easy' | 'normal' | 'hard') => void;
}

export default function TrackSelector({
  gameState,
  onSelectTrack,
  selectedTrackId,
  isPracticeMode,
  onTogglePractice,
  onStartEvent,
  difficulty,
  onSelectDifficulty
}: TrackSelectorProps) {

  // Convert time to mm:ss.cc format
  const formatTime = (ms: number): string => {
    if (!ms || ms === Infinity) return '---';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];

  const handleSelect = (id: string) => {
    audio.playButtonPress();
    onSelectTrack(id);
  };

  const getDifficultyBadgeColor = (diff: 'Easy' | 'Medium' | 'Hard') => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Medium':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
    }
  };

  // Build SVG points string from waypoints, scaling to 150x110 box automatically
  const renderMiniMapSvg = (waypoints: { x: number; y: number }[]) => {
    if (!waypoints || waypoints.length === 0) return null;
    
    // Find limits
    const xs = waypoints.map((w) => w.x);
    const ys = waypoints.map((w) => w.y);
    const minX = Math.min(...xs) - 80;
    const maxX = Math.max(...xs) + 80;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 80;

    const width = maxX - minX;
    const height = maxY - minY;

    const pointsStr = [...waypoints, waypoints[0]]
      .map((w) => `${w.x},${w.y}`)
      .join(' ');

    return (
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="w-full h-24 overflow-visible drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] filter"
      >
        <polygon
          points={pointsStr}
          fill="none"
          stroke="#475569"
          strokeWidth="60"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={pointsStr}
          fill="none"
          stroke="#1e293b"
          strokeWidth="48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={pointsStr}
          fill="none"
          stroke="url(#minimapGrad)"
          strokeWidth="6"
          strokeDasharray="14,12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="minimapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="bg-black/85 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-md max-w-4xl w-full mx-auto text-white shadow-2xl pointer-events-auto">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-zinc-800/40 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            SELECT RACING EVENT
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Choose a circuit layout and race conditions to challenge your limits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {TRACKS.map((track) => {
          const isSelected = track.id === selectedTrackId;
          const bestTimeValue = gameState.bestTimes[track.id] || 0;
          
          return (
            <div
              key={track.id}
              onClick={() => handleSelect(track.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group ${
                isSelected
                  ? 'bg-cyan-500/5 border-cyan-500 shadow-lg shadow-cyan-500/15'
                  : 'bg-black/40 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              {/* Mini Map Preview Top */}
              <div className="bg-[#050505]/95 p-5 flex items-center justify-center border-b border-zinc-800/80 select-none">
                {renderMiniMapSvg(track.waypoints)}
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between backdrop-blur-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${getDifficultyBadgeColor(track.difficulty)}`}>
                      {track.difficulty.toUpperCase()}
                    </span>
                    {isSelected && (
                      <span className="text-cyan-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-sans font-black tracking-tight text-white text-base group-hover:text-cyan-300 transition-colors">
                    {track.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1 mb-4 line-clamp-2">
                    {track.description}
                  </p>
                </div>

                <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> BEST LAP
                  </span>
                  <span className="font-bold text-white font-mono text-xs">
                    {bestTimeValue > 0 ? formatTime(bestTimeValue) : 'UNRANKED'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mode Configurations (Event vs. Practice Sandbox - with Difficulty parameters) */}
      <div className="border-t border-zinc-800/60 pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-start sm:items-center">
          
          {/* Mode toggle */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1 font-bold">GAME MODE / وضع اللعب</span>
            <div className="flex gap-2.5 bg-black/40 border border-zinc-800 p-1 rounded-xl backdrop-blur-md">
              <button
                onClick={() => { audio.playButtonPress(); onTogglePractice(false); }}
                className={`px-4 py-2 rounded-lg text-xs font-black font-sans tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isPracticeMode
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🏁 Grid Race GP
              </button>
              <button
                onClick={() => { audio.playButtonPress(); onTogglePractice(true); }}
                className={`px-4 py-2 rounded-lg text-xs font-black font-sans tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  isPracticeMode
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🔥 Drift Sandbox
              </button>
            </div>
          </div>

          {/* AI Difficulty selection */}
          {!isPracticeMode && (
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider pl-1 font-bold">BOT DIFFICULTY / الصعوبة</span>
              <div className="flex gap-2 bg-black/40 border border-zinc-800 p-1 rounded-xl backdrop-blur-md text-xs font-bold font-mono">
                <button
                  type="button"
                  onClick={() => { audio.playButtonPress(); onSelectDifficulty('easy'); }}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                    difficulty === 'easy'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/10'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Easy / سهل
                </button>
                <button
                  type="button"
                  onClick={() => { audio.playButtonPress(); onSelectDifficulty('normal'); }}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                    difficulty === 'normal'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/10'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Normal / عادى
                </button>
                <button
                  type="button"
                  onClick={() => { audio.playButtonPress(); onSelectDifficulty('hard'); }}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                    difficulty === 'hard'
                      ? 'bg-rose-500 text-slate-950 font-bold shadow-sm shadow-rose-500/10'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Hard / صعب
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end self-end mt-2 md:mt-0">
          <button
            onClick={onStartEvent}
            className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-black font-sans uppercase tracking-wider text-xs transition-all active:scale-98 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              isPracticeMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
            }`}
          >
            <Play className="w-4 h-4 fill-slate-950" />
            {isPracticeMode ? 'ENTER PRACTICE DRIFT' : `LAUNCH CUP RACE`}
          </button>
        </div>
      </div>
    </div>
  );
}
