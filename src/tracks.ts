import { TrackData } from './types';

// Anchor point coordinates for three beautiful, varied tracks
export const TRACKS: TrackData[] = [
  {
    id: 'classic_oval',
    name: 'Cosmic Oval',
    difficulty: 'Easy',
    description: 'A smooth, wide, double-loop Speedway through a sci-fi desert, perfect for unleashing high speed and testing basic drift control.',
    bgColor: '#0f172a',      // Dark Slate Blue
    trackColor: '#1e293b',   // Asphalt Grey
    curbColor: '#f43f5e',    // Rose curb
    borderColor: '#38bdf8',  // Cyan barriers
    startX: 200,
    startY: 230,
    startAngle: 0,          // facing Right (0 radians)
    startLine: { x1: 200, y1: 170, x2: 200, y2: 290 },
    waypoints: [
      { x: 150, y: 230 },   // Start area
      { x: 300, y: 230 },
      { x: 500, y: 230 },
      { x: 750, y: 230 },
      { x: 950, y: 280 },   // Dynamic curve 1
      { x: 1100, y: 380 },
      { x: 1150, y: 550 },  // Sweeper right
      { x: 1100, y: 720 },
      { x: 950, y: 820 },
      { x: 750, y: 870 },   // Inner straight
      { x: 500, y: 870 },
      { x: 300, y: 800 },   // Twist
      { x: 180, y: 650 },
      { x: 150, y: 480 },
      { x: 120, y: 330 },
    ],
    checkpoints: [
      { x: 650, y: 230, r: 120 },  // Checkpoint 1: top straight
      { x: 1130, y: 550, r: 120 }, // Checkpoint 2: right curve
      { x: 600, y: 870, r: 120 },  // Checkpoint 3: bottom straight
      { x: 150, y: 500, r: 120 },  // Checkpoint 4: left curve
    ],
    obstacles: [
      { x: 950, y: 320, r: 15, color: '#f59e0b', label: 'Cone' },
      { x: 500, y: 840, r: 15, color: '#ef4444', label: 'Barrier' },
      { x: 300, y: 830, r: 15, color: '#f59e0b', label: 'Cone' },
    ]
  },
  {
    id: 'drift_serpent',
    name: 'Serpent Pass',
    difficulty: 'Medium',
    description: 'A winding, tight canyon road with successive hairpins, chicane complexes, and high-altitude drop-offs. High drift combo potential!',
    bgColor: '#111827',      // Off-black dark slate
    trackColor: '#1f2937',   // Slate Charcoal
    curbColor: '#10b981',    // Emerald curb
    borderColor: '#a855f7',  // Violet barriers
    startX: 150,
    startY: 500,
    startAngle: -Math.PI / 2, // facing Up
    startLine: { x1: 90, y1: 500, x2: 210, y2: 500 },
    waypoints: [
      { x: 150, y: 550 },
      { x: 150, y: 350 },  // Long uphill straight
      { x: 180, y: 190 },  // Soft right bend
      { x: 300, y: 140 },
      { x: 450, y: 170 },
      { x: 480, y: 280 },  // Chicane right
      { x: 580, y: 320 },
      { x: 680, y: 220 },  // Hairpin left turn
      { x: 660, y: 140 },
      { x: 740, y: 100 },
      { x: 880, y: 120 },
      { x: 950, y: 220 },
      { x: 900, y: 360 },  // Sharp descent
      { x: 760, y: 450 },
      { x: 720, y: 580 },  // Winding hairpins
      { x: 850, y: 680 },
      { x: 1000, y: 640 },
      { x: 1100, y: 760 },
      { x: 1020, y: 880 }, // S-curves
      { x: 820, y: 880 },
      { x: 640, y: 800 },
      { x: 520, y: 680 },
      { x: 380, y: 720 },
      { x: 250, y: 830 },
      { x: 140, y: 750 },
    ],
    checkpoints: [
      { x: 300, y: 140, r: 100 },  // CP 1: first turn
      { x: 680, y: 220, r: 100 },  // CP 2: sharp corner
      { x: 900, y: 360, r: 100 },  // CP 3: downhill curves
      { x: 850, y: 680, r: 100 },  // CP 4: slalom loop
      { x: 380, y: 720, r: 100 },  // CP 5: final straightaway lead-in
    ],
    obstacles: [
      { x: 480, y: 160, r: 12, color: '#a855f7', label: 'Reflector' },
      { x: 660, y: 260, r: 14, color: '#f59e0b', label: 'Cone' },
      { x: 930, y: 250, r: 14, color: '#f59e0b', label: 'Cone' },
      { x: 1020, y: 680, r: 16, color: '#ef4444', label: 'Barrier' },
      { x: 620, y: 810, r: 15, color: '#a855f7', label: 'Sign' },
    ]
  },
  {
    id: 'cyber_grid',
    name: 'Cyber Neon Grid',
    difficulty: 'Hard',
    description: 'A neon-drenched metropolis track with challenging right-angle turns, high-grip straight sections, narrow corridors, and debris hazards.',
    bgColor: '#020617',      // Very dark cosmic slate
    trackColor: '#0f172a',   // Dark asphalt
    curbColor: '#f43f5e',    // Pink neon curbs
    borderColor: '#39ff14',  // Electric Green borders
    startX: 550,
    startY: 850,
    startAngle: 0,          // Facing Right
    startLine: { x1: 550, y1: 790, x2: 550, y2: 910 },
    waypoints: [
      { x: 500, y: 850 },
      { x: 750, y: 850 },  // Neon straight
      { x: 950, y: 850 },
      { x: 1100, y: 800 },
      { x: 1150, y: 650 }, // 90-degree right lead-up
      { x: 1150, y: 400 },
      { x: 1050, y: 250 }, // Tight alleyway
      { x: 800, y: 250 },
      { x: 750, y: 120 },  // Double chicane
      { x: 550, y: 120 },
      { x: 500, y: 250 },
      { x: 300, y: 250 },  // Hairpin right
      { x: 150, y: 350 },
      { x: 180, y: 550 },  // Sudden left-right transition
      { x: 350, y: 550 },
      { x: 400, y: 680 },
      { x: 350, y: 830 },
    ],
    checkpoints: [
      { x: 950, y: 850, r: 100 },  // CP 1: bottom neon drag
      { x: 1150, y: 450, r: 100 }, // CP 2: eastern skyscraper alley
      { x: 700, y: 200, r: 100 },  // CP 3: northern straight
      { x: 200, y: 300, r: 100 },  // CP 4: western loop
      { x: 350, y: 580, r: 100 },  // CP 5: downtown chicane
    ],
    obstacles: [
      { x: 1130, y: 500, r: 15, color: '#39ff14', label: 'Sparks' },
      { x: 1050, y: 260, r: 15, color: '#f43f5e', label: 'Barrier' },
      { x: 780, y: 230, r: 12, color: '#eab308', label: 'Cone' },
      { x: 520, y: 150, r: 14, color: '#39ff14', label: 'Tire Pile' },
      { x: 170, y: 450, r: 16, color: '#f43f5e', label: 'Ad Sign' },
    ]
  }
];

// Helper method to compute a high-precision Catmull-Rom or standard B-Spline if we want smooth graphics.
// Or we can just use native Canvas bezierCurveTo or line arc joints which look flawless with lineJoin: 'round'.
