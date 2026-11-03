'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Emote,
  MapTarget,
  PlayerStats,
  Weather,
  WorldRealtimeState,
  VehicleCategory,
  CityId,
} from '@/lib/types';
import { DISTRICTS, getDistrictsForCity, VEHICLES_CATALOG, ATM_SPOTS } from '@/lib/gameState';
import {
  AABB,
  BLOCK_CENTERS,
  INNER_BLOCKS,
  ROAD_LINES,
  ROAD_WIDTH,
  WORLD_HALF,
  blockBounds,
  blockLoop,
  circleHitsBox,
  generateFillerBuildings,
  getStreetName,
  nearestRoad,
} from '@/lib/cityLayout';
import { audioEngine } from '@/lib/audioEngine';
import { buildHumanoid, animateHumanoid, applyOutfit, Humanoid, HumanoidState } from './world/humanoid';
import { buildCar, CarModel } from './world/carModel';

export type VehicleAction = 'enter_exit' | 'seatbelt' | 'lights' | 'siren';

export interface LagosWorld3DProps {
  outfit: PlayerStats['outfit'];
  activeCity?: CityId;
  solarKw?: number;
  timeOfDay: number; // 0..24 (fractional)
  weather: Weather;
  isNepaActive: boolean;
  cameraMode: 'chase' | 'isometric' | 'hood';
  emote: Emote;
  holdingPhone: boolean;
  movementLocked: boolean;
  cursorFree: boolean;
  isDowned: boolean;
  energy: number;
  wantedStars: number;
  missionTarget: MapTarget | null;
  waypoint: MapTarget | null;
  teleportRequest: { x: number; z: number; ts: number } | null;
  spawnVehicleRequest: { id: string; timestamp: number } | null;
  vehicleControlTrigger: { action: VehicleAction; timestamp: number } | null;
  tuneVehicleRequest?: {
    color?: string;
    repair?: boolean;
    refuel?: boolean;
    boostLevel?: number;
    ts: number;
  } | null;
  meText: { text: string; ts: number } | null;
  onInteract: (id: string) => void;
  onRefuelRequest: (missingPct: number) => boolean;
  onMissionReached: (targetId: string) => void;
  onWaypointReached: () => void;
  onBusted: () => void;
  onWantedEscaped: () => void;
  onCrime: (kind: string) => void;
  onDamage: (amount: number, reason: string) => void;
  onEmoteCancel: () => void;
  onUpdateWorldState: (state: WorldRealtimeState) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SPEED_TO_KMH = 7;
const TOP_SPEED_ACCEL: Record<VehicleCategory, number> = { super: 26, police: 23, suv: 18, sedan: 16, transit: 11 };

function angleLerp(a: number, b: number, t: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function textTexture(text: string, bg: string, fg: string, w = 512, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = `900 ${Math.floor(h * 0.52)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function iconSprite(emoji: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(9,9,11,0.85)';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.font = '64px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  s.scale.set(1.4, 1.4, 1);
  return s;
}

function meSprite(text: string) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.font = 'italic 600 44px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = `* ${text} *`;
  const tw = Math.min(1000, ctx.measureText(label).width + 40);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect((1024 - tw) / 2, 24, tw, 80);
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText(label, 512, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, depthTest: false, transparent: true }));
  s.scale.set(6, 0.75, 1);
  s.renderOrder = 999;
  return s;
}

/** Window facade textures: colour map + emissive map (lit windows) */
function makeWindowTextures() {
  const w = 128;
  const h = 256;
  const map = document.createElement('canvas');
  const em = document.createElement('canvas');
  map.width = em.width = w;
  map.height = em.height = h;
  const m = map.getContext('2d')!;
  const e = em.getContext('2d')!;
  m.fillStyle = '#c8c8c8';
  m.fillRect(0, 0, w, h);
  e.fillStyle = '#000';
  e.fillRect(0, 0, w, h);
  const cols = 4;
  const rows = 8;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (w / cols) + 5;
      const y = r * (h / rows) + 6;
      const ww = w / cols - 10;
      const hh = h / rows - 12;
      const lit = rnd() < 0.42;
      m.fillStyle = lit ? '#fde68a' : '#1e293b';
      m.fillRect(x, y, ww, hh);
      if (lit) {
        e.fillStyle = rnd() < 0.2 ? '#bae6fd' : '#fcd34d';
        e.fillRect(x, y, ww, hh);
      }
    }
  }
  const mapTex = new THREE.CanvasTexture(map);
  const emTex = new THREE.CanvasTexture(em);
  for (const t of [mapTex, emTex]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  }
  return { mapTex, emTex };
}

/** Scale box UVs so window texture tiles at a constant world size */
function scaleBoxUVs(geo: THREE.BoxGeometry, w: number, h: number, d: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  // faces: +x, -x, +y, -y, +z, -z (4 verts each)
  const faceW = [d, d, 0, 0, w, w];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      if (faceW[f] === 0) {
        uv.setXY(i, 0.01, 0.01);
      } else {
        uv.setXY(i, uv.getX(i) * (faceW[f] / 10), uv.getY(i) * (h / 20));
      }
    }
  }
  uv.needsUpdate = true;
}

function isOnRoad(x: number, z: number) {
  return Math.abs(x - nearestRoad(x)) < ROAD_WIDTH / 2 || Math.abs(z - nearestRoad(z)) < ROAD_WIDTH / 2;
}
function groundY(x: number, z: number) {
  if (z < -WORLD_HALF + 0.5) return 0.35; // pier deck
  return isOnRoad(x, z) ? 0 : 0.12;
}
function clampToWorld(p: { x: number; z: number }) {
  p.x = Math.max(-WORLD_HALF + 2, Math.min(WORLD_HALF - 2, p.x));
  p.z = Math.min(WORLD_HALF - 2, p.z);
  if (p.z < -WORLD_HALF + 1) {
    const onPier = Math.abs(p.x) < 1.8 && p.z > -WORLD_HALF - 20;
    if (!onPier) p.z = -WORLD_HALF + 1;
  }
}

// ---------------------------------------------------------------------------
// Runtime entity types
// ---------------------------------------------------------------------------
interface DrivableCar {
  id: string;
  name: string;
  category: VehicleCategory;
  color: string;
  vmax: number;
  model: CarModel;
  x: number;
  z: number;
  heading: number;
  vx: number;
  vz: number;
  steer: number;
  fuel: number;
  engine: number;
}

interface TrafficCar {
  model: CarModel;
  loop: [number, number][];
  s: number;
  speed: number;
  maxSpeed: number;
  x: number;
  z: number;
  heading: number;
  honkCd: number;
}

interface Ped {
  id: string;
  name: string;
  h: Humanoid;
  loop: [number, number][];
  s: number;
  dir: 1 | -1;
  speed: number;
  downT: number;
  x: number;
  z: number;
  heading: number;
}

interface StaticNpc {
  h: Humanoid;
  state: HumanoidState;
}

interface PoliceUnit {
  model: CarModel;
  active: boolean;
  x: number;
  z: number;
  heading: number;
  speed: number;
}

const SKINS = ['#5c3a21', '#6d4023', '#8d5524', '#3b2416', '#c68642', '#e0ac69', '#4a2c17'];
const SHIRTS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#f8fafc', '#18181b', '#0ea5e9', '#ec4899', '#84cc16'];
const PANTS = ['#1e293b', '#334155', '#1f2937', '#78716c', '#0c4a6e', '#3f3f46'];
const TRAFFIC_COLORS = ['#e11d48', '#f8fafc', '#18181b', '#2563eb', '#71717a', '#16a34a', '#facc15', '#7c3aed', '#0891b2'];
const PED_NAMES = [
  'Chidi (Fintech Intern)',
  'Bisi (Market Trader)',
  'Tunde (Club Promoter)',
  'Zainab (Lekki Stylist)',
  'Emeka (Crypto Broker)',
  'Sade (Law Student)',
  'Kola (Auto Tech)',
  'Ada (Music Scout)',
  'Yemi (Street Photographer)',
  'Ngozi (Realtor)',
  'Femi (Boutique Owner)',
  'Halima (Chef)',
  'Segun (Courier)',
  'Damilola (DJ)',
];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const LagosWorld3D: React.FC<LagosWorld3DProps> = (props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const apiRef = useRef<{
    teleport: (x: number, z: number) => void;
    spawnVehicle: (id: string) => void;
    vehicleAction: (a: VehicleAction) => void;
    tuneVehicle: (opts: NonNullable<LagosWorld3DProps['tuneVehicleRequest']>) => void;
    showMe: (text: string) => void;
    setOutfit: (o: PlayerStats['outfit']) => void;
  } | null>(null);

  // ===================== ONE-TIME SCENE SETUP =====================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color('#0b1020');
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2(skyColor.getHex(), 0.009);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 600);
    camera.position.set(0, 6, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // ---------- Lights ----------
    const hemi = new THREE.HemisphereLight(0xbcd7ff, 0x2b2118, 0.6);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -55;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 220;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);

    // ---------- Ocean + ground ----------
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.12, metalness: 0.65 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.6;
    scene.add(ocean);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2),
      new THREE.MeshStandardMaterial({ color: 0x26282d, roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const roadMat = ground.material as THREE.MeshStandardMaterial;

    // Sea wall around the island
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    for (const [x, z, w, d] of [
      [0, WORLD_HALF, WORLD_HALF * 2, 1],
      [0, -WORLD_HALF, WORLD_HALF * 2, 1],
      [WORLD_HALF, 0, 1, WORLD_HALF * 2],
      [-WORLD_HALF, 0, 1, WORLD_HALF * 2],
    ] as [number, number, number, number][]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), wallMat);
      wall.position.set(x, -0.1, z);
      scene.add(wall);
    }

    // Sidewalk / park slabs for every block
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.95 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 1 });
    for (const bx of BLOCK_CENTERS) {
      for (const bz of BLOCK_CENTERS) {
        const [x0, x1] = blockBounds(bx);
        const [z0, z1] = blockBounds(bz);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.12, z1 - z0), sidewalkMat);
        slab.position.set((x0 + x1) / 2, 0.06, (z0 + z1) / 2);
        slab.receiveShadow = true;
        scene.add(slab);
        if (bz === -80 || (bx === 40 && bz === 40)) {
          const grass = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 6, 0.13, z1 - z0 - 6), grassMat);
          grass.position.set((x0 + x1) / 2, 0.07, (z0 + z1) / 2);
          grass.receiveShadow = true;
          scene.add(grass);
        }
      }
    }

    // Road markings (instanced dashes + crosswalks)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const dashGeo = new THREE.PlaneGeometry(0.25, 3);
    dashGeo.rotateX(-Math.PI / 2);
    const dashSpots: [number, number, number][] = [];
    for (const r of ROAD_LINES) {
      for (let t = -WORLD_HALF + 3; t < WORLD_HALF; t += 7) {
        if (ROAD_LINES.some((q) => Math.abs(q - t) < 6)) continue;
        dashSpots.push([r, t, 0]);
        dashSpots.push([t, r, Math.PI / 2]);
      }
    }
    const dashes = new THREE.InstancedMesh(dashGeo, dashMat, dashSpots.length);
    const tmp = new THREE.Object3D();
    dashSpots.forEach(([x, z, ry], i) => {
      tmp.position.set(x, 0.02, z);
      tmp.rotation.set(0, ry, 0);
      tmp.updateMatrix();
      dashes.setMatrixAt(i, tmp.matrix);
    });
    scene.add(dashes);

    const zebraGeo = new THREE.PlaneGeometry(0.6, 3.2);
    zebraGeo.rotateX(-Math.PI / 2);
    const zebraSpots: [number, number, number][] = [];
    for (const rx of ROAD_LINES) {
      for (const rz of ROAD_LINES) {
        for (let k = -3.5; k <= 3.5; k += 1.4) {
          zebraSpots.push([rx + k, rz - 6.8, 0]);
          zebraSpots.push([rx + k, rz + 6.8, 0]);
          zebraSpots.push([rx - 6.8, rz + k, Math.PI / 2]);
          zebraSpots.push([rx + 6.8, rz + k, Math.PI / 2]);
        }
      }
    }
    const zebras = new THREE.InstancedMesh(zebraGeo, new THREE.MeshBasicMaterial({ color: 0xe5e7eb }), zebraSpots.length);
    zebraSpots.forEach(([x, z, ry], i) => {
      tmp.position.set(x, 0.021, z);
      tmp.rotation.set(0, ry, 0);
      tmp.updateMatrix();
      zebras.setMatrixAt(i, tmp.matrix);
    });
    scene.add(zebras);

    // ---------- Buildings ----------
    const colliders: AABB[] = [];
    const cameraBlockers: THREE.Object3D[] = [];
    const { mapTex, emTex } = makeWindowTextures();
    const windowMats = new Map<number, THREE.MeshStandardMaterial>();
    const getWindowMat = (color: number) => {
      let m = windowMats.get(color);
      if (!m) {
        m = new THREE.MeshStandardMaterial({
          color,
          map: mapTex,
          emissive: 0xffd28a,
          emissiveMap: emTex,
          emissiveIntensity: 0,
          roughness: 0.55,
          metalness: 0.25,
        });
        windowMats.set(color, m);
      }
      return m;
    };
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });

    const addBox = (
      x: number, z: number, w: number, d: number, h: number,
      mat: THREE.Material, opts: { y?: number; collide?: boolean; windows?: boolean; cast?: boolean } = {}
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      if (opts.windows) scaleBoxUVs(geo, w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, (opts.y ?? 0) + h / 2, z);
      mesh.castShadow = opts.cast ?? true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      if (opts.collide !== false) {
        colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
        cameraBlockers.push(mesh);
      }
      return mesh;
    };

    const addSign = (text: string, bg: string, fg: string, x: number, y: number, z: number, w: number, glow = 0.9) => {
      const tex = textTexture(text, bg, fg);
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mat);
      sign.position.set(x, y, z);
      scene.add(sign);
      return mat;
    };

    // Generic filler buildings
    const reserved = new Set(DISTRICTS.map((d) => `${d.blockX},${d.blockZ}`));
    const fillers = generateFillerBuildings(reserved);
    for (const b of fillers) {
      addBox(b.x, b.z, b.w, b.d, b.h, getWindowMat(b.color), { windows: true });
      addBox(b.x, b.z, b.w + 0.4, b.d + 0.4, 0.5, roofMat, { y: b.h, collide: false, cast: false });
      if (b.h > 20) {
        addBox(b.x + b.w * 0.15, b.z - b.d * 0.15, 2, 2, 2.5, roofMat, { y: b.h + 0.5, collide: false, cast: false });
      }
    }

    // Landmarks (front faces +Z toward the marker)
    const neonMats: THREE.MeshStandardMaterial[] = [];
    const signMats: THREE.MeshStandardMaterial[] = [];
    const beams: THREE.Mesh[] = [];
    const glowMat = (c: number) => {
      const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2 });
      neonMats.push(m);
      return m;
    };

    for (const d of DISTRICTS) {
      const bx = d.blockX === -80 ? -77.5 : d.blockX;
      const bz = d.blockZ;
      switch (d.id) {
        case 'shitta': {
          addBox(bx, bz - 3, 18, 14, 6, getWindowMat(0xb45309), { windows: true });
          addBox(bx, bz + 5.2, 18, 2.6, 0.25, new THREE.MeshStandardMaterial({ color: 0xea580c }), { y: 3.6, collide: false });
          signMats.push(addSign('AMALA SHITTA', '#7c2d12', '#fde047', bx, 6.8, bz + 4.05, 10));
          const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
          for (const tx of [-6, -2, 2, 6]) {
            addBox(bx + tx, bz + 8, 1.4, 1.4, 0.8, tableMat, { collide: false, cast: false, y: 0.12 });
          }
          break;
        }
        case 'fleeca': {
          addBox(bx, bz - 2, 20, 16, 11, getWindowMat(0x14532d), { windows: true });
          signMats.push(addSign('FLEECA', '#052e16', '#4ade80', bx, 9, bz + 6.05, 9));
          addBox(bx, bz + 6.1, 20.4, 0.4, 0.6, glowMat(0x22c55e), { y: 7.2, collide: false });
          break;
        }
        case 'pillbox': {
          addBox(bx, bz - 3, 22, 16, 24, getWindowMat(0xd4d4d8), { windows: true });
          signMats.push(addSign('PILLBOX MEDICAL', '#ffffff', '#dc2626', bx, 5, bz + 5.05, 12));
          const pad = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x3f3f46 }));
          pad.position.set(bx, 24.1, bz - 3);
          scene.add(pad);
          const hTex = textTexture('H', '#3f3f46', '#facc15', 256, 256);
          const hMark = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: hTex }));
          hMark.rotation.x = -Math.PI / 2;
          hMark.position.set(bx, 24.22, bz - 3);
          scene.add(hMark);
          break;
        }
        case 'mrpd': {
          addBox(bx, bz - 3, 22, 16, 13, getWindowMat(0x1e293b), { windows: true });
          signMats.push(addSign('EKO POLICE DEPT', '#0f172a', '#93c5fd', bx, 10.5, bz + 5.05, 13));
          addBox(bx - 9, bz + 8, 0.25, 0.25, 9, new THREE.MeshStandardMaterial({ color: 0xd4d4d8 }), { collide: false });
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x16a34a, side: THREE.DoubleSide }));
          flag.position.set(bx - 7.8, 8.2, bz + 8);
          scene.add(flag);
          break;
        }
        case 'yaba': {
          addBox(bx - 5, bz - 4, 10, 10, 40, getWindowMat(0x1e3a8a), { windows: true });
          addBox(bx + 6, bz - 2, 8, 10, 28, getWindowMat(0x0369a1), { windows: true });
          signMats.push(addSign('PAYLAGOON', '#1e1b4b', '#a5b4fc', bx + 6, 26, bz + 3.05, 7));
          break;
        }
        case 'quilox': {
          addBox(bx, bz - 3, 20, 16, 12, new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8, roughness: 0.2 }));
          addBox(bx, bz - 3, 20.4, 16.4, 0.5, glowMat(0xd946ef), { y: 11, collide: false });
          addBox(bx, bz - 3, 20.4, 16.4, 0.5, glowMat(0x06b6d4), { y: 6, collide: false });
          signMats.push(addSign('QUILOX', '#000000', '#f0abfc', bx, 8.5, bz + 5.25, 10, 1.6));
          const beamMat = new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
          for (const sx of [-6, 6]) {
            const beam = new THREE.Mesh(new THREE.ConeGeometry(3, 60, 16, 1, true), beamMat);
            beam.geometry.translate(0, -30, 0);
            const pivot = new THREE.Group();
            pivot.position.set(bx + sx, 12, bz - 3);
            beam.rotation.x = Math.PI;
            pivot.add(beam);
            scene.add(pivot);
            beams.push(beam);
          }
          break;
        }
        case 'computervillage': {
          addBox(bx, bz - 5, 22, 12, 9, getWindowMat(0x991b1b), { windows: true });
          signMats.push(addSign('COMPUTER VILLAGE', '#7f1d1d', '#fed7aa', bx, 7.2, bz + 1.05, 12));
          const stallCols = [0xf97316, 0x3b82f6, 0x22c55e, 0xeab308];
          stallCols.forEach((c, i) => {
            addBox(bx - 7.5 + i * 5, bz + 5, 3.6, 3, 2.6, new THREE.MeshStandardMaterial({ color: c }), { y: 0.12 });
          });
          break;
        }
        case 'gas': {
          addBox(bx, bz - 8, 12, 6, 4.5, getWindowMat(0xf5f5f4), { windows: true });
          signMats.push(addSign('RON 24/7', '#b45309', '#ffffff', bx, 3.6, bz - 4.95, 6));
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xffffff, emissiveIntensity: 0.15 }));
          canopy.position.set(bx, 5.3, bz + 3);
          canopy.castShadow = true;
          scene.add(canopy);
          addBox(bx, bz + 8.05, 18, 0.1, 0.6, glowMat(0xf59e0b), { y: 5, collide: false });
          for (const px of [-8, 8]) for (const pz of [-1.5, 7.5]) addBox(bx + px, bz + pz, 0.5, 0.5, 5, sidewalkMat, { cast: false });
          for (const px of [-5, 0, 5]) addBox(bx + px, bz + 3, 0.7, 1.2, 1.6, new THREE.MeshStandardMaterial({ color: 0xdc2626 }), { y: 0.12 });
          break;
        }
        case 'lekki': {
          addBox(bx + 3, bz - 4, 16, 12, 8, getWindowMat(0xf8fafc), { windows: true });
          addBox(bx + 3, bz - 6, 12, 8, 4, getWindowMat(0xe2e8f0), { y: 8, windows: true, collide: false });
          const pool = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.3, roughness: 0.05 }));
          pool.position.set(bx - 8, 0.16, bz + 4);
          scene.add(pool);
          signMats.push(addSign('DYNASTY 8', '#0f172a', '#67e8f9', bx + 3, 5.5, bz + 2.05, 7));
          break;
        }
        case 'clothing': {
          addBox(bx, bz - 3, 16, 14, 7, getWindowMat(0xfbcfe8), { windows: true });
          signMats.push(addSign('SUBURBAN', '#831843', '#fbcfe8', bx, 5.6, bz + 4.05, 9));
          break;
        }
        case 'lagoon': {
          const plankMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
          const pier = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 22), plankMat);
          pier.position.set(0, 0.15, -WORLD_HALF - 10);
          pier.receiveShadow = true;
          scene.add(pier);
          addBox(0, bz + 8, 12, 4, 0.3, new THREE.MeshStandardMaterial({ color: 0xfacc15 }), { y: 3.2, collide: false });
          for (const px of [-5.5, 5.5]) addBox(px, bz + 8, 0.3, 0.3, 3.2, sidewalkMat, { cast: false });
          signMats.push(addSign('DANFO DEPOT', '#facc15', '#0a0a0a', 0, 4, bz + 10.05, 6, 0.5));
          break;
        }
        case 'home': {
          // Player's Private 2-Story Nigerian Duplex Villa & Solar Compound at (80, 40)
          addBox(bx, bz - 2, 16, 13, 8.5, getWindowMat(0xf8fafc), { windows: true });
          addBox(bx, bz - 2, 16.6, 13.6, 0.45, new THREE.MeshStandardMaterial({ color: 0x0f172a }), { y: 8.5, collide: false });
          // Balcony & entrance portico
          addBox(bx, bz + 5.2, 8, 2.4, 0.35, new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }), { y: 4.2, collide: false });
          signMats.push(addSign('YOUR RESIDENCE', '#064e3b', '#6ee7b7', bx, 6.2, bz + 4.55, 8.5));
          // Rooftop Solar PV Panel Array (4 angled deep-blue monocrystalline panels)
          const solarMat = new THREE.MeshStandardMaterial({
            color: 0x1d4ed8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.45,
            metalness: 0.85,
            roughness: 0.15,
          });
          for (const sx of [-4.5, -1.5, 1.5, 4.5]) {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 4.2), solarMat);
            panel.position.set(bx + sx, 9.25, bz - 2);
            panel.rotation.x = 0.22;
            scene.add(panel);
          }
          // Mikano Generator Shed & Courtyard Pool
          addBox(bx - 7, bz + 6, 3.2, 2.6, 2.4, new THREE.MeshStandardMaterial({ color: 0xb91c1c }), { y: 0.12 });
          const homePool = new THREE.Mesh(
            new THREE.BoxGeometry(5.5, 0.12, 4.2),
            new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.35, roughness: 0.1 })
          );
          homePool.position.set(bx + 5, 0.16, bz + 6.5);
          scene.add(homePool);
          break;
        }
        case 'airport': {
          // FAAN International Airport Terminal + Control Tower + Parked Passenger Jet at (-80, 40)
          addBox(bx, bz - 4, 21, 12, 9.5, getWindowMat(0x0c4a6e), { windows: true });
          addBox(bx, bz + 2.8, 22, 3, 0.4, glowMat(0x38bdf8), { y: 5.2, collide: false });
          signMats.push(addSign('FAAN INTL AIRPORT', '#082f49', '#7dd3fc', bx, 7.6, bz + 2.05, 12, 1.3));
          // Air Traffic Control Tower
          const towerShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2.1, 21, 12),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
          );
          towerShaft.position.set(bx - 8.5, 10.5, bz - 6);
          towerShaft.castShadow = true;
          scene.add(towerShaft);
          const towerCab = new THREE.Mesh(
            new THREE.CylinderGeometry(3.1, 2.2, 3.2, 12),
            glowMat(0x38bdf8)
          );
          towerCab.position.set(bx - 8.5, 22.2, bz - 6);
          scene.add(towerCab);
          // 3D Commercial Passenger Jet (Air Peace / Ibom Air 737) on Apron
          const jetGroup = new THREE.Group();
          const fuseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.25 });
          const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.3 });
          const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 15), fuseMat);
          fuselage.position.y = 2.0;
          const nose = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 2.5), fuseMat);
          nose.position.set(0, 1.8, 8.2);
          const wings = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.25, 3.2), wingMat);
          wings.position.set(0, 1.9, 0.5);
          const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 2.8), wingMat);
          tailFin.position.set(0, 4.2, -6.2);
          jetGroup.add(fuselage, nose, wings, tailFin);
          jetGroup.position.set(bx + 3.5, 0.12, bz + 7.2);
          jetGroup.rotation.y = Math.PI / 2;
          scene.add(jetGroup);
          break;
        }
      }
    }

    // ---------- Google Maps City-Specific 3D Landscapes (Lagos Bridges vs Abuja Aso Rock & Mosque) ----------
    const lagosLandscapeGroup = new THREE.Group();
    // Lekki-Ikoyi Cable-Stayed Bridge Pylon over X = 60 avenue
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const pylonLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 28, 1.2), pylonMat);
    pylonLeft.position.set(54, 14, 0);
    const pylonRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 28, 1.2), pylonMat);
    pylonRight.position.set(66, 14, 0);
    const pylonCross = new THREE.Mesh(new THREE.BoxGeometry(13.5, 1.4, 1.4), pylonMat);
    pylonCross.position.set(60, 23, 0);
    lagosLandscapeGroup.add(pylonLeft, pylonRight, pylonCross);
    scene.add(lagosLandscapeGroup);

    const abujaLandscapeGroup = new THREE.Group();
    // 1. Aso Rock Monolith (North-East horizon)
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.92, flatShading: true });
    const asoRock = new THREE.Mesh(new THREE.ConeGeometry(28, 52, 9), rockMat);
    asoRock.position.set(52, 24, 96);
    asoRock.scale.set(1.35, 1, 0.75);
    // 2. Zuma Rock Monolith (North-West horizon)
    const zumaRock = new THREE.Mesh(new THREE.ConeGeometry(24, 46, 8), rockMat);
    zumaRock.position.set(-52, 21, 96);
    zumaRock.scale.set(1.25, 1, 0.7);
    // 3. Abuja National Mosque Golden Dome & Minarets
    const goldDomeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.35,
      metalness: 0.75,
      roughness: 0.2,
    });
    const domeBase = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 14), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
    domeBase.position.set(0, 4.5, 86);
    const goldenDome = new THREE.Mesh(new THREE.SphereGeometry(6.5, 20, 14), goldDomeMat);
    goldenDome.position.set(0, 10.5, 86);
    abujaLandscapeGroup.add(asoRock, zumaRock, domeBase, goldenDome);
    for (const [mx, mz] of [[-8, 79], [8, 79], [-8, 93], [8, 93]] as [number, number][]) {
      const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 22, 10), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
      minaret.position.set(mx, 11, mz);
      abujaLandscapeGroup.add(minaret);
    }
    abujaLandscapeGroup.visible = false;
    scene.add(abujaLandscapeGroup);

    // ---------- Street lamps (instanced) ----------
    const lampSpots: [number, number][] = [];
    for (const r of ROAD_LINES) {
      for (let t = -WORLD_HALF + 8; t < WORLD_HALF; t += 18) {
        if (ROAD_LINES.some((q) => Math.abs(q - t) < 7)) continue;
        lampSpots.push([r + 6, t], [r - 6, t], [t, r + 6], [t, r - 6]);
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 6, 6);
    poleGeo.translate(0, 3, 0);
    const poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x27272a }), lampSpots.length);
    const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfde68a, emissiveIntensity: 0 });
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6), lampHeadMat, lampSpots.length);
    lampSpots.forEach(([x, z], i) => {
      tmp.position.set(x, 0.12, z);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      poles.setMatrixAt(i, tmp.matrix);
      tmp.position.set(x, 6.1, z);
      tmp.updateMatrix();
      heads.setMatrixAt(i, tmp.matrix);
    });
    scene.add(poles, heads);
    // A few real point lights near spawn hubs for nice night pools of light
    const lampLights: THREE.PointLight[] = [];
    for (const [x, z] of [[0, 16], [40, 16], [-40, 16], [0, -24], [40, -24], [0, 50]] as [number, number][]) {
      const pl = new THREE.PointLight(0xffd59a, 0, 22, 1.6);
      pl.position.set(x, 5.5, z);
      scene.add(pl);
      lampLights.push(pl);
    }

    // ---------- Palm trees (instanced) ----------
    const treeSpots: [number, number][] = [];
    for (let x = -84; x <= 84; x += 12) treeSpots.push([x, -84]);
    for (let x = -80; x <= 80; x += 14) treeSpots.push([x, -72]);
    treeSpots.push([30, 48], [30, 58], [50, 46], [26, 34], [-10, 8], [10, 8]);
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 6, 6);
    trunkGeo.translate(0, 3, 0);
    const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x78350f }), treeSpots.length);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.7, 0), new THREE.MeshStandardMaterial({ color: 0x15803d, flatShading: true }), treeSpots.length);
    trunks.castShadow = crowns.castShadow = true;
    treeSpots.forEach(([x, z], i) => {
      tmp.position.set(x, 0.12, z);
      tmp.rotation.set(0, Math.random() * 6, (Math.random() - 0.5) * 0.15);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      trunks.setMatrixAt(i, tmp.matrix);
      tmp.position.set(x, 6.3, z);
      tmp.scale.set(1.3, 0.55, 1.3);
      tmp.updateMatrix();
      crowns.setMatrixAt(i, tmp.matrix);
    });
    scene.add(trunks, crowns);

    // ---------- District markers + floating blip icons ----------
    const markerRings: THREE.Mesh[] = [];
    const markerIcons: THREE.Sprite[] = [];
    for (const d of DISTRICTS) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 0.9, 28, 1, true),
        new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.position.set(d.x, 0.55, d.z);
      scene.add(ring);
      markerRings.push(ring);
      const icon = iconSprite(d.blipIcon, d.color);
      icon.position.set(d.x, 2.6, d.z);
      scene.add(icon);
      markerIcons.push(icon);
    }
    for (const a of ATM_SPOTS) {
      const atm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.5), new THREE.MeshStandardMaterial({ color: 0x166534, emissive: 0x22c55e, emissiveIntensity: 0.35 }));
      atm.position.set(a.x, 0.97, a.z - 0.6);
      scene.add(atm);
    }

    // ---------- Mission / waypoint markers ----------
    const missionGroup = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const missionBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 24, 1, true), beamMat);
    missionBeam.position.y = 35;
    const missionRing = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.4, 40),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
    );
    missionRing.rotation.x = -Math.PI / 2;
    missionRing.position.y = 0.2;
    const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 4), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    chevron.rotation.x = Math.PI;
    missionGroup.add(missionBeam, missionRing, chevron);
    missionGroup.visible = false;
    scene.add(missionGroup);

    const waypointMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 30, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    waypointMarker.visible = false;
    scene.add(waypointMarker);

    // ---------- Rain ----------
    const RAIN = 1400;
    const rainPos = new Float32Array(RAIN * 6);
    for (let i = 0; i < RAIN; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 30;
      const z = (Math.random() - 0.5) * 70;
      rainPos.set([x, y, z, x, y - 0.6, z], i * 6);
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb4d9, transparent: true, opacity: 0.45 }));
    rain.frustumCulled = false;
    rain.visible = false;
    scene.add(rain);

    // ---------- Player ----------
    const P0 = propsRef.current;
    const player = buildHumanoid({
      shirt: P0.outfit.color,
      pants: P0.outfit.pants ?? '#1e293b',
      skin: P0.outfit.skin ?? '#6d4023',
      hat: P0.outfit.hat,
      castShadow: true,
    });
    scene.add(player.root);
    const pState = {
      x: 0,
      z: 15,
      y: 0.12,
      vy: 0,
      heading: Math.PI,
      grounded: true,
      speed: 0,
      ejectT: 0,
    };

    let meLabel: { sprite: THREE.Sprite; until: number } | null = null;

    // ---------- Drivable vehicles ----------
    const parkSpots: Record<string, [number, number, number]> = {
      'veh-danfo': [-8, 23.5, Math.PI / 2],
      'veh-super': [7, 16.5, -Math.PI / 2],
      'veh-gwagon': [32, 56.5, Math.PI / 2],
      'veh-police': [8, -23.5, Math.PI / 2],
      'veh-taxi': [-15, 16.5, -Math.PI / 2],
    };
    const cars: DrivableCar[] = VEHICLES_CATALOG.map((v, i) => {
      const [x, z, h] = parkSpots[v.id] ?? [i * 6, 23.5, 0];
      const model = buildCar(v.category, v.color, true);
      model.group.position.set(x, 0, z);
      model.group.rotation.y = h;
      scene.add(model.group);
      return {
        id: v.id,
        name: v.name,
        category: v.category,
        color: v.color,
        vmax: v.topSpeedKmh / SPEED_TO_KMH,
        model,
        x,
        z,
        heading: h,
        vx: 0,
        vz: 0,
        steer: 0,
        fuel: v.fuel,
        engine: v.condition,
      };
    });
    let activeCar: DrivableCar | null = null;
    const carFlags = { seatbelt: false, lights: true, siren: false };
    const headlight = new THREE.SpotLight(0xfff7d6, 0, 45, 0.6, 0.5, 1.2);
    headlight.position.set(0, 1, 2.2);
    headlight.target.position.set(0, 0, 12);

    // ---------- AI traffic ----------
    const traffic: TrafficCar[] = [];
    const trafficBlocks: [number, number][] = [];
    for (const bx of INNER_BLOCKS) for (const bz of INNER_BLOCKS) trafficBlocks.push([bx, bz]);
    for (let i = 0; i < 9; i++) {
      const [bx, bz] = trafficBlocks[i % trafficBlocks.length];
      const cat = pick<VehicleCategory>(['sedan', 'sedan', 'suv', 'transit', 'super', 'sedan']);
      const model = buildCar(cat, cat === 'transit' ? '#facc15' : pick(TRAFFIC_COLORS), false);
      scene.add(model.group);
      traffic.push({
        model,
        loop: blockLoop(bx, bz, 17.5),
        s: Math.random() * 140,
        speed: 0,
        maxSpeed: 7 + Math.random() * 4,
        x: 0,
        z: 0,
        heading: 0,
        honkCd: 0,
      });
    }

    // ---------- Pedestrians ----------
    const peds: Ped[] = [];
    for (let i = 0; i < 14; i++) {
      const [bx, bz] = trafficBlocks[(i * 4) % trafficBlocks.length];
      const h = buildHumanoid({ shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hat: pick(['none', 'none', 'cap', 'sunglasses'] as const) });
      scene.add(h.root);
      peds.push({
        id: `ped:${i}`,
        name: PED_NAMES[i % PED_NAMES.length],
        h,
        loop: blockLoop(bx, bz, 13),
        s: Math.random() * 104,
        dir: Math.random() < 0.5 ? 1 : -1,
        speed: 1.2 + Math.random() * 0.6,
        downT: 0,
        x: 0,
        z: 0,
        heading: 0,
      });
    }
    const npcs: StaticNpc[] = [];
    const placeNpc = (x: number, z: number, heading: number, state: HumanoidState) => {
      const h = buildHumanoid({ shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hat: pick(['none', 'cap', 'sunglasses'] as const) });
      h.root.position.set(x, 0.12, z);
      h.root.rotation.y = heading;
      scene.add(h.root);
      npcs.push({ h, state });
    };
    placeNpc(37, -25, 0.4, 'dance');
    placeNpc(43, -25, -0.5, 'dance');
    placeNpc(41, -23.5, Math.PI, 'dance');
    placeNpc(-3, 9, 0, 'idle');
    placeNpc(4, 10, -0.4, 'facepalm');
    placeNpc(1.5, -76, Math.PI, 'sit');
    placeNpc(-38, 11, 0.3, 'idle');
    placeNpc(-4, -25, 0, 'salute');

    // ---------- Police AI (pooled) ----------
    const police: PoliceUnit[] = [];
    for (let i = 0; i < 3; i++) {
      const model = buildCar('police', '#0f172a', false);
      model.group.visible = false;
      scene.add(model.group);
      police.push({ model, active: false, x: 0, z: 0, heading: 0, speed: 0 });
    }
    let bustTimer = 0;
    let escapeTimer = 0;
    let sirenCd = 0;

    // ---------- Collision helpers ----------
    const blocked = (x: number, z: number, r: number) => {
      for (const b of colliders) if (circleHitsBox(x, z, r, b)) return true;
      return false;
    };

    // ---------- Input ----------
    const keys: Record<string, boolean> = {};
    const cam = { yaw: Math.PI, pitch: 0.28, dist: 6.5, lastInput: 0, shake: 0 };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let emoteCancelSent = false;

    const enterOrExit = () => {
      if (activeCar) {
        const car = activeCar;
        const left = { x: Math.cos(car.heading), z: -Math.sin(car.heading) };
        let ex = car.x + left.x * 2.2;
        let ez = car.z + left.z * 2.2;
        if (blocked(ex, ez, 0.4)) {
          ex = car.x - left.x * 2.2;
          ez = car.z - left.z * 2.2;
        }
        pState.x = ex;
        pState.z = ez;
        pState.heading = car.heading;
        car.model.group.remove(headlight, headlight.target);
        activeCar = null;
        carFlags.seatbelt = false;
        carFlags.siren = false;
        audioEngine.setEngine(false, 0);
        return;
      }
      let best: DrivableCar | null = null;
      let bd = 4;
      for (const c of cars) {
        const dd = Math.hypot(c.x - pState.x, c.z - pState.z);
        if (dd < bd) {
          bd = dd;
          best = c;
        }
      }
      if (best) {
        activeCar = best;
        best.model.group.add(headlight, headlight.target);
        cam.yaw = best.heading;
        audioEngine.playSeatbeltChime();
      }
    };

    const vehicleAction = (a: VehicleAction) => {
      if (a === 'enter_exit') return enterOrExit();
      if (!activeCar) return;
      if (a === 'seatbelt') {
        carFlags.seatbelt = !carFlags.seatbelt;
        audioEngine.playSeatbeltChime();
      } else if (a === 'lights') {
        carFlags.lights = !carFlags.lights;
        audioEngine.playClick();
      } else if (a === 'siren') {
        carFlags.siren = !carFlags.siren;
        if (carFlags.siren) audioEngine.playPoliceSiren();
      }
    };

    const nearestInteractable = (): { id: string; name: string; actionLabel: string } | null => {
      if (activeCar) {
        if (Math.hypot(pState.x - 0, pState.z - 43) < 11)
          return { id: 'bennys', name: 'Ron Petrol & Benny’s Bay', actionLabel: 'Refuel & Tune Vehicle' };
        return null;
      }
      const activeDistricts = getDistrictsForCity(propsRef.current.activeCity || 'lagos');
      for (const d of activeDistricts) {
        if (Math.hypot(pState.x - d.x, pState.z - d.z) < 2.8) return { id: d.id, name: d.name, actionLabel: d.actionLabel };
      }
      for (const a of ATM_SPOTS) {
        if (Math.hypot(pState.x - a.x, pState.z - a.z) < 1.8) return { id: 'atm', name: 'ATM', actionLabel: 'Use ATM' };
      }
      for (const ped of peds) {
        if (ped.downT <= 0 && Math.hypot(pState.x - ped.x, pState.z - ped.z) < 2.3) {
          return { id: ped.id, name: ped.name, actionLabel: 'Talk / Interact' };
        }
      }
      return null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === ' ') e.preventDefault();
      keys[k] = true;
      const p = propsRef.current;
      if (p.movementLocked || p.isDowned) return;
      if (e.repeat) return;
      if (k === 'f') enterOrExit();
      else if (k === 'b') vehicleAction('seatbelt');
      else if (k === 'h') vehicleAction('lights');
      else if (k === 'q') vehicleAction('siren');
      else if (k === 'e') {
        const it = nearestInteractable();
        if (!it) return;
        if (it.id === 'refuel' && activeCar) {
          const missing = 100 - activeCar.fuel;
          if (missing < 1) return;
          if (p.onRefuelRequest(missing)) activeCar.fuel = 100;
        } else {
          p.onInteract(it.id);
        }
      } else if (k === ' ' && !activeCar && pState.grounded) {
        pState.vy = 5.4;
        pState.grounded = false;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    const canvas = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!propsRef.current.cursorFree && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    };
    const rotateCam = (dx: number, dy: number) => {
      cam.yaw -= dx * 0.0032;
      cam.pitch = Math.max(-0.15, Math.min(1.15, cam.pitch + dy * 0.0026));
      cam.lastInput = performance.now();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (document.pointerLockElement === canvas) {
        rotateCam(e.movementX, e.movementY);
      } else if (dragging) {
        rotateCam(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      cam.dist = Math.max(3, Math.min(16, cam.dist + e.deltaY * 0.006));
    };
    const onBlur = () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ---------- External API ----------
    apiRef.current = {
      teleport: (x, z) => {
        if (activeCar) {
          activeCar.x = x;
          activeCar.z = z + 3;
          activeCar.vx = activeCar.vz = 0;
        }
        pState.x = x;
        pState.z = z;
        pState.vy = 0;
      },
      spawnVehicle: (id) => {
        const car = cars.find((c) => c.id === id);
        if (!car) return;
        if (activeCar && activeCar !== car) enterOrExit();
        // Find a free spot on the closest road next to the player
        const rx = nearestRoad(pState.x);
        const rz = nearestRoad(pState.z);
        const useX = Math.abs(rx - pState.x) < Math.abs(rz - pState.z);
        car.x = useX ? rx + 2.5 : pState.x;
        car.z = useX ? pState.z : rz + 2.5;
        car.heading = useX ? 0 : Math.PI / 2;
        car.vx = car.vz = 0;
        car.fuel = Math.max(car.fuel, 60);
        if (activeCar !== car) {
          activeCar = car;
          car.model.group.add(headlight, headlight.target);
        }
        cam.yaw = car.heading;
        audioEngine.playDanfoHorn();
      },
      vehicleAction,
      tuneVehicle: (opts) => {
        const targetCar = activeCar ?? cars.find((c) => Math.hypot(c.x - pState.x, c.z - pState.z) < 6) ?? cars[0];
        if (!targetCar) return;
        if (opts.color && targetCar.category !== 'police') {
          targetCar.color = opts.color;
          targetCar.model.paintMat.color.set(opts.color);
        }
        if (opts.repair) targetCar.engine = 100;
        if (opts.refuel) targetCar.fuel = 100;
        if (opts.boostLevel) {
          const base = VEHICLES_CATALOG.find((v) => v.id === targetCar.id)?.topSpeedKmh ?? 180;
          targetCar.vmax = (base * (1 + opts.boostLevel * 0.14)) / SPEED_TO_KMH;
        }
      },
      showMe: (text) => {
        if (meLabel) player.root.remove(meLabel.sprite);
        const s = meSprite(text);
        s.position.y = 2.45;
        player.root.add(s);
        meLabel = { sprite: s, until: performance.now() + 6500 };
      },
      setOutfit: (o) => {
        applyOutfit(player, { shirt: o.color, pants: o.pants ?? '#1e293b', skin: o.skin ?? '#6d4023', hat: o.hat });
      },
    };

    // ---------- Main loop ----------
    const clock = new THREE.Clock();
    let raf = 0;
    let hudAcc = 0;
    let lastMissionReached = '';
    let waypointLatch = '';
    const raycaster = new THREE.Raycaster();
    const tmpV = new THREE.Vector3();
    const tmpV2 = new THREE.Vector3();
    const daySky = new THREE.Color('#8fb8e8');
    const duskSky = new THREE.Color('#f59e6b');
    const nightSky = new THREE.Color('#070b18');
    const rainSky = new THREE.Color('#3b4252');
    const fogTarget = new THREE.Color();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const p = propsRef.current;
      const locked = p.movementLocked || p.isDowned;

      // ======== Day / night & weather ========
      const tod = p.timeOfDay;
      const sunAng = ((tod - 6) / 12) * Math.PI;
      const elev = Math.sin(sunAng);
      const day = THREE.MathUtils.clamp(elev * 1.6 + 0.15, 0, 1);
      const dusk = THREE.MathUtils.clamp(1 - Math.abs(elev) * 4, 0, 1) * (elev > -0.25 ? 1 : 0);
      fogTarget.copy(nightSky).lerp(daySky, day).lerp(duskSky, dusk * 0.45);
      const wet = p.weather === 'rain' ? 1 : 0;
      const cloudy = p.weather === 'cloudy' ? 0.45 : p.weather === 'fog' ? 0.5 : wet * 0.65;
      fogTarget.lerp(rainSky, cloudy * day);
      skyColor.lerp(fogTarget, Math.min(1, dt * 2));
      const fog = scene.fog as THREE.FogExp2;
      fog.color.copy(skyColor);
      const fogDensity = p.weather === 'fog' ? 0.03 : p.weather === 'rain' ? 0.016 : 0.0075;
      fog.density += (fogDensity - fog.density) * Math.min(1, dt);
      hemi.intensity = 0.22 + day * 0.7 * (1 - cloudy * 0.4);
      sun.intensity = 0.08 + day * 1.7 * (1 - cloudy * 0.6);
      sun.color.setHSL(0.1, 0.6, 0.65 + day * 0.3);
      sun.position.set(pState.x + Math.cos(sunAng) * 70, 15 + Math.max(0.15, elev) * 80, pState.z + 30);
      sun.target.position.set(pState.x, 0, pState.z);
      const night = 1 - day;
      const power = p.isNepaActive ? 1 : 0.12;
      const isAbuja = p.activeCity === 'abuja';
      abujaLandscapeGroup.visible = isAbuja;
      lagosLandscapeGroup.visible = !isAbuja;
      windowMats.forEach((m) => (m.emissiveIntensity = night * 1.4 * power));
      lampHeadMat.emissiveIntensity = night * 2.5 * power;
      lampLights.forEach((l) => (l.intensity = night * 14 * power));
      signMats.forEach((m) => (m.emissiveIntensity = 0.25 + night * 0.9 * power));
      neonMats.forEach((m) => (m.emissiveIntensity = (0.4 + night * 2) * power));
      roadMat.roughness = 0.92 - wet * 0.55;
      roadMat.metalness = wet * 0.35;
      beams.forEach((b, i) => {
        b.parent!.rotation.z = Math.sin(t * 0.8 + i * 2) * 0.55;
        b.parent!.rotation.x = Math.cos(t * 0.6 + i) * 0.45;
        b.visible = night > 0.4 && p.isNepaActive;
      });

      rain.visible = wet > 0;
      if (rain.visible) {
        rain.position.set(camera.position.x, 0, camera.position.z);
        for (let i = 0; i < RAIN; i++) {
          const o = i * 6;
          rainPos[o + 1] -= dt * 32;
          rainPos[o + 4] -= dt * 32;
          if (rainPos[o + 4] < 0) {
            const y = 25 + Math.random() * 6;
            rainPos[o + 1] = y;
            rainPos[o + 4] = y - 0.6;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // ======== Player / vehicle control ========
      const fwdIn = locked ? 0 : (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
      const sideIn = locked ? 0 : (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
      let isSprinting = false;

      if (activeCar) {
        const car = activeCar;
        player.root.visible = false;
        const f = { x: Math.sin(car.heading), z: Math.cos(car.heading) };
        let fwd = car.vx * f.x + car.vz * f.z;
        let latX = car.vx - f.x * fwd;
        let latZ = car.vz - f.z * fwd;
        const handbrake = !locked && keys[' '];
        const canDrive = car.fuel > 0 && car.engine > 0;
        const accel = TOP_SPEED_ACCEL[car.category] * (car.engine < 20 ? 0.35 : 1);
        let braking = false;
        if (fwdIn > 0 && canDrive) {
          fwd += accel * (1 - Math.max(0, fwd) / car.vmax) * dt;
        } else if (fwdIn < 0) {
          if (fwd > 0.6) {
            fwd -= 32 * dt;
            braking = true;
          } else if (canDrive) {
            fwd = Math.max(-car.vmax * 0.3, fwd - accel * 0.6 * dt);
          }
        } else {
          fwd *= Math.exp(-0.45 * dt);
          fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), 1.2 * dt);
        }
        if (handbrake) {
          fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), 10 * dt);
          braking = true;
        }
        const speedRatio = Math.min(1, Math.abs(fwd) / car.vmax);
        const steerTarget = -sideIn * 0.6 * (1 - 0.55 * speedRatio);
        car.steer += (steerTarget - car.steer) * Math.min(1, dt * 8);
        const yawRate = (fwd / 2.7) * Math.tan(car.steer) * (handbrake ? 1.6 : 1);
        car.heading += yawRate * dt;
        const grip = handbrake ? 1.2 : 8.5;
        const decay = Math.exp(-grip * dt);
        latX *= decay;
        latZ *= decay;
        const nf = { x: Math.sin(car.heading), z: Math.cos(car.heading) };
        car.vx = nf.x * fwd + latX;
        car.vz = nf.z * fwd + latZ;

        const nx = car.x + car.vx * dt;
        const nz = car.z + car.vz * dt;
        const r = car.model.radius * 0.7;
        let impact = 0;
        if (blocked(nx, nz, r)) {
          impact = Math.hypot(car.vx, car.vz);
          car.vx *= -0.3;
          car.vz *= -0.3;
        } else {
          car.x = nx;
          car.z = nz;
        }
        // Car vs car (parked, traffic, police)
        const others: { x: number; z: number; push?: (dx: number, dz: number) => void }[] = [
          ...cars.filter((c) => c !== car).map((c) => ({ x: c.x, z: c.z, push: (dx: number, dz: number) => { c.x += dx; c.z += dz; } })),
          ...traffic.map((c) => ({ x: c.x, z: c.z })),
          ...police.filter((u) => u.active).map((u) => ({ x: u.x, z: u.z })),
        ];
        for (const o of others) {
          const dx = car.x - o.x;
          const dz = car.z - o.z;
          const dd = Math.hypot(dx, dz);
          if (dd < 3.1 && dd > 0.001) {
            const pen = 3.1 - dd;
            car.x += (dx / dd) * pen * 0.7;
            car.z += (dz / dd) * pen * 0.7;
            o.push?.((-dx / dd) * pen * 0.3, (-dz / dd) * pen * 0.3);
            impact = Math.max(impact, Math.hypot(car.vx, car.vz) * 0.8);
            car.vx *= 0.5;
            car.vz *= 0.5;
          }
        }
        clampToWorld(car);

        if (impact > 5) {
          car.engine = Math.max(0, car.engine - impact * 0.7);
          cam.shake = Math.min(1, impact / 22);
          audioEngine.playCrash(Math.min(1, impact / 25));
          if (impact > 15 && !carFlags.seatbelt) {
            // Ejected through the windscreen
            const carRef = car;
            enterOrExit();
            pState.x = carRef.x + f.x * 3;
            pState.z = carRef.z + f.z * 3;
            if (blocked(pState.x, pState.z, 0.4)) {
              pState.x = carRef.x - f.x * 3;
              pState.z = carRef.z - f.z * 3;
            }
            pState.ejectT = 2.2;
            p.onDamage(Math.round(impact * 1.6), 'You flew through the windscreen — wear your seatbelt [B]!');
          } else if (impact > 10) {
            p.onDamage(Math.round(impact * (carFlags.seatbelt ? 0.2 : 0.6)), 'Crash');
          }
        }

        // Pedestrian hits
        const carSpeed = Math.hypot(car.vx, car.vz);
        if (activeCar && carSpeed > 5) {
          for (const ped of peds) {
            if (ped.downT <= 0 && Math.hypot(ped.x - car.x, ped.z - car.z) < 1.9) {
              ped.downT = 9;
              p.onCrime('Vehicular assault on a pedestrian');
            }
          }
        }

        if (car.fuel > 0 && Math.abs(fwd) > 0.5) car.fuel = Math.max(0, car.fuel - dt * (0.12 + speedRatio * 0.35));

        // Model update
        const gy = groundY(car.x, car.z);
        car.model.group.position.set(car.x, gy, car.z);
        car.model.group.rotation.y = car.heading;
        car.model.group.rotation.z = THREE.MathUtils.lerp(car.model.group.rotation.z, -car.steer * speedRatio * 0.08, 0.2);
        car.model.frontWheels.forEach((w) => (w.rotation.y = car.steer));
        car.model.wheelMeshes.forEach((w) => (w.rotation.x += (fwd / 0.36) * dt));
        const isNight = night > 0.45;
        car.model.tailMat.emissiveIntensity = braking ? 3 : carFlags.lights && isNight ? 0.9 : 0.35;
        car.model.headMat.emissiveIntensity = carFlags.lights && isNight ? 2.5 : 0.4;
        headlight.intensity = carFlags.lights && isNight ? 60 : 0;
        if (car.model.barRed && car.model.barBlue) {
          const on = carFlags.siren;
          const ph = Math.floor(t * 6) % 2;
          car.model.barRed.emissiveIntensity = on && ph === 0 ? 4 : 0.2;
          car.model.barBlue.emissiveIntensity = on && ph === 1 ? 4 : 0.2;
          if (on) {
            sirenCd -= dt;
            if (sirenCd <= 0) {
              audioEngine.playPoliceSiren();
              sirenCd = 1.4;
            }
          }
        }
        audioEngine.setEngine(true, speedRatio * 100);

        pState.x = car.x;
        pState.z = car.z;
        pState.heading = car.heading;
        pState.speed = Math.abs(fwd);
      } else {
        // ---------------- On foot ----------------
        player.root.visible = true;
        if (pState.ejectT > 0) pState.ejectT -= dt;
        const moving = (fwdIn !== 0 || sideIn !== 0) && pState.ejectT <= 0;
        const canSprint = keys['shift'] && p.energy > 3;
        isSprinting = moving && !!canSprint && fwdIn >= 0;
        const spd = isSprinting ? 7.6 : 4.1;
        if (moving) {
          const fx = Math.sin(cam.yaw);
          const fz = Math.cos(cam.yaw);
          const rx = -Math.cos(cam.yaw);
          const rz = Math.sin(cam.yaw);
          let mx = fx * fwdIn + rx * sideIn;
          let mz = fz * fwdIn + rz * sideIn;
          const len = Math.hypot(mx, mz) || 1;
          mx /= len;
          mz /= len;
          const tx = pState.x + mx * spd * dt;
          const tz = pState.z + mz * spd * dt;
          if (!blocked(tx, pState.z, 0.35)) pState.x = tx;
          if (!blocked(pState.x, tz, 0.35)) pState.z = tz;
          pState.heading = angleLerp(pState.heading, Math.atan2(mx, mz), Math.min(1, dt * 12));
          pState.speed = spd;
          if (p.emote !== 'none' && !emoteCancelSent) {
            emoteCancelSent = true;
            p.onEmoteCancel();
          }
        } else {
          pState.speed = 0;
        }
        if (p.emote === 'none') emoteCancelSent = false;
        // Push out of parked cars
        for (const c of cars) {
          const dx = pState.x - c.x;
          const dz = pState.z - c.z;
          const dd = Math.hypot(dx, dz);
          if (dd < 1.7 && dd > 0.001) {
            pState.x = c.x + (dx / dd) * 1.7;
            pState.z = c.z + (dz / dd) * 1.7;
          }
        }
        clampToWorld(pState);
        // Gravity / jump
        const gy = groundY(pState.x, pState.z);
        if (!pState.grounded) {
          pState.vy -= 15 * dt;
          pState.y += pState.vy * dt;
          if (pState.y <= gy) {
            pState.y = gy;
            pState.vy = 0;
            pState.grounded = true;
          }
        } else {
          pState.y += (gy - pState.y) * Math.min(1, dt * 15);
        }

        player.root.position.set(pState.x, pState.y, pState.z);
        player.root.rotation.y = pState.heading;
        audioEngine.setEngine(false, 0);
      }

      // Player animation state
      let anim: HumanoidState = 'idle';
      if (p.isDowned || pState.ejectT > 0) anim = 'down';
      else if (!pState.grounded) anim = 'jump';
      else if (pState.speed > 0.1 && !activeCar) anim = isSprinting ? 'run' : 'walk';
      else if (p.emote !== 'none') anim = p.emote;
      animateHumanoid(player, anim, pState.speed, t, dt, p.holdingPhone && !activeCar);

      if (meLabel && performance.now() > meLabel.until) {
        player.root.remove(meLabel.sprite);
        meLabel = null;
      }

      // ======== Parked cars idle visuals ========
      for (const c of cars) {
        if (c === activeCar) continue;
        c.model.group.position.set(c.x, groundY(c.x, c.z), c.z);
        c.model.group.rotation.y = c.heading;
        c.model.headMat.emissiveIntensity = 0.2;
        c.model.tailMat.emissiveIntensity = 0.2;
        if (c.model.barRed) c.model.barRed.emissiveIntensity = 0.2;
        if (c.model.barBlue) c.model.barBlue.emissiveIntensity = 0.2;
      }

      // ======== AI traffic ========
      const obstacles: { x: number; z: number }[] = [{ x: pState.x, z: pState.z }];
      traffic.forEach((c) => obstacles.push({ x: c.x, z: c.z }));
      for (const c of traffic) {
        const s2 = ((c.s % 140) + 140) % 140;
        const i = Math.floor(s2 / 35);
        const fr = (s2 - i * 35) / 35;
        const a = c.loop[i];
        const b = c.loop[(i + 1) % 4];
        c.x = a[0] + (b[0] - a[0]) * fr;
        c.z = a[1] + (b[1] - a[1]) * fr;
        const targetH = Math.atan2(b[0] - a[0], b[1] - a[1]);
        c.heading = angleLerp(c.heading, targetH, Math.min(1, dt * 5));
        const fx = Math.sin(targetH);
        const fz = Math.cos(targetH);
        let blockedAhead = false;
        let playerAhead = false;
        for (const o of obstacles) {
          if (o.x === c.x && o.z === c.z) continue;
          const vx = o.x - c.x;
          const vz = o.z - c.z;
          const along = vx * fx + vz * fz;
          const lat = Math.abs(vx * fz - vz * fx);
          if (along > 0.5 && along < 8 && lat < 2.2) {
            blockedAhead = true;
            if (o === obstacles[0]) playerAhead = true;
          }
        }
        for (const u of police) {
          if (!u.active) continue;
          const vx = u.x - c.x;
          const vz = u.z - c.z;
          const along = vx * fx + vz * fz;
          if (along > 0.5 && along < 8 && Math.abs(vx * fz - vz * fx) < 2.2) blockedAhead = true;
        }
        const target = blockedAhead ? 0 : c.maxSpeed;
        c.speed += (target - c.speed) * Math.min(1, dt * (blockedAhead ? 5 : 1.2));
        c.s += c.speed * dt;
        c.honkCd -= dt;
        if (playerAhead && c.speed < 0.5 && c.honkCd <= 0 && Math.hypot(c.x - pState.x, c.z - pState.z) < 25) {
          audioEngine.playDanfoHorn();
          c.honkCd = 4 + Math.random() * 3;
        }
        c.model.group.position.set(c.x, 0, c.z);
        c.model.group.rotation.y = c.heading;
        c.model.wheelMeshes.forEach((w) => (w.rotation.x += (c.speed / 0.36) * dt));
        c.model.tailMat.emissiveIntensity = blockedAhead ? 2.5 : night > 0.45 ? 0.8 : 0.3;
        c.model.headMat.emissiveIntensity = night > 0.45 ? 2 : 0.3;
      }

      // ======== Pedestrians ========
      for (const ped of peds) {
        if (ped.downT > 0) {
          ped.downT -= dt;
          animateHumanoid(ped.h, 'down', 0, t, dt);
          continue;
        }
        const s2 = ((ped.s % 104) + 104) % 104;
        const i = Math.floor(s2 / 26);
        const fr = (s2 - i * 26) / 26;
        const a = ped.loop[i];
        const b = ped.loop[(i + 1) % 4];
        ped.x = a[0] + (b[0] - a[0]) * fr;
        ped.z = a[1] + (b[1] - a[1]) * fr;
        const dirX = (b[0] - a[0]) * ped.dir;
        const dirZ = (b[1] - a[1]) * ped.dir;
        // Pause and turn toward player if standing nearby on foot
        const vx = pState.x - ped.x;
        const vz = pState.z - ped.z;
        const near = Math.hypot(vx, vz) < 2.3 && !activeCar;
        const scared = p.wantedStars > 0 && Math.hypot(vx, vz) < 12;
        const desiredHeading = near ? Math.atan2(vx, vz) : Math.atan2(dirX, dirZ);
        ped.heading = angleLerp(ped.heading, desiredHeading, Math.min(1, dt * 6));
        const sp = near ? 0 : scared ? ped.speed * 2.6 : ped.speed;
        ped.s += sp * dt * ped.dir;
        ped.h.root.position.set(ped.x, 0.12, ped.z);
        ped.h.root.rotation.y = ped.heading;
        animateHumanoid(ped.h, near ? 'idle' : scared ? 'run' : 'walk', sp, t, dt);
      }
      for (const n of npcs) animateHumanoid(n.h, n.state, 0, t + n.h.phase, dt);

      // ======== Police pursuit ========
      const wanted = p.wantedStars;
      const desired = Math.min(3, wanted);
      let activeCount = police.filter((u) => u.active).length;
      if (activeCount < desired) {
        const unit = police.find((u) => !u.active)!;
        // Spawn at a road intersection 45-75 units away
        const candidates: [number, number][] = [];
        for (const rx of ROAD_LINES) for (const rz of ROAD_LINES) {
          const dd = Math.hypot(rx - pState.x, rz - pState.z);
          if (dd > 40 && dd < 80) candidates.push([rx, rz]);
        }
        const [sx, sz] = candidates.length ? pick(candidates) : [ROAD_LINES[0], ROAD_LINES[0]];
        unit.active = true;
        unit.x = sx;
        unit.z = sz;
        unit.heading = Math.atan2(pState.x - sx, pState.z - sz);
        unit.speed = 0;
        unit.model.group.visible = true;
        activeCount++;
      } else if (activeCount > desired) {
        police.forEach((u) => {
          if (u.active && police.filter((q) => q.active).length > desired) {
            u.active = false;
            u.model.group.visible = false;
          }
        });
      }
      let minPoliceDist = Infinity;
      for (const u of police) {
        if (!u.active) continue;
        const dx = pState.x - u.x;
        const dz = pState.z - u.z;
        const dd = Math.hypot(dx, dz);
        minPoliceDist = Math.min(minPoliceDist, dd);
        const desiredH = Math.atan2(dx, dz);
        u.heading = angleLerp(u.heading, desiredH, Math.min(1, dt * 2.2));
        const maxS = 12 + wanted * 2.6;
        const tgt = dd < 7 ? Math.max(0, dd - 4) : maxS;
        u.speed += (tgt - u.speed) * Math.min(1, dt * 1.5);
        const nx = u.x + Math.sin(u.heading) * u.speed * dt;
        const nz = u.z + Math.cos(u.heading) * u.speed * dt;
        if (blocked(nx, nz, 1.3)) {
          u.heading += 1.4 * dt * 8;
          u.speed *= 0.6;
        } else {
          u.x = nx;
          u.z = nz;
        }
        u.model.group.position.set(u.x, groundY(u.x, u.z), u.z);
        u.model.group.rotation.y = u.heading;
        u.model.wheelMeshes.forEach((w) => (w.rotation.x += (u.speed / 0.36) * dt));
        const ph = Math.floor(t * 6 + u.x) % 2;
        if (u.model.barRed) u.model.barRed.emissiveIntensity = ph === 0 ? 4 : 0.3;
        if (u.model.barBlue) u.model.barBlue.emissiveIntensity = ph === 1 ? 4 : 0.3;
        u.model.headMat.emissiveIntensity = 2;
      }
      if (wanted > 0) {
        if (minPoliceDist < 6 && pState.speed < 4) bustTimer += dt;
        else bustTimer = Math.max(0, bustTimer - dt * 0.5);
        if (bustTimer > 3) {
          bustTimer = 0;
          if (activeCar) enterOrExit();
          police.forEach((u) => {
            u.active = false;
            u.model.group.visible = false;
          });
          p.onBusted();
        }
        if (minPoliceDist > 60) escapeTimer += dt;
        else escapeTimer = 0;
        if (escapeTimer > 12) {
          escapeTimer = 0;
          p.onWantedEscaped();
        }
        sirenCd -= dt;
        if (minPoliceDist < 40 && sirenCd <= 0) {
          audioEngine.playPoliceSiren();
          sirenCd = 2.2;
        }
      } else {
        bustTimer = 0;
        escapeTimer = 0;
      }

      // ======== Markers ========
      markerRings.forEach((r, i) => {
        r.scale.y = 1 + Math.sin(t * 3 + i) * 0.15;
        markerIcons[i].position.y = 2.6 + Math.sin(t * 2 + i) * 0.15;
      });
      let missionDistance: number | null = null;
      if (p.missionTarget) {
        const mt = p.missionTarget;
        missionGroup.visible = true;
        missionGroup.position.set(mt.x, groundY(mt.x, mt.z), mt.z);
        (missionRing.material as THREE.MeshBasicMaterial).color.set(mt.color);
        beamMat.color.set(mt.color);
        (chevron.material as THREE.MeshBasicMaterial).color.set(mt.color);
        missionRing.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
        chevron.position.y = 3 + Math.sin(t * 3) * 0.3;
        chevron.rotation.y = t * 2;
        missionDistance = Math.hypot(mt.x - pState.x, mt.z - pState.z);
        if (missionDistance < (activeCar ? 5.5 : 2.6) && lastMissionReached !== mt.id && !locked) {
          lastMissionReached = mt.id;
          p.onMissionReached(mt.id);
        }
      } else {
        missionGroup.visible = false;
      }
      if (p.waypoint) {
        waypointMarker.visible = true;
        waypointMarker.position.set(p.waypoint.x, 15, p.waypoint.z);
        if (Math.hypot(p.waypoint.x - pState.x, p.waypoint.z - pState.z) < 8 && waypointLatch !== p.waypoint.id) {
          waypointLatch = p.waypoint.id;
          p.onWaypointReached();
        }
      } else {
        waypointMarker.visible = false;
        waypointLatch = '';
      }

      // ======== Camera ========
      const now = performance.now();
      if (p.cameraMode === 'isometric') {
        tmpV.set(pState.x + 22, 30, pState.z + 22);
        camera.position.lerp(tmpV, Math.min(1, dt * 4));
        camera.lookAt(pState.x, 1, pState.z);
      } else if (p.cameraMode === 'hood') {
        if (activeCar) {
          const fx = Math.sin(activeCar.heading);
          const fz = Math.cos(activeCar.heading);
          camera.position.set(activeCar.x + fx * 0.45, 1.38, activeCar.z + fz * 0.45);
          camera.lookAt(activeCar.x + fx * 28, 1.25, activeCar.z + fz * 28);
          cam.yaw = activeCar.heading;
        } else {
          player.root.visible = false;
          const fx = Math.sin(cam.yaw) * Math.cos(cam.pitch);
          const fy = -Math.sin(cam.pitch);
          const fz = Math.cos(cam.yaw) * Math.cos(cam.pitch);
          camera.position.set(pState.x, pState.y + 1.68, pState.z);
          camera.lookAt(pState.x + fx * 15, pState.y + 1.68 + fy * 15, pState.z + fz * 15);
        }
      } else {
        const speedFrac = activeCar ? Math.min(1, pState.speed / activeCar.vmax) : 0;
        if (activeCar && now - cam.lastInput > 1400 && pState.speed > 2) {
          cam.yaw = angleLerp(cam.yaw, activeCar.heading, Math.min(1, dt * 2.5));
          cam.pitch += (0.22 - cam.pitch) * Math.min(1, dt * 1.5);
        }
        const dist = activeCar ? Math.max(7.5, cam.dist + 2.5) + speedFrac * 2 : cam.dist;
        const target = tmpV2.set(pState.x, (activeCar ? 1.6 : pState.y + 1.55), pState.z);
        const fx = Math.sin(cam.yaw);
        const fz = Math.cos(cam.yaw);
        const shoulder = activeCar ? 0 : 0.55;
        const desiredPos = tmpV.set(
          target.x - fx * dist * Math.cos(cam.pitch) - Math.cos(cam.yaw) * shoulder,
          target.y + dist * Math.sin(cam.pitch) + 0.3,
          target.z - fz * dist * Math.cos(cam.pitch) + Math.sin(cam.yaw) * shoulder
        );
        // Keep the camera out of walls
        const dir = desiredPos.clone().sub(target);
        const len = dir.length();
        raycaster.set(target, dir.normalize());
        raycaster.far = len;
        const hit = raycaster.intersectObjects(cameraBlockers, false)[0];
        if (hit) desiredPos.copy(target).addScaledVector(dir, Math.max(1.2, hit.distance - 0.4));
        if (desiredPos.y < 0.4) desiredPos.y = 0.4;
        camera.position.lerp(desiredPos, Math.min(1, dt * (activeCar ? 10 : 18)));
        if (cam.shake > 0) {
          camera.position.x += (Math.random() - 0.5) * cam.shake * 0.6;
          camera.position.y += (Math.random() - 0.5) * cam.shake * 0.6;
          cam.shake = Math.max(0, cam.shake - dt * 2);
        }
        camera.lookAt(target.x + fx * 1.5, target.y, target.z + fz * 1.5);
        const fov = 60 + speedFrac * 16;
        if (Math.abs(camera.fov - fov) > 0.1) {
          camera.fov += (fov - camera.fov) * Math.min(1, dt * 3);
          camera.updateProjectionMatrix();
        }
      }

      if (p.cursorFree && document.pointerLockElement === canvas) document.exitPointerLock();

      // ======== HUD sync (throttled) ========
      hudAcc += dt;
      if (hudAcc > 0.08) {
        hudAcc = 0;
        let nearVehicle: WorldRealtimeState['nearVehicle'] = null;
        if (!activeCar) {
          for (const c of cars) {
            if (Math.hypot(c.x - pState.x, c.z - pState.z) < 4) {
              nearVehicle = { id: c.id, name: c.name, color: c.color };
              break;
            }
          }
        }
        const car = activeCar as DrivableCar | null;
        const kmh = car ? Math.hypot(car.vx, car.vz) * SPEED_TO_KMH : 0;
        const fwdSign = car ? Math.sign(car.vx * Math.sin(car.heading) + car.vz * Math.cos(car.heading)) : 0;
        p.onUpdateWorldState({
          x: pState.x,
          z: pState.z,
          heading: pState.heading,
          cameraYaw: cam.yaw,
          cameraMode: p.cameraMode,
          streetName: getStreetName(pState.x, pState.z, p.activeCity || 'lagos'),
          isSprinting,
          nearVehicle,
          nearInteractable: nearestInteractable(),
          vehicle: {
            isDriving: !!car,
            vehicleId: car?.id ?? null,
            vehicleName: car?.name ?? '',
            vehicleCategory: car?.category ?? 'sedan',
            speedKmh: kmh,
            rpm: car ? 12 + ((kmh % 45) / 45) * 85 : 0,
            gear: !car || kmh < 1 ? 'N' : fwdSign < 0 ? 'R' : String(Math.min(6, Math.floor(kmh / 45) + 1)),
            fuel: car?.fuel ?? 100,
            engineHealth: car?.engine ?? 100,
            seatbeltOn: carFlags.seatbelt,
            lightsOn: carFlags.lights,
            sirenOn: carFlags.siren,
          },
          police: police.filter((u) => u.active).map((u) => ({ x: u.x, z: u.z })),
          missionDistance,
        });
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      audioEngine.setEngine(false, 0);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('wheel', onWheel);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      apiRef.current = null;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      renderer.dispose();
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  }, []);

  // ===================== Prop-driven commands =====================
  useEffect(() => {
    if (props.teleportRequest) apiRef.current?.teleport(props.teleportRequest.x, props.teleportRequest.z);
  }, [props.teleportRequest]);

  useEffect(() => {
    if (props.spawnVehicleRequest) apiRef.current?.spawnVehicle(props.spawnVehicleRequest.id);
  }, [props.spawnVehicleRequest]);

  useEffect(() => {
    if (props.vehicleControlTrigger) apiRef.current?.vehicleAction(props.vehicleControlTrigger.action);
  }, [props.vehicleControlTrigger]);

  useEffect(() => {
    if (props.tuneVehicleRequest) apiRef.current?.tuneVehicle(props.tuneVehicleRequest);
  }, [props.tuneVehicleRequest]);

  useEffect(() => {
    if (props.meText) apiRef.current?.showMe(props.meText.text);
  }, [props.meText]);

  useEffect(() => {
    apiRef.current?.setOutfit(props.outfit);
  }, [props.outfit]);

  return <div ref={mountRef} className="absolute inset-0 touch-none" />;
};
