'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation, Compass, MapPinOff, Plane, DoorOpen } from 'lucide-react';
import { WorldRealtimeState, MapTarget, LagosDistrict, CityId } from '@/lib/types';
import { getDistrictsForCity, ATM_SPOTS } from '@/lib/gameState';
import {
  WORLD_HALF,
  ROAD_LINES,
  ROAD_WIDTH,
  BLOCK_CENTERS,
  getCityStreets,
} from '@/lib/cityLayout';
import { audioEngine } from '@/lib/audioEngine';

interface NoPixelCityMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldState: WorldRealtimeState;
  missionTarget: MapTarget | null;
  waypoint: MapTarget | null;
  activeCity?: CityId;
  onSetWaypoint: (target: MapTarget | null) => void;
  onTeleport: (x: number, z: number, label: string) => void;
  onFlyToCity?: (city: CityId, airline: string) => void;
  onEnterBuilding?: (id: LagosDistrict) => void;
}

const ENTERABLE_DISTRICTS: LagosDistrict[] = [
  'home',
  'airport',
  'computervillage',
  'lekki',
  'fleeca',
  'gas',
  'mrpd',
  'yaba',
  'cbn',
  'gtbank',
  'istore',
];

export const NoPixelCityMapModal: React.FC<NoPixelCityMapModalProps> = ({
  isOpen,
  onClose,
  worldState,
  missionTarget,
  waypoint,
  activeCity = 'lagos',
  onSetWaypoint,
  onTeleport,
  onFlyToCity,
  onEnterBuilding,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LagosDistrict>('home');
  const [viewCity, setViewCity] = useState<CityId>(activeCity);

  useEffect(() => {
    setViewCity(activeCity);
  }, [activeCity, isOpen]);

  const SIZE = 540;
  const PAD = 28;
  const SPAN = WORLD_HALF * 2; // 180

  const toCanvas = (wx: number, wz: number): [number, number] => {
    const cx = PAD + ((wx + WORLD_HALF) / SPAN) * (SIZE - PAD * 2);
    const cy = PAD + ((WORLD_HALF - wz) / SPAN) * (SIZE - PAD * 2);
    return [cx, cy];
  };

  const cityDistricts = getDistrictsForCity(viewCity);
  const { ns: streetsNS, ew: streetsEW } = getCityStreets(viewCity);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // 1. Water / Terrain Background
    ctx.fillStyle = viewCity === 'abuja' ? '#071b18' : '#061220';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 2. Main City Landmass (z from -70 to +90)
    const [lx0, ly0] = toCanvas(-WORLD_HALF, WORLD_HALF);
    const [lx1, ly1] = toCanvas(WORLD_HALF, -70);
    ctx.fillStyle = viewCity === 'abuja' ? '#131d17' : '#0f172a';
    ctx.fillRect(lx0, ly0, lx1 - lx0, ly1 - ly0);
    ctx.strokeStyle = viewCity === 'abuja' ? '#34d39955' : '#38bdf855';
    ctx.lineWidth = 2;
    ctx.strokeRect(lx0, ly0, lx1 - lx0, ly1 - ly0);

    // 2a. Dedicated Airport Peninsula Landmass (West of City: x = -88 down to -145, z = -45 to +65)
    // Completely separated from city streets with its own causeway road!
    const [ap0x, ap0y] = toCanvas(-145, 65);
    const [ap1x, ap1y] = toCanvas(-88, -45);
    ctx.fillStyle = viewCity === 'abuja' ? '#142019' : '#0b1329';
    ctx.fillRect(ap0x, ap0y, ap1x - ap0x, ap1y - ap0y);
    ctx.strokeStyle = '#38bdf888';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ap0x, ap0y, ap1x - ap0x, ap1y - ap0y);
    // Runway strip on Peninsula
    const [rw0x, rw0y] = toCanvas(-138, 55);
    const [rw1x, rw1y] = toCanvas(-138, -35);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rw0x, rw0y);
    ctx.lineTo(rw1x, rw1y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Causeway Road bridge connecting City to Airport
    const [cw0x, cw0y] = toCanvas(-94, 44);
    const [cw1x, cw1y] = toCanvas(-82, 36);
    ctx.fillStyle = '#334155';
    ctx.fillRect(cw0x, cw0y, cw1x - cw0x, cw1y - cw0y);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MMIA INTL RUNWAY 18L/36R', (rw0x + rw1x) / 2 - 8, (rw0y + rw1y) / 2);

    // 2b. Google Maps Geographic Landmarks & Natural Landscapes
    if (viewCity === 'lagos') {
      // Lagos Lagoon & Bight of Benin label in southern waters
      const [wx, wy] = toCanvas(0, -82);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BIGHT OF BENIN // FIVE COWRIE CREEK & LAGOS LAGOON', wx, wy + 18);

      // Third Mainland Bridge highlight along x = -60
      const [b1x, b1y0] = toCanvas(-60, 88);
      const [, b1y1] = toCanvas(-60, -68);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(b1x, b1y0);
      ctx.lineTo(b1x, b1y1);
      ctx.stroke();

      // Lekki-Ikoyi Link Bridge highlight along x = +60
      const [b2x, b2y0] = toCanvas(60, 88);
      const [, b2y1] = toCanvas(60, -68);
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(b2x, b2y0);
      ctx.lineTo(b2x, b2y1);
      ctx.stroke();
    } else {
      // Abuja: Aso Rock Monolith (North-East) & Zuma Rock Monolith (North-West)
      const [ax, ay] = toCanvas(52, 82);
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(ax, ay, 44, 15, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⛰️ ASO ROCK MONOLITH (936m)', ax, ay + 3);

      const [zx, zy] = toCanvas(-48, 82);
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(zx, zy, 38, 14, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a1a1aa';
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.fillText('⛰️ ZUMA ROCK (725m)', zx, zy + 3);

      // Jabi Lake Waterfront at South
      const [jx, jy] = toCanvas(0, -82);
      ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('JABI LAKE WATERFRONT & MILLENNIUM PARK CANAL', jx, jy + 18);
    }

    // 3. City Blocks + Airport Runway (-80, 40) + Player Villa (80, 40)
    const pxPerMeter = (SIZE - PAD * 2) / SPAN;
    for (const bx of BLOCK_CENTERS) {
      for (const bz of BLOCK_CENTERS) {
        if (bz === -80 && Math.abs(bx) > 20) continue;
        const half = 13.5;
        const [x0, y0] = toCanvas(bx - half, bz + half);
        const [x1, y1] = toCanvas(bx + half, bz - half);

        if (bx === -80 && bz === 40) {
          // Airport Runway & Tarmac Block
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
          // Runway strip
          ctx.strokeStyle = '#f8fafc';
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(x0 + 6, y0 + (y1 - y0) / 2);
          ctx.lineTo(x1 - 6, y0 + (y1 - y0) / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (bx === 80 && bz === 40) {
          // Player Home Residence Compound
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        } else {
          ctx.fillStyle = viewCity === 'abuja' ? '#1c2b22' : '#1e293b';
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        }
      }
    }

    // 4. Roads
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = ROAD_WIDTH * pxPerMeter;
    for (const r of ROAD_LINES) {
      const [ax0, ay0] = toCanvas(r, WORLD_HALF);
      const [ax1, ay1] = toCanvas(r, -72);
      ctx.beginPath();
      ctx.moveTo(ax0, ay0);
      ctx.lineTo(ax1, ay1);
      ctx.stroke();

      const [sx0, sy0] = toCanvas(-WORLD_HALF, r);
      const [sx1, sy1] = toCanvas(WORLD_HALF, r);
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();
    }

    // Google Maps Street Names
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    for (const r of ROAD_LINES) {
      const [, sy] = toCanvas(0, r);
      ctx.fillText(streetsEW[r] || '', SIZE / 2, sy - 3);
    }
    for (const r of ROAD_LINES) {
      const [sx] = toCanvas(r, 0);
      ctx.save();
      ctx.translate(sx + 4, SIZE / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(streetsNS[r] || '', 0, 0);
      ctx.restore();
    }

    // 5. GPS Route Line (only if viewing current activeCity)
    if (viewCity === activeCity) {
      const drawRoute = (tx: number, tz: number, color: string) => {
        const [px, py] = toCanvas(worldState.x, worldState.z);
        const [mx, my] = toCanvas(tx, worldState.z);
        const [ex, ey] = toCanvas(tx, tz);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(mx, my);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      };
      if (waypoint) drawRoute(waypoint.x, waypoint.z, '#a855f7');
      if (missionTarget) drawRoute(missionTarget.x, missionTarget.z, missionTarget.color || '#facc15');
    }

    // 6. ATM Spots
    for (const atm of ATM_SPOTS) {
      const [ax, ay] = toCanvas(atm.x, atm.z);
      ctx.beginPath();
      ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
    }

    // 7. District Blips & Labels
    for (const d of cityDistricts) {
      const [dx, dy] = toCanvas(d.x, d.z);
      const isSel = d.id === selectedDistrict;
      if (isSel) {
        ctx.beginPath();
        ctx.arc(dx, dy, 14, 0, Math.PI * 2);
        ctx.fillStyle = d.color + '44';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(dx, dy, 7, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isSel ? '#ffffff' : '#090d16';
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.name.split(' (')[0], dx, dy - 10);
    }

    // 8. Waypoint & Mission Blips + Player Arrow (when viewing current city)
    if (viewCity === activeCity) {
      if (waypoint) {
        const [wx, wy] = toCanvas(waypoint.x, waypoint.z);
        ctx.beginPath();
        ctx.arc(wx, wy, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
      if (missionTarget) {
        const [mx, my] = toCanvas(missionTarget.x, missionTarget.z);
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fillStyle = missionTarget.color || '#facc15';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      const [px, py] = toCanvas(worldState.x, worldState.z);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(worldState.heading);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(7, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-7, 8);
      ctx.closePath();
      ctx.fillStyle = '#14b8a6';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }
  }, [isOpen, worldState, missionTarget, waypoint, selectedDistrict, viewCity, activeCity, cityDistricts, streetsNS, streetsEW]);

  if (!isOpen) return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * SIZE;
    const cy = ((e.clientY - rect.top) / rect.height) * SIZE;

    const wx = ((cx - PAD) / (SIZE - PAD * 2)) * SPAN - WORLD_HALF;
    const wz = WORLD_HALF - ((cy - PAD) / (SIZE - PAD * 2)) * SPAN;
    const clampedX = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, Math.round(wx)));
    const clampedZ = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, Math.round(wz)));

    for (const d of cityDistricts) {
      if (Math.hypot(d.x - clampedX, d.z - clampedZ) < 11) {
        audioEngine.playClick();
        setSelectedDistrict(d.id);
        if (viewCity === activeCity) {
          onSetWaypoint({
            id: 'wp-' + d.id + '-' + Date.now(),
            x: d.x,
            z: d.z,
            label: d.name,
            color: '#a855f7',
          });
        }
        return;
      }
    }

    if (viewCity === activeCity) {
      audioEngine.playClick();
      onSetWaypoint({
        id: 'wp-custom-' + Date.now(),
        x: clampedX,
        z: clampedZ,
        label: `GPS [${clampedX}, ${clampedZ}]`,
        color: '#a855f7',
      });
    }
  };

  const activeDist = cityDistricts.find((d) => d.id === selectedDistrict) || cityDistricts[0];
  const isEnterable = ENTERABLE_DISTRICTS.includes(activeDist.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#090d16] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Google Maps City Switcher (Lagos vs Abuja) */}
        <div className="px-6 py-3.5 bg-zinc-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
                Google Maps Satellite // {viewCity === 'abuja' ? 'City of Abuja (FCT)' : 'City of Lagos (Eko)'}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono">
                  You are in: {activeCity === 'abuja' ? 'ABUJA (ABV)' : 'LAGOS (LOS)'}
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Real Google Maps roads, bridges, airports, houses & enterable buildings • Click map to set GPS route
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch between Lagos Map and Abuja Map */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setViewCity('lagos');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  viewCity === 'lagos'
                    ? 'bg-teal-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🌊 City of Lagos (LOS)
              </button>
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setViewCity('abuja');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  viewCity === 'abuja'
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⛰️ City of Abuja (ABV)
              </button>
            </div>

            {waypoint && (
              <button
                onClick={() => onSetWaypoint(null)}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-1"
              >
                <MapPinOff size={13} /> Clear Pin
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto">
          {/* Interactive Canvas Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#061220]">
              <canvas
                ref={canvasRef}
                width={SIZE}
                height={SIZE}
                onClick={handleCanvasClick}
                className="w-full h-full block cursor-crosshair"
              />
            </div>
          </div>

          {/* District Directory & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal-400">{activeDist.code}</span>
                <span className="text-lg">{activeDist.blipIcon}</span>
              </div>
              <h4 className="text-base font-black text-white">{activeDist.name}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{activeDist.description}</p>

              {viewCity === activeCity ? (
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioEngine.playClick();
                        onSetWaypoint({
                          id: 'wp-' + activeDist.id + '-' + Date.now(),
                          x: activeDist.x,
                          z: activeDist.z,
                          label: activeDist.name,
                          color: '#a855f7',
                        });
                        onClose();
                      }}
                      className="py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <MapPin size={13} /> Set GPS Route
                    </button>
                    <button
                      onClick={() => {
                        audioEngine.playClick();
                        onTeleport(activeDist.x, activeDist.z, activeDist.name);
                        onClose();
                      }}
                      className="py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs flex items-center justify-center gap-1"
                    >
                      <Navigation size={13} /> Fast Travel
                    </button>
                  </div>
                  {isEnterable && onEnterBuilding && (
                    <button
                      onClick={() => {
                        audioEngine.playClick();
                        onTeleport(activeDist.x, activeDist.z, activeDist.name);
                        onClose();
                        onEnterBuilding(activeDist.id);
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <DoorOpen size={14} /> Go Inside Building ({activeDist.name.split(' (')[0]})
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onFlyToCity) {
                        audioEngine.playClick();
                        onClose();
                        onFlyToCity(viewCity, 'Air Peace Express');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plane size={14} /> Fly to {viewCity === 'abuja' ? 'Abuja (ABV)' : 'Lagos (LOS)'} Now
                  </button>
                </div>
              )}
            </div>

            {/* All 13 Landmarks List */}
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {cityDistricts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDistrict(d.id)}
                  className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedDistrict === d.id
                      ? 'bg-teal-500/15 border-teal-400 text-white'
                      : 'bg-zinc-900/70 border-white/8 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{d.blipIcon}</span>
                    <span className="text-xs font-bold truncate">{d.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">{d.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
