export interface CarType {
  id: string;
  name: string;
  description: string;
  color: string;
  baseAcceleration: number;  // 0.1 to 0.3
  baseMaxSpeed: number;      // 3.0 to 6.0
  baseHandling: number;      // 0.04 to 0.08
  baseDriftStick: number;    // 0.85 to 0.95 (lower = more lateral sliding/skidding)
  price: number;
}

export interface UpgradeStats {
  engine: number;       // increases maxSpeed
  tires: number;        // increases drift grip/slip recovery
  handling: number;     // increases steering responsiveness
  weight: number;       // decreases slide inertia / improves acceleration
}

export interface UserUpgrades {
  [carId: string]: UpgradeStats;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'smoke' | 'dust' | 'spark' | 'tire_track';
}

export interface ActiveTireTrack {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  life: number;
}

export interface OpponentState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  currentWaypointIndex: number;
  lap: number;
  finished: boolean;
}

export interface TrackData {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  bgColor: string;         // outside of road
  trackColor: string;      // road color
  curbColor: string;       // track edge curbs
  borderColor: string;     // barrier border
  waypoints: { x: number; y: number }[]; // high-density list for AI to follow and for collision definition
  startLine: { x1: number; y1: number; x2: number; y2: number };
  startAngle: number;       // direction car faces at start
  startX: number;
  startY: number;
  checkpoints: { x: number; y: number; r: number }[]; // custom checkpoint circles
  obstacles: { x: number; y: number; r: number; color?: string; label?: string }[];
}

export interface GameState {
  currentTrackId: string;
  currentCarId: string;
  unlockedCars: string[];
  credits: number;
  upgrades: UserUpgrades;
  bestTimes: { [trackId: string]: number }; // Track ID -> best time in ms
}
