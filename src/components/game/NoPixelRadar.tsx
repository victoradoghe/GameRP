'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Shield,
  Utensils,
  Droplet,
  Zap,
  Brain,
  Mic,
  Radio,
  Compass,
  MapPinOff,
  Maximize2,
} from 'lucide-react';
import { Vitals, WorldRealtimeState, MapTarget, CityId } from '@/lib/types';
import { getDistrictsForCity } from '@/lib/gameState';
import { ROAD_LINES, ROAD_WIDTH, WORLD_HALF, BLOCK_CENTERS } from '@/lib/cityLayout';

interface NoPixelRadarProps {
  vitals: Vitals;
  worldState: WorldRealtimeState;
  missionTarget: MapTarget | null;
  waypoint: MapTarget | null;
  voiceMode: 'whisper' | 'normal' | 'shout';
  isRadioOn: boolean;
  activeCity?: CityId;
  onCycleVoiceMode: () => void;
  onToggleRadio: () => void;
  onSetWaypoint: (target: MapTarget | null) => void;
  onOpenMap?: () => void;
}

export const NoPixelRadar: React.FC<NoPixelRadarProps> = ({
  vitals,
  worldState,
  missionTarget,
  waypoint,
  voiceMode,
  isRadioOn,
  activeCity = 'lagos',
  onCycleVoiceMode,
  onToggleRadio,
  onSetWaypoint,
  onOpenMap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [northUp, setNorthUp] = useState(false);

  const SCALE = 1.65; // pixels per world meter

  // Cardinal compass from cameraYaw: +Z is North (yaw=0), -X is East (yaw=-PI/2)
  const getCompass = (yaw: number) => {
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    // Angle clockwise from +Z (North), where screen-right at yaw=0 is -X (East)
    const deg = (((Math.atan2(-fx, fz) * 180) / Math.PI) % 360 + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h * 0.58; // Slightly lower center like GTA V so more forward road is visible

    const yaw = northUp ? 0 : worldState.cameraYaw;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const rx = -Math.cos(yaw);
    const rz = Math.sin(yaw);

    const toScreen = (wx: number, wz: number): [number, number] => {
      const dx = wx - worldState.x;
      const dz = wz - worldState.z;
      const right = dx * rx + dz * rz;
      const fwd = dx * fx + dz * fz;
      return [cx + right * SCALE, cy - fwd * SCALE];
    };

    // 1. Deep ocean / background
    ctx.fillStyle = '#071422';
    ctx.fillRect(0, 0, w, h);

    // 2. City landmass polygon [-WORLD_HALF..WORLD_HALF] x [-72..WORLD_HALF]
    // South of z = -72 is the Lagoon waterfront
    const landCorners: [number, number][] = [
      [-WORLD_HALF, -70],
      [WORLD_HALF, -70],
      [WORLD_HALF, WORLD_HALF],
      [-WORLD_HALF, WORLD_HALF],
    ];
    ctx.beginPath();
    landCorners.forEach(([lx, lz], i) => {
      const [sx, sy] = toScreen(lx, lz);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#38bdf844';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. City blocks (subtle dark pads)
    for (const bx of BLOCK_CENTERS) {
      for (const bz of BLOCK_CENTERS) {
        if (bz === -80 && Math.abs(bx) > 20) continue;
        const half = 13.5;
        const corners: [number, number][] = [
          [bx - half, bz - half],
          [bx + half, bz - half],
          [bx + half, bz + half],
          [bx - half, bz + half],
        ];
        ctx.beginPath();
        corners.forEach(([px, pz], idx) => {
          const [sx, sy] = toScreen(px, pz);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fillStyle = '#1b2436';
        ctx.fill();
      }
    }

    // 4. Road grid (ROAD_LINES = [-60, -20, 20, 60])
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = ROAD_WIDTH * SCALE;
    ctx.lineCap = 'butt';
    for (const r of ROAD_LINES) {
      // Avenue (along Z)
      const [ax1, ay1] = toScreen(r, -72);
      const [ax2, ay2] = toScreen(r, WORLD_HALF);
      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.stroke();

      // Street (along X)
      const [sx1, sy1] = toScreen(-WORLD_HALF, r);
      const [sx2, sy2] = toScreen(WORLD_HALF, r);
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
    }

    // Center divider dashes on roads
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    for (const r of ROAD_LINES) {
      const [ax1, ay1] = toScreen(r, -72);
      const [ax2, ay2] = toScreen(r, WORLD_HALF);
      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.stroke();

      const [sx1, sy1] = toScreen(-WORLD_HALF, r);
      const [sx2, sy2] = toScreen(WORLD_HALF, r);
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 5. GPS Route lines (Manhattan L-path along nearest road)
    const drawRoute = (tx: number, tz: number, color: string) => {
      const [sx, sy] = toScreen(worldState.x, worldState.z);
      const [mx, my] = toScreen(tx, worldState.z);
      const [ex, ey] = toScreen(tx, tz);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    };

    if (waypoint) {
      drawRoute(waypoint.x, waypoint.z, '#a855f7');
    }
    if (missionTarget) {
      drawRoute(missionTarget.x, missionTarget.z, missionTarget.color || '#facc15');
    }

    // 6. District Blips
    const cityDistricts = getDistrictsForCity(activeCity);
    for (const d of cityDistricts) {
      const [bx, by] = toScreen(d.x, d.z);
      if (bx < -8 || bx > w + 8 || by < -8 || by > h + 8) continue;
      ctx.beginPath();
      ctx.arc(bx, by, d.id === 'home' || d.id === 'airport' ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = d.id === 'home' || d.id === 'airport' ? '#ffffff' : '#090d16';
      ctx.stroke();
    }

    // 7. Waypoint & Mission Blips (clamped to radar edge if off-screen so player always knows direction!)
    const drawClampedTarget = (tx: number, tz: number, color: string, pulse: boolean) => {
      let [bx, by] = toScreen(tx, tz);
      const pad = 10;
      bx = Math.max(pad, Math.min(w - pad, bx));
      by = Math.max(pad, Math.min(h - pad, by));
      if (pulse) {
        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fillStyle = color + '44';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    };

    if (waypoint) {
      drawClampedTarget(waypoint.x, waypoint.z, '#a855f7', false);
    }
    if (missionTarget) {
      drawClampedTarget(missionTarget.x, missionTarget.z, missionTarget.color || '#facc15', true);
    }

    // 8. Active Police Interceptor Blips (flashing red/blue)
    const flashBlue = Math.floor(Date.now() / 220) % 2 === 0;
    for (const cop of worldState.police) {
      const [px, py] = toScreen(cop.x, cop.z);
      if (px < -6 || px > w + 6 || py < -6 || py > h + 6) continue;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = flashBlue ? '#3b82f6' : '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    // 9. Player Arrow at (cx, cy)
    const arrowRot = yaw - worldState.heading;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(arrowRot);

    // Subtle cone of vision
    const grad = ctx.createRadialGradient(0, 0, 2, 0, -24, 34);
    grad.addColorStop(0, 'rgba(20, 184, 166, 0.26)');
    grad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-22, -38);
    ctx.lineTo(22, -38);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fillStyle = worldState.vehicle.isDriving ? '#14b8a6' : '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#020617';
    ctx.stroke();
    ctx.restore();

    // 10. North 'N' indicator pinned on top rim
    const [nx, ny] = toScreen(worldState.x, worldState.z + 200);
    const ndx = nx - cx;
    const ndy = ny - cy;
    const nLen = Math.hypot(ndx, ndy) || 1;
    const rimX = Math.max(12, Math.min(w - 12, cx + (ndx / nLen) * (w * 0.46)));
    const rimY = Math.max(12, Math.min(h - 14, cy + (ndy / nLen) * (h * 0.46)));
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(rimX, rimY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', rimX, rimY + 0.5);
  }, [worldState, missionTarget, waypoint, northUp, activeCity]);

  const handleRadarClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.58;

    const yaw = northUp ? 0 : worldState.cameraYaw;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const rx = -Math.cos(yaw);
    const rz = Math.sin(yaw);

    const relRight = (sx - cx) / SCALE;
    const relFwd = -(sy - cy) / SCALE;
    const wx = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, worldState.x + relFwd * fx + relRight * rx));
    const wz = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, worldState.z + relFwd * fz + relRight * rz));

    onSetWaypoint({
      id: 'wp-' + Date.now(),
      x: Math.round(wx),
      z: Math.round(wz),
      label: 'GPS Pin',
      color: '#a855f7',
    });
  };

  const renderVitalSquare = (
    value: number,
    color: string,
    icon: React.ReactNode,
    label: string,
    alert = false
  ) => {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    return (
      <div
        className={`relative w-8 h-8 rounded-lg bg-[#090d16]/90 border border-white/10 overflow-hidden flex items-center justify-center group shadow-md ${
          alert ? 'ring-1 ring-rose-500 animate-pulse' : ''
        }`}
        title={`${label}: ${pct}%`}
      >
        {/* Vertical fill from bottom (authentic NoPixel 4.0 square status icon) */}
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-300 opacity-35"
          style={{ height: `${pct}%`, backgroundColor: color }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ backgroundColor: color }}
        />
        <div className="relative z-10" style={{ color }}>
          {icon}
        </div>
      </div>
    );
  };

  const voicePct = voiceMode === 'whisper' ? 33 : voiceMode === 'normal' ? 66 : 100;

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 select-none w-[256px]">
      {/* Street & Compass Strip */}
      <div className="flex items-center justify-between gap-2 bg-[#090d16]/88 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl shadow-lg">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-black font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1 py-0.5 rounded">
            {activeCity === 'abuja' ? 'ABV' : 'LOS'}
          </span>
          <span className="text-[11px] font-black font-mono text-teal-400 bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.5 rounded">
            {getCompass(worldState.cameraYaw)}
          </span>
          <span className="text-[11px] font-bold text-zinc-100 truncate">
            {worldState.streetName || 'Broad Street'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {waypoint && (
            <button
              onClick={() => onSetWaypoint(null)}
              className="p-1 rounded bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 transition-colors"
              title="Clear GPS Waypoint"
            >
              <MapPinOff size={11} />
            </button>
          )}
          <button
            onClick={() => setNorthUp((n) => !n)}
            className={`p-1 rounded transition-colors ${
              northUp ? 'bg-teal-500/25 text-teal-300' : 'text-zinc-400 hover:text-white'
            }`}
            title={northUp ? 'North-Up Radar (Click for Camera-Follow)' : 'Camera-Follow Radar (Click for North-Up)'}
          >
            <Compass size={12} />
          </button>
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="p-1 rounded bg-white/5 hover:bg-teal-500/25 text-zinc-300 hover:text-teal-300 transition-colors"
              title="Open Full Satellite City Map [N]"
            >
              <Maximize2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Minimap Frame */}
      <div className="relative w-[256px] h-[154px] rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-[#071422]">
        <canvas
          ref={canvasRef}
          width={256}
          height={154}
          onClick={handleRadarClick}
          className="w-full h-full block cursor-crosshair"
          title="Click anywhere on radar to set GPS Waypoint"
        />

        {/* Classic GTA / NoPixel Health + Armor Strip along bottom edge */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/85 flex gap-0.5 px-0.5 py-[1px] pointer-events-none">
          <div className="flex-1 bg-zinc-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                vitals.health < 30 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, vitals.health))}%` }}
            />
          </div>
          <div className="flex-1 bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, vitals.armor))}%` }}
            />
          </div>
        </div>
      </div>

      {/* NoPixel 4.0 Minimal Square Status Row */}
      <div className="flex items-center justify-between gap-1">
        <button onClick={onCycleVoiceMode} className="focus:outline-none">
          {renderVitalSquare(
            voicePct,
            isRadioOn ? '#a855f7' : '#facc15',
            <Mic size={13} />,
            `Voice: ${voiceMode.toUpperCase()}`
          )}
        </button>

        {renderVitalSquare(
          vitals.health,
          vitals.health < 35 ? '#f43f5e' : '#10b981',
          <Heart size={13} />,
          'Health',
          vitals.health < 35
        )}

        {renderVitalSquare(vitals.armor, '#38bdf8', <Shield size={13} />, 'Armor')}

        {renderVitalSquare(
          vitals.hunger,
          '#fb923c',
          <Utensils size={13} />,
          'Hunger',
          vitals.hunger < 20
        )}

        {renderVitalSquare(
          vitals.thirst,
          '#22d3ee',
          <Droplet size={13} />,
          'Thirst',
          vitals.thirst < 20
        )}

        {renderVitalSquare(vitals.energy, '#eab308', <Zap size={13} />, 'Stamina')}

        {renderVitalSquare(
          vitals.stress,
          '#f472b6',
          <Brain size={13} />,
          'Stress',
          vitals.stress > 75
        )}

        <button
          onClick={onToggleRadio}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all shadow-md ${
            isRadioOn
              ? 'bg-purple-950/85 border-purple-500/60 text-purple-300'
              : 'bg-[#090d16]/90 border-white/10 text-zinc-500 hover:text-zinc-300'
          }`}
          title={isRadioOn ? 'Radio 104.8 MHz ON' : 'Radio OFF'}
        >
          <Radio size={13} />
        </button>
      </div>
    </div>
  );
};
