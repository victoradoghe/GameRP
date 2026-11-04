'use client';

import React from 'react';
import {
  Fuel,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Lightbulb,
  LogOut,
  Plane,
  Bike,
  Compass,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { VehicleTelemetry } from '@/lib/types';

interface NoPixelVehicleHUDProps {
  telemetry: VehicleTelemetry;
  onToggleSeatbelt: () => void;
  onToggleLights: () => void;
  onToggleSiren: () => void;
  onExitVehicle: () => void;
}

export const NoPixelVehicleHUD: React.FC<NoPixelVehicleHUDProps> = ({
  telemetry,
  onToggleSeatbelt,
  onToggleLights,
  onToggleSiren,
  onExitVehicle,
}) => {
  if (!telemetry.isDriving) return null;

  const speedVal = Math.round(telemetry.speedKmh);
  const speedDigits = String(speedVal).padStart(3, '0');
  const leadingZeros = speedVal === 0 ? 2 : speedVal < 10 ? 2 : speedVal < 100 ? 1 : 0;
  const rpmPct = Math.min(100, Math.max(6, telemetry.rpm));
  const isPolice = telemetry.vehicleCategory === 'police';
  const isPlane = telemetry.vehicleCategory === 'plane';
  const isMoto = telemetry.vehicleCategory === 'motorcycle';
  const altMeters = Math.max(0, Math.round(telemetry.altitudeMeters ?? 0));
  const altFeet = Math.round(altMeters * 3.281);
  const isAirborne = isPlane && altFeet > 18;
  const isStalling = isAirborne && speedVal < 45;

  const rollDeg = Math.round(((telemetry.rollRad ?? 0) * 180) / Math.PI);
  const pitchDeg = Math.round(((telemetry.pitchRad ?? 0) * 180) / Math.PI);
  const headingDeg = telemetry.headingDeg ?? 0;

  // Cardinal direction helper
  const getCardinal = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((deg % 360) / 45)) % 8;
    return dirs[idx];
  };

  return (
    <div className="pointer-events-auto bg-[#090d16]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-2xl w-[280px] text-white select-none transition-all">
      {/* Top Row: Vehicle Name + Gear/Flight Mode Box */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300 truncate flex items-center gap-1.5">
          {isPlane && <Plane size={12} className="text-sky-400 shrink-0 animate-pulse" />}
          {isMoto && <Bike size={12} className="text-amber-400 shrink-0" />}
          {telemetry.vehicleName}
        </span>
        <span
          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-black border tracking-wider ${
            isPlane
              ? isAirborne
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
              : 'bg-teal-500/15 border-teal-500/40 text-teal-300'
          }`}
        >
          {isPlane ? (isAirborne ? 'AIRBORNE' : 'TAXI 18L') : telemetry.gear}
        </span>
      </div>

      {/* Main Speedometer + Fuel/Engine/Altimeter */}
      <div className="flex items-end justify-between mb-2">
        <div className="flex items-baseline gap-1.5 font-mono leading-none">
          <span className="text-4xl font-black tracking-tight">
            <span className="text-zinc-700">{speedDigits.slice(0, leadingZeros)}</span>
            <span className="text-white">{speedDigits.slice(leadingZeros)}</span>
          </span>
          <span className="text-[10px] font-bold text-teal-400 uppercase pb-1">
            {isPlane ? 'KTS' : 'KM/H'}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] font-mono">
          {isPlane ? (
            <div className="flex items-center gap-1 text-emerald-300 font-bold">
              <span>ALT</span>
              <span className="text-xs">{altFeet.toLocaleString()} FT</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-zinc-400">
              <Compass size={11} className="text-zinc-500" />
              <span>
                {headingDeg}° {getCardinal(headingDeg)}
              </span>
            </div>
          )}
          <div
            className={`flex items-center gap-1 ${
              telemetry.fuel < 20 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
            }`}
          >
            <Fuel size={11} />
            <span>{Math.round(telemetry.fuel)}%</span>
          </div>
          <div
            className={`flex items-center gap-1 ${
              telemetry.engineHealth < 35 ? 'text-rose-400' : 'text-sky-300'
            }`}
          >
            <Wrench size={11} />
            <span>{Math.round(telemetry.engineHealth)}%</span>
          </div>
        </div>
      </div>

      {/* ==================== AIRCRAFT PRIMARY FLIGHT DISPLAY (PFD) HUD ==================== */}
      {isPlane && (
        <div className="mb-2 p-2 rounded-xl bg-black/60 border border-sky-500/30 font-mono text-[9px] relative overflow-hidden">
          {/* Artificial Horizon Mini Tape */}
          <div className="h-14 relative rounded-lg overflow-hidden bg-gradient-to-b from-sky-900/40 via-sky-950/20 to-amber-950/40 border border-sky-400/20 flex items-center justify-center">
            {/* Horizon Line + Pitch Marks */}
            <div
              className="absolute inset-x-0 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-transform duration-75"
              style={{
                transform: `translateY(${-pitchDeg * 1.4}px) rotate(${-rollDeg}deg)`,
              }}
            >
              {/* Pitch Ladder Marks */}
              <div className="absolute left-4 -top-3 w-4 h-0.5 bg-emerald-400/60" />
              <div className="absolute right-4 -top-3 w-4 h-0.5 bg-emerald-400/60" />
              <div className="absolute left-4 top-3 w-4 h-0.5 bg-amber-400/60" />
              <div className="absolute right-4 top-3 w-4 h-0.5 bg-amber-400/60" />
            </div>

            {/* Static Aircraft Center Reticle Symbol [- · -] */}
            <div className="relative z-10 flex items-center gap-1 text-amber-400 font-black">
              <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
              <span className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-amber-400/40" />
              <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
            </div>

            {/* Top Compass Heading Ribbon */}
            <div className="absolute top-1 inset-x-0 flex justify-between px-2 text-[8px] font-bold text-sky-300/80">
              <span>HDG {headingDeg}°</span>
              <span>{getCardinal(headingDeg)}</span>
              <span>PITCH {pitchDeg}°</span>
            </div>

            {/* Bottom Status / Stall Alert */}
            {isStalling ? (
              <div className="absolute bottom-1 inset-x-1 py-0.5 bg-rose-600/90 text-white font-black text-center text-[9px] rounded animate-pulse flex items-center justify-center gap-1">
                <AlertTriangle size={10} />
                <span>STALL WARNING • PUSH NOSE DOWN</span>
              </div>
            ) : telemetry.isBoosting ? (
              <div className="absolute bottom-1 inset-x-1 py-0.5 bg-sky-600/80 text-white font-black text-center text-[8px] rounded flex items-center justify-center gap-1">
                <Zap size={9} />
                <span>AFTERBURNER ENGAGED 124%</span>
              </div>
            ) : null}
          </div>

          {/* Avionics Flight Controls Key Hint */}
          <div className="mt-1.5 flex items-center justify-between text-[8px] text-sky-200/90 px-0.5 font-bold">
            <span>[SPACE] CLIMB</span>
            <span>[C] SINK</span>
            <span>[A/D] ROLL {rollDeg}°</span>
            <span>[SHIFT] BOOST</span>
          </div>
        </div>
      )}

      {/* Segmented NoPixel RPM / Thrust Bar */}
      <div className="grid grid-cols-12 gap-0.5 mb-2.5">
        {Array.from({ length: 12 }, (_, idx) => {
          const threshold = ((idx + 1) / 12) * 100;
          const active = rpmPct >= threshold - 4;
          const segColor =
            idx >= 10 ? 'bg-rose-500' : idx >= 7 ? 'bg-amber-400' : isPlane ? 'bg-sky-400' : 'bg-teal-400';
          return (
            <div
              key={idx}
              className={`h-1.5 rounded-xs transition-colors ${
                active ? segColor : 'bg-zinc-800'
              }`}
            />
          );
        })}
      </div>

      {/* Compact Control Strip */}
      <div className={`grid ${isPolice ? 'grid-cols-4' : 'grid-cols-3'} gap-1`}>
        <button
          onClick={onToggleSeatbelt}
          className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            telemetry.seatbeltOn
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
          }`}
          title={isMoto ? 'Helmet [B]' : isPlane ? 'Flight Harness [B]' : 'Seatbelt [B]'}
        >
          {telemetry.seatbeltOn ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
          <span>{isMoto ? 'HELMET' : isPlane ? 'HARNESS' : '[B] BELT'}</span>
        </button>

        <button
          onClick={onToggleLights}
          className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            telemetry.lightsOn
              ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              : 'bg-zinc-900 border-white/10 text-zinc-400'
          }`}
          title="Lights [H]"
        >
          <Lightbulb size={11} />
          <span>[H] LIGHTS</span>
        </button>

        {isPolice && (
          <button
            onClick={onToggleSiren}
            className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
              telemetry.sirenOn
                ? 'bg-blue-950/90 border-blue-400 text-blue-300 animate-pulse'
                : 'bg-zinc-900 border-white/10 text-zinc-400'
            }`}
            title="Code-3 Sirens [Q]"
          >
            <Siren size={11} />
            <span>[Q] SIREN</span>
          </button>
        )}

        <button
          onClick={onExitVehicle}
          className="py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-600/80 border border-white/10 text-zinc-300 hover:text-white text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
          title={isPlane && altMeters > 6 ? 'Land below 20ft to exit [F]' : 'Exit Vehicle [F]'}
        >
          <LogOut size={11} />
          <span>[F] EXIT</span>
        </button>
      </div>
    </div>
  );
};
