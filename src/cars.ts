import { CarType } from './types';

export const CARS: CarType[] = [
  {
    id: 'street_drifter',
    name: 'AE86 Drift Star',
    description: 'Perfect balanced entry-level drift machine. Excellent lateral slide coefficient and responsive recovery steering. Understated but legendary.',
    color: '#ef4444', // Red
    baseAcceleration: 0.14,
    baseMaxSpeed: 4.8,
    baseHandling: 0.052,
    baseDriftStick: 0.88, // lower means slides easily and holds drift beautifully
    price: 0 // Free! Always available template
  },
  {
    id: 'muscle_king',
    name: 'V8 Interceptor',
    description: 'Raw retro-styled muscle brute. Heavy chassis with rear-wheel overload. Massive acceleration, wide wild drifts, requiring firm steering throttle control.',
    color: '#3b82f6', // Blue
    baseAcceleration: 0.22,
    baseMaxSpeed: 5.2,
    baseHandling: 0.045,
    baseDriftStick: 0.85, // Very slippery slide inertia
    price: 450
  },
  {
    id: 'speed_demon',
    name: 'GTR Apex Hunter',
    description: 'High performance modern hypercar. Superb top speed and sticky direct performance tires. Tends to grip more, perfect for laser straight lines.',
    color: '#eab308', // Yellow
    baseAcceleration: 0.18,
    baseMaxSpeed: 6.2,
    baseHandling: 0.058,
    baseDriftStick: 0.93, // Sticks more, needs speed to drift
    price: 900
  },
  {
    id: 'cyber_bullet',
    name: 'Neon Cyber Bullet',
    description: 'Experimental futuristic high-voltage racer. Electric carbon-composite chassis with instantaneous torque and custom state-of-the-art vector thruster assistance.',
    color: '#a855f7', // Purple/Violet
    baseAcceleration: 0.26,
    baseMaxSpeed: 6.8,
    baseHandling: 0.065,
    baseDriftStick: 0.86, // Sliding is highly reactive and satisfying!
    price: 1800
  }
];

// Helper to calculate upgraded car stats based on purchase level
export function getUpgradedStat(
  baseValue: number,
  upgradeLevel: number,
  statType: 'acceleration' | 'maxSpeed' | 'handling' | 'driftStick'
): number {
  const multipliers = {
    acceleration: 0.12, // +12% per level (max index 5 = +60% acceleration!)
    maxSpeed: 0.08,     // +8% per level
    handling: 0.10,     // +10% steering responsiveness per level
    driftStick: -0.015  // lowers drift stick (more tail slide slide) by 1.5% per tire upgrade
  };

  const level = upgradeLevel || 0;
  
  if (statType === 'driftStick') {
    // Tire upgrade actually makes tires a bit stickier if level is high, OR lets them slide better.
    // Let's make tire upgrades improve DRIFT CONTROL (which increases driftStick closer to 0.95, meaning less sliding out, easier to correct!)
    return baseValue + level * 0.02; // +2% drift stickiness / recovery speed per tier
  }
  
  return baseValue * (1 + level * multipliers[statType]);
}
