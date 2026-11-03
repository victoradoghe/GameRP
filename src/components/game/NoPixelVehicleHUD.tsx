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

  return (
    <div className="pointer-events-auto bg-[#090d16]/90 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 shadow-2xl w-[264px] text-white select-none">
      {/* Top Row: Vehicle Name + Gear/Flight Mode Box */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 truncate flex items-center gap-1">
          {isPlane && <Plane size={11} className="text-sky-400 shrink-0" />}
          {isMoto && <Bike size={11} className="text-amber-400 shrink-0" />}
          {telemetry.vehicleName}
        </span>
        <span
          className={`px-2 py-0.5 rounded-md font-mono text-xs font-black border ${
            isPlane
              ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
              : 'bg-teal-500/15 border-teal-500/40 text-teal-300'
          }`}
        >
          {isPlane ? (altMeters > 6 ? 'AIR' : 'TAXI') : telemetry.gear}
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
          {isPlane && (
            <div className="flex items-center gap-1 text-emerald-300 font-bold">
              <span>ALT</span>
              <span>{altFeet.toLocaleString()} FT</span>
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

      {/* Avionics Flight Hint Banner */}
      {isPlane && (
        <div className="mb-2 px-2 py-1 rounded-lg bg-sky-950/60 border border-sky-400/30 text-[9px] font-mono text-sky-200 flex items-center justify-between">
          <span>[SPACE] CLIMB</span>
          <span>[C] DESCEND</span>
          <span>[A/D] BANK</span>
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
          className={`py-1 rounded-lg border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            telemetry.seatbeltOn
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
          }`}
          title={isMoto ? 'Helmet [B]' : isPlane ? 'Harness [B]' : 'Seatbelt [B]'}
        >
          {telemetry.seatbeltOn ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
          <span>{isMoto ? 'HELM' : '[B]'}</span>
        </button>

        <button
          onClick={onToggleLights}
          className={`py-1 rounded-lg border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
            telemetry.lightsOn
              ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              : 'bg-zinc-900 border-white/10 text-zinc-400'
          }`}
          title="Lights [H]"
        >
          <Lightbulb size={11} />
          <span>[H]</span>
        </button>

        {isPolice && (
          <button
            onClick={onToggleSiren}
            className={`py-1 rounded-lg border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
              telemetry.sirenOn
                ? 'bg-blue-950/90 border-blue-400 text-blue-300 animate-pulse'
                : 'bg-zinc-900 border-white/10 text-zinc-400'
            }`}
            title="Code-3 Sirens [Q]"
          >
            <Siren size={11} />
            <span>[Q]</span>
          </button>
        )}

        <button
          onClick={onExitVehicle}
          className="py-1 rounded-lg bg-zinc-900 hover:bg-rose-600/80 border border-white/10 text-zinc-300 hover:text-white text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
          title={isPlane && altMeters > 6 ? 'Land below 20ft to exit [F]' : 'Exit Vehicle [F]'}
        >
          <LogOut size={11} />
          <span>[F]</span>
        </button>
      </div>
    </div>
  );
};
