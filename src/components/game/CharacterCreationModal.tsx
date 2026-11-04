'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  User,
  Sparkles,
  Dice5,
  Check,
  RotateCcw,
  Shield,
  Briefcase,
  ChevronRight,
  Shirt,
  Scissors,
  Eye,
  Sliders,
  Award,
  ArrowRight,
  Play,
  X,
} from 'lucide-react';
import {
  PlayerStats,
  Gender,
  HairStyle,
  BodyBuild,
  FacialHair,
  CharacterAppearance,
  SocialClass,
  Vitals,
} from '@/lib/types';
import { buildHumanoid, animateHumanoid, Humanoid } from './world/humanoid';
import { audioEngine } from '@/lib/audioEngine';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: (newPlayer: PlayerStats, newVitals?: Partial<Vitals>) => void;
  existingPlayer?: PlayerStats;
}

const NIGERIAN_FIRST_NAMES_MALE = [
  'Sunday', 'Kolawole', 'Babatunde', 'Emeka', 'Chukwudi', 'Dapo', 'Farouk', 'Timi', 'Ibrahim', 'Femi', 'Obinna', 'Sodiq'
];
const NIGERIAN_FIRST_NAMES_FEMALE = [
  'Chioma', 'Fatima', 'Ngozi', 'Amina', 'Simi', 'Zainab', 'Bisi', 'Funke', 'Folashade', 'Amaka', 'Halima', 'Teni'
];
const NIGERIAN_LAST_NAMES = [
  'Adeleke', 'Okafor', 'Bello', 'Danjuma', 'Fashola', 'Balogun', 'Eze', 'Ogunlesi', 'Aliyu', 'Abiodun', 'Tinubu', 'Nwosu'
];

const SKIN_TONES = [
  { name: 'Deep Ebony', hex: '#3B1F0E' },
  { name: 'Dark Chocolate', hex: '#4A2C18' },
  { name: 'Rich Cocoa', hex: '#5C341A' },
  { name: 'Warm Espresso', hex: '#6E3F24' },
  { name: 'Golden Bronze', hex: '#8D5524' },
  { name: 'Warm Caramel', hex: '#A86C3B' },
  { name: 'Honey Sand', hex: '#C68642' },
  { name: 'Fair Ivory', hex: '#E0AC69' },
];

