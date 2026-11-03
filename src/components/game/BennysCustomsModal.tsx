'use client';

import React from 'react';
import { X, Wrench, Fuel, Paintbrush, Gauge, Check } from 'lucide-react';
import { VehicleTelemetry } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

interface BennysCustomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleTelemetry;
  playerCash: number;
  playerBank: number;
  onTune: (
    opts: { color?: string; repair?: boolean; refuel?: boolean; boostLevel?: number },
    cost: number,
    label: string
  ) => void;
}

const CUSTOM_PAINTS = [
  { name: 'Midnight Carbon', hex: '#18181B' },
  { name: 'Miami Vice Pink', hex: '#EC4899' },
  { name: 'NoPixel Teal', hex: '#14B8A6' },
  { name: 'Brabus Emerald', hex: '#10B981' },
  { name: 'Danfo Gold', hex: '#FACC15' },
  { name: 'Rosso Corsa', hex: '#EF4444' },
  { name: 'Nardo Grey', hex: '#64748B' },
  { name: 'Pearl White', hex: '#F8FAFC' },
];

export const BennysCustomsModal: React.FC<BennysCustomsModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  playerCash,
  playerBank,
  onTune,
}) => {
  if (!isOpen) return null;

  const formatNaira = (val: number) => '₦' + val.toLocaleString('en-NG');
  const missingFuel = Math.max(0, Math.round(100 - vehicle.fuel));
  const fuelCost = Math.max(500, missingFuel * 85);
  const missingEngine = Math.max(0, Math.round(100 - vehicle.engineHealth));
  const repairCost = Math.max(2500, missingEngine * 350);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#090d16] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <Wrench size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Benny’s Original Motorworks & Ron Petrol
              </h3>
              <p className="text-[10px] text-zinc-400">
                Active Bay: {vehicle.vehicleName || 'Closest Vehicle'} • Cash:{' '}
                {formatNaira(playerCash)} / Bank: {formatNaira(playerBank)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {/* 1. Fuel & Engine Repair */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Fuel size={14} /> Ron 98 Octane
                </span>
                <span className="font-mono text-zinc-400">{Math.round(vehicle.fuel)}%</span>
              </div>
              <button
                onClick={() => {
                  audioEngine.playClick();
                  onTune({ refuel: true }, fuelCost, 'Full Tank Refuel');
                }}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
              >
                Fill Tank ({formatNaira(fuelCost)})
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Wrench size={14} /> Chassis & Engine
                </span>
                <span className="font-mono text-zinc-400">
                  {Math.round(vehicle.engineHealth)}%
                </span>
              </div>
              <button
                onClick={() => {
                  audioEngine.playClick();
                  onTune({ repair: true }, repairCost, 'Complete Engine Rebuild');
                }}
                className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs"
              >
                Full Repair ({formatNaira(repairCost)})
              </button>
            </div>
          </div>

          {/* 2. Live 3D Metallic Respray */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-pink-300 flex items-center gap-1.5">
                <Paintbrush size={14} /> Live 3D Metallic Paint Respray
              </span>
              <span className="font-mono text-zinc-400">₦15,000</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CUSTOM_PAINTS.map((p) => (
                <button
                  key={p.hex}
                  onClick={() => {
                    audioEngine.playClick();
                    onTune({ color: p.hex }, 15000, `${p.name} Respray`);
                  }}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/30 shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: p.hex }}
                  >
                    <Check
                      size={10}
                      className={
                        p.hex === '#F8FAFC' || p.hex === '#FACC15'
                          ? 'text-black opacity-60'
                          : 'text-white opacity-60'
                      }
                    />
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-200 truncate">
                    {p.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. ECU & Twin-Turbo Performance Stages */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
            <span className="font-bold text-teal-300 flex items-center gap-1.5">
              <Gauge size={14} /> Performance ECU & Twin-Turbo Kits
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { stage: 1, name: 'Stage 1 Street', bonus: '+14% Top Speed', cost: 45000 },
                { stage: 2, name: 'Stage 2 Sport', bonus: '+28% Top Speed', cost: 95000 },
                { stage: 3, name: 'Stage 3 Race X', bonus: '+42% Top Speed', cost: 185000 },
              ].map((kit) => (
                <button
                  key={kit.stage}
                  onClick={() => {
                    audioEngine.playClick();
                    onTune({ boostLevel: kit.stage }, kit.cost, `${kit.name} Turbo Kit`);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-teal-950/60 border border-white/10 hover:border-teal-400 text-left space-y-1 transition-all"
                >
                  <span className="text-[11px] font-black text-white block">{kit.name}</span>
                  <span className="text-[10px] text-teal-300 block">{kit.bonus}</span>
                  <span className="text-[10px] font-mono text-amber-300 block">
                    {formatNaira(kit.cost)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
