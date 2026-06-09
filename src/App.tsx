import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from './types';
import { CARS } from './cars';
import { TRACKS } from './tracks';
import { audio } from './components/SoundManager';
import GameCanvas from './components/GameCanvas';
import GarageMenu from './components/GarageMenu';
import TrackSelector from './components/TrackSelector';
import { Play, Flame, Wrench, Compass, Trophy, Info, Sparkles, AlertTriangle } from 'lucide-react';

const INITIAL_GAME_STATE: GameState = {
  currentTrackId: 'classic_oval',
  currentCarId: 'street_drifter',
  unlockedCars: ['street_drifter'],
  credits: 350, // Starting bonus
  upgrades: {},
  bestTimes: {}
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [activeScreen, setActiveScreen] = useState<'MENU' | 'GAME'>('MENU');
  const [menuTab, setMenuTab] = useState<'MAIN' | 'GARAGE' | 'TRACK_SELECT'>('MAIN');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  
  // Immersive Long Loading Screen States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('BOOTING VIRTUAL MACHINE');

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('drift_racer_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure keys remain intact even if save is legacy
        setGameState({
          ...INITIAL_GAME_STATE,
          ...parsed,
          unlockedCars: parsed.unlockedCars || ['street_drifter'],
          upgrades: parsed.upgrades || {},
          bestTimes: parsed.bestTimes || {}
        });
      } catch (e) {
        console.warn('Could not parse game save, defaulting to baseline state.');
      }
    }
  }, []);

  // Instantly handle the loading screen progress updates
  useEffect(() => {
    if (!isLoading) return;

    setLoadingProgress(0);
    setLoadingText('CONNECTING CORE DEVIATIVE PHYSICS ENGINE...');

    const stages = [
      { prg: 6, text: 'SYNCHRONIZING VECTOR TRACK WAYPOINTS...' },
      { prg: 18, text: 'PRE-WARMING WEB AUDIO PROCEDURAL SYNTHS...' },
      { prg: 34, text: 'ALLOCATING HEURISTIC DRIFT MULTIPLIERS...' },
      { prg: 48, text: 'COMPILING RAYCAST PERSPECTIVE ARRAYS...' },
      { prg: 62, text: 'INITIALIZING PERSONAL BEST GHOSTRUNNERS...' },
      { prg: 76, text: 'WARMING RADIAL TIRE TEMPERATURE COEFFICIENTS...' },
      { prg: 88, text: 'CALIBRATING SPEEDOMETER GEAR TRANSLATORS...' },
      { prg: 95, text: 'SIMULATION COMPILED WITH ZERO WARP INDICES.' },
      { prg: 99, text: 'READY TO START. ENGAGE THRUSTERS...' }
    ];

    let currentProgress = 0;
    
    const interval = setInterval(() => {
      // Slower incremental steps for an immersive countdown feel
      currentProgress += Math.random() * 1.5 + 0.5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Final transition delay for maximum cinematic feedback
        setTimeout(() => {
          setIsLoading(false);
          setActiveScreen('GAME');
        }, 1200);
      }
      
      setLoadingProgress(Math.floor(currentProgress));

      // Match diagnostic stage message based on progress bracket
      const matchedStage = [...stages].reverse().find(s => currentProgress >= s.prg);
      if (matchedStage) {
        setLoadingText(matchedStage.text);
      }
    }, 40); // Slower updates to make it feel long, premium, and highly detailed (~ 5 seconds setup loop)

    return () => clearInterval(interval);
  }, [isLoading]);

  const currentCar = CARS.find((c) => c.id === gameState.currentCarId) || CARS[0];
  const currentTrack = TRACKS.find((t) => t.id === gameState.currentTrackId) || TRACKS[0];

  const handleSelectCar = (carId: string) => {
    setGameState((prev) => {
      const next = { ...prev, currentCarId: carId };
      localStorage.setItem('drift_racer_save', JSON.stringify(next));
      return next;
    });
  };

  const handleUnlockCar = (carId: string) => {
    const car = CARS.find((c) => c.id === carId);
    if (!car) return;
    setGameState((prev) => {
      if (prev.credits < car.price || prev.unlockedCars.includes(carId)) return prev;
      const next = {
        ...prev,
        credits: prev.credits - car.price,
        unlockedCars: [...prev.unlockedCars, carId],
        currentCarId: carId // auto-select newly unlocked vehicle
      };
      localStorage.setItem('drift_racer_save', JSON.stringify(next));
      return next;
    });
  };

  const handleUpgradeStat = (carId: string, statType: 'engine' | 'tires' | 'handling' | 'weight') => {
    setGameState((prev) => {
      const nextUpgrades = { ...prev.upgrades };
      const currentStats = nextUpgrades[carId] || { engine: 0, tires: 0, handling: 0, weight: 0 };
      const currentLvl = currentStats[statType];
      
      const UPGRADE_PRICES = [60, 120, 200, 320, 480];
      const price = UPGRADE_PRICES[currentLvl];
      if (prev.credits < price || currentLvl >= 5) return prev;

      nextUpgrades[carId] = {
        ...currentStats,
        [statType]: currentLvl + 1
      };

      const next = {
        ...prev,
        credits: prev.credits - price,
        upgrades: nextUpgrades
      };
      localStorage.setItem('drift_racer_save', JSON.stringify(next));
      return next;
    });
  };

  const handleTrackCompleted = (trackId: string, lapTime: number, creditsEarned: number) => {
    setGameState((prev) => {
      const updatedTimes = { ...prev.bestTimes };
      if (lapTime > 0 && (updatedTimes[trackId] === undefined || lapTime < updatedTimes[trackId])) {
        updatedTimes[trackId] = lapTime;
      }
      const next = {
        ...prev,
        credits: prev.credits + creditsEarned,
        bestTimes: updatedTimes
      };
      localStorage.setItem('drift_racer_save', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateCredits = (amount: number) => {
    setGameState((prev) => {
      const next = {
        ...prev,
        credits: prev.credits + amount
      };
      localStorage.setItem('drift_racer_save', JSON.stringify(next));
      return next;
    });
  };

  const handlePlayButton = () => {
    audio.playButtonPress();
    setMenuTab('TRACK_SELECT');
  };

  // Turn mm:ss.cc format
  const formatTime = (ms: number): string => {
    if (!ms || ms === Infinity) return '---';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div id="app-viewport-root" className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* Background Racing Track Perspective Simulator (Only active on menu lobbies) */}
      {activeScreen !== 'GAME' && (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0a1a] via-[#111122] to-[#050505] overflow-hidden pointer-events-none">
          {/* Track Perspective Lines */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2000px] h-[400px] border-x-[150px] border-b-[800px] border-transparent border-b-zinc-800 opacity-40"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] border-x-[50px] border-b-[800px] border-transparent border-b-zinc-700 opacity-30"></div>
          {/* Road Markings */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-4 h-32 bg-yellow-400/60 blur-[1px]"></div>
          <div className="absolute bottom-[300px] left-1/2 -translate-x-1/2 w-3 h-20 bg-yellow-400/30 blur-[2px]"></div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col justify-center relative z-10">
        
        {/* State 1: Active In-Game Screen */}
        {activeScreen === 'GAME' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col"
          >
            {/* Game Navigation bar */}
            <div className="flex justify-between items-center mb-4 bg-black/60 border border-zinc-800/80 p-3 rounded-2xl backdrop-blur-md">
              <div>
                <span className="text-[10px] font-mono uppercase bg-zinc-900 text-cyan-400 px-2.5 py-1 rounded border border-zinc-800">
                  {isPracticeMode ? 'DRIFT PRACTICE SANDBOX' : 'RACER COMP CUP'}
                </span>
                <h1 className="text-sm font-bold tracking-tight mt-1 text-slate-200">
                  {currentCar.name} <span className="text-slate-500">@</span> {currentTrack.name}
                </h1>
              </div>

              <button
                onClick={() => {
                  audio.playButtonPress();
                  setActiveScreen('MENU');
                  setMenuTab('TRACK_SELECT');
                }}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-lg border border-zinc-800 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
              >
                ABANDON RUN
              </button>
            </div>

            <GameCanvas
              gameState={gameState}
              onTrackCompleted={handleTrackCompleted}
              onUpdateCredits={handleUpdateCredits}
              onCloseGame={() => {
                setActiveScreen('MENU');
                setMenuTab('TRACK_SELECT');
              }}
              isPracticeMode={isPracticeMode}
              difficulty={difficulty}
            />
          </motion.div>
        ) : (
          /* State 2: Active Menu Screens */
          <div className="flex flex-col gap-6">
            
            {/* Top Logo Brand */}
            <header className="text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800/40 pb-5">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500 p-2.5 rounded-2xl shadow-lg shadow-cyan-500/20 active:rotate-12 transition-transform select-none">
                  <Flame className="w-6 h-6 text-slate-950 fill-slate-950 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter leading-none text-white font-sans">
                    DRIFT RACER
                  </h1>
                  <span className="text-[10px] text-cyan-400 font-mono block tracking-widest mt-1 uppercase">
                    PRO AUDIO SYNTHESIS & VECTOR PHYSICS
                  </span>
                </div>
              </div>

              {/* Bank Funds Indicator Block */}
              <div className="flex items-center gap-3 bg-black/60 border border-zinc-800 rounded-2xl px-4 py-2 text-right backdrop-blur-md">
                <div>
                  <span className="text-[8px] text-zinc-400 font-mono uppercase">Your Account</span>
                  <div className="text-sm font-black text-cyan-400 font-mono leading-none mt-1">
                    {gameState.credits} <span className="text-[10px] text-cyan-500 font-normal">CR</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Menu Sections Switch Case */}
            <AnimatePresence mode="wait">
              {menuTab === 'MAIN' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                  key="main_menu"
                >
                  {/* Left Hero Graphic Section */}
                  <div className="md:col-span-7 flex flex-col justify-center text-center md:text-left py-6 pr-0 md:pr-4">
                    <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest mb-3 flex items-center justify-center md:justify-start gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" /> ARCADE SIMULATOR ENGINE
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4 text-white">
                      FEEL THE LATERAL DEVIATION.
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-lg">
                      Enter clean high-precision drifts to earn upgrades. Programmed with pure vector physics,
                      procedural engine audio synthesis, ghost overlays, and dynamic waypoint racers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                      <button
                        onClick={handlePlayButton}
                        className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-sans uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-cyan-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        SELECT RACING CHALLENGE
                      </button>
                      <button
                        onClick={() => { audio.playButtonPress(); setMenuTab('GARAGE'); }}
                        className="px-8 py-3.5 bg-black/40 hover:bg-zinc-900 border border-zinc-800 text-white font-black font-sans uppercase tracking-widest text-xs rounded-xl hover:border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
                      >
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        VEHICLE GARAGE
                      </button>
                    </div>

                    {/* Safety Audio Notice Banner */}
                    <div className="mt-8 bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex items-center gap-2.5 max-w-md select-none">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                      <p className="text-[10px] text-slate-400 text-left leading-normal font-mono">
                        Procedural synth engine utilizes Web Audio. Hovering or clicking buttons will initiate audio context safely in this browser sandbox.
                      </p>
                    </div>
                  </div>

                  {/* Right Side Status Panel Grid (Bento style) */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest pl-1">
                      Active Campaign Status
                    </h3>

                    {/* Current Vehicle Cell */}
                    <div className="bg-black/60 border border-zinc-800/80 p-4.5 rounded-2xl flex items-center justify-between backdrop-blur-md">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-mono uppercase block">CURRENT DRIFTER</span>
                        <h4 className="font-bold text-base text-white mt-1">{currentCar.name}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono inline-block mt-0.5 italic">
                          "{currentCar.description.substring(0, 52)}..."
                        </span>
                      </div>
                      <div className="px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-center">
                        <span className="text-[8px] text-zinc-500 font-mono block">COLOR</span>
                        <div
                          className="w-5 h-5 rounded-full border border-zinc-700 shadow-sm mx-auto mt-1"
                          style={{ backgroundColor: currentCar.color }}
                        />
                      </div>
                    </div>

                    {/* Selected Track Cell */}
                    <div className="bg-black/60 border border-zinc-800/80 p-4.5 rounded-2xl flex items-center justify-between backdrop-blur-md">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-mono uppercase block font-medium">SELECTED SPEEDWAY</span>
                        <h4 className="font-bold text-base text-white mt-1">{currentTrack.name}</h4>
                        <span className="text-[10px] text-cyan-400 font-mono block mt-1">
                          Difficulty: <span className="text-amber-400 font-semibold">{currentTrack.difficulty}</span>
                        </span>
                      </div>
                      <div className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-center min-w-[100px]">
                        <span className="text-[8px] text-zinc-500 font-mono block">BEST TIME</span>
                        <span className="text-xs font-mono font-bold text-cyan-400 mt-1 block">
                          {formatTime(gameState.bestTimes[currentTrack.id] || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Overall Records Cell */}
                    <div className="bg-cyan-500/10 border-l-2 border-cyan-500 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md">
                      <Trophy className="w-5 h-5 text-cyan-400" />
                      <div>
                        <span className="text-[9px] text-cyan-500 font-mono block uppercase">Unlocked Garage Fleet</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {gameState.unlockedCars.length} of {CARS.length} Cars Unlocked
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {menuTab === 'GARAGE' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  key="garage_view"
                  className="w-full"
                >
                  <GarageMenu
                    gameState={gameState}
                    onSelectCar={handleSelectCar}
                    onUnlockCar={handleUnlockCar}
                    onUpgradeStat={handleUpgradeStat}
                    onClose={() => {
                      audio.playButtonPress();
                      setMenuTab('MAIN');
                    }}
                  />
                </motion.div>
              )}

              {menuTab === 'TRACK_SELECT' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  key="track_select_view"
                  className="w-full"
                >
                  <TrackSelector
                    gameState={gameState}
                    onSelectTrack={(trackId) => {
                      setGameState((prev) => {
                        const next = { ...prev, currentTrackId: trackId };
                        localStorage.setItem('drift_racer_save', JSON.stringify(next));
                        return next;
                      });
                    }}
                    selectedTrackId={gameState.currentTrackId}
                    isPracticeMode={isPracticeMode}
                    onTogglePractice={setIsPracticeMode}
                    onStartEvent={() => {
                      audio.playButtonPress();
                      setIsLoading(true);
                    }}
                    difficulty={difficulty}
                    onSelectDifficulty={setDifficulty}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        audio.playButtonPress();
                        setMenuTab('MAIN');
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ← Return to Main Page Lobby
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Dynamic Immersive Diagnostic Loading Screen Layer */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-8 select-none"
          >
            {/* Background cyber grid effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.85)_0%,rgba(5,5,5,0.98)_100%)] z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-65 z-0 pointer-events-none" />
            
            {/* Ambient track lighting perspective simulated behind loader */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[300px] border-x-[120px] border-b-[500px] border-transparent border-b-cyan-950/25 opacity-35 z-0 blur-[2px]" />

            <div className="relative z-10 max-w-lg w-full flex flex-col items-center">
              
              {/* Spinner Graphic & Progress Glow */}
              <div className="relative mb-8 flex items-center justify-center h-24 w-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#111"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (loadingProgress / 100) * 251.2}
                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    transition={{ ease: "easeOut" }}
                  />
                </svg>
                {/* Numeric loading representation */}
                <div className="absolute font-mono text-xl font-bold tracking-tighter text-white">
                  {loadingProgress}%
                </div>
              </div>

              {/* Title & Static Simulation Metadata */}
              <div className="text-center mb-6">
                <h3 className="text-sm font-mono font-bold text-cyan-400 tracking-[0.25em] uppercase glow-text-sky mb-2">
                  TRANSMITTING RUN DATA
                </h3>
                <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                  SIM NODE: a0806ddb // GEO: LOCAL_BROWSER
                </div>
              </div>

              {/* Staged Diagnostic State Message */}
              <div className="w-full bg-zinc-950/90 border border-zinc-900 px-6 py-4 rounded-xl shadow-2xl mb-6 min-h-[72px] flex items-center justify-center text-center">
                <motion.div
                  key={loadingText}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono text-zinc-300 uppercase tracking-wider leading-relaxed"
                >
                  <span className="text-cyan-400 animate-pulse mr-2">▲</span>
                  {loadingText}
                </motion.div>
              </div>

              {/* Wide Progress Slider bar */}
              <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-cyan-500 shadow-[0_0_12px_#06b6d4]"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              {/* Side bar decorations for aesthetic pairing */}
              <div className="w-full flex justify-between items-center mt-3 font-mono text-[9px] text-zinc-500">
                <span>MEM_SEGMENT: 0x88FFB0</span>
                <span>STATUS: STABLE_CYCLES</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
