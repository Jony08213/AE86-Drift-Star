import React from 'react';
import { motion } from 'motion/react';
import { CARS, getUpgradedStat } from '../cars';
import { GameState, CarType } from '../types';
import { audio } from './SoundManager';
import { Wrench, Lock, Check, Gauge, Zap, Sparkles, Orbit, ShoppingCart } from 'lucide-react';

interface GarageMenuProps {
  gameState: GameState;
  onSelectCar: (carId: string) => void;
  onUnlockCar: (carId: string) => void;
  onUpgradeStat: (carId: string, statType: 'engine' | 'tires' | 'handling' | 'weight') => void;
  onClose: () => void;
}

const UPGRADE_PRICES = [60, 120, 200, 320, 480]; // Prices for Levels 1 to 5

export default function GarageMenu({
  gameState,
  onSelectCar,
  onUnlockCar,
  onUpgradeStat,
  onClose,
}: GarageMenuProps) {
  const currentCar = CARS.find((c) => c.id === gameState.currentCarId) || CARS[0];
  const userUpgradesForCurrent = gameState.upgrades[currentCar.id] || {
    engine: 0,
    tires: 0,
    handling: 0,
    weight: 0,
  };

  const isUnlocked = (carId: string) => gameState.unlockedCars.includes(carId);

  const handleSelectCar = (car: CarType) => {
    audio.playButtonPress();
    if (isUnlocked(car.id)) {
      onSelectCar(car.id);
    }
  };

  const handleUnlock = (car: CarType) => {
    if (gameState.credits >= car.price) {
      audio.playButtonPress();
      onUnlockCar(car.id);
    }
  };

  const handleUpgrade = (stat: 'engine' | 'tires' | 'handling' | 'weight') => {
    const currentLevel = userUpgradesForCurrent[stat];
    if (currentLevel < 5) {
      const price = UPGRADE_PRICES[currentLevel];
      if (gameState.credits >= price) {
        audio.playButtonPress();
        onUpgradeStat(currentCar.id, stat);
      }
    }
  };

  const getUpgradePercentage = (level: number) => {
    return (level / 5) * 100;
  };

  // Compute upgraded stats of current selected car for rendering
  const maxSpeedVal = getUpgradedStat(currentCar.baseMaxSpeed, userUpgradesForCurrent.engine, 'maxSpeed');
  const accelerationVal = getUpgradedStat(currentCar.baseAcceleration, userUpgradesForCurrent.weight, 'acceleration');
  const handlingVal = getUpgradedStat(currentCar.baseHandling, userUpgradesForCurrent.handling, 'handling');
  const driftVal = getUpgradedStat(currentCar.baseDriftStick, userUpgradesForCurrent.tires, 'driftStick');

  return (
    <div className="bg-black/85 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-md max-w-4xl w-full mx-auto md:p-8 text-white shadow-2xl overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800/40 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            VEHICLE GARAGE & TUNING
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Unlock premium chassis and tune specs with credits earned from drifts and race events.
          </p>
        </div>
        <div className="bg-zinc-950/40 border border-zinc-800 px-4 py-2 rounded-xl text-right backdrop-blur-md">
          <span className="text-[10px] text-zinc-400 font-mono uppercase block font-medium">RACING FUNDS</span>
          <span className="text-xl font-bold text-cyan-400 font-mono block tracking-tight">
            {gameState.credits} <span className="text-xs text-cyan-500 font-normal">CR</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Car Catalog Selection (Col: 5) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest pl-1 mb-1">
            Chassis Inventory
          </h3>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[360px] pr-1">
            {CARS.map((car) => {
              const unlocked = isUnlocked(car.id);
              const isSelected = gameState.currentCarId === car.id;
              
              return (
                <div
                  key={car.id}
                  onClick={() => unlocked && handleSelectCar(car)}
                  className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/5 border-cyan-500 shadow-md shadow-cyan-500/15'
                      : unlocked
                      ? 'bg-black/40 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/40'
                      : 'bg-black/10 border-zinc-900/80 saturate-50 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Car Color Dot Indicator */}
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                          style={{ backgroundColor: car.color }}
                        />
                        <h4 className="font-bold text-sm tracking-tight">{car.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{car.description}</p>
                    </div>

                    {!unlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock(car);
                        }}
                        disabled={gameState.credits < car.price}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black font-mono tracking-tight transition-all ${
                          gameState.credits >= car.price
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        {car.price}
                      </button>
                    ) : isSelected ? (
                      <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Car Details & Upgrade Panels (Col: 7) */}
        <div className="md:col-span-7 bg-black/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md">
          <div>
            {/* Selected Car Showcase */}
            <div className="flex justify-between items-start mb-4 border-b border-zinc-800/40 pb-4">
              <div>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider text-slate-900"
                  style={{ backgroundColor: currentCar.color }}
                >
                  PRO SERIES TYPE
                </span>
                <h3 className="text-xl font-black tracking-tight mt-1.5">{currentCar.name}</h3>
                <p className="text-[11px] text-slate-400 leading-normal mt-1 italic">
                  "{currentCar.description}"
                </p>
              </div>
            </div>

            {/* Performance Stat Bars */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-900">
              {/* Max Speed */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-sky-400" /> TOP SPEED</span>
                  <span className="text-slate-300 font-bold">{Math.round(maxSpeedVal * 30)} KM/H</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${(maxSpeedVal / 10.5) * 100}%` }} />
                </div>
              </div>

              {/* Acceleration */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-400" /> TORQUE ACCEL</span>
                  <span className="text-slate-300 font-bold">{Math.round(accelerationVal * 1000)} HP</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${(accelerationVal / 0.42) * 100}%` }} />
                </div>
              </div>

              {/* Handling */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Orbit className="w-3 h-3 text-purple-400" /> ROTATION STEER</span>
                  <span className="text-slate-300 font-bold">{Math.round(handlingVal * 1000)} DEG</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded overflow-hidden">
                  <div className="h-full bg-purple-400 transition-all duration-300" style={{ width: `${(handlingVal / 0.11) * 100}%` }} />
                </div>
              </div>

              {/* Drift slide */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> SLIP CONTROL</span>
                  <span className="text-slate-300 font-bold">{Math.round((1 - driftVal) * 1000)} PTS</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${((1.05 - driftVal) / 0.25) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Performance Tuning Grid */}
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2.5">
              Available Upgrades
            </h4>
            <div className="flex flex-col gap-2.5">
              {([
                { key: 'engine', label: 'Engine ECU Block', desc: 'Increases absolute top speed threshold', color: 'bg-sky-400', border: 'border-sky-500/20' },
                { key: 'weight', label: 'Carbon Weight Loss', desc: 'Saves mass, vastly boosting acceleration and torque', color: 'bg-emerald-400', border: 'border-emerald-500/20' },
                { key: 'handling', label: 'Anti-Roll Steer Bars', desc: 'Improves rotation speed and lock-to-lock transitions', color: 'bg-purple-400', border: 'border-purple-500/20' },
                { key: 'tires', label: 'Performance Slick Tires', desc: 'Upgrades tire traction index and slip recovery', color: 'bg-amber-400', border: 'border-amber-500/20' }
              ] as const).map(({ key, label, desc, color, border }) => {
                const currentLevel = userUpgradesForCurrent[key];
                const price = currentLevel < 5 ? UPGRADE_PRICES[currentLevel] : 0;
                const canAfford = gameState.credits >= price;
                
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border bg-slate-950/40 ${border}`}
                  >
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          LVL {currentLevel}/5
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                      
                      {/* Subdivided level cubes indicator */}
                      <div className="flex gap-1.5 mt-2">
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 flex-1 rounded-sm ${
                              idx <= currentLevel ? color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      {currentLevel >= 5 ? (
                        <span className="bg-slate-800 text-slate-500 border border-slate-700 px-3 py-1.5 text-xs font-mono font-bold rounded-lg block text-center min-w-[75px]">
                          MAX
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(key)}
                          disabled={!canAfford}
                          className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-lg text-xs font-mono font-black transition-all min-w-[85px] border ${
                            canAfford
                              ? 'bg-slate-900 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 hover:shadow-md cursor-pointer'
                              : 'bg-slate-950/60 border-slate-850 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-mono uppercase text-[9px]">
                            <ShoppingCart className="w-3 h-3" /> TUNE
                          </span>
                          <span className="font-bold font-mono tracking-tighter mt-0.5 text-xs leading-none">
                            {price} CR
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start drive button */}
          <div className="mt-6 flex justify-end gap-3 pointer-events-auto">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-sans uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-98 transition-all duration-200 cursor-pointer"
            >
              CONFIRM SELECTION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