const SHIRT_COLORS = [
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Danfo Yellow', hex: '#FACC15' },
  { name: 'NoPixel Teal', hex: '#14B8A6' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Crisp White', hex: '#F8FAFC' },
  { name: 'Stealth Black', hex: '#18181B' },
  { name: 'Quilox Purple', hex: '#A855F7' },
  { name: 'Gold Brocade', hex: '#D97706' },
];

const PANTS_COLORS = [
  { name: 'Dark Denim', hex: '#1E293B' },
  { name: 'Jet Black Cargo', hex: '#111827' },
  { name: 'Khaki Tan', hex: '#92400E' },
  { name: 'Slate Grey', hex: '#475569' },
  { name: 'Crisp Cream', hex: '#E2E8F0' },
  { name: 'Pure White Agbada', hex: '#F8FAFC' },
];

const HAIR_COLORS = [
  { name: 'Jet Black', hex: '#121214' },
  { name: 'Dark Espresso', hex: '#271B14' },
  { name: 'Honey Blonde', hex: '#B45309' },
  { name: 'Platinum Silver', hex: '#94A3B8' },
  { name: 'Burgundy Wine', hex: '#831843' },
  { name: 'Emerald Tint', hex: '#065F46' },
];

interface OriginPreset {
  id: SocialClass;
  title: string;
  tagline: string;
  icon: string;
  starterCash: number;
  starterBank: number;
  cred: number;
  defaultOutfit: 'agbada' | 'senator' | 'street' | 'techbro' | 'drip';
  description: string;
}

const ORIGINS: OriginPreset[] = [
  {
    id: 'lapo',
    title: 'Street Hustler & Grinder',
    tagline: 'Mainland survivor who knows every back-alley of Oshodi & Marina',
    icon: '⚡',
    starterCash: 180000,
    starterBank: 250000,
    cred: 55,
    defaultOutfit: 'street',
    description: 'High stamina, street smarts, and an unstoppable will to make it to Lekki.',
  },
  {
    id: 'techbro',
    title: 'Fintech Engineer & Coder',
    tagline: 'Silicon Lagoon builder earning USD and shipping smart contracts',
    icon: '💻',
    starterCash: 120000,
    starterBank: 1500000,
    cred: 40,
    defaultOutfit: 'techbro',
    description: 'Starts with high Fleeca Bank capital, MacBook Pro, and generator fuel reserve.',
  },
  {
    id: 'nepo',
    title: 'Island Mogul & Syndicate Heir',
    tagline: 'Victoria Island trust fund royalty with VIP access everywhere',
    icon: '👑',
    starterCash: 3500000,
    starterBank: 12000000,
    cred: 75,
    defaultOutfit: 'drip',
    description: 'Billionaire lifestyle, luxury sports cars, VIP Quilox access, and private jet perks.',
  },
  {
    id: 'returnee',
    title: 'Corporate Returnee / Expat',
    tagline: 'London & Atlanta returnee investing in modern Abuja infrastructure',
    icon: '🏛️',
    starterCash: 600000,
    starterBank: 4000000,
    cred: 50,
    defaultOutfit: 'senator',
    description: 'Clean record, tailored Senator suits, international connections, and high banking trust.',
  },
];

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  existingPlayer,
}) => {
  const [tab, setTab] = useState<'identity' | 'appearance' | 'wardrobe' | 'review'>('identity');

  // Identity State
  const [name, setName] = useState<string>(existingPlayer?.name || 'Sunday Okafor');
  const [gender, setGender] = useState<Gender>(existingPlayer?.gender || 'male');
  const [age, setAge] = useState<number>(existingPlayer?.age || 26);
  const [selectedOrigin, setSelectedOrigin] = useState<SocialClass>(existingPlayer?.origin || 'lapo');

  // Physical Appearance State
  const [skinTone, setSkinTone] = useState<string>(
    existingPlayer?.appearance?.skinTone || existingPlayer?.outfit?.skin || '#6E3F24'
  );
  const [build, setBuild] = useState<BodyBuild>(existingPlayer?.appearance?.build || 'athletic');
  const [hairStyle, setHairStyle] = useState<HairStyle>(
    existingPlayer?.appearance?.hairStyle || (gender === 'female' ? 'braids' : 'fade')
  );
  const [hairColor, setHairColor] = useState<string>(
    existingPlayer?.appearance?.hairColor || '#121214'
  );
  const [facialHair, setFacialHair] = useState<FacialHair>(
    existingPlayer?.appearance?.facialHair || (gender === 'female' ? 'none' : 'stubble')
  );

  // Wardrobe State
  const [outfitStyle, setOutfitStyle] = useState<'agbada' | 'senator' | 'street' | 'techbro' | 'drip' | 'casual'>(
    (existingPlayer?.appearance?.outfitStyle || existingPlayer?.outfit?.style || 'street') as any
  );
  const [shirtColor, setShirtColor] = useState<string>(
    existingPlayer?.appearance?.shirtColor || existingPlayer?.outfit?.color || '#10B981'
  );
  const [pantsColor, setPantsColor] = useState<string>(
    existingPlayer?.appearance?.pantsColor || existingPlayer?.outfit?.pants || '#1E293B'
  );
  const [hat, setHat] = useState<'none' | 'cap' | 'sunglasses' | 'fila' | 'fedora'>(
    existingPlayer?.appearance?.hat || (existingPlayer?.outfit?.hat as any) || 'none'
  );
  const [necklace, setNecklace] = useState<'none' | 'gold_chain' | 'pearls' | 'silver_chain'>(
    existingPlayer?.appearance?.necklace || 'gold_chain'
  );

  // 3D Preview Canvas Ref
  const mountRef = useRef<HTMLDivElement | null>(null);
  const humanoidRef = useRef<Humanoid | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Randomize Name
  const handleRandomizeName = () => {
    audioEngine.playClick();
    const firstList = gender === 'female' ? NIGERIAN_FIRST_NAMES_FEMALE : NIGERIAN_FIRST_NAMES_MALE;
    const first = firstList[Math.floor(Math.random() * firstList.length)];
    const last = NIGERIAN_LAST_NAMES[Math.floor(Math.random() * NIGERIAN_LAST_NAMES.length)];
    setName(`${first} ${last}`);
  };

  // Sync Hair style defaults when gender toggles
  const handleGenderChange = (newGender: Gender) => {
    audioEngine.playClick();
    setGender(newGender);
    if (newGender === 'female') {
      if (hairStyle === 'fade' || hairStyle === 'waves') setHairStyle('braids');
      setFacialHair('none');
    } else {
      if (hairStyle === 'bob') setHairStyle('fade');
      if (facialHair === 'none') setFacialHair('stubble');
    }
  };

  // Three.js 3D Live Character Viewport
  useEffect(() => {
    if (!isOpen) return;
    const container = mountRef.current;
    if (!container) return;

    // Clean container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080d1a');

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio 3-Point Lighting
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.4);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    const ambLight = new THREE.AmbientLight(0x1e293b, 0.9);
    scene.add(ambLight);

    // Studio Pedestal Floor
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.12, 32),
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.8,
        roughness: 0.25,
      })
    );
    pedestal.position.y = -0.06;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const pedestalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.015, 12, 48),
      new THREE.MeshStandardMaterial({
        color: '#14b8a6',
        emissive: '#14b8a6',
        emissiveIntensity: 1.8,
      })
    );
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.y = 0.005;
    scene.add(pedestalRing);

    // Build Character
    const humanoid = buildHumanoid({
      shirt: shirtColor,
      pants: pantsColor,
      skin: skinTone,
      hat,
      necklace,
      gender,
      age,
      build,
      hairStyle,
      hairColor,
      facialHair,
      outfitStyle,
      castShadow: true,
    });
    humanoidRef.current = humanoid;
    scene.add(humanoid.root);

    // Camera Orbit drag control
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotation = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      targetRotation += dx * 0.015;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch controls
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouseX;
      targetRotation += dx * 0.015;
      prevMouseX = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Render loop with idle breathing animation
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth slow auto-rotation when not dragging
      if (!isDragging) {
        targetRotation += dt * 0.35;
      }
      humanoid.root.rotation.y += (targetRotation - humanoid.root.rotation.y) * 0.1;

      // Animate Idle breathing / subtle swagger
      animateHumanoid(humanoid, 'idle', 0, time / 1000, dt, false);

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [
    isOpen,
    gender,
    age,
    build,
    skinTone,
    hairStyle,
    hairColor,
    facialHair,
    outfitStyle,
    shirtColor,
    pantsColor,
    hat,
    necklace,
  ]);

  if (!isOpen) return null;

  // Complete & Spawn Handler
  const handleFinalizeCreation = () => {
    audioEngine.playCashEarn();
    const originSpec = ORIGINS.find((o) => o.id === selectedOrigin) || ORIGINS[0];

    const updatedAppearance: CharacterAppearance = {
      gender,
      age,
      build,
      skinTone,
      hairStyle,
      hairColor,
      facialHair,
      outfitStyle,
      shirtColor,
      pantsColor,
      hat,
      necklace,
    };

    const finalPlayer: PlayerStats = {
      ...(existingPlayer || {}),
      id: existingPlayer?.id || 'player-' + Date.now().toString(36),
      stateId: existingPlayer?.stateId || Math.floor(1000 + Math.random() * 9000),
      phoneNumber: existingPlayer?.phoneNumber || '080-419-' + Math.floor(1000 + Math.random() * 9000),
      name: name.trim() || 'Sunday Okafor',
      gender,
      age,
      appearance: updatedAppearance,
      tagline: `${originSpec.title} • ${age}yo • ${gender === 'female' ? 'Citizen' : 'Citizen'}`,
      origin: selectedOrigin,
      cash: originSpec.starterCash,
      bankBalance: originSpec.starterBank,
      cryptoBalance: existingPlayer?.cryptoBalance || 15,
      loanBalance: selectedOrigin === 'lapo' ? 15000 : 0,
      outfit: {
        style: outfitStyle as any,
        color: shirtColor,
        pants: pantsColor,
        skin: skinTone,
        hat: (hat === 'fila' || hat === 'fedora' ? 'none' : hat) as any,
      },
      job: originSpec.title,
      isOnDuty: true,
      salary: selectedOrigin === 'nepo' ? 180000 : selectedOrigin === 'techbro' ? 120000 : 65000,
      housing: selectedOrigin === 'nepo' ? 'lekki-duplex' : selectedOrigin === 'techbro' ? 'mainland-flat' : 'face-me-i-face-you',
      rentDueDays: 14,
      rentAmount: selectedOrigin === 'nepo' ? 250000 : 35000,
      inventory: {
        generator: true,
        generatorFuelLitres: 25,
        solarInverter: selectedOrigin === 'techbro' || selectedOrigin === 'nepo',
        danfoPass: true,
        laptop: selectedOrigin === 'techbro',
        vipPassQuilox: selectedOrigin === 'nepo',
      },
      activeCity: existingPlayer?.activeCity || 'lagos',
      phoneModelId: selectedOrigin === 'nepo' ? 'iphone-15-pro' : 'tecno-phantom-v2',
      ownedPhones: ['tecno-phantom-v2'],
      laptopModelId: 'thinkpad-x1',
      ownedLaptops: ['thinkpad-x1'],
      nepaUnitsKwh: 80,
      nepaBillArrears: 0,
      solarKw: selectedOrigin === 'nepo' ? 10 : selectedOrigin === 'techbro' ? 5 : 0,
      homeSafeCash: 50000,
      items: existingPlayer?.items?.length ? existingPlayer.items : [],
      ownedVehicles: selectedOrigin === 'nepo' ? ['veh-brabus', 'veh-ducati'] : ['veh-okada'],
      ownedPlanes: [],
      transactions: [],
      musicTracksReleased: 0,
      fansCount: selectedOrigin === 'nepo' ? 250 : 25,
    };

    onComplete(finalPlayer, {
      health: 100,
      armor: 50,
      streetCred: originSpec.cred,
      stress: 5,
    });
  };

  const getAgeLabel = (a: number) => {
    if (a <= 25) return 'Young Adult • Street Hustler';
    if (a <= 39) return 'Prime Prime • Tech & Creative';
    if (a <= 54) return 'Corporate Mogul & Syndicate';
    return 'Respected Elder & Chief';
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/95 flex flex-col justify-between p-4 sm:p-8 select-none backdrop-blur-xl animate-fade-in text-white overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-teal-500/30 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-teal-500/20">
            ★
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              Citizen Studio <span className="text-teal-400">// Character Creation</span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-mono">
              Craft your 3D identity, age, gender, and social origins in Eko & Abuja
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Grid: 3D Viewport on Left, Customizer Options on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto flex-1 min-h-0 py-4 items-stretch">
        {/* 3D Character Viewport Column */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>3D LIVE PREVIEW</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
            <span>🖱️ Drag to rotate 360°</span>
            <span className="text-teal-400 font-bold uppercase">{gender} • {age} YO</span>
          </div>

          {/* Mount canvas */}
          <div ref={mountRef} className="flex-1 w-full h-full min-h-[320px] cursor-grab active:cursor-grabbing" />
        </div>

        {/* Customization Controls Column */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl bg-zinc-900/90 border border-white/10 p-5 shadow-2xl min-h-0 overflow-hidden">
          {/* Step Tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-black/60 p-1 rounded-2xl border border-white/10 mb-4 shrink-0 text-xs font-bold">
            <button
              onClick={() => {
                audioEngine.playClick();
                setTab('identity');
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                tab === 'identity' ? 'bg-teal-500 text-black font-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User size={14} />
              <span className="truncate">1. Identity</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setTab('appearance');
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                tab === 'appearance' ? 'bg-teal-500 text-black font-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scissors size={14} />
              <span className="truncate">2. Physical</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setTab('wardrobe');
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                tab === 'wardrobe' ? 'bg-teal-500 text-black font-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shirt size={14} />
              <span className="truncate">3. Attire</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setTab('review');
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                tab === 'review' ? 'bg-amber-500 text-black font-black shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Award size={14} />
              <span className="truncate">4. ID Card</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
            {/* ================= TAB 1: IDENTITY & ORIGIN ================= */}
            {tab === 'identity' && (
              <div className="space-y-4 animate-fade-in">
                {/* Full Name & Dice */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Citizen Legal Name
                    </label>
                    <button
                      onClick={handleRandomizeName}
                      className="text-xs font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      <Dice5 size={14} /> Roll Name
                    </button>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter first & last name"
                    className="w-full bg-black/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-semibold"
                  />
                </div>

                {/* Gender Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Gender Identity
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'male' as Gender, label: 'Male ♂', desc: 'Athletic V-taper frame' },
                      { id: 'female' as Gender, label: 'Female ♀', desc: 'Curved hourglass frame' },
                      { id: 'nonbinary' as Gender, label: 'Custom ⚧', desc: 'Fluid androgynous frame' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleGenderChange(g.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          gender === g.id
                            ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-white">{g.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Slider (18 - 75) */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 block">
                        Citizen Age: <strong className="text-teal-400 text-sm font-mono">{age} Years Old</strong>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {getAgeLabel(age)}
                      </span>
                    </div>
                    {age >= 50 && (
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        Silver Hair Elder
                      </span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={75}
                    value={age}
                    onChange={(e) => {
                      setAge(parseInt(e.target.value, 10));
                    }}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>18yo (Youth)</span>
                    <span>35yo (Prime)</span>
                    <span>50yo (Executive)</span>
                    <span>75yo (Elder Chief)</span>
                  </div>
                </div>

                {/* Social Origin / Story Archetype */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Origin &amp; Starting Social Background
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ORIGINS.map((orig) => (
                      <button
                        key={orig.id}
                        onClick={() => {
                          audioEngine.playClick();
                          setSelectedOrigin(orig.id);
                          setOutfitStyle(orig.defaultOutfit as any);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedOrigin === orig.id
                            ? 'bg-gradient-to-br from-teal-950/60 to-zinc-900 border-teal-400 text-white shadow-xl'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{orig.icon}</span>
                          <div>
                            <div className="font-extrabold text-xs text-white">{orig.title}</div>
                            <div className="text-[10px] font-mono text-teal-400 font-bold">
                              ₦{(orig.starterBank + orig.starterCash).toLocaleString()} Starting Net Worth
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-300 mt-1.5 leading-snug">{orig.tagline}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: PHYSICAL & HAIR ================= */}
            {tab === 'appearance' && (
              <div className="space-y-4 animate-fade-in">
                {/* Body Build */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Physique &amp; Body Build
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['slim', 'athletic', 'muscular', 'heavy'] as BodyBuild[]).map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          audioEngine.playClick();
                          setBuild(b);
                        }}
                        className={`py-2 px-3 rounded-xl border text-center uppercase text-xs font-bold transition-all ${
                          build === b
                            ? 'bg-teal-500 text-black font-black border-teal-400 shadow-md'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Tone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Melanin Skin Tone
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SKIN_TONES.map((s) => (
                      <button
                        key={s.hex}
                        onClick={() => {
                          audioEngine.playClick();
                          setSkinTone(s.hex);
                        }}
                        className={`h-11 rounded-xl flex items-center justify-center border-2 transition-transform ${
                          skinTone === s.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: s.hex }}
                        title={s.name}
                      >
                        {skinTone === s.hex && <Check size={16} className="text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hairstyle Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Hairstyle ({gender === 'female' ? 'Feminine Cuts' : 'Masculine Cuts'})
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(gender === 'female'
                      ? [
                          { id: 'braids' as HairStyle, label: 'Box Braids' },
                          { id: 'afro' as HairStyle, label: 'Afro Puff Crown' },
                          { id: 'bob' as HairStyle, label: 'Sleek Bob' },
                          { id: 'dreads' as HairStyle, label: 'Boho Dreads' },
                          { id: 'waves' as HairStyle, label: 'Pixie Waves' },
                          { id: 'buzz' as HairStyle, label: 'Buzz Fade' },
                        ]
                      : [
                          { id: 'fade' as HairStyle, label: 'Taper Fade' },
                          { id: 'afro' as HairStyle, label: 'High Top Afro' },
                          { id: 'waves' as HairStyle, label: '360 Waves' },
                          { id: 'dreads' as HairStyle, label: 'Dreadlocks' },
                          { id: 'braids' as HairStyle, label: 'Cornrows' },
                          { id: 'buzz' as HairStyle, label: 'Clean Buzz / Bald' },
                        ]
                    ).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          audioEngine.playClick();
                          setHairStyle(h.id);
                        }}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          hairStyle === h.id
                            ? 'bg-teal-500/20 border-teal-400 text-white'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Hair Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.hex}
                        onClick={() => {
                          audioEngine.playClick();
                          setHairColor(hc.hex);
                        }}
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                          hairColor === hc.hex ? 'border-white bg-white/10' : 'border-white/10 bg-black/40 text-zinc-400'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: hc.hex }} />
                        <span>{hc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facial Hair (for Male characters) */}
                {gender !== 'female' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Facial Hair / Beard
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'none' as FacialHair, label: 'Clean Shaven' },
                        { id: 'stubble' as FacialHair, label: '5 o’clock Shadow' },
                        { id: 'goatee' as FacialHair, label: 'Goatee' },
                        { id: 'beard' as FacialHair, label: 'Full Beard' },
                      ].map((fh) => (
                        <button
                          key={fh.id}
                          onClick={() => {
                            audioEngine.playClick();
                            setFacialHair(fh.id);
                          }}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                            facialHair === fh.id
                              ? 'bg-teal-500/20 border-teal-400 text-white'
                              : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {fh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: WARDROBE & NIGERIAN ATTIRE ================= */}
            {tab === 'wardrobe' && (
              <div className="space-y-4 animate-fade-in">
                {/* Outfit Style */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Attire &amp; Fashion Cut
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'agbada', label: 'Grand Agbada', desc: 'Flowing sleeves & embroidered gold chest bib' },
                      { id: 'senator', label: 'Senator Suit', desc: 'Sharp tailored suit with mandarin collar & buttons' },
                      { id: 'street', label: 'Street Drip', desc: 'Layered streetwear hoodie with kangaroo pocket' },
                      { id: 'techbro', label: 'Tech Bro Minimal', desc: 'Modern hoodie & glowing cyan smartwatch' },
                      { id: 'drip', label: 'Island Luxury', desc: 'Glossy designer puffer & heavy Cuban chains' },
                      { id: 'casual', label: 'Casual Chic', desc: 'Relaxed cotton shirt and denim trousers' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          audioEngine.playClick();
                          setOutfitStyle(s.id as any);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          outfitStyle === s.id
                            ? 'bg-teal-500/20 border-teal-400 text-white shadow-md'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-white">{s.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Shirt / Agbada Color
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                    {SHIRT_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => {
                          audioEngine.playClick();
                          setShirtColor(c.hex);
                        }}
                        className={`h-9 rounded-xl border-2 flex items-center justify-center transition-transform ${
                          shirtColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-85'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {shirtColor === c.hex && (
                          <Check size={14} className={c.hex === '#F8FAFC' || c.hex === '#FACC15' ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pants Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Trousers / Pants Color
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PANTS_COLORS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => {
                          audioEngine.playClick();
                          setPantsColor(p.hex);
                        }}
                        className={`h-9 rounded-xl border-2 flex items-center justify-center transition-transform ${
                          pantsColor === p.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-85'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      >
                        {pantsColor === p.hex && (
                          <Check size={14} className={p.hex === '#E2E8F0' || p.hex === '#F8FAFC' ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headwear & Caps */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Headwear &amp; Caps
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'fila', label: 'Fila Cap (Yoruba)' },
                      { id: 'cap', label: 'Street Snapback' },
                      { id: 'fedora', label: 'Elder Fedora' },
                      { id: 'sunglasses', label: 'Designer Shades' },
                    ].map((hw) => (
                      <button
                        key={hw.id}
                        onClick={() => {
                          audioEngine.playClick();
                          setHat(hw.id as any);
                        }}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          hat === hw.id
                            ? 'bg-teal-500/20 border-teal-400 text-white'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {hw.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chains & Jewelry */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Jewelry &amp; Chains
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'gold_chain', label: '18k Cuban Link Chain' },
                      { id: 'none', label: 'No Jewelry' },
                    ].map((jw) => (
                      <button
                        key={jw.id}
                        onClick={() => {
                          audioEngine.playClick();
                          setNecklace(jw.id as any);
                        }}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          necklace === jw.id
                            ? 'bg-teal-500/20 border-teal-400 text-white'
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {jw.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: REVIEW & CITIZENSHIP ID ================= */}
            {tab === 'review' && (
              <div className="space-y-4 animate-fade-in">
                {/* Official Holographic Citizenship ID Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-teal-950/40 to-black border-2 border-teal-400/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center font-black text-black text-xl">
                        🇳🇬
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-teal-300 font-bold tracking-widest">
                          FEDERAL REPUBLIC OF NIGERIA
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Lagos State &amp; FCT Resident Identity Card
                        </h3>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                      VERIFIED CITIZEN
                    </span>
                  </div>

                  {/* Body Specs */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">Full Name</span>
                      <strong className="text-white text-sm font-sans">{name}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">Age &amp; Gender</span>
                      <strong className="text-teal-300">{age} Years Old • {gender.toUpperCase()}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">Social Background</span>
                      <strong className="text-amber-300">
                        {ORIGINS.find((o) => o.id === selectedOrigin)?.title}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">Starting Capital</span>
                      <strong className="text-emerald-400 font-bold">
                        ₦{(
                          (ORIGINS.find((o) => o.id === selectedOrigin)?.starterCash || 0) +
                          (ORIGINS.find((o) => o.id === selectedOrigin)?.starterBank || 0)
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">Attire &amp; Style</span>
                      <strong className="text-zinc-200 capitalize">{outfitStyle} • {hairStyle}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">Resident District</span>
                      <strong className="text-purple-300">
                        {selectedOrigin === 'nepo' ? 'Lekki Phase 1' : selectedOrigin === 'techbro' ? 'Yaba Tech District' : 'Marina Waterfront'}
                      </strong>
                    </div>
                  </div>

                  {/* Barcode & Security Hologram */}
                  <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-4 text-[10px] font-mono text-zinc-500">
                    <div>NIN: 9028-4921-3901-LAG</div>
                    <div className="tracking-[0.4em] text-zinc-400">||||||||||||||||||||||||||||</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs font-mono text-teal-300">
                  ⚡ Character progress and appearances are automatically saved as you play across Lagos and Abuja.
                </div>
              </div>
            )}
          </div>

          {/* Navigation / Next / Complete Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4 shrink-0">
            {tab !== 'identity' ? (
              <button
                onClick={() => {
                  audioEngine.playClick();
                  if (tab === 'review') setTab('wardrobe');
                  else if (tab === 'wardrobe') setTab('appearance');
                  else if (tab === 'appearance') setTab('identity');
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
              >
                ← Previous Step
              </button>
            ) : (
              <div />
            )}

            {tab !== 'review' ? (
              <button
                onClick={() => {
                  audioEngine.playClick();
                  if (tab === 'identity') setTab('appearance');
                  else if (tab === 'appearance') setTab('wardrobe');
                  else if (tab === 'wardrobe') setTab('review');
                }}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <span>Continue</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleFinalizeCreation}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm uppercase tracking-widest flex items-center gap-2.5 shadow-2xl shadow-teal-500/30 transform hover:scale-[1.02] transition-all"
              >
                <Play size={16} fill="currentColor" />
                <span>Confirm &amp; Spawn in City [ENTER]</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs font-mono text-zinc-500 shrink-0">
        <div>Eko Citizen Studio • High-Fidelity 3D Melanin Anatomy &amp; Nigerian Couture</div>
        <div>NoPixel V // Eko &amp; Abuja RP</div>
      </div>
    </div>
  );
};
