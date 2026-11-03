'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  Emote,
  MapTarget,
  PlayerStats,
  Weather,
  WorldRealtimeState,
  VehicleCategory,
  CityId,
  LagosDistrict,
  GraphicsSettings,
  JobKind,
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
import { buildPlane, PlaneModel } from './world/planeModel';
import { buildBuildingInterior, BuiltInterior } from './world/interiorBuilder';

export type VehicleAction = 'enter_exit' | 'seatbelt' | 'lights' | 'siren';

export interface LagosWorld3DProps {
  outfit: PlayerStats['outfit'];
  activeCity?: CityId;
  solarKw?: number;
  graphicsSettings?: GraphicsSettings;
  activeMissionJobKind?: JobKind | null;
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
  enterBuildingRequest?: { id: LagosDistrict; ts: number } | null;
  exitBuildingRequest?: number | null;
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

const SPEED_TO_KMH = 7;
const TOP_SPEED_ACCEL: Record<VehicleCategory, number> = {
  super: 26,
  police: 23,
  suv: 18,
  sedan: 16,
  transit: 11,
  motorcycle: 30,
  plane: 34,
};

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
  ctx.strokeStyle = fg;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = fg;
  ctx.font = `900 ${Math.floor(h * 0.44)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function iconSprite(emoji: string, label: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 140;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
  ctx.beginPath();
  ctx.roundRect(12, 16, 360, 108, 40);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.font = '50px serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 34, 72);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 24px Arial, sans-serif';
  ctx.fillText(label.slice(0, 19), 98, 58);

  ctx.fillStyle = color;
  ctx.font = '700 18px monospace';
  ctx.fillText('[E] ENTER 3D INTERIOR', 98, 92);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true })
  );
  s.scale.set(2.8, 1.02, 1);
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
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect((1024 - tw) / 2, 24, tw, 80);
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText(label, 512, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthWrite: false, depthTest: false, transparent: true })
  );
  s.scale.set(6, 0.75, 1);
  s.renderOrder = 999;
  return s;
}

function makeAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1f232a';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 42;
  for (let i = 0; i < 2600; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 256;
    seed = (seed * 16807) % 2147483647;
    const y = seed % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(36, 36);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSidewalkTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeWindowTextures() {
  const w = 256;
  const h = 512;
  const map = document.createElement('canvas');
  const em = document.createElement('canvas');
  map.width = em.width = w;
  map.height = em.height = h;
  const m = map.getContext('2d')!;
  const e = em.getContext('2d')!;
  m.fillStyle = '#cbd5e1';
  m.fillRect(0, 0, w, h);
  e.fillStyle = '#000000';
  e.fillRect(0, 0, w, h);

  // Horizontal architectural floor slabs
  m.fillStyle = '#94a3b8';
  for (let y = 0; y < h; y += 64) {
    m.fillRect(0, y, w, 6);
  }

  const cols = 4;
  const rows = 8;
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (w / cols) + 8;
      const y = r * (h / rows) + 10;
      const ww = w / cols - 16;
      const hh = h / rows - 18;
      const lit = rnd() < 0.46;
      m.fillStyle = lit ? '#fef3c7' : '#0f172a';
      m.fillRect(x, y, ww, hh);
      m.strokeStyle = '#334155';
      m.lineWidth = 2;
      m.strokeRect(x, y, ww, hh);
      if (lit) {
        e.fillStyle = rnd() < 0.25 ? '#7dd3fc' : '#fde68a';
        e.fillRect(x + 2, y + 2, ww - 4, hh - 4);
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

function scaleBoxUVs(geo: THREE.BoxGeometry, w: number, h: number, d: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
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
  if (x < -WORLD_HALF + 2) {
    // Dedicated Airport Peninsula causeway & runway asphalt level
    return true;
  }
  return Math.abs(x - nearestRoad(x)) < ROAD_WIDTH / 2 || Math.abs(z - nearestRoad(z)) < ROAD_WIDTH / 2;
}
function groundY(x: number, z: number) {
  if (x < -WORLD_HALF + 2 && Math.abs(z) < 88) return 0.08;
  if (z < -WORLD_HALF + 0.5) return 0.35;
  return isOnRoad(x, z) ? 0 : 0.12;
}
function clampToWorld(p: { x: number; z: number }) {
  const minX = Math.abs(p.z) < 86 ? -242 : -WORLD_HALF + 2;
  p.x = Math.max(minX, Math.min(WORLD_HALF - 2, p.x));
  p.z = Math.min(WORLD_HALF - 2, p.z);
  if (p.z < -WORLD_HALF + 1) {
    const onPier = Math.abs(p.x) < 1.8 && p.z > -WORLD_HALF - 20;
    const onAirport = p.x < -WORLD_HALF - 4 && p.z > -86;
    if (!onPier && !onAirport) p.z = -WORLD_HALF + 1;
  }
}

interface DrivableCar {
  id: string;
  name: string;
  category: VehicleCategory;
  color: string;
  vmax: number;
  model: CarModel;
  x: number;
  y: number;
  z: number;
  vy: number;
  heading: number;
  pitch: number;
  roll: number;
  vx: number;
  vz: number;
  steer: number;
  fuel: number;
  engine: number;
}

interface AmbientSkyPlane {
  plane: PlaneModel;
  mode: 'orbit' | 'linear';
  y: number;
  speed: number;
  phase: number;
  radius: number;
  dirX: number;
  dirZ: number;
  x: number;
  z: number;
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

export const LagosWorld3D: React.FC<LagosWorld3DProps> = (props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const [doorFade, setDoorFade] = useState(false);

  const apiRef = useRef<{
    teleport: (x: number, z: number) => void;
    spawnVehicle: (id: string) => void;
    vehicleAction: (a: VehicleAction) => void;
    tuneVehicle: (opts: NonNullable<LagosWorld3DProps['tuneVehicleRequest']>) => void;
    showMe: (text: string) => void;
    setOutfit: (o: PlayerStats['outfit']) => void;
    enterInterior: (id: LagosDistrict) => void;
    exitInterior: () => void;
    applyGraphics: (g?: GraphicsSettings) => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color('#0b1020');
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2(skyColor.getHex(), 0.008);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      950
    );
    camera.position.set(0, 6, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // AAA Physically Based Environment Reflections (PMREM)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.72;
    pmrem.dispose();

    // AAA Post-Processing HDR Bloom Pipeline
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.32,
      0.42,
      0.86
    );
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    // Outdoor world container (hidden cleanly when walking inside a 3D building!)
    const outdoorGroup = new THREE.Group();
    scene.add(outdoorGroup);

    // ---------- Outdoor Lights ----------
    const hemi = new THREE.HemisphereLight(0xbcd7ff, 0x2b2118, 0.65);
    outdoorGroup.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 230;
    sun.shadow.bias = -0.0004;
    outdoorGroup.add(sun);
    outdoorGroup.add(sun.target);

    const applyGraphics = (g?: GraphicsSettings) => {
      const scale = g?.resolutionScale ?? 1.0;
      const bloomOn = g?.bloomEnabled ?? true;
      const shadowsOn = g?.shadowsEnabled ?? true;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetDpr = Math.max(0.35, Math.min(2.6, baseDpr * scale));
      renderer.setPixelRatio(targetDpr);
      renderer.setSize(w, h);
      composer.setPixelRatio(targetDpr);
      composer.setSize(w, h);
      bloomPass.setSize(Math.max(1, Math.floor(w * scale)), Math.max(1, Math.floor(h * scale)));
      bloomPass.enabled = bloomOn;
      renderer.shadowMap.enabled = shadowsOn;
      sun.castShadow = shadowsOn;
    };
    applyGraphics(propsRef.current.graphicsSettings);

    // ---------- Ocean + Textured Asphalt Ground ----------
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(950, 950),
      new THREE.MeshPhysicalMaterial({
        color: 0x075985,
        roughness: 0.08,
        metalness: 0.55,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.6;
    outdoorGroup.add(ocean);

    const asphaltTex = makeAsphaltTexture();
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2),
      new THREE.MeshStandardMaterial({
        map: asphaltTex,
        color: 0xffffff,
        roughness: 0.88,
        metalness: 0.08,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    outdoorGroup.add(ground);
    const roadMat = ground.material as THREE.MeshStandardMaterial;

    // Sea wall around city perimeter (with wide causeway opening on West side for the Airport Landmass)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 });
    for (const [x, z, w, d] of [
      [0, WORLD_HALF, WORLD_HALF * 2, 1],
      [0, -WORLD_HALF, WORLD_HALF * 2, 1],
      [WORLD_HALF, 0, 1, WORLD_HALF * 2],
      [-WORLD_HALF, -38, 1, 114],
      [-WORLD_HALF, 75, 1, 40],
    ] as [number, number, number, number][]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), wallMat);
      wall.position.set(x, -0.1, z);
      outdoorGroup.add(wall);
    }

    // Textured Interlocking Stone Sidewalks & Parks
    const sidewalkTex = makeSidewalkTexture();
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTex,
      roughness: 0.88,
    });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.95 });
    for (const bx of BLOCK_CENTERS) {
      for (const bz of BLOCK_CENTERS) {
        const [x0, x1] = blockBounds(bx);
        const [z0, z1] = blockBounds(bz);
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(x1 - x0, 0.12, z1 - z0),
          sidewalkMat
        );
        slab.position.set((x0 + x1) / 2, 0.06, (z0 + z1) / 2);
        slab.receiveShadow = true;
        outdoorGroup.add(slab);
        if (bz === -80 || (bx === 40 && bz === 40) || (bx === 80 && bz === 40)) {
          const grass = new THREE.Mesh(
            new THREE.BoxGeometry(x1 - x0 - 4, 0.13, z1 - z0 - 4),
            grassMat
          );
          grass.position.set((x0 + x1) / 2, 0.07, (z0 + z1) / 2);
          grass.receiveShadow = true;
          outdoorGroup.add(grass);
        }
      }
    }

    // Road markings (instanced yellow center dashes + crisp crosswalks)
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
    outdoorGroup.add(dashes);

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
    const zebras = new THREE.InstancedMesh(
      zebraGeo,
      new THREE.MeshBasicMaterial({ color: 0xf1f5f9 }),
      zebraSpots.length
    );
    zebraSpots.forEach(([x, z, ry], i) => {
      tmp.position.set(x, 0.021, z);
      tmp.rotation.set(0, ry, 0);
      tmp.updateMatrix();
      zebras.setMatrixAt(i, tmp.matrix);
    });
    outdoorGroup.add(zebras);

    // Intersection Traffic Signal Gantries (Red / Amber / Green live-cycling signals) + Street & Highway Signs
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });
    const trafficLightSets: {
      red: THREE.MeshStandardMaterial;
      amber: THREE.MeshStandardMaterial;
      green: THREE.MeshStandardMaterial;
      phaseOffset: number;
    }[] = [];
    for (const rx of [-60, -20, 20, 60]) {
      for (const rz of [-60, -20, 20, 60]) {
        const rMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.2 });
        const aMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.2 });
        const gMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.9 });
        trafficLightSets.push({ red: rMat, amber: aMat, green: gMat, phaseOffset: (rx + rz) * 0.08 });

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 5.8, 8), gantryMat);
        post.position.set(rx + 5.8, 2.9, rz + 5.8);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.14), gantryMat);
        arm.position.set(rx + 4.0, 5.5, rz + 5.8);
        const housing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.44, 0.28), gantryMat);
        housing.position.set(rx + 3.9, 5.3, rz + 5.8);
        const sigR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), rMat);
        sigR.position.set(rx + 3.4, 5.3, rz + 5.95);
        const sigA = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), aMat);
        sigA.position.set(rx + 3.9, 5.3, rz + 5.95);
        const sigG = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), gMat);
        sigG.position.set(rx + 4.4, 5.3, rz + 5.95);
        outdoorGroup.add(post, arm, housing, sigR, sigA, sigG);
      }
    }

    // 3D Street Signs (STOP, SPEED LIMIT 60, ONE WAY) & Overhead Highway Gantry Signs
    const stopSignTex = textTexture('STOP', '#dc2626', '#ffffff');
    const speedSignTex = textTexture('60 KM/H', '#f8fafc', '#0f172a');
    const signPoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    for (const [sx, sz, isStop] of [
      [-14.2, -14.2, true],
      [14.2, 14.2, true],
      [-54.2, 25.8, true],
      [25.8, -54.2, true],
      [-25.8, 54.2, false],
      [54.2, 25.8, false],
      [-65.8, 34.2, false],
      [65.8, -14.2, false],
    ] as [number, number, boolean][]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.7, 8), signPoleMat);
      pole.position.set(sx, 1.35, sz);
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.85, 0.06),
        new THREE.MeshStandardMaterial({
          map: isStop ? stopSignTex : speedSignTex,
          roughness: 0.35,
        })
      );
      board.position.set(sx, 2.55, sz);
      outdoorGroup.add(pole, board);
    }

    // Overhead Green Expressway Direction Gantries
    for (const [gx, gz, label] of [
      [-55, 20, '← MMIA AIRPORT | CBN BULLION VAULT'],
      [0, 20, '↑ ZENITH BANK | VICTORIA ISLAND →'],
      [40, 60, '↑ GTCO CORPORATE BANK | YOUR RESIDENCE →'],
    ] as [number, number, string][]) {
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 7.4, 8), gantryMat);
      legL.position.set(gx - 5.8, 3.7, gz);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 7.4, 8), gantryMat);
      legR.position.set(gx + 5.8, 3.7, gz);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.22, 0.22), gantryMat);
      cross.position.set(gx, 7.1, gz);
      const hwyTex = textTexture(label, '#065f46', '#ffffff');
      const hwyBoard = new THREE.Mesh(
        new THREE.BoxGeometry(8.8, 1.45, 0.14),
        new THREE.MeshStandardMaterial({
          map: hwyTex,
          emissive: 0xffffff,
          emissiveMap: hwyTex,
          emissiveIntensity: 0.45,
        })
      );
      hwyBoard.position.set(gx, 6.9, gz);
      outdoorGroup.add(legL, legR, cross, hwyBoard);
    }

    // Outdoor Panning 3D Security Cameras mounted on Banks, Police HQ, Tech Stores & Airport
    const outdoorSecurityCameras: THREE.Group[] = [];
    const cctvBodyM = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.65, roughness: 0.25 });
    const cctvLedM = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.2 });
    const addOutdoorCCTV = (x: number, y: number, z: number, baseYaw = 0) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);
      pivot.rotation.y = baseYaw;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.56), cctvBodyM);
      body.rotation.x = 0.38;
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), cctvLedM);
      led.position.set(0.1, 0.08, 0.28);
      pivot.add(body, led);
      outdoorGroup.add(pivot);
      outdoorSecurityCameras.push(pivot);
    };

    // ---------- Outdoor Buildings & Landmarks ----------
    const colliders: AABB[] = [];
    const cameraBlockers: THREE.Object3D[] = [];
    const { mapTex, emTex } = makeWindowTextures();
    const windowMats = new Map<number, THREE.MeshStandardMaterial>();
    const getWindowMat = (color: number) => {
      let m = windowMats.get(color);
      if (!m) {
        m = new THREE.MeshPhysicalMaterial({
          color,
          map: mapTex,
          emissive: 0xffd28a,
          emissiveMap: emTex,
          emissiveIntensity: 0,
          roughness: 0.36,
          metalness: 0.35,
          clearcoat: 0.45,
        });
        windowMats.set(color, m);
      }
      return m;
    };
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });

    const addBox = (
      x: number,
      z: number,
      w: number,
      d: number,
      h: number,
      mat: THREE.Material,
      opts: { y?: number; collide?: boolean; windows?: boolean; cast?: boolean } = {}
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      if (opts.windows) scaleBoxUVs(geo, w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, (opts.y ?? 0) + h / 2, z);
      mesh.castShadow = opts.cast ?? true;
      mesh.receiveShadow = true;
      outdoorGroup.add(mesh);
      if (opts.collide !== false) {
        colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
        cameraBlockers.push(mesh);
      }
      return mesh;
    };

    const signMats: THREE.MeshStandardMaterial[] = [];
    const addSign = (
      text: string,
      bg: string,
      fg: string,
      x: number,
      y: number,
      z: number,
      w: number,
      glow = 1.0
    ) => {
      const tex = textTexture(text, bg, fg);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: glow,
      });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mat);
      sign.position.set(x, y, z);
      outdoorGroup.add(sign);
      signMats.push(mat);
      return sign;
    };

    // Generic filler skyscrapers & blocks
    const reserved = new Set(DISTRICTS.map((d) => `${d.blockX},${d.blockZ}`));
    const fillers = generateFillerBuildings(reserved);
    for (const b of fillers) {
      addBox(b.x, b.z, b.w, b.d, b.h, getWindowMat(b.color), { windows: true });
      addBox(b.x, b.z, b.w + 0.5, b.d + 0.5, 0.55, roofMat, { y: b.h, collide: false, cast: false });
      if (b.h > 20) {
        addBox(b.x + b.w * 0.15, b.z - b.d * 0.15, 2.2, 2.2, 2.6, roofMat, {
          y: b.h + 0.55,
          collide: false,
          cast: false,
        });
      }
    }

    const neonMats: THREE.MeshStandardMaterial[] = [];
    const beams: THREE.Mesh[] = [];
    const glowMat = (c: number) => {
      const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.35 });
      neonMats.push(m);
      return m;
    };

    // Helper: add unmistakable 3D Glowing Double-Glass Entrance Doors + Walkway on every building!
    const doorPositions = new Map<LagosDistrict, { x: number; z: number }>();
    const addEntrancePortal = (
      distId: LagosDistrict,
      doorX: number,
      doorZ: number,
      markerX: number,
      markerZ: number,
      hexColor: string
    ) => {
      doorPositions.set(distId, { x: doorX, z: doorZ });
      const frameM = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.2 });
      const portalM = new THREE.MeshStandardMaterial({
        color: hexColor,
        emissive: hexColor,
        emissiveIntensity: 1.15,
        roughness: 0.1,
      });
      addBox(doorX, doorZ + 0.08, 3.2, 0.24, 3.1, frameM, { collide: false, cast: false });
      addBox(doorX - 0.72, doorZ + 0.12, 1.28, 0.26, 2.75, portalM, { collide: false, cast: false, y: 0.12 });
      addBox(doorX + 0.72, doorZ + 0.12, 1.28, 0.26, 2.75, portalM, { collide: false, cast: false, y: 0.12 });

      // Paved walkway from building door out to sidewalk marker
      const pathLen = Math.max(1.5, Math.abs(markerZ - doorZ));
      const walkway = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.04, pathLen),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 })
      );
      walkway.position.set(doorX, 0.135, (doorZ + markerZ) / 2);
      walkway.receiveShadow = true;
      outdoorGroup.add(walkway);
    };

    const dynamicSigns = new Map<LagosDistrict, { mesh: THREE.Mesh; bg: string; fg: string }>();

    for (const d of DISTRICTS) {
      // FIXED BUG: properly center BOTH -80 -> -77.5 AND +80 -> +77.5 edge blocks!
      const bx = d.blockX === -80 ? -77.5 : d.blockX === 80 ? 77.5 : d.blockX;
      const bz = d.blockZ;

      switch (d.id) {
        case 'home': {
          // Player's Private 2-Story Nigerian Luxury Duplex Villa + Rooftop Solar + Pool at (77.5, 40)
          addBox(bx, bz - 1, 16, 13, 8.8, getWindowMat(0xf8fafc), { windows: true });
          addBox(bx, bz - 1, 16.8, 13.8, 0.5, new THREE.MeshStandardMaterial({ color: 0x0f172a }), {
            y: 8.8,
            collide: false,
          });
          addBox(bx, bz + 6.2, 8.4, 2.6, 0.35, new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }), {
            y: 4.1,
            collide: false,
          });
          const s = addSign('YOUR RESIDENCE', '#064e3b', '#6ee7b7', bx, 6.4, bz + 5.58, 9);
          dynamicSigns.set('home', { mesh: s, bg: '#064e3b', fg: '#6ee7b7' });
          addEntrancePortal('home', bx, bz + 5.5, d.x, d.z, d.color);

          // 4 Angled Rooftop Monocrystalline Solar Panels
          const solarMat = new THREE.MeshPhysicalMaterial({
            color: 0x1d4ed8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.55,
            metalness: 0.85,
            roughness: 0.12,
            clearcoat: 1.0,
          });
          for (const sx of [-4.5, -1.5, 1.5, 4.5]) {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 4.4), solarMat);
            panel.position.set(bx + sx, 9.55, bz - 1);
            panel.rotation.x = 0.24;
            outdoorGroup.add(panel);
          }
          // Mikano Generator Shed & Courtyard Pool
          addBox(bx - 6.8, bz + 7.2, 3.0, 2.4, 2.3, new THREE.MeshStandardMaterial({ color: 0xb91c1c }), {
            y: 0.12,
          });
          const homePool = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 0.14, 3.8),
            new THREE.MeshPhysicalMaterial({
              color: 0x06b6d4,
              emissive: 0x0891b2,
              emissiveIntensity: 0.4,
              roughness: 0.05,
              clearcoat: 1.0,
            })
          );
          homePool.position.set(bx + 5.4, 0.16, bz + 7.5);
          outdoorGroup.add(homePool);
          break;
        }
        case 'airport': {
          // =========================================================================
          // DEDICATED INTERNATIONAL AIRPORT PENINSULA LANDMASS (x = -95..-245, z = -88..+88)
          // Completely separate from city streets — just like real life & GTA VI!
          // =========================================================================
          // 1. Causeway Bridge & Master Concrete Airfield Apron Slab
          const apronSlab = new THREE.Mesh(
            new THREE.BoxGeometry(152, 0.28, 176),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.86, metalness: 0.08 })
          );
          apronSlab.position.set(-170, -0.06, 0);
          apronSlab.receiveShadow = true;
          outdoorGroup.add(apronSlab);

          const causewayRoad = new THREE.Mesh(
            new THREE.BoxGeometry(28, 0.16, 22),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.78 })
          );
          causewayRoad.position.set(-103, 0.01, 40);
          causewayRoad.receiveShadow = true;
          outdoorGroup.add(causewayRoad);

          // 2. Full-Scale Asphalt Runway 18L / 36R (x = -212, z = -82..+82)
          const runwayMesh = new THREE.Mesh(
            new THREE.BoxGeometry(26, 0.08, 166),
            new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.75 })
          );
          runwayMesh.position.set(-212, 0.1, 0);
          runwayMesh.receiveShadow = true;
          outdoorGroup.add(runwayMesh);

          const rwyLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
          for (let rz = -72; rz <= 72; rz += 10) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 5.2), rwyLineMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-212, 0.15, rz);
            outdoorGroup.add(stripe);
          }
          // Piano-key threshold markings at both ends of Runway 18L/36R
          for (const endZ of [-78, 78]) {
            for (let kx = -9; kx <= 9; kx += 3) {
              const keyM = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5.5), rwyLineMat);
              keyM.rotation.x = -Math.PI / 2;
              keyM.position.set(-212 + kx, 0.15, endZ);
              outdoorGroup.add(keyM);
            }
          }
          // Glowing Runway Edge Lights
          const rwyEdgeMat = glowMat(0x38bdf8);
          for (let rz = -80; rz <= 80; rz += 16) {
            for (const ex of [-224.5, -199.5]) {
              const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), rwyEdgeMat);
              bulb.position.set(ex, 0.3, rz);
              outdoorGroup.add(bulb);
            }
          }

          // 3. Colossal International Passenger Terminal (x = -131, z = 40)
          addBox(-131, 40, 22, 34, 11.5, getWindowMat(0x0c4a6e), { windows: true });
          addBox(-119, 40, 4.2, 35, 0.48, glowMat(0x38bdf8), { y: 5.8, collide: false });
          const s = addSign('MMIA INTL AIRPORT (LOS)', '#082f49', '#7dd3fc', -119.8, 8.6, 40, 16, 1.35);
          s.rotation.y = Math.PI / 2;
          dynamicSigns.set('airport', { mesh: s, bg: '#082f49', fg: '#7dd3fc' });

          // Terminal East Entrance Portal facing (-114, 40)
          doorPositions.set('airport', { x: -119.5, z: 40 });
          addBox(-119.6, 40, 0.3, 4.2, 3.4, glowMat(0x38bdf8), { collide: false, cast: false });
          addOutdoorCCTV(-119.5, 5.4, 34, Math.PI / 2);
          addOutdoorCCTV(-119.5, 5.4, 46, Math.PI / 2);

          // 4. 34-Meter Air Traffic Control Tower
          const towerShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(1.9, 2.7, 30, 16),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.42 })
          );
          towerShaft.position.set(-134, 15, 68);
          towerShaft.castShadow = true;
          outdoorGroup.add(towerShaft);
          const towerCab = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 2.9, 4.2, 16), glowMat(0x38bdf8));
          towerCab.position.set(-134, 31.5, 68);
          outdoorGroup.add(towerCab);

          // 5. Three Giant Steel-Arch Aircraft Hangars (Hangar 1 Executive, Hangar 2 Charter, Hangar 3 Cargo)
          const hangarWallMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.35 });
          const hangarRoofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.45 });
          for (const [hz, label] of [
            [-15, 'HANGAR 01 • VIP JETS'],
            [-55, 'HANGAR 02 • CHARTER'],
            [70, 'HANGAR 03 • AIRCARGO'],
          ] as [number, string][]) {
            // Left, Right & Back Hangar Walls (Open on West side facing Runway!)
            addBox(-160, hz - 11, 24, 1.2, 8.5, hangarWallMat);
            addBox(-160, hz + 11, 24, 1.2, 8.5, hangarWallMat);
            addBox(-148.5, hz, 1.2, 22, 8.5, hangarWallMat);
            addBox(-160, hz, 24.6, 23.2, 0.9, hangarRoofMat, { y: 8.5, collide: false });
            const hs = addSign(label, '#0f172a', '#38bdf8', -172.2, 7.6, hz, 12, 1.1);
            hs.rotation.y = -Math.PI / 2;
          }

          // 6. Multiple Static Commercial Airliners & Private Jets across Gates & Tarmac
          const fleetSpecs: [number, number, number, string, string, number][] = [
            [-154, 30, -Math.PI / 2, '#f8fafc', '#0284c7', 1.22], // Gate A1 Air Peace Boeing 737
            [-154, 50, -Math.PI / 2, '#f8fafc', '#16a34a', 1.25], // Gate A2 Ibom Air Airbus A220
            [-160, 70, -Math.PI / 2, '#e2e8f0', '#f59e0b', 1.18], // Hangar 3 Cargo Jet
            [-184, -35, 0, '#0f172a', '#38bdf8', 0.95], // Taxiway Executive Jet
          ];
          for (const [px, pz, ry, bodyC, stripeC, sc] of fleetSpecs) {
            const pJet = buildPlane(bodyC, stripeC, sc, false);
            pJet.group.position.set(px, 0.12, pz);
            pJet.group.rotation.y = ry;
            outdoorGroup.add(pJet.group);
          }
          break;
        }
        case 'cbn': {
          // Central Bank of Nigeria (CBN) Sovereign Bullion Fortress at (-77.5, 40)
          addBox(bx, bz - 2, 22, 16, 18.5, getWindowMat(0x422006), { windows: true });
          addBox(bx, bz + 6.2, 22.6, 0.6, 0.7, glowMat(0xeab308), { y: 11.5, collide: false });
          // Armored Gold Bullion Columns
          const goldColMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.85, roughness: 0.2 });
          for (const cx of [-8, -4, 4, 8]) {
            addBox(bx + cx, bz + 6.3, 0.9, 0.9, 11, goldColMat, { collide: false });
          }
          const s = addSign('CENTRAL BANK (CBN VAULT)', '#422006', '#fde047', bx, 12.8, bz + 6.12, 13.5, 1.4);
          dynamicSigns.set('cbn', { mesh: s, bg: '#422006', fg: '#fde047' });
          addEntrancePortal('cbn', bx, bz + 6.0, d.x, d.z, d.color);
          addOutdoorCCTV(bx - 9, 6.2, bz + 6.3, 0.3);
          addOutdoorCCTV(bx + 9, 6.2, bz + 6.3, -0.3);
          break;
        }
        case 'gtbank': {
          // GTCO / Access Corporate Investment Bank Tower at (40, 77.5)
          const gbz = bz === 80 ? 77.5 : bz;
          addBox(bx, gbz, 20, 15, 16.5, getWindowMat(0x9a3412), { windows: true });
          addBox(bx, gbz - 7.6, 20.4, 0.5, 0.65, glowMat(0xf97316), { y: 10.2, collide: false });
          const s = addSign('GTCO CORPORATE BANK', '#7c2d12', '#fed7aa', bx, 11.4, gbz - 7.62, 12, 1.3);
          s.rotation.y = Math.PI;
          dynamicSigns.set('gtbank', { mesh: s, bg: '#7c2d12', fg: '#fed7aa' });
          addEntrancePortal('gtbank', bx, gbz - 7.5, d.x, d.z, d.color);
          addOutdoorCCTV(bx - 8, 5.8, gbz - 7.6, Math.PI);
          addOutdoorCCTV(bx + 8, 5.8, gbz - 7.6, Math.PI);
          break;
        }
        case 'istore': {
          // iStore & CyberDeck Flagship Apple/Android Megastore at (77.5, 0)
          addBox(bx, bz - 2, 19, 14, 10.5, getWindowMat(0x0f172a), { windows: true });
          addBox(bx, bz + 5.1, 19.4, 0.45, 0.55, glowMat(0x38bdf8), { y: 6.8, collide: false });
          const s = addSign('iSTORE & CYBERDECK HUB', '#082f49', '#e0f2fe', bx, 8.2, bz + 5.08, 12, 1.35);
          dynamicSigns.set('istore', { mesh: s, bg: '#082f49', fg: '#e0f2fe' });
          addEntrancePortal('istore', bx, bz + 5.0, d.x, d.z, d.color);
          addOutdoorCCTV(bx - 7.5, 5.2, bz + 5.2, 0);
          break;
        }
        case 'shitta': {
          addBox(bx, bz - 3, 18, 14, 6.5, getWindowMat(0xb45309), { windows: true });
          addBox(bx, bz + 5.2, 18, 2.6, 0.28, new THREE.MeshStandardMaterial({ color: 0xea580c }), {
            y: 3.8,
            collide: false,
          });
          const s = addSign('AMALA SHITTA', '#7c2d12', '#fde047', bx, 5.4, bz + 4.08, 10);
          dynamicSigns.set('shitta', { mesh: s, bg: '#7c2d12', fg: '#fde047' });
          addEntrancePortal('shitta', bx, bz + 4.0, d.x, d.z, d.color);
          break;
        }
        case 'fleeca': {
          addBox(bx, bz - 2, 20, 16, 12, getWindowMat(0x14532d), { windows: true });
          const s = addSign('ZENITH / FLEECA BANK', '#052e16', '#4ade80', bx, 9.5, bz + 6.08, 11);
          dynamicSigns.set('fleeca', { mesh: s, bg: '#052e16', fg: '#4ade80' });
          addBox(bx, bz + 6.1, 20.4, 0.4, 0.55, glowMat(0x22c55e), { y: 7.4, collide: false });
          addEntrancePortal('fleeca', bx, bz + 6.0, d.x, d.z, d.color);
          break;
        }
        case 'pillbox': {
          addBox(bx, bz - 3, 22, 16, 24, getWindowMat(0xe2e8f0), { windows: true });
          const s = addSign('LASUTH / PILLBOX MED', '#ffffff', '#dc2626', bx, 5.6, bz + 5.08, 12);
          dynamicSigns.set('pillbox', { mesh: s, bg: '#ffffff', fg: '#dc2626' });
          addEntrancePortal('pillbox', bx, bz + 5.0, d.x, d.z, d.color);
          const pad = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 0.2, 32),
            new THREE.MeshStandardMaterial({ color: 0x3f3f46 })
          );
          pad.position.set(bx, 24.1, bz - 3);
          outdoorGroup.add(pad);
          break;
        }
        case 'mrpd': {
          addBox(bx, bz - 3, 22, 16, 13.5, getWindowMat(0x1e293b), { windows: true });
          const s = addSign('POLICE & SECURITY HQ', '#0f172a', '#93c5fd', bx, 10.6, bz + 5.08, 13);
          dynamicSigns.set('mrpd', { mesh: s, bg: '#0f172a', fg: '#93c5fd' });
          addEntrancePortal('mrpd', bx, bz + 5.0, d.x, d.z, d.color);
          addBox(bx - 9, bz + 8, 0.25, 0.25, 9, new THREE.MeshStandardMaterial({ color: 0xd4d4d8 }), {
            collide: false,
          });
          const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 1.4),
            new THREE.MeshStandardMaterial({ color: 0x16a34a, side: THREE.DoubleSide })
          );
          flag.position.set(bx - 7.8, 8.2, bz + 8);
          outdoorGroup.add(flag);
          break;
        }
        case 'yaba': {
          addBox(bx - 5, bz - 4, 10, 10, 40, getWindowMat(0x1e3a8a), { windows: true });
          addBox(bx + 5, bz - 2, 10, 12, 28, getWindowMat(0x0369a1), { windows: true });
          const s = addSign('SILICON TECH CAMPUS', '#1e1b4b', '#a5b4fc', bx + 5, 11, bz + 4.08, 9.5);
          dynamicSigns.set('yaba', { mesh: s, bg: '#1e1b4b', fg: '#a5b4fc' });
          addEntrancePortal('yaba', bx, bz + 4.0, d.x, d.z, d.color);
          break;
        }
        case 'quilox': {
          addBox(bx, bz - 3, 20, 16, 12.5, new THREE.MeshPhysicalMaterial({ color: 0x09090b, metalness: 0.85, roughness: 0.15, clearcoat: 1 }));
          addBox(bx, bz - 3, 20.4, 16.4, 0.5, glowMat(0xd946ef), { y: 11.2, collide: false });
          addBox(bx, bz - 3, 20.4, 16.4, 0.5, glowMat(0x06b6d4), { y: 6.2, collide: false });
          const s = addSign('CLUB QUILOX VIP', '#000000', '#f0abfc', bx, 8.6, bz + 5.25, 10.5, 1.6);
          dynamicSigns.set('quilox', { mesh: s, bg: '#000000', fg: '#f0abfc' });
          addEntrancePortal('quilox', bx, bz + 5.0, d.x, d.z, d.color);
          const beamMat = new THREE.MeshBasicMaterial({
            color: 0xe879f9,
            transparent: true,
            opacity: 0.13,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          for (const sx of [-6, 6]) {
            const beam = new THREE.Mesh(new THREE.ConeGeometry(3, 60, 16, 1, true), beamMat);
            beam.geometry.translate(0, -30, 0);
            const pivot = new THREE.Group();
            pivot.position.set(bx + sx, 12.5, bz - 3);
            beam.rotation.x = Math.PI;
            pivot.add(beam);
            outdoorGroup.add(pivot);
            beams.push(beam);
          }
          break;
        }
        case 'computervillage': {
          addBox(bx, bz - 4, 22, 13, 9.5, getWindowMat(0x991b1b), { windows: true });
          const s = addSign('COMPUTER VILLAGE TECH', '#7f1d1d', '#fed7aa', bx, 7.4, bz + 2.58, 12.5);
          dynamicSigns.set('computervillage', { mesh: s, bg: '#7f1d1d', fg: '#fed7aa' });
          addEntrancePortal('computervillage', bx, bz + 2.5, d.x, d.z, d.color);
          break;
        }
        case 'gas': {
          addBox(bx, bz - 7, 14, 7, 5.2, getWindowMat(0xf5f5f4), { windows: true });
          const s = addSign('NNPC • NEPA • SOLAR', '#b45309', '#ffffff', bx, 4.1, bz - 3.42, 9);
          dynamicSigns.set('gas', { mesh: s, bg: '#b45309', fg: '#ffffff' });
          addEntrancePortal('gas', bx, bz - 3.4, d.x, d.z, d.color);
          const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.65, 10),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xffffff, emissiveIntensity: 0.2 })
          );
          canopy.position.set(bx, 5.4, bz + 3.5);
          canopy.castShadow = true;
          outdoorGroup.add(canopy);
          addBox(bx, bz + 8.55, 18, 0.12, 0.6, glowMat(0xf59e0b), { y: 5.1, collide: false });
          for (const px of [-8, 8])
            for (const pz of [-1, 8])
              addBox(bx + px, bz + pz, 0.5, 0.5, 5.1, sidewalkMat, { cast: false });
          for (const px of [-5, 5])
            addBox(bx + px, bz + 3.5, 0.7, 1.2, 1.6, new THREE.MeshStandardMaterial({ color: 0xdc2626 }), {
              y: 0.12,
            });
          break;
        }
        case 'lekki': {
          addBox(bx, bz - 3, 20, 14, 9.5, getWindowMat(0xf8fafc), { windows: true });
          addBox(bx, bz - 5, 14, 9, 4.5, getWindowMat(0xe2e8f0), { y: 9.5, windows: true, collide: false });
          const s = addSign('THE PALMS MALL & SOLAR', '#0f172a', '#67e8f9', bx, 6.8, bz + 4.08, 11.5);
          dynamicSigns.set('lekki', { mesh: s, bg: '#0f172a', fg: '#67e8f9' });
          addEntrancePortal('lekki', bx, bz + 4.0, d.x, d.z, d.color);
          break;
        }
        case 'clothing': {
          addBox(bx, bz - 3, 16, 14, 7.5, getWindowMat(0xfbcfe8), { windows: true });
          const s = addSign('SUBURBAN BOUTIQUE', '#831843', '#fbcfe8', bx, 5.8, bz + 4.08, 9.5);
          dynamicSigns.set('clothing', { mesh: s, bg: '#831843', fg: '#fbcfe8' });
          addEntrancePortal('clothing', bx, bz + 4.0, d.x, d.z, d.color);
          break;
        }
        case 'lagoon': {
          const plankMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
          const pier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 22), plankMat);
          pier.position.set(0, 0.15, -WORLD_HALF - 10);
          pier.receiveShadow = true;
          outdoorGroup.add(pier);
          addBox(0, bz + 5, 14, 8, 4.8, getWindowMat(0x0e7490), { windows: true });
          const s = addSign('LAGOON & DANFO TERMINAL', '#facc15', '#0a0a0a', 0, 3.9, bz + 9.08, 9.5, 0.7);
          dynamicSigns.set('lagoon', { mesh: s, bg: '#facc15', fg: '#0a0a0a' });
          addEntrancePortal('lagoon', 0, bz + 9.0, d.x, d.z, d.color);
          break;
        }
      }
    }

    // ---------- Google Maps City-Specific 3D Landscapes ----------
    const lagosLandscapeGroup = new THREE.Group();
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const pylonLeft = new THREE.Mesh(new THREE.BoxGeometry(1.3, 30, 1.3), pylonMat);
    pylonLeft.position.set(54, 15, 0);
    const pylonRight = new THREE.Mesh(new THREE.BoxGeometry(1.3, 30, 1.3), pylonMat);
    pylonRight.position.set(66, 15, 0);
    const pylonCross = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.5, 1.5), pylonMat);
    pylonCross.position.set(60, 24, 0);
    lagosLandscapeGroup.add(pylonLeft, pylonRight, pylonCross);
    outdoorGroup.add(lagosLandscapeGroup);

    const abujaLandscapeGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9, flatShading: true });
    const asoRock = new THREE.Mesh(new THREE.ConeGeometry(28, 54, 10), rockMat);
    asoRock.position.set(52, 25, 96);
    asoRock.scale.set(1.35, 1, 0.75);
    const zumaRock = new THREE.Mesh(new THREE.ConeGeometry(24, 48, 9), rockMat);
    zumaRock.position.set(-52, 22, 96);
    zumaRock.scale.set(1.25, 1, 0.7);
    const goldDomeMat = new THREE.MeshPhysicalMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
    });
    const domeBase = new THREE.Mesh(
      new THREE.BoxGeometry(14, 9, 14),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
    );
    domeBase.position.set(0, 4.5, 86);
    const goldenDome = new THREE.Mesh(new THREE.SphereGeometry(6.5, 22, 16), goldDomeMat);
    goldenDome.position.set(0, 10.5, 86);
    abujaLandscapeGroup.add(asoRock, zumaRock, domeBase, goldenDome);
    for (const [mx, mz] of [
      [-8, 79],
      [8, 79],
      [-8, 93],
      [8, 93],
    ] as [number, number][]) {
      const minaret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.85, 22, 10),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
      );
      minaret.position.set(mx, 11, mz);
      abujaLandscapeGroup.add(minaret);
    }
    abujaLandscapeGroup.visible = false;
    outdoorGroup.add(abujaLandscapeGroup);

    // ---------- Street Lamps ----------
    const lampSpots: [number, number][] = [];
    for (const r of ROAD_LINES) {
      for (let t = -WORLD_HALF + 8; t < WORLD_HALF; t += 18) {
        if (ROAD_LINES.some((q) => Math.abs(q - t) < 7)) continue;
        lampSpots.push([r + 6, t], [r - 6, t], [t, r + 6], [t, r - 6]);
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 6, 8);
    poleGeo.translate(0, 3, 0);
    const poles = new THREE.InstancedMesh(
      poleGeo,
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.6 }),
      lampSpots.length
    );
    const lampHeadMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfde68a,
      emissiveIntensity: 0,
    });
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 10, 8), lampHeadMat, lampSpots.length);
    lampSpots.forEach(([x, z], i) => {
      tmp.position.set(x, 0.12, z);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      poles.setMatrixAt(i, tmp.matrix);
      tmp.position.set(x, 6.1, z);
      tmp.updateMatrix();
      heads.setMatrixAt(i, tmp.matrix);
    });
    outdoorGroup.add(poles, heads);

    const lampLights: THREE.PointLight[] = [];
    for (const [x, z] of [
      [0, 16],
      [40, 16],
      [-40, 16],
      [0, -24],
      [40, -24],
      [0, 50],
      [77.5, 50],
      [-77.5, 50],
    ] as [number, number][]) {
      const pl = new THREE.PointLight(0xffd59a, 0, 24, 1.5);
      pl.position.set(x, 5.5, z);
      outdoorGroup.add(pl);
      lampLights.push(pl);
    }

    // ---------- Multi-Frond Tropical Palm Trees ----------
    const treeSpots: [number, number][] = [];
    for (let x = -84; x <= 84; x += 12) treeSpots.push([x, -84]);
    for (let x = -80; x <= 80; x += 16) treeSpots.push([x, -72]);
    treeSpots.push([30, 48], [30, 52], [50, 46], [68, 48], [86, 48], [-10, 8], [10, 8]);
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, side: THREE.DoubleSide });
    for (const [tx, tz] of treeSpots) {
      const treeG = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 6.2, 8), palmTrunkMat);
      trunk.position.y = 3.1;
      trunk.castShadow = true;
      treeG.add(trunk);
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.8, 5), palmFrondMat);
        frond.position.y = 6.15;
        frond.rotation.z = 1.15;
        const fPivot = new THREE.Group();
        fPivot.rotation.y = (f * Math.PI * 2) / 6;
        fPivot.add(frond);
        treeG.add(fPivot);
      }
      treeG.position.set(tx, 0.12, tz);
      outdoorGroup.add(treeG);
    }

    // ---------- District Entrance Markers & Floating Badges ----------
    const markerRings: THREE.Mesh[] = [];
    const markerIcons: THREE.Sprite[] = [];
    for (const d of DISTRICTS) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.25, 0.9, 28, 1, true),
        new THREE.MeshBasicMaterial({
          color: d.color,
          transparent: true,
          opacity: 0.42,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      ring.position.set(d.x, 0.55, d.z);
      outdoorGroup.add(ring);
      markerRings.push(ring);

      const icon = iconSprite(d.blipIcon, d.name, d.color);
      icon.position.set(d.x, 2.75, d.z);
      outdoorGroup.add(icon);
      markerIcons.push(icon);
    }
    for (const a of ATM_SPOTS) {
      const atm = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.7, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x166534, emissive: 0x22c55e, emissiveIntensity: 0.45 })
      );
      atm.position.set(a.x, 0.97, a.z - 0.6);
      outdoorGroup.add(atm);
    }

    // ---------- Mission & Waypoint Markers + Realistic 3D Job Scene Actors ----------
    const missionGroup = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const missionBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 24, 1, true), beamMat);
    missionBeam.position.y = 35;
    const missionRing = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.4, 40),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    missionRing.rotation.x = -Math.PI / 2;
    missionRing.position.y = 0.2;
    const chevron = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1, 4),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    chevron.rotation.x = Math.PI;
    missionGroup.add(missionBeam, missionRing, chevron);

    // 3D Job Actors attached to active mission sites
    const missionCustomerNpc = buildHumanoid({
      shirt: '#0ea5e9',
      pants: '#1e293b',
      skin: '#6d4023',
      hat: 'sunglasses',
    });
    missionCustomerNpc.root.position.set(1.6, 0, 1.2);
    missionGroup.add(missionCustomerNpc.root);

    const missionPatientNpc = buildHumanoid({
      shirt: '#f8fafc',
      pants: '#334155',
      skin: '#8d5524',
      hat: 'none',
    });
    missionPatientNpc.root.position.set(0.8, 0.05, 0.6);
    missionGroup.add(missionPatientNpc.root);

    const missionSuspectNpc = buildHumanoid({
      shirt: '#18181b',
      pants: '#09090b',
      skin: '#4a2c17',
      hat: 'cap',
    });
    missionSuspectNpc.root.position.set(-1.5, 0, 1.0);
    missionGroup.add(missionSuspectNpc.root);

    const missionBrokenCar = buildCar('sedan', '#475569', false);
    missionBrokenCar.group.position.set(2.2, 0, -0.5);
    missionBrokenCar.group.rotation.y = 0.35;
    missionGroup.add(missionBrokenCar.group);

    const missionSkyRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.2, 0.36, 14, 40),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.9,
      })
    );
    missionSkyRing.position.set(0, 42, 0);
    missionGroup.add(missionSkyRing);

    missionGroup.visible = false;
    outdoorGroup.add(missionGroup);

    // ---------- 3 Live Ambient Sky Airliners & Executive Jets Overhead ----------
    const ambientPlanes: AmbientSkyPlane[] = [
      {
        plane: buildPlane('#f8fafc', '#0284c7', 1.38, false),
        mode: 'linear',
        y: 48,
        speed: 22,
        phase: 0,
        radius: 0,
        dirX: 0.78,
        dirZ: 0.62,
        x: -140,
        z: -110,
      },
      {
        plane: buildPlane('#f8fafc', '#16a34a', 1.18, false),
        mode: 'orbit',
        y: 66,
        speed: 0.19,
        phase: 1.4,
        radius: 108,
        dirX: 0,
        dirZ: 0,
        x: 0,
        z: 0,
      },
      {
        plane: buildPlane('#0f172a', '#f59e0b', 1.26, false),
        mode: 'linear',
        y: 84,
        speed: 27,
        phase: 2.8,
        radius: 0,
        dirX: -0.92,
        dirZ: 0.39,
        x: 150,
        z: -60,
      },
    ];
    for (const ap of ambientPlanes) {
      ap.plane.gearGroup.visible = false;
      ap.plane.contrailGroup.visible = true;
      ap.plane.group.rotation.order = 'YXZ';
      outdoorGroup.add(ap.plane.group);
    }

    const waypointMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 30, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    waypointMarker.visible = false;
    outdoorGroup.add(waypointMarker);

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
    const rain = new THREE.LineSegments(
      rainGeo,
      new THREE.LineBasicMaterial({ color: 0x9fb4d9, transparent: true, opacity: 0.45 })
    );
    rain.frustumCulled = false;
    rain.visible = false;
    outdoorGroup.add(rain);

    // ---------- Playable 3D Character (Added directly to scene so it works indoors & outdoors!) ----------
    const P0 = propsRef.current;
    const player = buildHumanoid({
      shirt: P0.outfit.color,
      pants: P0.outfit.pants ?? '#1e293b',
      skin: P0.outfit.skin ?? '#6d4023',
      hat: P0.outfit.hat,
      castShadow: true,
    });
    player.root.rotation.order = 'YXZ';
    scene.add(player.root);
    const pState = {
      x: 77.5, // Start right outside Your Residence compound so player sees their house immediately!
      z: 52.5,
      y: 0.12,
      vy: 0,
      heading: Math.PI,
      grounded: true,
      speed: 0,
      ejectT: 0,
    };

    let meLabel: { sprite: THREE.Sprite; until: number } | null = null;

    // ---------- Walkable 3D Building Interior State ----------
    let activeInterior: BuiltInterior | null = null;
    let outdoorReturnPos = { x: 77.5, z: 52.5, heading: 0 };
    let lastSignCity: CityId = 'lagos';

    const disposeInterior = (intr: BuiltInterior) => {
      scene.remove(intr.group);
      intr.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    };

    // ---------- Drivable Vehicles, Motorcycles & Private Jets ----------
    const parkSpots: Record<string, [number, number, number]> = {
      'veh-gwagon': [72, 56.5, Math.PI / 2], // Outside Your Residence!
      'veh-okada': [66, 56.5, Math.PI / 2], // Boxer 250cc Motorcycle right outside Your Residence!
      'veh-ducati': [35, -23.5, -Math.PI / 2], // Ducati Panigale V4S Superbike at VI / Quilox!
      'veh-super': [7, 16.5, -Math.PI / 2],
      'veh-danfo': [-8, 23.5, Math.PI / 2],
      'veh-police': [8, -23.5, Math.PI / 2],
      'veh-taxi': [-110, 48.5, Math.PI / 2], // Airport Shuttle Taxi waiting outside Airport Causeway!
      'plane-cessna': [-162, -15, -Math.PI / 2], // Parked in Hangar 01 on the Dedicated Airport Landmass!
      'plane-challenger': [-162, -55, -Math.PI / 2], // Parked in Hangar 02 on the Dedicated Airport Landmass!
      'plane-gulfstream': [-212, -52, 0], // Lined up on Runway 18L/36R ready for immediate takeoff!
    };
    const cars: DrivableCar[] = VEHICLES_CATALOG.map((v, i) => {
      const [x, z, h] = parkSpots[v.id] ?? [i * 6, 23.5, 0];
      const model = buildCar(v.category, v.color, true);
      model.group.rotation.order = 'YXZ';
      model.group.position.set(x, 0, z);
      model.group.rotation.y = h;
      outdoorGroup.add(model.group);
      return {
        id: v.id,
        name: v.name,
        category: v.category,
        color: v.color,
        vmax: v.topSpeedKmh / SPEED_TO_KMH,
        model,
        x,
        y: 0,
        z,
        vy: 0,
        heading: h,
        pitch: 0,
        roll: 0,
        vx: 0,
        vz: 0,
        steer: 0,
        fuel: v.fuel,
        engine: v.condition,
      };
    });
    let activeCar: DrivableCar | null = null;
    const carFlags = { seatbelt: false, lights: true, siren: false };
    const headlight = new THREE.SpotLight(0xfff7d6, 0, 48, 0.6, 0.5, 1.2);
    headlight.position.set(0, 1, 2.2);
    headlight.target.position.set(0, 0, 12);

    // ---------- AI Traffic (Cars + Motorcycles with 3D Riders!) ----------
    const traffic: TrafficCar[] = [];
    const trafficBlocks: [number, number][] = [];
    for (const bx of INNER_BLOCKS) for (const bz of INNER_BLOCKS) trafficBlocks.push([bx, bz]);
    for (let i = 0; i < 12; i++) {
      const [bx, bz] = trafficBlocks[i % trafficBlocks.length];
      const cat = pick<VehicleCategory>([
        'sedan',
        'sedan',
        'suv',
        'transit',
        'super',
        'motorcycle',
        'motorcycle',
      ]);
      const col =
        cat === 'transit'
          ? '#facc15'
          : cat === 'motorcycle'
          ? pick(['#f97316', '#dc2626', '#18181b', '#2563eb'])
          : pick(TRAFFIC_COLORS);
      const model = buildCar(cat, col, false);
      if (cat === 'motorcycle') {
        const aiRider = buildHumanoid({
          shirt: pick(SHIRTS),
          pants: '#18181b',
          skin: pick(SKINS),
          hat: 'cap',
        });
        aiRider.root.position.set(0, 0.14, -0.22);
        aiRider.spine.rotation.x = 0.28;
        aiRider.lShoulder.rotation.x = -0.95;
        aiRider.rShoulder.rotation.x = -0.95;
        aiRider.lHip.rotation.x = -0.7;
        aiRider.rHip.rotation.x = -0.7;
        model.group.add(aiRider.root);
      }
      outdoorGroup.add(model.group);
      traffic.push({
        model,
        loop: blockLoop(bx, bz, 17.5),
        s: Math.random() * 140,
        speed: 0,
        maxSpeed: cat === 'motorcycle' ? 10 + Math.random() * 4 : 7 + Math.random() * 4,
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
      const h = buildHumanoid({
        shirt: pick(SHIRTS),
        pants: pick(PANTS),
        skin: pick(SKINS),
        hat: pick(['none', 'none', 'cap', 'sunglasses'] as const),
      });
      outdoorGroup.add(h.root);
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
      const h = buildHumanoid({
        shirt: pick(SHIRTS),
        pants: pick(PANTS),
        skin: pick(SKINS),
        hat: pick(['none', 'cap', 'sunglasses'] as const),
      });
      h.root.position.set(x, 0.12, z);
      h.root.rotation.y = heading;
      outdoorGroup.add(h.root);
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
    // Additional Outdoor Workers across Banks, Airport Tarmac, Tech Hub & Gas Station
    placeNpc(-74, 48, 0, 'salute'); // CBN Bullion Guard
    placeNpc(-81, 48, 0, 'salute'); // CBN Bullion Guard
    placeNpc(36, 68, Math.PI, 'salute'); // GTBank Security Guard
    placeNpc(44, 68, Math.PI, 'salute'); // GTBank Security Guard
    placeNpc(-116, 36, Math.PI / 2, 'wave'); // Airport Terminal Valet Worker
    placeNpc(-148, 24, -Math.PI / 2, 'wave'); // Airport Tarmac Ground Marshal
    placeNpc(-172, -15, -Math.PI / 2, 'idle'); // Hangar 01 Aircraft Engineer
    placeNpc(-172, -55, -Math.PI / 2, 'idle'); // Hangar 02 Aircraft Mechanic
    placeNpc(74, 8, 0, 'wave'); // iStore Outdoor Promoter
    placeNpc(-3, 44, 0, 'idle'); // NNPC Fuel Attendant

    // ---------- Police AI ----------
    const police: PoliceUnit[] = [];
    for (let i = 0; i < 3; i++) {
      const model = buildCar('police', '#0f172a', false);
      model.group.visible = false;
      outdoorGroup.add(model.group);
      police.push({ model, active: false, x: 0, z: 0, heading: 0, speed: 0 });
    }
    let bustTimer = 0;
    let escapeTimer = 0;
    let sirenCd = 0;

    // ---------- Collision Helpers ----------
    const blocked = (x: number, z: number, r: number) => {
      const activeList = activeInterior ? activeInterior.colliders : colliders;
      for (const b of activeList) if (circleHitsBox(x, z, r, b)) return true;
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
      if (activeInterior) return;
      if (activeCar) {
        const car = activeCar;
        if (car.category === 'plane' && car.y > 7) {
          // Prevent accidental mid-air bailout; descend below 25ft to disembark
          audioEngine.playSeatbeltChime();
          return;
        }
        const offsetDist = car.category === 'plane' ? 3.8 : 2.2;
        const left = { x: Math.cos(car.heading), z: -Math.sin(car.heading) };
        let ex = car.x + left.x * offsetDist;
        let ez = car.z + left.z * offsetDist;
        if (blocked(ex, ez, 0.4)) {
          ex = car.x - left.x * offsetDist;
          ez = car.z - left.z * offsetDist;
        }
        pState.x = ex;
        pState.z = ez;
        pState.y = groundY(ex, ez);
        pState.vy = 0;
        pState.grounded = true;
        pState.heading = car.heading;
        player.root.rotation.set(0, car.heading, 0);
        car.y = groundY(car.x, car.z);
        car.vy = 0;
        car.pitch = 0;
        car.roll = 0;
        car.model.group.remove(headlight, headlight.target);
        activeCar = null;
        carFlags.seatbelt = false;
        carFlags.siren = false;
        audioEngine.setEngine(false, 0);
        return;
      }
      let best: DrivableCar | null = null;
      let bd = 7.0;
      for (const c of cars) {
        const maxEnterDist = c.category === 'plane' ? 6.8 : 4.2;
        const dd = Math.hypot(c.x - pState.x, c.z - pState.z);
        if (dd < maxEnterDist && dd < bd) {
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

    const enterInteriorRoom = (districtId: LagosDistrict) => {
      if (activeCar) enterOrExit();
      setDoorFade(true);
      audioEngine.playClick();

      setTimeout(() => {
        const distInfo = getDistrictsForCity(propsRef.current.activeCity || 'lagos').find(
          (item) => item.id === districtId
        );
        if (activeInterior) {
          disposeInterior(activeInterior);
        }
        outdoorReturnPos = {
          x: distInfo ? distInfo.x : pState.x,
          z: distInfo ? distInfo.z + 1.2 : pState.z,
          heading: 0,
        };

        outdoorGroup.visible = false;
        activeInterior = buildBuildingInterior(districtId, propsRef.current.activeCity || 'lagos');
        scene.add(activeInterior.group);

        pState.x = activeInterior.spawnX;
        pState.z = activeInterior.spawnZ;
        pState.y = 0.02;
        pState.vy = 0;
        pState.grounded = true;
        pState.heading = activeInterior.spawnHeading;
        cam.yaw = Math.PI;
        cam.pitch = 0.34;

        setTimeout(() => setDoorFade(false), 120);
      }, 110);
    };

    const exitInteriorRoom = () => {
      if (!activeInterior) return;
      setDoorFade(true);
      audioEngine.playClick();

      setTimeout(() => {
        if (activeInterior) {
          disposeInterior(activeInterior);
          activeInterior = null;
        }
        outdoorGroup.visible = true;
        pState.x = outdoorReturnPos.x;
        pState.z = outdoorReturnPos.z;
        pState.y = groundY(outdoorReturnPos.x, outdoorReturnPos.z);
        pState.vy = 0;
        pState.grounded = true;
        pState.heading = outdoorReturnPos.heading;
        cam.yaw = 0;
        cam.pitch = 0.28;

        setTimeout(() => setDoorFade(false), 120);
      }, 110);
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
      // 1. Inside a 3D Building Interior: check all 3D furniture & service stations!
      if (activeInterior) {
        let bestStation: { id: string; name: string; actionLabel: string } | null = null;
        let bestDist = Infinity;
        for (const st of activeInterior.stations) {
          const rad = st.radius ?? 2.35;
          const dist = Math.hypot(pState.x - st.x, pState.z - st.z);
          if (dist < rad && dist < bestDist) {
            bestDist = dist;
            bestStation = { id: st.id, name: st.name, actionLabel: st.actionLabel };
          }
        }
        return bestStation;
      }

      // 2. Outdoors in vehicle
      if (activeCar) {
        if (Math.hypot(pState.x - 0, pState.z - 43) < 11) {
          return {
            id: 'bennys',
            name: 'NNPC Petrol & Benny’s Bay',
            actionLabel: 'Refuel & Tune Vehicle',
          };
        }
        // Allow entering buildings even when pulling up curbside in a car (< 6.5m)!
        const activeDistricts = getDistrictsForCity(propsRef.current.activeCity || 'lagos');
        for (const d of activeDistricts) {
          if (Math.hypot(pState.x - d.x, pState.z - d.z) < 6.5 && pState.speed < 2.5) {
            return {
              id: `enter:${d.id}`,
              name: d.name,
              actionLabel: `Park & ${d.actionLabel}`,
            };
          }
        }
        return null;
      }

      // 3. Outdoors on foot — check both sidewalk marker AND 3D glass front door!
      const activeDistricts = getDistrictsForCity(propsRef.current.activeCity || 'lagos');
      for (const d of activeDistricts) {
        const door = doorPositions.get(d.id);
        const nearMarker = Math.hypot(pState.x - d.x, pState.z - d.z) < 3.8;
        const nearDoor = door ? Math.hypot(pState.x - door.x, pState.z - door.z) < 3.6 : false;
        if (nearMarker || nearDoor) {
          return { id: `enter:${d.id}`, name: d.name, actionLabel: d.actionLabel };
        }
      }
      for (const a of ATM_SPOTS) {
        if (Math.hypot(pState.x - a.x, pState.z - a.z) < 2.0) {
          return { id: 'atm', name: 'ATM Kiosk', actionLabel: 'Use Bank ATM' };
        }
      }
      for (const ped of peds) {
        if (ped.downT <= 0 && Math.hypot(pState.x - ped.x, pState.z - ped.z) < 2.4) {
          return { id: ped.id, name: ped.name, actionLabel: 'Talk / Interact' };
        }
      }
      return null;
    };

    const triggerInteraction = (it: { id: string; name: string; actionLabel: string }) => {
      const p = propsRef.current;
      if (it.id.startsWith('enter:')) {
        const distId = it.id.slice(6) as LagosDistrict;
        enterInteriorRoom(distId);
        return;
      }
      if (it.id === 'int:exit') {
        exitInteriorRoom();
        return;
      }
      if (it.id === 'refuel' && activeCar) {
        const missing = 100 - activeCar.fuel;
        if (missing < 1) return;
        if (p.onRefuelRequest(missing)) activeCar.fuel = 100;
        return;
      }
      p.onInteract(it.id);
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

      if (e.key === 'Backspace' && activeInterior) {
        e.preventDefault();
        exitInteriorRoom();
        return;
      }

      if (k === 'f') enterOrExit();
      else if (k === 'b') vehicleAction('seatbelt');
      else if (k === 'h') vehicleAction('lights');
      else if (k === 'q') vehicleAction('siren');
      else if (k === 'e') {
        const it = nearestInteractable();
        if (it) triggerInteraction(it);
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
      cam.dist = Math.max(2.6, Math.min(16, cam.dist + e.deltaY * 0.006));
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
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      applyGraphics(propsRef.current.graphicsSettings);
    };
    window.addEventListener('resize', onResize);

    // ---------- External API ----------
    apiRef.current = {
      teleport: (x, z) => {
        if (activeInterior) {
          disposeInterior(activeInterior);
          activeInterior = null;
          outdoorGroup.visible = true;
        }
        if (activeCar) {
          activeCar.x = x;
          activeCar.z = z + 3;
          activeCar.y = groundY(x, z + 3);
          activeCar.vy = 0;
          activeCar.vx = activeCar.vz = 0;
        }
        pState.x = x;
        pState.z = z;
        pState.y = groundY(x, z);
        pState.vy = 0;
      },
      spawnVehicle: (id) => {
        if (activeInterior) {
          disposeInterior(activeInterior);
          activeInterior = null;
          outdoorGroup.visible = true;
          pState.x = outdoorReturnPos.x;
          pState.z = outdoorReturnPos.z;
        }
        const car = cars.find((c) => c.id === id);
        if (!car) return;
        if (activeCar && activeCar !== car) enterOrExit();
        const rx = nearestRoad(pState.x);
        const rz = nearestRoad(pState.z);
        const useX = Math.abs(rx - pState.x) < Math.abs(rz - pState.z);
        if (car.category === 'plane') {
          // Place directly on the Dedicated Airport Runway 18L/36R if near Airport, or wide avenue
          if (pState.x < -88) {
            car.x = -212;
            car.z = -58;
            car.heading = 0;
          } else {
            car.x = useX ? rx : pState.x;
            car.z = useX ? pState.z : rz;
            car.heading = useX ? 0 : Math.PI / 2;
          }
          car.y = groundY(car.x, car.z);
          car.vy = 0;
          car.pitch = 0;
          car.roll = 0;
          if (car.model.gearGroup) car.model.gearGroup.visible = true;
        } else {
          car.x = useX ? rx + 2.5 : pState.x;
          car.z = useX ? pState.z : rz + 2.5;
          car.heading = useX ? 0 : Math.PI / 2;
          car.y = groundY(car.x, car.z);
          car.vy = 0;
        }
        car.vx = car.vz = 0;
        car.fuel = Math.max(car.fuel, 85);
        if (activeCar !== car) {
          activeCar = car;
          car.model.group.add(headlight, headlight.target);
        }
        cam.yaw = car.heading;
        audioEngine.playDanfoHorn();
      },
      vehicleAction,
      tuneVehicle: (opts) => {
        const targetCar =
          activeCar ?? cars.find((c) => Math.hypot(c.x - pState.x, c.z - pState.z) < 8) ?? cars[0];
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
        applyOutfit(player, {
          shirt: o.color,
          pants: o.pants ?? '#1e293b',
          skin: o.skin ?? '#6d4023',
          hat: o.hat,
        });
      },
      enterInterior: enterInteriorRoom,
      exitInterior: exitInteriorRoom,
      applyGraphics,
    };

    // ---------- Main Loop ----------
    const clock = new THREE.Clock();
    let raf = 0;
    let hudAcc = 0;
    let lastMissionReached = '';
    let waypointLatch = '';
    const raycaster = new THREE.Raycaster();
    const tmpV = new THREE.Vector3();
    const tmpV2 = new THREE.Vector3();
    const daySky = new THREE.Color('#7db4f0');
    const duskSky = new THREE.Color('#f59e6b');
    const nightSky = new THREE.Color('#060a16');
    const rainSky = new THREE.Color('#3b4252');
    const indoorBg = new THREE.Color('#090d16');
    const fogTarget = new THREE.Color();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const p = propsRef.current;
      const locked = p.movementLocked || p.isDowned;
      const activeCity = p.activeCity || 'lagos';

      // Dynamically update 3D building signs & badges when flying between Lagos and Abuja!
      if (activeCity !== lastSignCity) {
        lastSignCity = activeCity;
        const cityDists = getDistrictsForCity(activeCity);
        cityDists.forEach((cd, idx) => {
          const signEntry = dynamicSigns.get(cd.id);
          if (signEntry) {
            const shortTitle = cd.name.split(' (')[0].toUpperCase().slice(0, 22);
            const newTex = textTexture(shortTitle, signEntry.bg, signEntry.fg);
            const mat = signEntry.mesh.material as THREE.MeshStandardMaterial;
            if (mat.map) mat.map.dispose();
            mat.map = newTex;
            mat.emissiveMap = newTex;
            mat.needsUpdate = true;
          }
          if (markerIcons[idx]) {
            const newSprite = iconSprite(cd.blipIcon, cd.name, cd.color);
            const oldMat = markerIcons[idx].material as THREE.SpriteMaterial;
            if (oldMat.map) oldMat.map.dispose();
            oldMat.map = (newSprite.material as THREE.SpriteMaterial).map;
            oldMat.needsUpdate = true;
          }
        });
      }

      // ======== Atmosphere, Lighting & Indoor vs Outdoor Visibility ========
      const fog = scene.fog as THREE.FogExp2;
      const tod = p.timeOfDay;
      const sunAng = ((tod - 6) / 12) * Math.PI;
      const elev = Math.sin(sunAng);
      const day = THREE.MathUtils.clamp(elev * 1.6 + 0.15, 0, 1);
      const night = 1 - day;

      if (activeInterior) {
        // Tone down exposure & bloom indoors so building interiors look rich, grounded, and never over-bright!
        renderer.toneMappingExposure = 0.75;
        bloomPass.strength = 0.11;
        skyColor.lerp(indoorBg, Math.min(1, dt * 8));
        fog.color.copy(skyColor);
        fog.density = 0.0015;
        // Animate indoor NPCs, panning security cameras & floating station markers
        for (const n of activeInterior.npcs) {
          animateHumanoid(n.h, n.state, 0, t + n.h.phase, dt);
        }
        activeInterior.securityCameras?.forEach((sc, idx) => {
          sc.rotation.y = Math.sin(t * 1.25 + idx * 1.7) * 0.65;
        });
        activeInterior.animatedRings.forEach((r, idx) => {
          r.scale.y = 1 + Math.sin(t * 3.2 + idx) * 0.16;
          activeInterior!.animatedSprites[idx].position.y = 2.35 + Math.sin(t * 2.4 + idx) * 0.1;
        });
      } else {
        renderer.toneMappingExposure = 1.04;
        bloomPass.strength = 0.28;
        // Cycle outdoor traffic signals (Green -> Amber -> Red) & pan outdoor CCTV cameras
        trafficLightSets.forEach((tls) => {
          const cycle = (t + tls.phaseOffset) % 14;
          const isGreen = cycle < 6.5;
          const isAmber = cycle >= 6.5 && cycle < 8.5;
          const isRed = cycle >= 8.5;
          tls.green.emissiveIntensity = isGreen ? 2.2 : 0.12;
          tls.amber.emissiveIntensity = isAmber ? 2.2 : 0.12;
          tls.red.emissiveIntensity = isRed ? 2.2 : 0.12;
        });
        outdoorSecurityCameras.forEach((camG, idx) => {
          camG.rotation.y = Math.sin(t * 1.1 + idx) * 0.55;
        });
        const dusk = THREE.MathUtils.clamp(1 - Math.abs(elev) * 4, 0, 1) * (elev > -0.25 ? 1 : 0);
        fogTarget.copy(nightSky).lerp(daySky, day).lerp(duskSky, dusk * 0.48);
        const wet = p.weather === 'rain' ? 1 : 0;
        const cloudy = p.weather === 'cloudy' ? 0.45 : p.weather === 'fog' ? 0.5 : wet * 0.65;
        fogTarget.lerp(rainSky, cloudy * day);
        skyColor.lerp(fogTarget, Math.min(1, dt * 2));
        fog.color.copy(skyColor);
        const fogDensity = p.weather === 'fog' ? 0.026 : p.weather === 'rain' ? 0.014 : 0.0065;
        fog.density += (fogDensity - fog.density) * Math.min(1, dt);

        hemi.intensity = 0.28 + day * 0.72 * (1 - cloudy * 0.4);
        sun.intensity = 0.12 + day * 1.8 * (1 - cloudy * 0.55);
        sun.color.setHSL(0.1, 0.55, 0.65 + day * 0.3);
        sun.position.set(
          pState.x + Math.cos(sunAng) * 70,
          18 + Math.max(0.15, elev) * 82,
          pState.z + 30
        );
        sun.target.position.set(pState.x, 0, pState.z);

        const power = p.isNepaActive ? 1 : 0.15;
        const isAbuja = activeCity === 'abuja';
        abujaLandscapeGroup.visible = isAbuja;
        lagosLandscapeGroup.visible = !isAbuja;

        windowMats.forEach((m) => (m.emissiveIntensity = night * 1.45 * power));
        lampHeadMat.emissiveIntensity = night * 2.5 * power;
        lampLights.forEach((l) => (l.intensity = night * 16 * power));
        signMats.forEach((m) => (m.emissiveIntensity = 0.35 + night * 0.95 * power));
        neonMats.forEach((m) => (m.emissiveIntensity = (0.45 + night * 1.8) * power));
        roadMat.roughness = 0.88 - wet * 0.58;
        roadMat.metalness = 0.08 + wet * 0.38;
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
      }

      // ======== Player / Vehicle Control ========
      const fwdIn = locked
        ? 0
        : (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
      const sideIn = locked
        ? 0
        : (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
      let isSprinting = false;

      if (activeCar && !activeInterior) {
        const car = activeCar;
        const isPlane = car.category === 'plane';
        const isMoto = car.category === 'motorcycle';

        if (isPlane) {
          // ---------------- 3D Aircraft Flight & Runway Taxi Physics ----------------
          player.root.visible = false;
          const climbIn = locked
            ? 0
            : (keys[' '] ? 1 : 0) - (keys['c'] || keys['control'] ? 1 : 0);
          const afterburner = !locked && keys['shift'] ? 1.24 : 1.0;
          const canFly = car.fuel > 0 && car.engine > 0;
          const f = { x: Math.sin(car.heading), z: Math.cos(car.heading) };
          let fwd = car.vx * f.x + car.vz * f.z;
          const maxSpd = car.vmax * afterburner;

          if (fwdIn > 0 && canFly) {
            fwd += TOP_SPEED_ACCEL.plane * afterburner * (1 - Math.max(0, fwd) / maxSpd) * dt;
          } else if (fwdIn < 0) {
            if (fwd > 1) fwd -= 22 * dt;
            else if (car.y < 1.2 && canFly) fwd = Math.max(-8, fwd - 10 * dt);
          } else {
            fwd *= Math.exp(-(car.y > 2 ? 0.14 : 0.38) * dt);
          }

          const speedRatio = Math.min(1, Math.abs(fwd) / car.vmax);
          const turnRate = -sideIn * (car.y > 2 ? 0.95 : 0.72 * Math.min(1, Math.abs(fwd) / 6));
          car.heading += turnRate * dt;
          car.steer += (-sideIn * 0.45 - car.steer) * Math.min(1, dt * 6);

          const nf = { x: Math.sin(car.heading), z: Math.cos(car.heading) };
          car.vx = nf.x * fwd;
          car.vz = nf.z * fwd;

          // Vertical Lift, Climb & Descent
          const gy = groundY(car.x, car.z);
          if (climbIn > 0 && fwd > 8.5 && canFly) {
            car.vy += (15 - car.vy) * Math.min(1, dt * 3.5);
          } else if (climbIn < 0) {
            car.vy += (-14 - car.vy) * Math.min(1, dt * 3.8);
          } else if (car.y > gy + 0.5) {
            // Level cruise trim if fast enough, gentle stall sink if slow
            const targetVy = fwd > 11 ? 0 : -6.5;
            car.vy += (targetVy - car.vy) * Math.min(1, dt * 3.0);
          } else {
            car.vy = 0;
          }

          car.y = Math.min(148, car.y + car.vy * dt);
          if (car.y <= gy) {
            car.y = gy;
            car.vy = 0;
          }

          const nx = car.x + car.vx * dt;
          const nz = car.z + car.vz * dt;
          if (car.y < 24 && blocked(nx, nz, 1.8)) {
            car.vx *= -0.25;
            car.vz *= -0.25;
            audioEngine.playCrash(0.45);
          } else {
            car.x = Math.max(-275, Math.min(WORLD_HALF + 85, nx));
            car.z = Math.max(-WORLD_HALF - 85, Math.min(WORLD_HALF + 85, nz));
          }

          if (car.fuel > 0 && Math.abs(fwd) > 0.5) {
            car.fuel = Math.max(0, car.fuel - dt * (0.09 + speedRatio * 0.22));
          }

          // Smooth Pitch & Bank Attitude
          const targetPitch = car.y > gy + 0.4 ? -climbIn * 0.28 - (car.vy * 0.012) : -Math.max(0, climbIn) * 0.12;
          const targetRoll = car.y > gy + 0.6 ? sideIn * 0.52 : sideIn * 0.05;
          car.pitch = THREE.MathUtils.lerp(car.pitch, targetPitch, Math.min(1, dt * 5));
          car.roll = THREE.MathUtils.lerp(car.roll, targetRoll, Math.min(1, dt * 5));

          car.model.group.position.set(car.x, car.y, car.z);
          car.model.group.rotation.set(car.pitch, car.heading, car.roll, 'YXZ');
          car.model.frontWheels.forEach((w) => (w.rotation.y = car.steer));
          if (car.y < gy + 1) {
            car.model.wheelMeshes.forEach((w) => (w.rotation.x += (fwd / 0.32) * dt));
          }
          if (car.model.gearGroup) car.model.gearGroup.visible = car.y < gy + 7.5;
          if (car.model.contrailGroup) car.model.contrailGroup.visible = car.y > 14 && fwd > 12;
          car.model.fanMeshes?.forEach((fan) => (fan.rotation.y += dt * (10 + speedRatio * 36)));
          if (car.model.strobeMat) {
            car.model.strobeMat.emissiveIntensity = Math.sin(t * 10) > 0.68 ? 4.5 : 0.25;
          }
          const isNight = night > 0.45;
          car.model.headMat.emissiveIntensity = carFlags.lights && isNight ? 2.8 : 0.8;
          headlight.intensity = carFlags.lights && isNight && car.y < 18 ? 65 : 0;
          audioEngine.setEngine(true, 22 + speedRatio * 78);

          pState.x = car.x;
          pState.y = car.y;
          pState.z = car.z;
          pState.heading = car.heading;
          pState.speed = Math.abs(fwd);
        } else {
          // ---------------- Ground Cars & 3D Motorcycles ----------------
          player.root.visible = isMoto;
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
          const steerTarget = -sideIn * (isMoto ? 0.68 : 0.6) * (1 - 0.52 * speedRatio);
          car.steer += (steerTarget - car.steer) * Math.min(1, dt * (isMoto ? 10 : 8));
          const yawRate = (fwd / (isMoto ? 2.15 : 2.7)) * Math.tan(car.steer) * (handbrake ? 1.6 : 1);
          car.heading += yawRate * dt;
          const grip = handbrake ? 1.2 : isMoto ? 10.5 : 8.5;
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
          const others: { x: number; z: number; push?: (dx: number, dz: number) => void }[] = [
            ...cars
              .filter((c) => c !== car && c.y < 3)
              .map((c) => ({
                x: c.x,
                z: c.z,
                push: (dx: number, dz: number) => {
                  c.x += dx;
                  c.z += dz;
                },
              })),
            ...traffic.map((c) => ({ x: c.x, z: c.z })),
            ...police.filter((u) => u.active).map((u) => ({ x: u.x, z: u.z })),
          ];
          const hitDist = isMoto ? 2.2 : 3.1;
          for (const o of others) {
            const dx = car.x - o.x;
            const dz = car.z - o.z;
            const dd = Math.hypot(dx, dz);
            if (dd < hitDist && dd > 0.001) {
              const pen = hitDist - dd;
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
            if (impact > (isMoto ? 12 : 15) && !carFlags.seatbelt) {
              const carRef = car;
              enterOrExit();
              pState.x = carRef.x + f.x * 3;
              pState.z = carRef.z + f.z * 3;
              if (blocked(pState.x, pState.z, 0.4)) {
                pState.x = carRef.x - f.x * 3;
                pState.z = carRef.z - f.z * 3;
              }
              pState.ejectT = 2.2;
              p.onDamage(
                Math.round(impact * 1.6),
                isMoto
                  ? 'You were thrown off your bike — strap your helmet [B]!'
                  : 'You flew through the windscreen — wear your seatbelt [B]!'
              );
            } else if (impact > 10) {
              p.onDamage(Math.round(impact * (carFlags.seatbelt ? 0.2 : 0.6)), 'Crash');
            }
          }

          const carSpeed = Math.hypot(car.vx, car.vz);
          if (activeCar && carSpeed > 5) {
            for (const ped of peds) {
              if (ped.downT <= 0 && Math.hypot(ped.x - car.x, ped.z - car.z) < 1.9) {
                ped.downT = 9;
                p.onCrime('Vehicular assault on a pedestrian');
              }
            }
          }

          if (car.fuel > 0 && Math.abs(fwd) > 0.5)
            car.fuel = Math.max(0, car.fuel - dt * (0.12 + speedRatio * 0.35));

          const gy = groundY(car.x, car.z);
          car.y = gy;
          car.model.group.position.set(car.x, gy, car.z);
          car.model.group.rotation.y = car.heading;
          const targetLean = isMoto
            ? -car.steer * (0.25 + speedRatio * 0.65)
            : -car.steer * speedRatio * 0.08;
          car.roll = THREE.MathUtils.lerp(car.roll, targetLean, isMoto ? 0.24 : 0.2);
          car.model.group.rotation.z = car.roll;
          car.model.frontWheels.forEach((w) => (w.rotation.y = car.steer));
          car.model.wheelMeshes.forEach((w) => (w.rotation.x += (fwd / 0.35) * dt));

          // Pose 3D Player Character astride the Motorcycle leaning into corners!
          if (isMoto) {
            player.root.position.set(car.x - nf.x * 0.22, gy + 0.14, car.z - nf.z * 0.22);
            player.root.rotation.set(0, car.heading, car.roll, 'YXZ');
            player.hips.position.y = 0.68;
            player.spine.rotation.set(0.34, 0, 0);
            player.head.rotation.set(-0.22, -car.steer * 0.4, 0);
            player.lShoulder.rotation.set(-0.98, 0, 0.14);
            player.rShoulder.rotation.set(-0.98, 0, -0.14);
            player.lHip.rotation.set(-0.72, 0, 0.18);
            player.rHip.rotation.set(-0.72, 0, -0.18);
            player.phone.visible = false;
          }

          const isNight = night > 0.45;
          car.model.tailMat.emissiveIntensity = braking ? 3 : carFlags.lights && isNight ? 1.1 : 0.45;
          car.model.headMat.emissiveIntensity = carFlags.lights && isNight ? 2.6 : 0.55;
          headlight.intensity = carFlags.lights && isNight ? 65 : 0;
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
          pState.y = gy;
          pState.z = car.z;
          pState.heading = car.heading;
          pState.speed = Math.abs(fwd);
        }
      } else {
        // ---------------- On Foot (Outdoors OR Inside 3D Building!) ----------------
        player.root.visible = true;
        player.root.rotation.x = 0;
        player.root.rotation.z = 0;
        if (pState.ejectT > 0) pState.ejectT -= dt;
        const moving = (fwdIn !== 0 || sideIn !== 0) && pState.ejectT <= 0;
        const canSprint = keys['shift'] && p.energy > 3;
        isSprinting = moving && !!canSprint && fwdIn >= 0;
        const spd = activeInterior ? (isSprinting ? 6.0 : 3.8) : isSprinting ? 7.6 : 4.2;
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

        if (activeInterior) {
          // Clamp cleanly inside the 3D interior room bounds
          pState.x = Math.max(
            activeInterior.bounds.minX,
            Math.min(activeInterior.bounds.maxX, pState.x)
          );
          pState.z = Math.max(
            activeInterior.bounds.minZ,
            Math.min(activeInterior.bounds.maxZ, pState.z)
          );
        } else {
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
        }

        const gy = activeInterior ? 0.02 : groundY(pState.x, pState.z);
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

      // Player animation state (skip overriding limbs when astride a motorcycle!)
      if (!(activeCar && activeCar.category === 'motorcycle' && !activeInterior)) {
        let anim: HumanoidState = 'idle';
        if (p.isDowned || pState.ejectT > 0) anim = 'down';
        else if (!pState.grounded) anim = 'jump';
        else if (pState.speed > 0.1 && !activeCar) anim = isSprinting ? 'run' : 'walk';
        else if (p.emote !== 'none') anim = p.emote;
        animateHumanoid(player, anim, pState.speed, t, dt, p.holdingPhone && !activeCar);
      }

      if (meLabel && performance.now() > meLabel.until) {
        player.root.remove(meLabel.sprite);
        meLabel = null;
      }

      // ======== Outdoor AI Simulation (Only when Outdoors) ========
      let missionDistance: number | null = null;
      if (!activeInterior) {
        // Animate Live Ambient Sky Airliners & Jets Overhead!
        ambientPlanes.forEach((ap, idx) => {
          if (ap.mode === 'orbit') {
            ap.phase += ap.speed * dt;
            const nx = Math.cos(ap.phase) * ap.radius;
            const nz = Math.sin(ap.phase) * ap.radius;
            const vx = -Math.sin(ap.phase);
            const vz = Math.cos(ap.phase);
            ap.x = nx;
            ap.z = nz;
            const head = Math.atan2(vx, vz);
            ap.plane.group.position.set(nx, ap.y + Math.sin(t * 0.6 + idx) * 1.2, nz);
            ap.plane.group.rotation.set(0, head, 0.24, 'YXZ');
          } else {
            ap.x += ap.dirX * ap.speed * dt;
            ap.z += ap.dirZ * ap.speed * dt;
            if (ap.x > 195) ap.x = -195;
            if (ap.x < -195) ap.x = 195;
            if (ap.z > 195) ap.z = -195;
            if (ap.z < -195) ap.z = 195;
            const head = Math.atan2(ap.dirX, ap.dirZ);
            ap.plane.group.position.set(ap.x, ap.y, ap.z);
            ap.plane.group.rotation.set(0, head, 0, 'YXZ');
          }
          ap.plane.fanMeshes.forEach((f) => (f.rotation.y += dt * 32));
          ap.plane.strobeMat.emissiveIntensity = Math.sin(t * 9 + idx * 2.1) > 0.7 ? 4.8 : 0.25;
        });

        for (const c of cars) {
          if (c === activeCar) continue;
          c.y = groundY(c.x, c.z);
          c.model.group.position.set(c.x, c.y, c.z);
          c.model.group.rotation.set(0, c.heading, 0, 'YXZ');
          c.model.headMat.emissiveIntensity = 0.25;
          c.model.tailMat.emissiveIntensity = 0.25;
          if (c.model.gearGroup) c.model.gearGroup.visible = true;
          if (c.model.contrailGroup) c.model.contrailGroup.visible = false;
          if (c.model.barRed) c.model.barRed.emissiveIntensity = 0.2;
          if (c.model.barBlue) c.model.barBlue.emissiveIntensity = 0.2;
        }

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
          c.model.tailMat.emissiveIntensity = blockedAhead ? 2.5 : night > 0.45 ? 0.9 : 0.35;
          c.model.headMat.emissiveIntensity = night > 0.45 ? 2.2 : 0.35;
        }

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

        // Police Pursuit
        const wanted = p.wantedStars;
        const desired = Math.min(3, wanted);
        let activeCount = police.filter((u) => u.active).length;
        if (activeCount < desired) {
          const unit = police.find((u) => !u.active)!;
          const candidates: [number, number][] = [];
          for (const rx of ROAD_LINES)
            for (const rz of ROAD_LINES) {
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

        // Outdoor Markers
        markerRings.forEach((r, i) => {
          r.scale.y = 1 + Math.sin(t * 3 + i) * 0.15;
          markerIcons[i].position.y = 2.75 + Math.sin(t * 2 + i) * 0.15;
        });
        if (p.missionTarget) {
          const mt = p.missionTarget;
          const jk = p.activeMissionJobKind;
          missionGroup.visible = true;
          missionGroup.position.set(mt.x, groundY(mt.x, mt.z), mt.z);
          (missionRing.material as THREE.MeshBasicMaterial).color.set(mt.color);
          beamMat.color.set(mt.color);
          (chevron.material as THREE.MeshBasicMaterial).color.set(mt.color);
          missionRing.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
          chevron.position.y = 3 + Math.sin(t * 3) * 0.3;
          chevron.rotation.y = t * 2;

          // Realistic 3D Job Actors at active checkpoint!
          const showCustomer = jk === 'taxi' || jk === 'delivery' || jk === 'banker' || jk === 'developer';
          const showPatient = jk === 'ems';
          const showSuspect = jk === 'police' || jk === 'security' || jk === 'heist';
          const showBrokenCar = jk === 'mechanic';
          const showSkyRing = jk === 'pilot';

          missionCustomerNpc.root.visible = showCustomer;
          if (showCustomer) animateHumanoid(missionCustomerNpc, 'wave', 0, t, dt);

          missionPatientNpc.root.visible = showPatient;
          if (showPatient) animateHumanoid(missionPatientNpc, 'down', 0, t, dt);

          missionSuspectNpc.root.visible = showSuspect;
          if (showSuspect) {
            const dSus = Math.hypot(mt.x - pState.x, mt.z - pState.z);
            animateHumanoid(missionSuspectNpc, dSus < 11 ? 'handsup' : 'idle', 0, t, dt);
          }

          missionBrokenCar.group.visible = showBrokenCar;
          if (showBrokenCar) {
            const blink = Math.floor(t * 4) % 2 === 0 ? 3.2 : 0.2;
            missionBrokenCar.tailMat.emissiveIntensity = blink;
            missionBrokenCar.headMat.emissiveIntensity = blink * 0.6;
          }

          missionSkyRing.visible = showSkyRing;
          if (showSkyRing) {
            const isAirportApproach = mt.x < -55 && mt.z > 40;
            missionSkyRing.position.y = isAirportApproach ? 6 : 42;
            missionSkyRing.rotation.y = t * 0.8;
          }

          missionDistance = Math.hypot(mt.x - pState.x, mt.z - pState.z);
          const triggerRadius =
            jk === 'pilot'
              ? 14.5
              : activeCar
              ? activeCar.category === 'plane'
                ? 12.5
                : 5.5
              : 3.2;
          if (missionDistance < triggerRadius && lastMissionReached !== mt.id && !locked) {
            lastMissionReached = mt.id;
            p.onMissionReached(mt.id);
          }
        } else {
          missionGroup.visible = false;
        }
        if (p.waypoint) {
          waypointMarker.visible = true;
          waypointMarker.position.set(p.waypoint.x, 15, p.waypoint.z);
          if (
            Math.hypot(p.waypoint.x - pState.x, p.waypoint.z - pState.z) < 8 &&
            waypointLatch !== p.waypoint.id
          ) {
            waypointLatch = p.waypoint.id;
            p.onWaypointReached();
          }
        } else {
          waypointMarker.visible = false;
          waypointLatch = '';
        }
      }

      // ======== Camera (Outdoor + Indoor + Aerial Chase/Cockpit) ========
      const now = performance.now();
      const flyingPlane = activeCar && !activeInterior && activeCar.category === 'plane';
      if (p.cameraMode === 'isometric') {
        const isoDist = activeInterior ? 11 : flyingPlane ? 32 : 22;
        const isoHeight = activeInterior ? 16 : flyingPlane ? pState.y + 34 : 30;
        tmpV.set(pState.x + isoDist * 0.6, isoHeight, pState.z + isoDist);
        camera.position.lerp(tmpV, Math.min(1, dt * 5));
        camera.lookAt(pState.x, flyingPlane ? pState.y + 1.5 : 1, pState.z);
      } else if (p.cameraMode === 'hood') {
        if (activeCar && !activeInterior) {
          const fx = Math.sin(activeCar.heading);
          const fz = Math.cos(activeCar.heading);
          const camH = flyingPlane ? activeCar.y + 2.35 : 1.38;
          const fwdOff = flyingPlane ? 4.2 : 0.45;
          camera.position.set(activeCar.x + fx * fwdOff, camH, activeCar.z + fz * fwdOff);
          camera.lookAt(activeCar.x + fx * 34, camH - 0.15, activeCar.z + fz * 34);
          cam.yaw = activeCar.heading;
        } else {
          player.root.visible = false;
          const fx = Math.sin(cam.yaw) * Math.cos(cam.pitch);
          const fy = -Math.sin(cam.pitch);
          const fz = Math.cos(cam.yaw) * Math.cos(cam.pitch);
          camera.position.set(pState.x, pState.y + 1.66, pState.z);
          camera.lookAt(pState.x + fx * 15, pState.y + 1.66 + fy * 15, pState.z + fz * 15);
        }
      } else {
        const speedFrac = activeCar && !activeInterior ? Math.min(1, pState.speed / activeCar.vmax) : 0;
        if (activeCar && !activeInterior && now - cam.lastInput > 1400 && pState.speed > 2) {
          cam.yaw = angleLerp(cam.yaw, activeCar.heading, Math.min(1, dt * 2.5));
          cam.pitch += ((flyingPlane ? 0.18 : 0.22) - cam.pitch) * Math.min(1, dt * 1.5);
        }
        const dist = activeInterior
          ? Math.min(4.4, cam.dist)
          : flyingPlane
          ? Math.max(14.5, cam.dist + 8) + speedFrac * 3.5
          : activeCar
          ? Math.max(7.5, cam.dist + 2.5) + speedFrac * 2
          : cam.dist;
        const target = tmpV2.set(
          pState.x,
          flyingPlane
            ? pState.y + 2.2
            : activeCar && !activeInterior
            ? 1.6
            : pState.y + 1.55,
          pState.z
        );
        const fx = Math.sin(cam.yaw);
        const fz = Math.cos(cam.yaw);
        const shoulder = activeCar && !activeInterior ? 0 : activeInterior ? 0.35 : 0.55;
        const desiredPos = tmpV.set(
          target.x - fx * dist * Math.cos(cam.pitch) - Math.cos(cam.yaw) * shoulder,
          target.y + dist * Math.sin(cam.pitch) + 0.3,
          target.z - fz * dist * Math.cos(cam.pitch) + Math.sin(cam.yaw) * shoulder
        );
        if (!(flyingPlane && pState.y > 14)) {
          const dir = desiredPos.clone().sub(target);
          const len = dir.length();
          raycaster.set(target, dir.normalize());
          raycaster.far = len;
          const activeBlockers = activeInterior ? activeInterior.cameraBlockers : cameraBlockers;
          const hit = raycaster.intersectObjects(activeBlockers, false)[0];
          if (hit) desiredPos.copy(target).addScaledVector(dir, Math.max(1.1, hit.distance - 0.35));
        }
        if (desiredPos.y < 0.4) desiredPos.y = 0.4;
        if (activeInterior && desiredPos.y > 5.0) desiredPos.y = 5.0;
        camera.position.lerp(desiredPos, Math.min(1, dt * (activeCar ? 10 : 18)));
        if (cam.shake > 0) {
          camera.position.x += (Math.random() - 0.5) * cam.shake * 0.6;
          camera.position.y += (Math.random() - 0.5) * cam.shake * 0.6;
          cam.shake = Math.max(0, cam.shake - dt * 2);
        }
        camera.lookAt(target.x + fx * 1.5, target.y, target.z + fz * 1.5);
        const fov = 60 + speedFrac * (flyingPlane ? 18 : 16);
        if (Math.abs(camera.fov - fov) > 0.1) {
          camera.fov += (fov - camera.fov) * Math.min(1, dt * 3);
          camera.updateProjectionMatrix();
        }
      }

      if (p.cursorFree && document.pointerLockElement === canvas) document.exitPointerLock();

      // ======== HUD Sync ========
      hudAcc += dt;
      if (hudAcc > 0.08) {
        hudAcc = 0;
        let nearVehicle: WorldRealtimeState['nearVehicle'] = null;
        if (!activeCar && !activeInterior) {
          for (const c of cars) {
            const enterDist = c.category === 'plane' ? 6.8 : 4.2;
            if (Math.hypot(c.x - pState.x, c.z - pState.z) < enterDist) {
              nearVehicle = { id: c.id, name: c.name, color: c.color };
              break;
            }
          }
        }
        const car = !activeInterior ? (activeCar as DrivableCar | null) : null;
        const kmh = car ? Math.hypot(car.vx, car.vz) * SPEED_TO_KMH : 0;
        const fwdSign = car
          ? Math.sign(car.vx * Math.sin(car.heading) + car.vz * Math.cos(car.heading))
          : 0;
        p.onUpdateWorldState({
          x: activeInterior ? outdoorReturnPos.x : pState.x,
          z: activeInterior ? outdoorReturnPos.z : pState.z,
          heading: pState.heading,
          cameraYaw: cam.yaw,
          cameraMode: p.cameraMode,
          streetName: activeInterior
            ? activeInterior.title
            : car && car.category === 'plane' && car.y > 8
            ? `${activeCity === 'abuja' ? 'Abuja' : 'Lagos'} Airspace • ${Math.round(car.y * 3.281)} FT`
            : getStreetName(pState.x, pState.z, activeCity),
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
            gear:
              !car || kmh < 1
                ? 'N'
                : fwdSign < 0
                ? 'R'
                : String(Math.min(6, Math.floor(kmh / 45) + 1)),
            fuel: car?.fuel ?? 100,
            engineHealth: car?.engine ?? 100,
            seatbeltOn: carFlags.seatbelt,
            lightsOn: carFlags.lights,
            sirenOn: carFlags.siren,
            altitudeMeters: car ? Math.max(0, car.y) : 0,
          },
          police: police.filter((u) => u.active).map((u) => ({ x: u.x, z: u.z })),
          missionDistance,
          insideBuilding: activeInterior ? activeInterior.districtId : null,
          insideTitle: activeInterior ? activeInterior.title : undefined,
        });
      }

      composer.render();
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
      if (activeInterior) disposeInterior(activeInterior);
      envTex.dispose();
      composer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      renderer.dispose();
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  }, []);

  useEffect(() => {
    apiRef.current?.applyGraphics(props.graphicsSettings);
  }, [props.graphicsSettings]);

  useEffect(() => {
    if (props.teleportRequest)
      apiRef.current?.teleport(props.teleportRequest.x, props.teleportRequest.z);
  }, [props.teleportRequest]);

  useEffect(() => {
    if (props.spawnVehicleRequest)
      apiRef.current?.spawnVehicle(props.spawnVehicleRequest.id);
  }, [props.spawnVehicleRequest]);

  useEffect(() => {
    if (props.vehicleControlTrigger)
      apiRef.current?.vehicleAction(props.vehicleControlTrigger.action);
  }, [props.vehicleControlTrigger]);

  useEffect(() => {
    if (props.enterBuildingRequest)
      apiRef.current?.enterInterior(props.enterBuildingRequest.id);
  }, [props.enterBuildingRequest]);

  useEffect(() => {
    if (props.exitBuildingRequest) apiRef.current?.exitInterior();
  }, [props.exitBuildingRequest]);

  useEffect(() => {
    if (props.tuneVehicleRequest) apiRef.current?.tuneVehicle(props.tuneVehicleRequest);
  }, [props.tuneVehicleRequest]);

  useEffect(() => {
    if (props.meText) apiRef.current?.showMe(props.meText.text);
  }, [props.meText]);

  useEffect(() => {
    apiRef.current?.setOutfit(props.outfit);
  }, [props.outfit]);

  return (
    <div ref={mountRef} className="absolute inset-0 touch-none">
      {/* Smooth GTA / NoPixel MLO Doorway Transition Fade */}
      <div
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-200 z-20 ${
          doorFade ? 'opacity-95' : 'opacity-0'
        }`}
      />
    </div>
  );
};
