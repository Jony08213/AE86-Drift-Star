import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Zap, Landmark, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';

interface HUDProps {
  speed: number;
  maxSpeed: number;
  lap: number;
  maxLaps: number;
  currentLapTime: number;
  bestLapTime: number;
  driftPointsScore: number;
  currentDriftAngle: number;
  driftMultiplier: number;
  isDrifting: boolean;
  totalCredits: number;
  isPracticeMode: boolean;
  onResetTrack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showGhost: boolean;
  onToggleGhost: () => void;
  countdown: number;
  // added track details:
  trackId: string;
  trackName: string;
  trackWaypoints: { x: number; y: number }[];
}

export default function HUD({
  speed,
  maxSpeed,
  lap,
  maxLaps,
  currentLapTime,
  bestLapTime,
  driftPointsScore,
  currentDriftAngle,
  driftMultiplier,
  isDrifting,
  totalCredits,
  isPracticeMode,
  onResetTrack,
  isMuted,
  onToggleMute,
  showGhost,
  onToggleGhost,
  countdown,
  trackId,
  trackName,
  trackWaypoints
}: HUDProps) {
  // Convert standard time to readable format mm:ss.cc (centiseconds)
  const formatTime = (ms: number): string => {
    if (ms === Infinity || ms === 0 || isNaN(ms)) return '--:--.--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const speedKmh = Math.round(speed * 35);
  // Calculate a dynamic revs percentage
  const revPercent = Math.min(100, Math.round((speed / maxSpeed) * 100 + (isDrifting ? 15 : 0)));

  // Dynamic tire heating logic (heats up during drifts!)
  const frontLeftTemp = isDrifting ? 'bg-emerald-500/80 border-emerald-400' : 'bg-green-500/40 border-green-400/50';
  const frontRightTemp = isDrifting ? 'bg-emerald-500/80 border-emerald-400' : 'bg-green-500/40 border-green-400/50';
  const rearLeftTemp = isDrifting ? 'bg-amber-500/80 border-amber-400 font-bold blur-[0.2px]' : 'bg-green-400/40 border-green-400/50';
  const rearRightTemp = isDrifting ? 'bg-amber-500/80 border-amber-400 font-bold blur-[0.2px]' : 'bg-green-400/40 border-green-400/50';

  // Build high-tech vector gps track mini map overlay
  const renderTrackMiniMapPath = () => {
    if (!trackWaypoints || trackWaypoints.length === 0) return null;
    const xs = trackWaypoints.map((w) => w.x);
    const ys = trackWaypoints.map((w) => w.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 100;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 100;

    const width = maxX - minX;
    const height = maxY - minY;

    const pointsStr = [...trackWaypoints, trackWaypoints[0]]
      .map((w) => `${w.x},${w.y}`)
      .join(' ');

    const startPt = trackWaypoints[0];

    return (
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="w-full h-full filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] opacity-70 p-2"
      >
        <polygon
          points={pointsStr}
          fill="none"
          stroke="url(#mapCyberGrad)"
          strokeWidth="60"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-10"
        />
        <polygon
          points={pointsStr}
          fill="none"
          stroke="url(#mapCyberGrad)"
          strokeWidth="15"
          strokeDasharray="14 10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={startPt.x}
          cy={startPt.y}
          r="45"
          className="fill-cyan-400 animate-pulse"
        />
        <circle
          cx={startPt.x}
          cy={startPt.y}
          r="20"
          className="fill-white"
        />
        <defs>
          <linearGradient id="mapCyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none z-10 font-sans flex flex-col justify-between p-8">
      
      {/* Cinematic Bars Overlay */}
      <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black to-transparent pointer-events-none opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black to-transparent pointer-events-none opacity-80"></div>

      {/* Target/Crosshair subtle center sight */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
        <div className="w-32 h-32 border border-cyan-500/30 rounded-full"></div>
        <div className="absolute w-48 h-px bg-cyan-500/20"></div>
        <div className="absolute h-48 w-px bg-cyan-500/20"></div>
      </div>

      {/* Top HUD Bar */}
      <div className="z-10 flex justify-between items-start">
        {/* Position & Lap */}
        <div className="flex space-x-6">
          <div className="bg-black/60 border-l-4 border-cyan-500 px-6 py-3 backdrop-blur-md">
            <div className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase mb-1">Session</div>
            <div className="text-3xl font-black italic text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
              {isPracticeMode ? 'DRIFT' : '03'}<span className="text-lg font-normal text-zinc-400">{isPracticeMode ? '' : '/12'}</span>
            </div>
          </div>
          <div className="bg-black/60 border-l-4 border-white px-6 py-3 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Lap</div>
            <div className="text-3xl font-black italic text-white">
              {isPracticeMode ? '∞' : `0${Math.min(maxLaps, lap)}`}<span className="text-lg font-normal text-zinc-400">/{isPracticeMode ? '∞' : `0${maxLaps}`}</span>
            </div>
          </div>
        </div>

        {/* Drift Score Notification (Center top) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isDrifting && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 10 }}
                className="flex flex-col items-center select-none"
              >
                <div className="bg-amber-500 text-slate-950 font-black px-4 py-1.5 rounded-full text-xs font-mono tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3 px-0.5 fill-slate-950" />
                  DRIFTING ({Math.round(currentDriftAngle * (180 / Math.PI))}°)
                </div>
                <div className="flex items-baseline gap-1 mt-1 text-white text-3xl font-black font-mono tracking-tighter glow-text-amber">
                  <span>{Math.round(driftPointsScore)}</span>
                  <span className="text-amber-400 text-lg">x{driftMultiplier}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time & Best Times */}
        <div className="flex flex-col items-end space-y-2 pointer-events-auto">
          <div className="bg-black/60 px-6 py-2 backdrop-blur-md border border-zinc-800">
            <div className="text-[10px] text-zinc-400 font-bold text-right tracking-wider uppercase">CURRENT LAP</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">{formatTime(currentLapTime)}</div>
          </div>
          <div className="bg-black/60 px-4 py-1 backdrop-blur-md border border-zinc-800">
            <div className="text-[10px] text-zinc-500 font-bold text-right tracking-wider uppercase">BEST</div>
            <div className="text-sm font-mono text-zinc-300">{formatTime(bestLapTime)}</div>
          </div>
        </div>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent select-none z-35">
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2.0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              key={countdown}
              className="font-mono font-black text-white glow-text-sky flex flex-col items-center"
            >
              <span className="text-8xl md:text-9xl tracking-tight">
                {countdown === 1 ? 'GO!' : countdown - 1}
              </span>
              <span className="text-xs tracking-[0.4em] uppercase text-cyan-400 mt-2">
                {countdown === 1 ? 'FLOOR IT' : 'PREPARING ENG'}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom HUD */}
      <div className="mt-auto z-10 p-2 grid grid-cols-1 md:grid-cols-3 items-end gap-6">
        
        {/* Left Col: Leaderboard Mini */}
        <div className="space-y-1.5 pointer-events-auto scale-95 origin-bottom-left">
          <div className="bg-cyan-500/15 border-l-2 border-cyan-500 p-2.5 flex justify-between items-center w-64 backdrop-blur-md">
            <span className="text-[11px] font-bold tracking-wider text-cyan-400 font-sans">02. MARCUS V.</span>
            <span className="text-[10px] font-mono text-cyan-400">+0.42s</span>
          </div>
          <div className="bg-white/10 border-l-2 border-white p-2.5 flex justify-between items-center w-64 shadow-lg backdrop-blur-md">
            <span className="text-[11px] font-bold tracking-wider text-white font-sans">03. YOU</span>
            <span className="text-[10px] font-mono text-white">--:--</span>
          </div>
          <div className="bg-black/50 border-l-2 border-zinc-600 p-2.5 flex justify-between items-center w-64 backdrop-blur-md">
            <span className="text-[11px] font-bold text-zinc-400 font-sans">04. TAKUMI F.</span>
            <span className="text-[10px] font-mono text-zinc-500">+1.08s</span>
          </div>
          
          {/* Funds visualizer built directly into Left column dashboard */}
          <div className="text-[10px] font-mono text-zinc-400 pt-1.5 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>SESSION EARNINGS: </span>
            <span className="text-emerald-400 font-bold">{totalCredits} CR</span>
          </div>
        </div>

        {/* Speedometer Centerpiece Dial */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="relative flex flex-col items-center">
            {/* Dial Arcs */}
            <svg className="w-60 h-30 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" viewBox="0 0 200 100">
              <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#222" strokeWidth="12" strokeLinecap="round" />
              <path
                d="M 20 90 A 80 80 0 0 1 180 90"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="251.3"
                strokeDashoffset={251.3 - (revPercent / 100) * 251.3}
                style={{ transition: 'stroke-dashoffset 0.08s ease-out' }}
                className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              />
            </svg>
            {/* Digital Readout */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <div className="text-6xl font-black italic tracking-tighter leading-none text-white drop-shadow-md font-mono">{speedKmh}</div>
              <div className="text-[10px] font-bold tracking-[0.3em] text-cyan-500 -mt-0.5">KM/H</div>
            </div>
            {/* Gear Indicator */}
            <div className="absolute -right-6 bottom-3 bg-zinc-950 border-2 border-zinc-400 w-12 h-12 flex items-center justify-center transform skew-x-12 shadow-lg">
              <div className="text-2xl font-black text-white -skew-x-12 font-mono">
                {speed === 0 ? 'N' : speed < 0 ? 'R' : speedKmh < 45 ? '1' : speedKmh < 85 ? '2' : speedKmh < 130 ? '3' : '4'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Mini Map & Systems */}
        <div className="flex flex-col items-end space-y-4 pointer-events-auto scale-95 origin-bottom-right">
          {/* Tire Temperature visual metrics */}
          <div className="grid grid-cols-2 gap-1 opacity-80 bg-black/60 p-2 border border-zinc-800 rounded-lg">
            <div className={`w-6 h-8 rounded-[3px] border ${frontLeftTemp}`} title="Front-Left Tire Heat (Temp)" />
            <div className={`w-6 h-8 rounded-[3px] border ${frontRightTemp}`} title="Front-Right Tire Heat (Temp)" />
            <div className={`w-6 h-8 rounded-[3px] border ${rearLeftTemp}`} title="Rear-Left Tire Heat (Temp)" />
            <div className={`w-6 h-8 rounded-[3px] border ${rearRightTemp}`} title="Rear-Right Tire Heat (Temp)" />
          </div>
          
          {/* High Tech GPS Circle Track Map */}
          <div className="w-36 h-36 bg-black/95 rounded-full border border-zinc-800 p-4 relative flex items-center justify-center overflow-hidden shadow-2xl">
            {renderTrackMiniMapPath()}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-zinc-500 tracking-wider uppercase whitespace-nowrap">
              GPS HUD TELEMETRY
            </div>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-cyan-400 tracking-tighter uppercase whitespace-nowrap bg-zinc-900/90 px-2 py-0.5 rounded-full border border-zinc-800">
              {trackName}
            </div>
          </div>
        </div>
      </div>

      {/* Action Overlay Pill Buttons aligned with the ESC, Camera, and Telemetry options from mockup */}
      <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 pointer-events-auto z-20">
        <button
          onClick={onResetTrack}
          className="px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500 rounded-full text-[9px] font-extrabold text-zinc-400 hover:text-white uppercase transition-all tracking-wider"
        >
          R Reset Position
        </button>
        <button
          onClick={onToggleGhost}
          className={`px-3.5 py-1.5 rounded-full text-[9px] font-extrabold uppercase transition-all tracking-wider border ${
            showGhost
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-cyan-500 hover:text-white'
          }`}
        >
          G PB Ghost {showGhost ? "ON" : "OFF"}
        </button>
        <button
          onClick={onToggleMute}
          className="px-3.5 py-1.5 bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500 rounded-full text-[9px] font-extrabold text-zinc-400 hover:text-white uppercase transition-all tracking-wider"
        >
          M Audio {isMuted ? "MUTED" : "LIVE"}
        </button>
      </div>

    </div>
  );
}
