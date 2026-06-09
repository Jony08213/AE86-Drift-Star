import React, { useEffect, useRef, useState } from 'react';
import { TRACKS } from '../tracks';
import { CARS, getUpgradedStat } from '../cars';
import { GameState, Particle, ActiveTireTrack, OpponentState } from '../types';
import { audio } from './SoundManager';
import HUD from './HUD';
import { Trophy, RefreshCw, Milestone, Flag } from 'lucide-react';

interface GameCanvasProps {
  gameState: GameState;
  onTrackCompleted: (trackId: string, lapTime: number, creditsEarned: number) => void;
  onUpdateCredits: (amount: number) => void;
  onCloseGame: () => void;
  isPracticeMode: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

// Fixed dimensions for internal physics coordinate space
const VIRTUAL_WIDTH = 1500;
const VIRTUAL_HEIGHT = 1200;

export default function GameCanvas({
  gameState,
  onTrackCompleted,
  onUpdateCredits,
  onCloseGame,
  isPracticeMode,
  difficulty
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load current car details
  const carMeta = CARS.find((c) => c.id === gameState.currentCarId) || CARS[0];
  const carUpgrades = gameState.upgrades[carMeta.id] || { engine: 0, tires: 0, handling: 0, weight: 0 };

  const maxSpeed = getUpgradedStat(carMeta.baseMaxSpeed, carUpgrades.engine, 'maxSpeed');
  const acceleration = getUpgradedStat(carMeta.baseAcceleration, carUpgrades.weight, 'acceleration');
  const handling = getUpgradedStat(carMeta.baseHandling, carUpgrades.handling, 'handling');
  const driftStick = getUpgradedStat(carMeta.baseDriftStick, carUpgrades.tires, 'driftStick');

  // Load current track details
  const track = TRACKS.find((t) => t.id === gameState.currentTrackId) || TRACKS[0];

  // React state for HUD triggers
  const [speed, setSpeed] = useState(0);
  const [lap, setLap] = useState(1);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState(gameState.bestTimes[track.id] || 0);
  const [totalCredits, setTotalCredits] = useState(gameState.credits);
  const [countdown, setCountdown] = useState(4); // 3, 2, 1, GO (starts at 4)
  const [isMuted, setIsMuted] = useState(audio.getMuteState());
  const [showGhost, setShowGhost] = useState(true);

  // Persistent overlay messages (e.g., drift stats, record notification)
  const [showFinishedAlert, setShowFinishedAlert] = useState(false);
  const [finalLapHistory, setFinalLapHistory] = useState<number[]>([]);
  const [earnedCreditsFinal, setEarnedCreditsFinal] = useState(0);

  // Drift Score Tally Stats (stored in component state too)
  const [driftPointsState, setDriftPointsState] = useState(0);
  const [driftMultiplierState, setDriftMultiplierState] = useState(1);
  const [isDriftingState, setIsDriftingState] = useState(false);
  const [currentDriftAngle, setCurrentDriftAngle] = useState(0);

  // References holding physics loops and mutable game variables (to avoid React re-render lag)
  const stateRef = useRef({
    // Player car position values
    carX: track.startX,
    carY: track.startY,
    carVX: 0,
    carVY: 0,
    carAngle: track.startAngle,
    carSpeed: 0,

    // Timers
    lapStartTime: 0,
    raceFinished: false,
    nextCheckpointIndex: 0,
    lapHistory: [] as number[],
    currentLap: 1,
    maxLaps: isPracticeMode ? 99999 : 3,

    // Drift Scoring
    driftPoints: 0,
    driftMultiplier: 1,
    isDrifting: false,
    driftAccumulator: 0,
    straightDriveTimer: 0,

    // Controls
    keys: {
      Forward: false,
      Backward: false,
      Left: false,
      Right: false,
      Handbrake: false
    },

    // Screen Camera focus
    camX: track.startX - 400,
    camY: track.startY - 300,

    // Particles and Skids lists
    particles: [] as Particle[],
    particleIdCounter: 0,
    tireTracks: [] as ActiveTireTrack[],
    tireTrackIdCounter: 0,

    // Ghost Recording and Playback
    ghostRecording: [] as { x: number; y: number; angle: number }[],
    ghostFrameIndex: 0,
    savedBestLapPath: [] as { x: number; y: number; angle: number }[], // cached from storage

    // AI opponents
    opponents: [] as OpponentState[]
  });

  // Track size of screen/container
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update credits directly
  useEffect(() => {
    setTotalCredits(gameState.credits);
  }, [gameState.credits]);

  // Adjust container width / height on resizing
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('canvas-container-root');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial check

    // Initialize Web Audio API on first interaction
    const initSound = () => {
      audio.init();
      document.removeEventListener('click', initSound);
      document.removeEventListener('keydown', initSound);
    };
    document.addEventListener('click', initSound);
    document.addEventListener('keydown', initSound);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', initSound);
      document.removeEventListener('keydown', initSound);
    };
  }, []);

  // Set up Keyboard Action Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default window scrolling for game triggers
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const keys = stateRef.current.keys;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          keys.Forward = true;
          break;
        case 's':
        case 'arrowdown':
          keys.Backward = true;
          break;
        case 'a':
        case 'arrowleft':
          keys.Left = true;
          break;
        case 'd':
        case 'arrowright':
          keys.Right = true;
          break;
        case ' ':
          keys.Handbrake = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = stateRef.current.keys;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          keys.Forward = false;
          break;
        case 's':
        case 'arrowdown':
          keys.Backward = false;
          break;
        case 'a':
        case 'arrowleft':
          keys.Left = false;
          break;
        case 'd':
        case 'arrowright':
          keys.Right = false;
          break;
        case ' ':
          keys.Handbrake = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Countdown timer clock
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
        if (countdown === 2) {
          // Trigger GO engines!
          stateRef.current.lapStartTime = Date.now();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Compute distance from point to line segment mathematically
  const getDistanceToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return {
      distance: Math.hypot(px - ax, py - ay),
      x: ax,
      y: ay
    };
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t)); // clamp
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return {
      distance: Math.hypot(px - projX, py - projY),
      x: projX,
      y: projY
    };
  };

  // Find if a car location coordinate is off-road on the grass
  const checkIsOffRoad = (cx: number, cy: number) => {
    // Road path connects track.waypoints sequentially in a loop
    const pts = track.waypoints;
    let minDistance = Infinity;

    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const res = getDistanceToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y);
      if (res.distance < minDistance) {
        minDistance = res.distance;
      }
    }

    // Road is 115 pixels wide, so half-width is 57.5 pixels
    return minDistance > 68;
  };

  // Triggered when track completes
  const handleRaceFinished = () => {
    const ref = stateRef.current;
    if (ref.raceFinished) return;
    ref.raceFinished = true;

    // Turn off engine noise immediately
    audio.updateEngineSound(0, false);
    audio.updateScreech(0);

    // Filter and compute total credits earned from finish placement
    // Best user lap time
    const minLapTime = ref.lapHistory.length > 0 ? Math.min(...ref.lapHistory) : 0;
    
    // Position credits (always assume 1st place in solo timers unless AI finishes first!
    // Let's compute if AI beat the player)
    let userPlacement = 1;
    ref.opponents.forEach((opp) => {
      if (opp.finished && opp.lap >= ref.maxLaps) {
        userPlacement++;
      }
    });

    const finishBonus = isPracticeMode ? 0 : userPlacement === 1 ? 400 : userPlacement === 2 ? 250 : 150;
    const totalEarnings = finishBonus + Math.round(ref.driftAccumulator / 100);

    setEarnedCreditsFinal(totalEarnings);
    setFinalLapHistory([...ref.lapHistory]);
    setShowFinishedAlert(true);

    onTrackCompleted(track.id, minLapTime, totalEarnings);
  };

  // Initialize Core Game Objects
  useEffect(() => {
    const ref = stateRef.current;
    
    // Reset car position
    ref.carX = track.startX;
    ref.carY = track.startY;
    ref.carVX = 0;
    ref.carVY = 0;
    ref.carAngle = track.startAngle;
    ref.carSpeed = 0;

    // Reset trackers
    ref.raceFinished = false;
    ref.currentLap = 1;
    ref.nextCheckpointIndex = 0;
    ref.lapHistory = [];
    ref.timeTrialStart = 0;
    
    // Bank points
    ref.driftPoints = 0;
    ref.driftMultiplier = 1;
    ref.isDrifting = false;
    ref.driftAccumulator = 0;
    ref.straightDriveTimer = 0;

    // Read personal best ghost profile if saved
    const pbPathJson = localStorage.getItem(`ghost_path_${track.id}`);
    if (pbPathJson) {
      try {
        ref.savedBestLapPath = JSON.parse(pbPathJson);
      } catch (err) {
        ref.savedBestLapPath = [];
      }
    } else {
      ref.savedBestLapPath = [];
    }
    ref.ghostRecording = [];
    ref.ghostFrameIndex = 0;

    // Spawn 3 competitive AI opponent states behind player grid
    const names = ['Acrobat AI', 'Racer Zero', 'Carbon Phantom'];
    const colors = ['#10b981', '#f97316', '#a855f7'];

    // Adjust bot capabilities based on the selected difficulty level
    let diffSpeedScale = 1.0;
    let diffAccelScale = 1.0;
    let diffHandlingScale = 1.0;

    if (difficulty === 'easy') {
      diffSpeedScale = 0.70;
      diffAccelScale = 0.70;
      diffHandlingScale = 0.75;
    } else if (difficulty === 'hard') {
      diffSpeedScale = 1.25;
      diffAccelScale = 1.20;
      diffHandlingScale = 1.15;
    }
    
    ref.opponents = isPracticeMode ? [] : [0, 1, 2].map((idx) => {
      // Shift back relative to start coordinates to stack behind player
      const shiftAngle = track.startAngle + Math.PI; // opposite direction
      const ox = track.startX + Math.cos(shiftAngle) * (45 + idx * 45) + Math.sin(shiftAngle) * (idx % 2 === 0 ? 30 : -30);
      const oy = track.startY + Math.sin(shiftAngle) * (45 + idx * 45) + Math.cos(shiftAngle) * (idx % 2 === 0 ? 30 : -30);
 
      // Distinct stats for each AI bot scale by difficulty
      return {
        id: `ai_${idx}`,
        name: names[idx],
        color: colors[idx],
        x: ox,
        y: oy,
        vx: 0,
        vy: 0,
        angle: track.startAngle,
        speed: 0,
        maxSpeed: maxSpeed * (0.86 + idx * 0.04) * diffSpeedScale, // varying speeds
        acceleration: acceleration * (0.8 + idx * 0.1) * diffAccelScale,
        handling: handling * (0.9 + idx * 0.08) * diffHandlingScale,
        currentWaypointIndex: 1, // targeting first waypoint
        lap: 1,
        finished: false
      };
    });

    ref.particles = [];
    ref.tireTracks = [];

    setLap(1);
    setCurrentLapTime(0);
    setShowFinishedAlert(false);

    // Clear and build the loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      const controlsActive = countdown === 0 && !ref.raceFinished;

      // -----------------------------------------------------------------
      // 1. GHOST & LAP RECORDER MECHANICS
      // -----------------------------------------------------------------
      if (controlsActive) {
        // Record coordinate frame
        ref.ghostRecording.push({ x: ref.carX, y: ref.carY, angle: ref.carAngle });
      }

      // -----------------------------------------------------------------
      // 2. PLAYER PHYSICAL ENGINE
      // -----------------------------------------------------------------
      // Steer rotation logic
      if (controlsActive) {
        // Rotate only when moving, relative to current speed
        const rotationFactor = Math.min(1.0, Math.sin((Math.abs(ref.carSpeed) / maxSpeed) * Math.PI * 0.5)) || 0;
        // Reduce the steering sensitivity slightly for smoother, more stable controls
        const currentSteerSpeed = handling * 0.80 * (ref.keys.Handbrake ? 1.45 : 1.0) * (ref.carSpeed < 0 ? -1 : 1);

        if (ref.keys.Left) {
          ref.carAngle -= currentSteerSpeed * rotationFactor;
        }
        if (ref.keys.Right) {
          ref.carAngle += currentSteerSpeed * rotationFactor;
        }
      }

      // Force limits
      const isOffRoad = checkIsOffRoad(ref.carX, ref.carY);
      const activeMaxSpeed = isOffRoad ? maxSpeed * 0.45 : maxSpeed;
      const activeAccel = isOffRoad ? acceleration * 0.5 : acceleration;

      // Apply gas/brake
      if (controlsActive) {
        if (ref.keys.Forward) {
          if (ref.carSpeed < 0) ref.carSpeed += activeAccel * 3; // strong brake
          else ref.carSpeed = Math.min(activeMaxSpeed, ref.carSpeed + activeAccel);
        } else if (ref.keys.Backward) {
          if (ref.carSpeed > 0) ref.carSpeed -= activeAccel * 2.5; // active reverse brake
          else ref.carSpeed = Math.max(-activeMaxSpeed * 0.35, ref.carSpeed - activeAccel * 0.6);
        } else {
          // Rolling resistance drag
          ref.carSpeed *= isOffRoad ? 0.90 : 0.98;
          if (Math.abs(ref.carSpeed) < 0.05) ref.carSpeed = 0;
        }
      } else {
        // Stop engine controls during countdown/finishing line
        ref.carSpeed *= 0.97;
      }

      // Compute vector headings
      const headX = Math.cos(ref.carAngle);
      const headY = Math.sin(ref.carAngle);
      const targetVx = headX * ref.carSpeed;
      const targetVy = headY * ref.carSpeed;

      // Adjust tire grip multiplier
      // If Spacebar is pressed, alignment speed slows down drastically (inducing slide!)
      let slideFactor = driftStick;
      if (ref.keys.Handbrake && controlsActive) {
        slideFactor = 0.68; // slick handbrake skidding!
      } else if (isOffRoad) {
        slideFactor = 0.72; // slippery grass
      }
      
      // Interpolate vector velocity
      // Low grip coeff lets momentum carry the car sideways!
      const alignmentGrip = 1 - slideFactor; // e.g. 0.12 (grippy) or 0.32 (drifty)
      ref.carVX = ref.carVX * slideFactor + targetVx * alignmentGrip;
      ref.carVY = ref.carVY * slideFactor + targetVy * alignmentGrip;

      // Apply coordinates shift
      ref.carX += ref.carVX;
      ref.carY += ref.carVY;

      // Constrain inside map borders roughly to prevent flying out of canvas space
      ref.carX = Math.max(30, Math.min(VIRTUAL_WIDTH - 30, ref.carX));
      ref.carY = Math.max(30, Math.min(VIRTUAL_HEIGHT - 30, ref.carY));

      // Calculate sliding slip angle
      const currentMoveAngle = Math.atan2(ref.carVY, ref.carVX);
      let slipAngle = Math.abs(currentMoveAngle - ref.carAngle);
      while (slipAngle > Math.PI) slipAngle -= Math.PI * 2;
      while (slipAngle < -Math.PI) slipAngle += Math.PI * 2;
      slipAngle = Math.abs(slipAngle);

      // Determine active drift scoring status
      const slipThreshold = 0.28; // ~16 deg
      const isCurrentlyDrifting =
        controlsActive &&
        slipAngle > slipThreshold &&
        Math.hypot(ref.carVX, ref.carVY) > 2.0;

      if (isCurrentlyDrifting) {
        ref.isDrifting = true;
        ref.straightDriveTimer = 0;

        // Earn continuous points
        const addedGains = slipAngle * 12 * ref.driftMultiplier;
        ref.driftPoints += addedGains;

        // Increase multiplier for massive drifts per 750 points
        if (ref.driftPoints > ref.driftMultiplier * 800) {
          ref.driftMultiplier = Math.min(5, ref.driftMultiplier + 1);
        }

        // Spawn skid smoke and exhaust sparks!
        const shiftR = ref.carAngle + Math.PI / 2;
        // Left Rear tire coords
        const trX1 = ref.carX - headX * 18 + Math.cos(shiftR) * 11;
        const trY1 = ref.carY - headY * 18 + Math.sin(shiftR) * 11;
        // Right Rear tire coords
        const trX2 = ref.carX - headX * 18 - Math.cos(shiftR) * 11;
        const trY2 = ref.carY - headY * 18 - Math.sin(shiftR) * 11;

        // Add skid segments to permanent tracks
        ref.tireTracks.push({
          id: ref.tireTrackIdCounter++,
          x1: trX1,
          y1: trY1,
          x2: trX1 - ref.carVX * 0.5,
          y2: trY1 - ref.carVY * 0.5,
          opacity: 0.85,
          life: 350 // fades after 350 frames
        });
        ref.tireTracks.push({
          id: ref.tireTrackIdCounter++,
          x1: trX2,
          y1: trY2,
          x2: trX2 - ref.carVX * 0.5,
          y2: trY2 - ref.carVY * 0.5,
          opacity: 0.85,
          life: 350
        });

        // Spawn drift puffs particles
        if (Math.random() < 0.45) {
          ref.particles.push({
            id: ref.particleIdCounter++,
            x: trX1,
            y: trY1,
            vx: -ref.carVX * 0.25 + (Math.random() - 0.5) * 1,
            vy: -ref.carVY * 0.25 + (Math.random() - 0.5) * 1,
            color: isOffRoad ? '#a16207' : '#e2e8f0', // brown dust vs white rubber smoke
            size: 4 + Math.random() * 8,
            life: 25,
            maxLife: 25,
            type: isOffRoad ? 'dust' : 'smoke'
          });
          ref.particles.push({
            id: ref.particleIdCounter++,
            x: trX2,
            y: trY2,
            vx: -ref.carVX * 0.25 + (Math.random() - 0.5) * 1,
            vy: -ref.carVY * 0.25 + (Math.random() - 0.5) * 1,
            color: isOffRoad ? '#a16207' : '#e2e8f0',
            size: 4 + Math.random() * 8,
            life: 25,
            maxLife: 25,
            type: isOffRoad ? 'dust' : 'smoke'
          });
        }

        // Active procedural tire squeal pitch adjustment
        audio.updateScreech(slipAngle * 1.6);
      } else {
        // Not drifting
        audio.updateScreech(0);
        if (ref.isDrifting) {
          ref.straightDriveTimer++;
          // Wait 35 frames before finalizing combo payout
          if (ref.straightDriveTimer > 35) {
            ref.isDrifting = false;
            const earnedBonus = Math.round(ref.driftPoints);
            if (earnedBonus > 45) {
              ref.driftAccumulator += earnedBonus;
              onUpdateCredits(earnedBonus); // payout instantly!
            }
            ref.driftPoints = 0;
            ref.driftMultiplier = 1;
          }
        }
      }

      // Exhaust ambient puffs
      if (Math.random() < 0.15 && Math.abs(ref.carSpeed) > 0.1) {
        const exhaustX = ref.carX - headX * 22 + Math.cos(ref.carAngle + Math.PI/2) * 8;
        const exhaustY = ref.carY - headY * 22 + Math.sin(ref.carAngle + Math.PI/2) * 8;
        ref.particles.push({
          id: ref.particleIdCounter++,
          x: exhaustX,
          y: exhaustY,
          vx: -headX * 1 + (Math.random() - 0.5) * 0.5,
          vy: -headY * 1 + (Math.random() - 0.5) * 0.5,
          color: '#cbd5e1',
          size: 2 + Math.random() * 4,
          life: 15,
          maxLife: 15,
          type: 'smoke'
        });
      }

      // Continuous procedural update of engine sound RPM
      const currentSpeedRatio = Math.abs(ref.carSpeed) / maxSpeed;
      audio.updateEngineSound(currentSpeedRatio, true);

      // React states updates
      setSpeed(Math.abs(ref.carSpeed));
      setIsDriftingState(ref.isDrifting);
      setDriftPointsState(ref.driftPoints);
      setDriftMultiplierState(ref.driftMultiplier);
      setCurrentDriftAngle(slipAngle);

      // -----------------------------------------------------------------
      // 3. COLLISION WITH BARRIERS & OBSTACLES
      // -----------------------------------------------------------------
      // Obstacle bouncing
      for (const obs of track.obstacles) {
        const dist = Math.hypot(ref.carX - obs.x, ref.carY - obs.y);
        const colRadius = 15 + obs.r; // Car approximate bounds + barrier size
        if (dist < colRadius) {
          // Trigger collision crash!
          audio.playCrash(0.65);

          // Bounce calculation: push car out
          const bounceAngle = Math.atan2(ref.carY - obs.y, ref.carX - obs.x);
          
          ref.carX = obs.x + Math.cos(bounceAngle) * colRadius;
          ref.carY = obs.y + Math.sin(bounceAngle) * colRadius;

          // Flip velocity vector with restitution decay
          ref.carVX = Math.cos(bounceAngle) * (Math.abs(ref.carSpeed) * 0.45 + 1.2);
          ref.carVY = Math.sin(bounceAngle) * (Math.abs(ref.carSpeed) * 0.45 + 1.2);
          ref.carSpeed = -ref.carSpeed * 0.35; // reverse force thud

          // Set combo lost instantly!
          if (ref.isDrifting) {
            ref.isDrifting = false;
            ref.driftPoints = 0;
            ref.driftMultiplier = 1;
          }

          // Spawn high spark spikes
          for (let s = 0; s < 12; s++) {
            ref.particles.push({
              id: ref.particleIdCounter++,
              x: ref.carX - Math.cos(bounceAngle) * 12,
              y: ref.carY - Math.sin(bounceAngle) * 12,
              vx: Math.cos(bounceAngle + (Math.random() - 0.5) * 1.5) * (4 + Math.random() * 5),
              vy: Math.sin(bounceAngle + (Math.random() - 0.5) * 1.5) * (4 + Math.random() * 5),
              color: '#fbbf24', // golden yellow sparks spark list
              size: 2 + Math.random() * 3,
              life: 18,
              maxLife: 18,
              type: 'spark'
            });
          }
        }
      }

      // Border bounds collision detection (using mathematical segments to nearest track boundary)
      // If the player goes extremely far off-track (e.g. dist to segment > 105px), we hit the solid scenic barriers!
      const borderCollLimit = 100;
      let minTrackDist = Infinity;
      let closestSegmentIdx = 0;
      let closestPt = { x: 0, y: 0 };

      for (let i = 0; i < track.waypoints.length; i++) {
        const p1 = track.waypoints[i];
        const p2 = track.waypoints[(i + 1) % track.waypoints.length];
        const res = getDistanceToSegment(ref.carX, ref.carY, p1.x, p1.y, p2.x, p2.y);
        if (res.distance < minTrackDist) {
          minTrackDist = res.distance;
          closestSegmentIdx = i;
          closestPt = { x: res.x, y: res.y };
        }
      }

      if (minTrackDist > borderCollLimit) {
        audio.playCrash(0.55);

        // Push car back inside the road boundary
        const dirX = ref.carX - closestPt.x;
        const dirY = ref.carY - closestPt.y;
        const dHyp = Math.hypot(dirX, dirY) || 1;

        // Reset inside coordinates limit
        ref.carX = closestPt.x + (dirX / dHyp) * borderCollLimit;
        ref.carY = closestPt.y + (dirY / dHyp) * borderCollLimit;

        // Reflect velocity vector
        ref.carVX = -(dirX / dHyp) * (Math.abs(ref.carSpeed) * 0.35 + 1.0);
        ref.carVY = -(dirY / dHyp) * (Math.abs(ref.carSpeed) * 0.35 + 1.0);
        ref.carSpeed = -ref.carSpeed * 0.25;

        // Reset combo
        if (ref.isDrifting) {
          ref.isDrifting = false;
          ref.driftPoints = 0;
          ref.driftMultiplier = 1;
        }

        // Particle sparks
        for (let s = 0; s < 8; s++) {
          ref.particles.push({
            id: ref.particleIdCounter++,
            x: ref.carX,
            y: ref.carY,
            vx: (dirX / dHyp + (Math.random() - 0.5) * 1) * (3 + Math.random() * 3),
            vy: (dirY / dHyp + (Math.random() - 0.5) * 1) * (3 + Math.random() * 3),
            color: '#38bdf8', // sky cyan neon barrier sparks!
            size: 2.5,
            life: 14,
            maxLife: 14,
            type: 'spark'
          });
        }
      }

      // -----------------------------------------------------------------
      // 4. CHECKPOINT & LAP CROSSINGS
      // -----------------------------------------------------------------
      if (controlsActive) {
        // Compute active stopwatch lap timer
        const currentMs = Date.now() - ref.lapStartTime;
        setCurrentLapTime(currentMs);

        // Check active checkpoints list. Only index if within bounds.
        if (ref.nextCheckpointIndex < track.checkpoints.length) {
          const currentCP = track.checkpoints[ref.nextCheckpointIndex];
          const cpDist = Math.hypot(ref.carX - currentCP.x, ref.carY - currentCP.y);
          if (cpDist < currentCP.r) {
            // Advance next checkpoint target
            ref.nextCheckpointIndex = ref.nextCheckpointIndex + 1;
          }
        }

        // Collected all checkpoints and crossed finish threshold grid?
        if (ref.nextCheckpointIndex >= track.checkpoints.length) {
          // Check crossed start/finish grid (we check nearby the startX/startY start line bounds)
          // Or simple distance to starting line segment
          const lineCol = getDistanceToSegment(ref.carX, ref.carY, track.startLine.x1, track.startLine.y1, track.startLine.x2, track.startLine.y2);
          if (lineCol.distance < 80) {
            // Lap Finished!
            ref.nextCheckpointIndex = 0; // reset to beginning

            // Sound cue
            audio.playLapChime();

            const lapDuration = Date.now() - ref.lapStartTime;
            ref.lapHistory.push(lapDuration);
            ref.lapStartTime = Date.now(); // reset stopwatch for next lap

            if (ref.currentLap >= ref.maxLaps) {
              // Completed Race Course event!
              handleRaceFinished();
            } else {
              ref.currentLap++;
              setLap(ref.currentLap);

              // Save PB Ghost loop if it's the fastest lap ever made
              if (lapDuration < bestLapTime || bestLapTime === 0) {
                setBestLapTime(lapDuration);
                localStorage.setItem(`lap_pb_${track.id}`, lapDuration.toString());
                // Save current recording
                localStorage.setItem(`ghost_path_${track.id}`, JSON.stringify(ref.ghostRecording));
                ref.savedBestLapPath = [...ref.ghostRecording];
              }
            }

            // Reset ghost recorder frame for next lap
            ref.ghostRecording = [];
            ref.ghostFrameIndex = 0;
          }
        }
      }

      // -----------------------------------------------------------------
      // 5. AI OPPONENTS PHYSICAL PATH GUIDING
      // -----------------------------------------------------------------
      if (countdown === 0 && !ref.raceFinished) {
        ref.opponents.forEach((ai) => {
          if (ai.finished) return;

          // Find current target waypoint
          const wp = track.waypoints[ai.currentWaypointIndex];
          const distToWp = Math.hypot(wp.x - ai.x, wp.y - ai.y);

          // If close enough, switch to target next sequential node
          if (distToWp < 75) {
            ai.currentWaypointIndex = (ai.currentWaypointIndex + 1) % track.waypoints.length;
            
            // Re-check start/finish cross for AI lap trackers
            if (ai.currentWaypointIndex === 0) {
              ai.lap++;
              if (ai.lap > ref.maxLaps) {
                ai.finished = true;
                ai.speed = 0;
              }
            }
          }

          // Compute required navigation angle to next node
          const targetAn = Math.atan2(wp.y - ai.y, wp.x - ai.x);
          
          // Steer towards target direction
          let anDiff = targetAn - ai.angle;
          while (anDiff > Math.PI) anDiff -= Math.PI * 2;
          while (anDiff < -Math.PI) anDiff += Math.PI * 2;

          // Gradually steer
          if (anDiff > 0.05) ai.angle += ai.handling;
          else if (anDiff < -0.05) ai.angle -= ai.handling;

          // Apply forward speed, throttled down slightly around sharp curves 
          const isCurve = Math.abs(anDiff) > 0.45;
          const targetSpeed = isCurve ? ai.maxSpeed * 0.65 : ai.maxSpeed;
          
          if (ai.speed < targetSpeed) ai.speed += ai.acceleration;
          else ai.speed -= ai.acceleration * 1.5;

          // Compute component step
          ai.vx = Math.cos(ai.angle) * ai.speed;
          ai.vy = Math.sin(ai.angle) * ai.speed;

          ai.x += ai.vx;
          ai.y += ai.vy;
        });
      }

      // -----------------------------------------------------------------
      // 6. DRAW / RENDERING LAYOUT (0.0.0.0 Port safe responsive scales)
      // -----------------------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      
      // Update camera follow scroll
      // Track player car position tightly with slight lazy drag
      ref.camX = ref.camX * 0.9 + (ref.carX - canvas.width / 2) * 0.1;
      ref.camY = ref.camY * 0.9 + (ref.carY - canvas.height / 2) * 0.1;

      // Constrain camera roughly within reasonable margins
      const maxCamX = VIRTUAL_WIDTH - canvas.width;
      const maxCamY = VIRTUAL_HEIGHT - canvas.height;
      
      // Apply translation matrix offset
      ctx.translate(-ref.camX, -ref.camY);

      // --- Draw Grass Out-Of-Bounds Terrain ---
      ctx.fillStyle = track.bgColor;
      ctx.fillRect(-200, -200, VIRTUAL_WIDTH + 400, VIRTUAL_HEIGHT + 400);

      // Draw subtle grid lines on the turf scene
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < VIRTUAL_WIDTH; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, VIRTUAL_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < VIRTUAL_HEIGHT; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(VIRTUAL_WIDTH, y);
        ctx.stroke();
      }

      // --- Draw Track Slabs / Curves ---
      // We draw alternating black/asphalt colors connecting waypoint splines
      const points = track.waypoints;

      // 1. Draw Curb Stripe boundaries beneath track
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i <= points.length; i++) {
        const p = points[i % points.length];
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = track.curbColor;
      ctx.lineWidth = 154;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // alternating zebra color curbs
      ctx.setLineDash([40, 40]);
      ctx.stroke();

      // Alternating off color curbs to complete zebra look
      ctx.strokeStyle = '#f8fafc'; // clean white
      ctx.lineDashOffset = 40;
      ctx.stroke();
      ctx.setLineDash([]); // clear dash specs

      // 2. Draw outer barrier border walls
      ctx.strokeStyle = track.borderColor;
      ctx.lineWidth = 142;
      ctx.stroke();

      // 3. Draw inner black backing for borders
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 134;
      ctx.stroke();

      // 4. Draw true asphalt grey road layer
      ctx.strokeStyle = track.trackColor;
      ctx.lineWidth = 120;
      ctx.stroke();

      // 5. Draw neon dash center line
      ctx.strokeStyle = '#f8fafc25';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([25, 30]);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Draw Start/Finish checkered grid line ---
      ctx.save();
      ctx.translate(track.startX, track.startY);
      ctx.rotate(track.startAngle + Math.PI / 2); // perpendicular path line
      
      const gl = track.startLine;
      const lx = Math.hypot(gl.x1 - gl.x2, gl.y1 - gl.y2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-62, -12, 124, 24); // checker backing
      // Checkered blocks logic drawing
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-62 + i * 21, -12 + (i % 2 === 0 ? 0 : 12), 21, 12);
      }
      ctx.restore();

      // --- Draw Checkpoint Cyan Neon Gates ---
      track.checkpoints.forEach((cp, idx) => {
        const isTarget = idx === ref.nextCheckpointIndex;
        ctx.strokeStyle = isTarget ? '#22d3ee99' : '#47556920';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cp.r - 20, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = isTarget ? '#22d3ee12' : '#ffffff04';
        ctx.fill();

        // Banner labels
        ctx.fillStyle = isTarget ? '#22d3ee' : '#cbd5e120';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`GATE ${idx+1}`, cp.x, cp.y - 4);
      });

      // --- Draw Permanent Tire Skids ---
      // Tick down persistent track lifespans
      ref.tireTracks = ref.tireTracks.filter((t) => {
        t.life--;
        t.opacity = Math.max(0, t.life / 350) * 0.45;
        return t.life > 0;
      });

      // Stroke skids list
      ctx.strokeStyle = '#020617';
      ctx.lineCap = 'round';
      ref.tireTracks.forEach((t) => {
        ctx.beginPath();
        ctx.globalAlpha = t.opacity;
        ctx.lineWidth = 5;
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0; // restore baseline

      // --- Update & Draw Dynamic Particle Array ---
      ref.particles = ref.particles.filter((p) => {
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        
        // fade size and opacity at end
        const alpha = Math.max(0, p.life / p.maxLife);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        return p.life > 0;
      });
      ctx.globalAlpha = 1.0;

      // --- Draw Obstacle structures (cones & barrels) ---
      track.obstacles.forEach((obs) => {
        // Base Shadow
        ctx.fillStyle = '#02061730';
        ctx.beginPath();
        ctx.arc(obs.x + 4, obs.y + 4, obs.r, 0, Math.PI * 2);
        ctx.fill();

        // Outer structural shape
        ctx.fillStyle = obs.color || '#f59e0b';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight ring
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      });

      // -----------------------------------------------------------------
      // DRAW CAR PLACEMENTS (Ghost, AI, Player)
      // -----------------------------------------------------------------

      // 1. Draw PB Recorded Ghost (Wireframe semi-transparent look)
      if (showGhost && ref.savedBestLapPath.length > 0) {
        // Retrieve current recording frame matching index
        const frameIdx = ref.ghostFrameIndex % ref.savedBestLapPath.length;
        const gFrame = ref.savedBestLapPath[frameIdx];
        if (gFrame) {
          ctx.save();
          ctx.translate(gFrame.x, gFrame.y);
          ctx.rotate(gFrame.angle);

          // Transparent body bounds
          ctx.strokeStyle = '#ffffffaa';
          ctx.lineWidth = 1.5;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          // bumper/fender outline
          ctx.rect(-21, -12, 42, 24);
          ctx.stroke();
          ctx.fill();

          // glowing trace
          ctx.restore();

          if (controlsActive) {
            ref.ghostFrameIndex++;
          }
        }
      }

      // 2. Draw AI Opponent Cars
      ref.opponents.forEach((ai) => {
        ctx.save();
        ctx.translate(ai.x, ai.y);
        ctx.rotate(ai.angle);

        // Tires
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(8, 10, 8, 4);
        ctx.fillRect(-16, 10, 8, 4);
        ctx.fillRect(8, -14, 8, 4);
        ctx.fillRect(-16, -14, 8, 4);

        // Main colored chassis frame
        ctx.fillStyle = ai.color;
        ctx.beginPath();
        ctx.roundRect(-21, -11, 42, 22, [4]);
        ctx.fill();

        // Windshield cockpit screen
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, -8, 11, 16);

        // Roof details
        ctx.fillStyle = ai.color;
        ctx.fillRect(-12, -7, 9, 14);

        // Spoiler wing
        ctx.fillStyle = '#020617';
        ctx.fillRect(-22, -12, 3, 24);

        // AI text metadata overlay indicator icon
        ctx.restore();

        ctx.fillStyle = ai.color;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ai.name, ai.x, ai.y - 18);
      });

      // 3. Draw Player Car Vector
      ctx.save();
      ctx.translate(ref.carX, ref.carY);
      ctx.rotate(ref.carAngle);

      // Tire Shadow base
      ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-24, -13, 48, 26, [6]);
      ctx.fill();

      // Front steering wheels angle indicator rendering
      const steerAngleDraw = ref.keys.Left ? -0.45 : ref.keys.Right ? 0.45 : 0;
      
      // Draw 4 physical tyres
      ctx.fillStyle = '#090d16';
      // Rear tires (aligned straight)
      ctx.fillRect(-16, 10.5, 9, 4.5);
      ctx.fillRect(-16, -15, 9, 4.5);
      
      // Front tires (rotate depending on turn angle!)
      ctx.save();
      ctx.translate(11, 11);
      ctx.rotate(steerAngleDraw);
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();

      ctx.save();
      ctx.translate(11, -11);
      ctx.rotate(steerAngleDraw);
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();

      // Sleek composite sports chassis
      ctx.fillStyle = carMeta.color;
      ctx.beginPath();
      ctx.roundRect(-21, -11, 42, 22, [4]);
      ctx.fill();

      // Side skirts details (grey accents)
      ctx.fillStyle = '#475569';
      ctx.fillRect(-8, -12, 16, 1);
      ctx.fillRect(-8, 11, 16, 1);

      // Dark carbon fiber hood stripe styling
      ctx.fillStyle = '#090d16';
      ctx.fillRect(8, -4, 13, 8);

      // Canopy dark cockpit glass
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-3, -7, 12, 14, [2]);
      ctx.fill();

      // Steering wheel indicator
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, -2, 1, 4);

      // Rear Spoiler deck wing
      ctx.fillStyle = '#111827';
      ctx.fillRect(-22, -13, 3.5, 26);

      // Twin Exhaust pipes glowing orange
      ctx.fillStyle = ref.keys.Forward ? '#ef4444' : '#64748b';
      ctx.fillRect(-23, 6, 1.5, 2);
      ctx.fillRect(-23, -8, 1.5, 2);

      // Bright Led headlights
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(20, -9, 1.5, 3);
      ctx.fillRect(20, 6, 1.5, 3);

      // Brake lights - Glow bright crimson when handbraking / decelerating
      const isReversingSlowing = ref.keys.Backward || ref.keys.Handbrake;
      ctx.fillStyle = isReversingSlowing ? '#ef4444' : '#991b1b';
      ctx.fillRect(-21, -8, 1, 3);
      ctx.fillRect(-21, 5, 1, 3);

      ctx.restore();

      ctx.restore(); // restore camera

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      audio.updateEngineSound(0, false);
      audio.updateScreech(0);
    };
  }, [track, maxSpeed, acceleration, handling, driftStick, countdown, showGhost, isPracticeMode, difficulty]);

  const handleResetTrack = () => {
    audio.playButtonPress();
    const ref = stateRef.current;
    ref.carX = track.startX;
    ref.carY = track.startY;
    ref.carVX = 0;
    ref.carVY = 0;
    ref.carAngle = track.startAngle;
    ref.carSpeed = 0;
    
    // Reset CP targeted checks
    ref.nextCheckpointIndex = 0;
  };

  const handleToggleMute = () => {
    const nextMute = audio.toggleMute();
    setIsMuted(nextMute);
  };

  return (
    <div
      id="canvas-container-root"
      className="relative w-full h-[520px] md:h-[620px] bg-[#050505] border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center select-none"
    >
      {/* HUD OVERLAY ELEMENTS */}
      <HUD
        speed={speed}
        maxSpeed={maxSpeed}
        lap={lap}
        maxLaps={stateRef.current.maxLaps}
        currentLapTime={currentLapTime}
        bestLapTime={bestLapTime}
        driftPointsScore={driftPointsState}
        currentDriftAngle={currentDriftAngle}
        driftMultiplier={driftMultiplierState}
        isDrifting={isDriftingState}
        totalCredits={totalCredits}
        isPracticeMode={isPracticeMode}
        onResetTrack={handleResetTrack}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        showGhost={showGhost}
        onToggleGhost={() => setShowGhost(!showGhost)}
        countdown={countdown}
        trackId={track.id}
        trackName={track.name}
        trackWaypoints={track.waypoints}
      />

      {/* HTML5 RENDER STAGE CANVAS */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block focus:outline-hidden"
      />

      {/* RETAIL END OF EVENT RACE SUMMARY popup modal */}
      {showFinishedAlert && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl max-w-md w-full text-white shadow-2xl text-center flex flex-col items-center">
            <Trophy className="w-16 h-16 text-amber-400 stroke-[1.5] drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-bounce mb-3" />
            
            <h3 className="text-xl font-black font-sans tracking-tight">
              EVENT FINISHED!
            </h3>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
              {track.name} Completed
            </p>

            {/* Split lap list stats */}
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl w-full my-5 flex flex-col gap-2.5">
              <div className="flex justify-between font-mono text-xs text-slate-400 border-b border-slate-850 pb-2 uppercase tracking-wider">
                <span>Lap Breakdown</span>
                <span>Split Duration</span>
              </div>
              {finalLapHistory.map((split, ind) => {
                const isPb = split === Math.min(...finalLapHistory);
                const formatSplit = (ms: number) => {
                  const s = Math.floor(ms / 1000);
                  const c = Math.floor((ms % 1000) / 10);
                  return `${s}.${c.toString().padStart(2, '0')}s`;
                };
                return (
                  <div key={ind} className="flex justify-between items-center font-mono text-xs">
                    <span className="text-slate-500">Lap {ind + 1}</span>
                    <span className={`font-bold ${isPb ? 'text-amber-400' : 'text-slate-300'}`}>
                      {formatSplit(split)} {isPb && '★ PB'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Financial profits payout details */}
            <div className="text-sm font-semibold text-emerald-400 font-mono tracking-tight bg-emerald-950/30 border border-emerald-900/30 px-5 py-3.5 rounded-xl w-full mb-6">
              <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1">CREDITS PROFIT PAYOUT</span>
              <span className="text-2xl font-black">{earnedCreditsFinal} CR</span>
              <span className="text-[10px] text-emerald-500 block font-normal mt-1">Added to standard garage wallet</span>
            </div>

            {/* Back button */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onCloseGame}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 font-bold font-sans uppercase tracking-wider text-slate-950 text-xs rounded-xl shadow-lg transition-transform active:scale-98 cursor-pointer"
              >
                RETURN TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
