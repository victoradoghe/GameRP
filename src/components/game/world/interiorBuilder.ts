import * as THREE from 'three';
import { CityId, LagosDistrict } from '@/lib/types';
import { AABB } from '@/lib/cityLayout';
import { buildHumanoid, Humanoid, HumanoidState } from './humanoid';
import { buildCar } from './carModel';

export interface InteriorStation {
  id: string;
  name: string;
  actionLabel: string;
  x: number;
  z: number;
  color: string;
  icon: string;
  radius?: number;
}

export interface BuiltInterior {
  districtId: LagosDistrict;
  title: string;
  subtitle: string;
  group: THREE.Group;
  colliders: AABB[];
  cameraBlockers: THREE.Object3D[];
  stations: InteriorStation[];
  npcs: { h: Humanoid; state: HumanoidState }[];
  securityCameras: THREE.Group[];
  animatedRings: THREE.Mesh[];
  animatedSprites: THREE.Sprite[];
  spawnX: number;
  spawnZ: number;
  spawnHeading: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

type FloorStyle = 'parquet' | 'marble' | 'terrazzo' | 'tech' | 'club' | 'terracotta' | 'hospital';

function makeFloorTexture(style: FloorStyle): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  if (style === 'parquet') {
    ctx.fillStyle = '#3b2616';
    ctx.fillRect(0, 0, 256, 256);
    const shades = ['#472e1b', '#332012', '#523620', '#2b1b0f'];
    for (let y = 0; y < 256; y += 32) {
      for (let x = 0; x < 256; x += 64) {
        ctx.fillStyle = shades[((x / 64) + (y / 32)) % shades.length];
        ctx.fillRect(x + 1, y + 1, 62, 30);
      }
    }
  } else if (style === 'marble') {
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillRect(128, 128, 128, 128);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 128, 128);
    ctx.strokeRect(128, 128, 128, 128);
  } else if (style === 'terrazzo') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  } else if (style === 'tech') {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  } else if (style === 'club') {
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 248, 248);
  } else if (style === 'terracotta') {
    ctx.fillStyle = '#431407';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#5c1d0c';
    for (let y = 0; y < 256; y += 64) {
      for (let x = 0; x < 256; x += 64) {
        ctx.fillRect(x + 3, y + 3, 58, 58);
      }
    }
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.strokeRect(i, 0, 64, 256);
      ctx.strokeRect(0, i, 256, 64);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallBanner(text: string, sub: string, bg: string, fg: string, accent: string) {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 192);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 752, 176);
  ctx.fillStyle = fg;
  ctx.font = '900 50px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 28), 384, 78);
  ctx.fillStyle = accent;
  ctx.font = '700 25px monospace';
  ctx.fillText(sub.slice(0, 52), 384, 138);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeStationSprite(emoji: string, label: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
  ctx.beginPath();
  ctx.roundRect(16, 20, 480, 116, 42);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.font = '56px serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 42, 82);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 28px Arial, sans-serif';
  ctx.fillText(label.slice(0, 23), 116, 68);

  ctx.fillStyle = color;
  ctx.font = '700 21px monospace';
  ctx.fillText('PRESS [E] TO INTERACT', 116, 106);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.scale.set(2.5, 0.78, 1);
  return sprite;
}

export function buildBuildingInterior(
  districtId: LagosDistrict,
  city: CityId = 'lagos'
): BuiltInterior {
  const group = new THREE.Group();
  const colliders: AABB[] = [];
  const cameraBlockers: THREE.Object3D[] = [];
  const stations: InteriorStation[] = [];
  const npcs: { h: Humanoid; state: HumanoidState }[] = [];
  const securityCameras: THREE.Group[] = [];
  const animatedRings: THREE.Mesh[] = [];
  const animatedSprites: THREE.Sprite[] = [];

  const W = 24;
  const D = 22;
  const H = 5.4;
  const halfW = W / 2;
  const halfD = D / 2;

  const isAbuja = city === 'abuja';

  const configMap: Record<
    LagosDistrict,
    { title: string; subtitle: string; floor: FloorStyle; wallColor: number; lightColor: number }
  > = {
    home: {
      title: isAbuja ? 'Your Maitama Luxury Villa' : 'Your Lekki / Ikoyi Duplex Residence',
      subtitle: 'Living Lounge • Developer Office • Master Bedroom • Solar & NEPA Smart Wall',
      floor: 'parquet',
      wallColor: 0x1e293b,
      lightColor: 0xffd8a8,
    },
    computervillage: {
      title: isAbuja ? 'Banex Plaza Flagship Tech Store' : 'Computer Village & Slot Flagship Store',
      subtitle: 'Apple iOS 19 Bar • Samsung/Pixel Android Zone • Pro Developer Laptops',
      floor: 'terrazzo',
      wallColor: 0x1e293b,
      lightColor: 0xbae6fd,
    },
    istore: {
      title: isAbuja ? 'Maitama iStore & CyberDeck Flagship' : 'VI iStore & CyberDeck Mega Plaza',
      subtitle: 'iPhone 17 Ultra • M4 Max MacBooks • CCTV Jammers & Vault Plasma Drills',
      floor: 'tech',
      wallColor: 0x0f172a,
      lightColor: 0x7dd3fc,
    },
    lekki: {
      title: isAbuja ? 'Jabi Lake Mall (Shoprite & Dynasty 8)' : 'The Palms Mall Lekki (Shoprite & Dynasty 8)',
      subtitle: 'Supermarket Aisles • Rooftop Solar Showroom • Luxury Watches & Real Estate',
      floor: 'marble',
      wallColor: 0x1f2937,
      lightColor: 0xfde68a,
    },
    fleeca: {
      title: isAbuja ? 'Zenith Commercial Bank (Central Area)' : 'Zenith / Fleeca Commercial Bank HQ',
      subtitle: 'Tier-1 Vault (₦4.5M–₦12.5M) • CCTV Control • Teller & Banker Desk',
      floor: 'marble',
      wallColor: 0x143328,
      lightColor: 0xa7f3d0,
    },
    gtbank: {
      title: isAbuja ? 'Access / GTCO Corporate Bank (Wuse II)' : 'GTCO / Access Corporate Bank Tower',
      subtitle: 'Tier-2 Biometric Vault (₦18M–₦38M) • 6 Laser Cameras • Forex Treasury',
      floor: 'marble',
      wallColor: 0x2a1810,
      lightColor: 0xfed7aa,
    },
    cbn: {
      title: isAbuja ? 'CBN Sovereign Gold & Bullion Vault (CBD)' : 'Central Bank (CBN) Sovereign Reserve',
      subtitle: 'Tier-3 Maximum Security Vault (₦60,000,000+) • Laser Grid • Gold Bullion',
      floor: 'marble',
      wallColor: 0x1c1917,
      lightColor: 0xfef08a,
    },
    airport: {
      title: isAbuja
        ? 'Nnamdi Azikiwe Int’l Airport Terminal (ABV)'
        : 'Murtala Muhammed Int’l Airport Terminal (LOS)',
      subtitle: 'Check-In Counters • Private Jet Hangar Sales • Departure Gate B4',
      floor: 'terrazzo',
      wallColor: 0x172554,
      lightColor: 0xbae6fd,
    },
    mrpd: {
      title: isAbuja ? 'Louis Edet Police & Security Command' : 'Eko Police RRS & Sentinel Security HQ',
      subtitle: 'Command Dispatch Desk • Tactical Armory • Holding Cells & CCTV',
      floor: 'terrazzo',
      wallColor: 0x1e293b,
      lightColor: 0xbfdbfe,
    },
    yaba: {
      title: isAbuja ? 'Abuja Tech Village & Ventures Campus' : 'Yaba Silicon Lagoon Engineering Hub',
      subtitle: 'Software Developer Pods • Cloud Server Room • Startup Espresso Bar',
      floor: 'tech',
      wallColor: 0x0f172a,
      lightColor: 0xa5b4fc,
    },
    gas: {
      title: isAbuja ? 'NNPC Mega Mart, AEDC & Benny’s Bay' : 'NNPC Mega Mart, EKEDC & Benny’s Bay',
      subtitle: 'Generator Fuel Jerrycans • NEPA Prepaid Meter • Solar Kits • Car Tuning Lift',
      floor: 'terrazzo',
      wallColor: 0x27272a,
      lightColor: 0xfde68a,
    },
    shitta: {
      title: isAbuja ? 'Garki Area 11 Kilishi & Amala Bukka' : 'Amala Shitta Legendary Canteen',
      subtitle: 'Hot Amala, Ewedu, Gbegiri, Assorted Meat & Chilled Drinks',
      floor: 'terracotta',
      wallColor: 0x2e1912,
      lightColor: 0xfcd34d,
    },
    pillbox: {
      title: isAbuja ? 'National Hospital Abuja Trauma Center' : 'LASUTH / Pillbox Medical Center',
      subtitle: 'Emergency Triage • Surgical Recovery Beds • EMS Paramedic Dispatch',
      floor: 'hospital',
      wallColor: 0x132a2e,
      lightColor: 0xa5f3fc,
    },
    quilox: {
      title: isAbuja ? 'Hustle & Bustle VIP Nightclub (Wuse II)' : 'Club Quilox VIP Lounge (Victoria Island)',
      subtitle: 'LED Dancefloor • Live Afrobeats DJ Booth • Azul & Ace of Spades VIP Tables',
      floor: 'club',
      wallColor: 0x09090b,
      lightColor: 0xe879f9,
    },
    clothing: {
      title: isAbuja ? 'Wuse II Senator & Designer Boutique' : 'Suburban Ikoyi Luxury Fashion House',
      subtitle: 'Runway Mannequins • Streetwear & Agbada Racks • 3D Wardrobe Mirror',
      floor: 'parquet',
      wallColor: 0x2d1628,
      lightColor: 0xfbcfe8,
    },
    lagoon: {
      title: isAbuja ? 'Jabi Lake Waterfront Club & Transit' : 'Five Cowrie Creek Lagoon Pier & Transit',
      subtitle: 'Waterfront Lounge • Danfo Conductor Dispatch • Marina Deck',
      floor: 'parquet',
      wallColor: 0x112830,
      lightColor: 0x67e8f9,
    },
  };

  const cfg = configMap[districtId];

  const addProp = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    collide = true
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (collide) {
      colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    }
    return mesh;
  };

  const addStation = (s: InteriorStation) => {
    stations.push(s);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.55, 28, 1, true),
      new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.position.set(s.x, 0.3, s.z);
    group.add(ring);
    animatedRings.push(ring);

    const disc = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.95, 28),
      new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(s.x, 0.03, s.z);
    group.add(disc);

    const sp = makeStationSprite(s.icon, s.name, s.color);
    sp.position.set(s.x, 2.35, s.z);
    group.add(sp);
    animatedSprites.push(sp);
  };

  const skins = ['#5c3a21', '#6d4023', '#8d5524', '#3b2416', '#c68642', '#4a2c17'];
  let npcIdx = 0;
  const addNpc = (
    x: number,
    z: number,
    heading: number,
    shirt: string,
    pants: string,
    state: HumanoidState = 'idle',
    hat: 'none' | 'cap' | 'sunglasses' = 'none'
  ) => {
    const h = buildHumanoid({
      shirt,
      pants,
      skin: skins[npcIdx++ % skins.length],
      hat,
      castShadow: true,
    });
    h.root.position.set(x, 0.02, z);
    h.root.rotation.y = heading;
    group.add(h.root);
    npcs.push({ h, state });
  };

  // Helper to mount 3D Panning Security Cameras on Ceiling Corners/Walls!
  const addSecurityCamera = (x: number, z: number, baseYaw: number) => {
    const mount = new THREE.Group();
    mount.position.set(x, H - 0.38, z);
    mount.rotation.y = baseYaw;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 })
    );
    stem.position.y = 0.16;
    mount.add(stem);

    const pivot = new THREE.Group();
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.44),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.3 })
    );
    housing.rotation.x = 0.45;
    const redLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.2 })
    );
    redLed.position.set(0, 0.04, 0.22);

    // Subtle Red Security Vision Cone
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 5.2, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.09,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    cone.rotation.x = -Math.PI / 2 + 0.45;
    cone.position.set(0, -1.1, 2.3);
    pivot.add(housing, redLed, cone);
    mount.add(pivot);
    group.add(mount);
    securityCameras.push(pivot);
  };

  // ---------------- 1. FLOOR, SHELL WALLS, WINDOWS & CINEMATIC LIGHTING ----------------
  const floorTex = makeFloorTexture(cfg.floor);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: cfg.floor === 'marble' || cfg.floor === 'club' ? 0.35 : 0.55,
    metalness: cfg.floor === 'club' ? 0.35 : 0.08,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({
    color: cfg.wallColor,
    roughness: 0.82,
    metalness: 0.05,
  });
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.5,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.4), wallMat);
  backWall.position.set(0, H / 2, -halfD);
  backWall.receiveShadow = true;
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), wallMat);
  leftWall.position.set(-halfW, H / 2, 0);
  leftWall.receiveShadow = true;
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), wallMat);
  rightWall.position.set(halfW, H / 2, 0);
  rightWall.receiveShadow = true;
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.4), wallMat);
  frontWall.position.set(0, H / 2, halfD);
  group.add(backWall, leftWall, rightWall, frontWall);
  cameraBlockers.push(backWall, leftWall, rightWall, frontWall);

  addProp(0, 0, -halfD + 0.22, W, 0.18, 0.08, baseboardMat, false);
  addProp(-halfW + 0.22, 0, 0, 0.08, 0.18, D, baseboardMat, false);
  addProp(halfW - 0.22, 0, 0, 0.08, 0.18, D, baseboardMat, false);

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
    side: THREE.FrontSide,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  group.add(ceiling);

  // Soft, Non-Glare Recessed Ceiling Lights (FIXED: no longer overly bright!)
  const ledPanelMat = new THREE.MeshStandardMaterial({
    color: cfg.lightColor,
    emissive: cfg.lightColor,
    emissiveIntensity: 0.45,
  });
  for (const lx of [-6.5, 6.5]) {
    for (const lz of [-5.5, 4.5]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), ledPanelMat);
      panel.position.set(lx, H - 0.05, lz);
      group.add(panel);

      const pt = new THREE.PointLight(cfg.lightColor, districtId === 'quilox' ? 1.8 : 2.8, 18, 1.5);
      pt.position.set(lx, H - 0.45, lz);
      group.add(pt);
    }
  }
  const centerFill = new THREE.AmbientLight(0xffffff, districtId === 'quilox' ? 0.24 : 0.34);
  group.add(centerFill);

  // Mount 3D Panning Security Cameras in commercial/bank/government buildings!
  if (districtId !== 'home' && districtId !== 'shitta') {
    addSecurityCamera(-10.5, -9.5, 0.65);
    addSecurityCamera(10.5, -9.5, -0.65);
    if (districtId === 'fleeca' || districtId === 'gtbank' || districtId === 'cbn' || districtId === 'mrpd') {
      addSecurityCamera(-10.5, 4.5, 1.2);
      addSecurityCamera(10.5, 4.5, -1.2);
    }
  }

  // Glowing Front Exit Double Glass Doors
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.7, roughness: 0.25 });
  const doorGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.15,
  });
  addProp(0, 0, halfD - 0.22, 3.4, 3.1, 0.18, doorFrameMat, false);
  addProp(-0.78, 0.1, halfD - 0.24, 1.4, 2.8, 0.2, doorGlassMat, false);
  addProp(0.78, 0.1, halfD - 0.24, 1.4, 2.8, 0.2, doorGlassMat, false);

  addStation({
    id: 'int:exit',
    name: 'Exit to City Street',
    actionLabel: 'Step Outside to 3D City',
    x: 0,
    z: halfD - 1.7,
    color: '#f43f5e',
    icon: '🚪',
    radius: 2.2,
  });

  // Indoor Potted Plants
  const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
  for (const [px, pz] of [
    [-10.4, 9.2],
    [10.4, 9.2],
  ] as [number, number][]) {
    addProp(px, 0, pz, 0.75, 0.7, 0.75, potMat, true);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), leafMat);
    bush.position.set(px, 1.25, pz);
    group.add(bush);
  }

  // Reusable Furniture Materials (Warm, non-glare)
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.45, metalness: 0.08 });
  const oakWood = new THREE.MeshStandardMaterial({ color: 0x7c4d25, roughness: 0.5 });
  const velvetTeal = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.8 });
  const velvetPurple = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.75 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.75, roughness: 0.3 });
  const silverMetal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.18,
  });
  const cashGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
  const screenCyan = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });
  const screenGreen = new THREE.MeshStandardMaterial({
    color: 0x059669,
    emissive: 0x34d399,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });
  const glassCaseMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
  });

  // Back-wall Main Title Banner
  const mainBannerTex = makeWallBanner(
    cfg.title.toUpperCase(),
    cfg.subtitle,
    '#090d16',
    '#f8fafc',
    '#14b8a6'
  );
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 2.4),
    new THREE.MeshStandardMaterial({
      map: mainBannerTex,
      emissive: 0xffffff,
      emissiveMap: mainBannerTex,
      emissiveIntensity: 0.28,
    })
  );
  bannerMesh.position.set(0, 3.85, -halfD + 0.25);
  group.add(bannerMesh);

  // Shared helper to build a Walk-In Bank Hall + CCTV Room + Heavy Armored Vault Chamber
  const buildBankInterior = (
    tier: 1 | 2 | 3,
    accentHex: string,
    vaultTitle: string,
    payoutLabel: string
  ) => {
    // 1. Bulletproof Teller Counter (Left) + 3 Bank Teller Workers
    addProp(-6.2, 0, -2.5, 6.8, 1.1, 1.3, darkWood);
    addProp(-6.2, 1.1, -2.5, 6.6, 1.25, 0.1, glassCaseMat, false);
    addNpc(-8.4, -4.0, 0, accentHex, '#0f172a', 'idle');
    addNpc(-6.2, -4.0, 0, accentHex, '#0f172a', 'idle');
    addNpc(-4.0, -4.0, 0, accentHex, '#0f172a', 'wave');
    // Waiting bank customer
    addNpc(-5.5, 0.5, Math.PI, '#38bdf8', '#1e293b', 'idle');

    addStation({
      id: 'int:bank_teller',
      name: 'Private Banking & Multi-Bank Teller',
      actionLabel: 'Deposit, Withdraw, Loans & P2P Wire',
      x: -6.2,
      z: -0.6,
      color: accentHex,
      icon: '🏦',
    });

    // 2. Corporate Banker Compliance & Forex Desk (Right) + 2 Bank Officers
    addProp(6.4, 0, -1.5, 4.6, 0.92, 1.6, darkWood);
    addProp(5.5, 0.94, -1.6, 1.1, 0.68, 0.08, screenGreen, false);
    addProp(7.3, 0.94, -1.6, 1.1, 0.68, 0.08, screenCyan, false);
    addNpc(5.5, -2.9, 0, '#f8fafc', '#0f172a', 'idle');
    addNpc(7.3, -2.9, 0, '#f8fafc', '#0f172a', 'idle');
    addStation({
      id: 'int:bank_desk',
      name: 'Corporate Banker Officer Desk',
      actionLabel: 'Work as Banker (Clear RTGS Wires / Flag Fraud)',
      x: 6.4,
      z: 0.4,
      color: '#34d399',
      icon: '💼',
    });

    // 3. Security Camera & Laser Grid Control Terminal (Front-Left) + Armed Guard
    addProp(-8.8, 0, 4.2, 2.6, 1.05, 1.2, darkMetal);
    addProp(-8.8, 1.06, 4.1, 2.1, 0.85, 0.08, screenCyan, false);
    addNpc(-6.8, 4.2, -Math.PI / 2, '#1e3a8a', '#09090b', 'salute', 'cap');
    addStation({
      id: 'int:bank_cams',
      name: `CCTV & Laser Security Grid (Tier ${tier})`,
      actionLabel: 'Hack / Loop Security Cameras (+25% Vault Loot)',
      x: -8.8,
      z: 6.0,
      color: '#38bdf8',
      icon: '📹',
    });

    // 4. Heavy Armored Vault Chamber at Back-Center + Gold Bullion & Cash Pallets + Tactical Guards!
    addProp(-3.8, 0, -7.8, 0.45, 3.6, 4.4, darkMetal);
    addProp(3.8, 0, -7.8, 0.45, 3.6, 4.4, darkMetal);
    const vaultDoor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.55, 0.38, 28),
      tier === 3 ? goldMat : silverMetal
    );
    vaultDoor.rotation.x = Math.PI / 2;
    vaultDoor.position.set(2.2, 1.85, -5.8);
    vaultDoor.rotation.z = 0.6;
    group.add(vaultDoor);

    // Red Laser Tripwires across the Vault Threshold
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (const ly of [0.65, 1.35, 2.05]) {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 7.1, 6), laserMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(0, ly, -5.8);
      group.add(beam);
    }

    // Stacked Gold Bullion Carts & Naira Cash Pallets Inside the Vault!
    for (const vx of [-1.8, 0, 1.8]) {
      addProp(vx, 0, -9.2, 1.3, 0.85, 1.1, darkMetal);
      addProp(
        vx,
        0.85,
        -9.2,
        1.1,
        0.55,
        0.9,
        tier >= 2 && vx !== 0 ? goldMat : cashGreenMat,
        false
      );
    }

    // Armed Vault Security Guards
    addNpc(-4.5, -5.2, 0, '#09090b', '#09090b', 'idle', 'sunglasses');
    addNpc(4.5, -5.2, 0, '#09090b', '#09090b', 'idle', 'sunglasses');
    if (tier >= 2) {
      addNpc(0, 3.5, Math.PI, '#1e3a8a', '#09090b', 'idle', 'cap');
    }

    addStation({
      id: 'int:bank_vault',
      name: vaultTitle,
      actionLabel: `Breach Vault & Steal ${payoutLabel}`,
      x: 0,
      z: -4.8,
      color: '#ef4444',
      icon: '💰',
    });
  };

  // ---------------- 2. BESPOKE 3D FURNITURE & WORKERS PER BUILDING ----------------
  switch (districtId) {
    case 'home': {
      const rug = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.03, 5.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 })
      );
      rug.position.set(-2.5, 0.015, 1.5);
      group.add(rug);

      addProp(-2.5, 0, 3.3, 4.6, 0.5, 1.25, velvetTeal);
      addProp(-2.5, 0.5, 3.78, 4.6, 0.55, 0.28, velvetTeal, false);
      addProp(-4.5, 0, 1.9, 1.2, 0.5, 3.6, velvetTeal);
      addProp(-2.3, 0, 1.3, 2.2, 0.42, 1.1, glassCaseMat);

      addProp(-2.3, 0, -0.8, 3.8, 0.65, 0.65, darkWood);
      addProp(-2.3, 0.75, -0.8, 3.2, 1.75, 0.1, darkMetal, false);
      const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.6), screenCyan);
      tvScreen.position.set(-2.3, 1.63, -0.73);
      group.add(tvScreen);

      // Private Domestic Chef & Estate Butler
      addNpc(-9.2, 2.2, Math.PI / 2, '#f8fafc', '#0f172a', 'idle', 'cap');
      addNpc(3.2, 5.5, Math.PI, '#1e293b', '#09090b', 'salute');

      // HOME DEVELOPER OFFICE
      addProp(-7.6, 0, -7.2, 3.8, 0.82, 1.5, darkWood);
      addProp(-7.6, 0, -5.6, 0.75, 0.95, 0.75, darkMetal, false);
      addProp(-8.2, 0.85, -7.4, 1.25, 0.78, 0.08, screenCyan, false);
      addProp(-6.9, 0.85, -7.4, 1.25, 0.78, 0.08, screenGreen, false);
      addProp(-7.55, 0.83, -6.85, 0.55, 0.04, 0.38, silverMetal, false);
      addStation({
        id: 'int:home_laptop',
        name: 'Developer Laptop Workstation',
        actionLabel: 'Code Remote Contract / Switch Laptop',
        x: -7.5,
        z: -4.8,
        color: '#6366f1',
        icon: '💻',
      });

      // MASTER BEDROOM SUITE
      addProp(7.2, 0, -7.0, 4.2, 0.52, 4.6, darkWood);
      addProp(7.2, 0.52, -6.9, 3.9, 0.28, 4.3, whiteMat, false);
      addProp(7.2, 0.68, -5.8, 3.95, 0.18, 2.2, velvetTeal, false);
      addProp(6.2, 0.82, -8.4, 1.3, 0.18, 0.65, whiteMat, false);
      addProp(8.2, 0.82, -8.4, 1.3, 0.18, 0.65, whiteMat, false);
      addProp(7.2, 0, -9.25, 4.4, 1.65, 0.25, darkWood, false);
      addStation({
        id: 'int:home_bed',
        name: 'King-Size Master Bed',
        actionLabel: 'Sleep & Restore 100% Energy + Health',
        x: 7.2,
        z: -3.8,
        color: '#14b8a6',
        icon: '🛏️',
      });

      addProp(10.6, 0, -1.8, 1.3, 2.8, 3.4, oakWood);
      addStation({
        id: 'int:home_wardrobe',
        name: 'Walk-In Designer Wardrobe',
        actionLabel: 'Change 3D Character Outfit & Drip',
        x: 9.0,
        z: -1.8,
        color: '#ec4899',
        icon: '👕',
      });

      addProp(2.6, 0, -9.8, 1.3, 1.6, 0.9, darkMetal);
      addStation({
        id: 'int:home_safe',
        name: 'Personal Cash Safe & Residence Hub',
        actionLabel: 'Manage Safe Cash & Home Upgrades',
        x: 2.6,
        z: -8.2,
        color: '#f59e0b',
        icon: '🔐',
      });

      addProp(10.8, 0.9, 4.2, 0.65, 1.85, 2.4, whiteMat);
      addProp(10.44, 1.35, 4.2, 0.08, 0.95, 1.6, screenGreen, false);
      addStation({
        id: 'int:home_solar',
        name: 'Solar Inverter & NEPA Meter Panel',
        actionLabel: 'Pay NEPA Bill, Fuel Gen or Buy Solar',
        x: 9.1,
        z: 4.2,
        color: '#10b981',
        icon: '☀️',
      });

      addProp(-9.8, 0, 3.8, 1.6, 2.3, 1.4, silverMetal);
      addStation({
        id: 'int:home_fridge',
        name: 'Smart Kitchen & Double Fridge',
        actionLabel: 'Eat Fresh Home Meal (+Hunger & +Thirst)',
        x: -8.0,
        z: 3.8,
        color: '#22d3ee',
        icon: '🍽️',
      });
      break;
    }

    case 'computervillage':
    case 'istore': {
      // Table 1: Apple iOS Flagship Display Table (Left) + Apple Specialist Worker
      addProp(-6.5, 0, -1.5, 4.2, 0.92, 2.2, oakWood);
      for (const dx of [-1.4, -0.45, 0.45, 1.4]) {
        addProp(-6.5 + dx, 0.92, -1.5, 0.22, 0.34, 0.08, screenCyan, false);
      }
      addNpc(-6.5, -3.1, 0, '#0284c7', '#0f172a', 'wave');
      addStation({
        id: 'int:cv_ios',
        name: 'Apple iOS 19 Flagship Bar',
        actionLabel: 'Buy iPhone 15 Pro / 16 Pro Max / 17 Ultra',
        x: -6.5,
        z: 0.6,
        color: '#38bdf8',
        icon: '🍎',
      });

      // Table 2: Android Ultra & Foldable Table (Center) + Android Specialist Worker
      addProp(0, 0, -1.5, 4.2, 0.92, 2.2, oakWood);
      for (const dx of [-1.4, -0.45, 0.45, 1.4]) {
        addProp(dx, 0.92, -1.5, 0.28, 0.34, 0.08, screenGreen, false);
      }
      addNpc(0, -3.1, 0, '#10b981', '#0f172a', 'idle');
      addStation({
        id: 'int:cv_android',
        name: 'Samsung, Pixel & Tecno Android Zone',
        actionLabel: 'Buy Galaxy S25 Ultra / Pixel 9 / Fold 2',
        x: 0,
        z: 0.6,
        color: '#10b981',
        icon: '🤖',
      });

      // Table 3: Pro Developer Laptops Bar (Right) + Laptop Engineer Worker
      addProp(6.5, 0, -1.5, 4.2, 0.92, 2.2, oakWood);
      for (const dx of [-1.3, 0, 1.3]) {
        addProp(6.5 + dx, 0.92, -1.45, 0.65, 0.04, 0.44, silverMetal, false);
        addProp(6.5 + dx, 0.96, -1.66, 0.65, 0.44, 0.04, screenCyan, false);
      }
      addNpc(6.5, -3.1, 0, '#a855f7', '#0f172a', 'idle', 'sunglasses');
      addStation({
        id: 'int:cv_laptops',
        name: 'MacBook M4 Max & ROG Laptop Lab',
        actionLabel: 'Buy Laptops (Up to 1.90x Job Pay Bonus)',
        x: 6.5,
        z: 0.6,
        color: '#a855f7',
        icon: '💻',
      });

      // Back Genius / Vault Hacking Hardware Counter + 3 Staff Workers
      addProp(0, 0, -7.8, 9.5, 1.05, 1.3, darkMetal);
      addNpc(-3.2, -9.1, 0, '#f97316', '#1e293b', 'idle', 'cap');
      addNpc(0, -9.1, 0, '#38bdf8', '#1e293b', 'idle');
      addNpc(3.2, -9.1, 0, '#ef4444', '#1e293b', 'idle', 'sunglasses');
      addStation({
        id: 'int:cv_counter',
        name: 'Vault Hacking & Cyber Gear Counter',
        actionLabel: 'Buy CCTV Jammers, Vault Drills & Laptops',
        x: 0,
        z: -6.1,
        color: '#f97316',
        icon: '📡',
      });
      break;
    }

    case 'lekki': {
      const shelfColors = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6];
      for (const sz of [-5.2, -1.4]) {
        addProp(-7.0, 0, sz, 4.8, 2.1, 0.9, silverMetal);
        shelfColors.forEach((col, idx) => {
          addProp(
            -8.8 + idx * 1.15,
            1.1,
            sz,
            0.85,
            0.45,
            0.96,
            new THREE.MeshStandardMaterial({ color: col }),
            false
          );
        });
      }
      // Supermarket Cashier & Stock Clerks
      addNpc(-7.0, -7.2, 0, '#ef4444', '#1e293b', 'wave', 'cap');
      addNpc(-4.2, -3.2, -Math.PI / 2, '#ef4444', '#1e293b', 'idle');
      addStation({
        id: 'int:mall_grocery',
        name: 'Shoprite Supermarket Aisle',
        actionLabel: 'Buy Groceries, Drinks & Medkits',
        x: -7.0,
        z: 0.8,
        color: '#f97316',
        icon: '🛒',
      });

      addProp(0, 0, -7.2, 5.4, 0.85, 2.2, darkMetal);
      const demoSolar = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.12, 1.8),
        new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.45,
          metalness: 0.85,
          roughness: 0.2,
        })
      );
      demoSolar.position.set(0, 1.45, -7.2);
      demoSolar.rotation.x = 0.42;
      group.add(demoSolar);
      addNpc(0, -9.0, 0, '#10b981', '#0f172a', 'idle');
      addStation({
        id: 'int:mall_solar',
        name: 'Luminous & Tesla Solar Showroom',
        actionLabel: 'Buy Home Solar Roof & Inverter Kits',
        x: 0,
        z: -4.9,
        color: '#10b981',
        icon: '☀️',
      });

      addProp(7.2, 0, -3.5, 4.4, 1.0, 1.6, glassCaseMat);
      addNpc(7.2, -5.0, 0, '#06b6d4', '#0f172a', 'idle', 'sunglasses');
      addStation({
        id: 'int:mall_luxury',
        name: 'Luxury Boutique & Recording Suite',
        actionLabel: 'Shop Luxury Goods / Record Hit Track',
        x: 7.2,
        z: -1.6,
        color: '#06b6d4',
        icon: '💎',
      });

      addProp(7.2, 0, 3.8, 3.8, 0.95, 1.4, darkWood);
      addNpc(7.2, 2.4, 0, '#14b8a6', '#1e293b', 'wave');
      addStation({
        id: 'int:mall_realestate',
        name: 'Dynasty 8 Real Estate Agency',
        actionLabel: 'Upgrade House, Duplex or Mansion',
        x: 7.2,
        z: 5.5,
        color: '#14b8a6',
        icon: '🏡',
      });
      break;
    }

    case 'fleeca': {
      buildBankInterior(
        1,
        '#10b981',
        'Zenith / Fleeca Commercial Vault',
        '₦4,500,000 – ₦12,500,000'
      );
      break;
    }

    case 'gtbank': {
      buildBankInterior(
        2,
        '#f97316',
        'GTCO / Access Biometric Corporate Vault',
        '₦18,000,000 – ₦38,000,000'
      );
      break;
    }

    case 'cbn': {
      buildBankInterior(
        3,
        '#facc15',
        'CBN Sovereign Gold & Bullion Vault',
        '₦60,000,000 – ₦115,000,000+'
      );
      break;
    }

    case 'airport': {
      // Check-In Counters (Left) + 3 Airline Agents
      addProp(-6.4, 0, 1.0, 6.2, 1.05, 1.3, darkWood);
      addProp(-6.4, 1.05, 0.8, 5.8, 0.55, 0.08, screenCyan, false);
      addNpc(-8.2, -0.5, 0, '#0284c7', '#0f172a', 'idle');
      addNpc(-6.4, -0.5, 0, '#0284c7', '#0f172a', 'wave');
      addNpc(-4.6, -0.5, 0, '#0284c7', '#0f172a', 'idle');
      addStation({
        id: 'int:airport_checkin',
        name: 'Air Peace & Executive Jet Check-In',
        actionLabel: isAbuja
          ? 'Book Flight to Lagos / Buy Private Jet'
          : 'Book Flight to Abuja / Buy Private Jet',
        x: -6.4,
        z: 2.9,
        color: '#38bdf8',
        icon: '🎫',
      });

      // Security X-Ray Archway in Center + 2 FAAN Customs Officers
      addProp(-1.1, 0, -1.8, 0.3, 2.5, 0.8, silverMetal);
      addProp(1.1, 0, -1.8, 0.3, 2.5, 0.8, silverMetal);
      addProp(0, 2.4, -1.8, 2.5, 0.3, 0.8, screenGreen, false);
      addNpc(2.3, -1.8, -Math.PI / 2, '#1e3a8a', '#0f172a', 'salute', 'cap');
      addNpc(-2.3, -1.8, Math.PI / 2, '#1e3a8a', '#0f172a', 'idle', 'cap');

      // Departure Lounge Seats (Right)
      for (const rz of [2.5, -0.5]) {
        addProp(6.8, 0, rz, 4.4, 0.55, 0.9, velvetTeal);
      }

      // Boarding Gate B4 + Panoramic Window + Pilot & Gate Agent
      const gateWindow = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 3.4), glassCaseMat);
      gateWindow.position.set(5.2, 2.1, -halfD + 0.28);
      group.add(gateWindow);
      addProp(5.2, 0, -7.8, 2.8, 1.05, 1.0, darkMetal);
      addNpc(5.2, -9.0, 0, '#09090b', '#09090b', 'salute', 'cap');
      addStation({
        id: 'int:airport_gate',
        name: 'International Boarding Gate & Hangar',
        actionLabel: isAbuja
          ? 'Board Flight to Lagos (LOS) or Spawn Jet'
          : 'Board Flight to Abuja (ABV) or Spawn Jet',
        x: 5.2,
        z: -5.8,
        color: '#0ea5e9',
        icon: '✈️',
      });
      break;
    }

    case 'mrpd': {
      addProp(-5.5, 0, 0.5, 5.6, 1.08, 1.4, darkWood);
      addNpc(-7.0, -1.1, 0, '#1d4ed8', '#0f172a', 'salute', 'cap');
      addNpc(-4.0, -1.1, 0, '#1d4ed8', '#0f172a', 'idle', 'cap');
      addNpc(2.5, 2.5, -0.5, '#09090b', '#09090b', 'idle', 'sunglasses');
      addStation({
        id: 'int:pd_desk',
        name: 'Police & Security Command Desk',
        actionLabel: 'Clock In: Police / Security Guard / Clear Warrant',
        x: -5.5,
        z: 2.5,
        color: '#3b82f6',
        icon: '🚓',
      });

      addProp(7.2, 0, -3.5, 4.2, 2.2, 1.1, darkMetal);
      addNpc(7.2, -5.2, 0, '#1e3a8a', '#09090b', 'idle', 'cap');
      addStation({
        id: 'int:pd_armory',
        name: 'Tactical Kevlar & Medkit Armory',
        actionLabel: 'Equip +100% Tactical Armor & Duty Gear',
        x: 7.2,
        z: -1.4,
        color: '#eab308',
        icon: '🛡️',
      });

      for (let bx = -9.5; bx <= -3.5; bx += 0.75) {
        addProp(bx, 0, -6.5, 0.08, 3.2, 0.08, silverMetal, bx === -9.5 || bx === -3.5);
      }
      break;
    }

    case 'yaba': {
      for (const pz of [-4.5, 0.5]) {
        addProp(-6.0, 0, pz, 5.0, 0.85, 1.6, darkMetal);
        addProp(-7.2, 0.88, pz, 1.2, 0.7, 0.08, screenCyan, false);
        addProp(-4.8, 0.88, pz, 1.2, 0.7, 0.08, screenGreen, false);
      }
      // 4 Software Engineers & DevOps Staff
      addNpc(-7.2, -6.0, 0, '#6366f1', '#1e293b', 'idle');
      addNpc(-4.8, -6.0, 0, '#0ea5e9', '#1e293b', 'idle');
      addNpc(-7.2, -1.0, 0, '#10b981', '#1e293b', 'idle');
      addNpc(2.5, -4.5, Math.PI / 2, '#a855f7', '#1e293b', 'idle');
      addStation({
        id: 'int:yaba_code',
        name: 'Senior Software Engineering Pod',
        actionLabel: 'Launch Interactive Coding Sprint',
        x: -6.0,
        z: 2.6,
        color: '#6366f1',
        icon: '👨‍💻',
      });

      for (const sx of [4.5, 6.2, 7.9, 9.6]) {
        addProp(sx, 0, -6.8, 1.25, 2.6, 1.3, darkMetal);
        addProp(sx, 1.6, -6.12, 0.9, 0.22, 0.05, screenGreen, false);
        addProp(sx, 1.1, -6.12, 0.9, 0.22, 0.05, screenCyan, false);
      }
      addStation({
        id: 'int:yaba_servers',
        name: 'Cloud Kubernetes Server Racks',
        actionLabel: 'Start 3D Field & Cloud Developer Job',
        x: 7.0,
        z: -4.2,
        color: '#38bdf8',
        icon: '🖥️',
      });
      break;
    }

    case 'gas': {
      addProp(-6.2, 0, -4.5, 5.8, 1.02, 1.4, darkWood);
      const jerryMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      for (const jx of [-8.2, -7.2, -6.2]) {
        addProp(jx, 0, -2.5, 0.55, 0.75, 0.42, jerryMat, false);
      }
      addNpc(-7.4, -6.0, 0, '#f59e0b', '#1e293b', 'idle', 'cap');
      addNpc(-5.0, -6.0, 0, '#10b981', '#1e293b', 'wave');
      addStation({
        id: 'int:gas_energy',
        name: 'NNPC Fuel, NEPA Bill & Solar Desk',
        actionLabel: 'Buy Generator Fuel, Pay NEPA or Buy Solar',
        x: -6.2,
        z: -1.8,
        color: '#f59e0b',
        icon: '⛽',
      });

      addProp(4.2, 0, -3.5, 0.35, 2.6, 0.35, darkMetal);
      addProp(8.2, 0, -3.5, 0.35, 2.6, 0.35, darkMetal);
      const showCar = buildCar('super', '#ec4899', true);
      showCar.group.position.set(6.2, 0.45, -3.5);
      group.add(showCar.group);
      colliders.push({ minX: 4.5, maxX: 7.9, minZ: -5.9, maxZ: -1.1 });
      // 2 Benny's Mechanics inspecting the car
      addNpc(3.4, -3.5, Math.PI / 2, '#18181b', '#334155', 'idle', 'cap');
      addNpc(9.0, -3.5, -Math.PI / 2, '#18181b', '#334155', 'idle', 'cap');

      addStation({
        id: 'int:gas_bennys',
        name: 'Benny’s Custom Tuning Lift',
        actionLabel: 'Respray, Repair & Turbo-Tune Vehicle',
        x: 6.2,
        z: 0.4,
        color: '#ec4899',
        icon: '🔧',
      });
      break;
    }

    case 'shitta': {
      addProp(0, 0, -6.5, 8.4, 1.05, 1.4, oakWood);
      for (const px of [-2.4, 0, 2.4]) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 0.55, 16), silverMetal);
        pot.position.set(px, 1.32, -6.5);
        group.add(pot);
      }
      // 3 Bukka Chefs & Servers + Diners
      addNpc(-2.4, -8.1, 0, '#ea580c', '#1e293b', 'idle', 'cap');
      addNpc(0, -8.1, 0, '#ea580c', '#1e293b', 'wave');
      addNpc(2.4, -8.1, 0, '#f59e0b', '#1e293b', 'idle');
      addStation({
        id: 'int:amala_counter',
        name: 'Mama Put Hot Amala & Kilishi Counter',
        actionLabel: 'Order Hot Amala, Ewedu & Assorted Meat',
        x: 0,
        z: -4.2,
        color: '#eab308',
        icon: '🍲',
      });

      for (const [tx, tz] of [
        [-6.2, 0.5],
        [6.2, 0.5],
      ] as [number, number][]) {
        addProp(tx, 0, tz, 2.4, 0.8, 1.8, oakWood);
        addNpc(tx, tz - 1.3, 0, '#10b981', '#1e293b', 'sit');
        addNpc(tx, tz + 1.3, Math.PI, '#38bdf8', '#1e293b', 'sit');
      }
      break;
    }

    case 'pillbox': {
      addProp(-5.5, 0, -4.5, 5.2, 1.05, 1.3, darkWood);
      addNpc(-6.8, -6.0, 0, '#0ea5e9', '#0f172a', 'idle');
      addNpc(-4.2, -6.0, 0, '#f8fafc', '#0284c7', 'wave');
      addStation({
        id: 'int:hosp_heal',
        name: 'Chief Surgeon Triage Desk',
        actionLabel: 'Full Trauma Checkup & 100% Heal',
        x: -5.5,
        z: -2.4,
        color: '#f43f5e',
        icon: '🏥',
      });

      for (const bx of [3.5, 7.8]) {
        addProp(bx, 0, -5.5, 2.1, 0.72, 3.6, whiteMat);
        addProp(bx, 0.72, -6.8, 1.6, 0.16, 0.65, velvetTeal, false);
      }
      addNpc(5.6, -5.5, 0, '#10b981', '#0f172a', 'idle');

      addProp(7.5, 0, 2.5, 3.2, 2.1, 1.0, silverMetal);
      addNpc(5.2, 2.5, Math.PI / 2, '#ef4444', '#0f172a', 'salute', 'cap');
      addStation({
        id: 'int:hosp_ems',
        name: 'EMS Paramedic Dispatch Locker',
        actionLabel: 'Clock In: 911 EMS Ambulance Shift',
        x: 7.5,
        z: 4.4,
        color: '#38bdf8',
        icon: '🚑',
      });
      break;
    }

    case 'quilox': {
      const clubCols = [0xd946ef, 0x06b6d4, 0x8b5cf6, 0xf43f5e];
      for (let gx = -1.5; gx <= 1.5; gx += 1) {
        for (let gz = -1.5; gz <= 1.5; gz += 1) {
          const tileCol = clubCols[Math.abs(Math.round(gx + gz * 2)) % clubCols.length];
          const tile = new THREE.Mesh(
            new THREE.BoxGeometry(1.75, 0.05, 1.75),
            new THREE.MeshStandardMaterial({
              color: tileCol,
              emissive: tileCol,
              emissiveIntensity: 0.65,
            })
          );
          tile.position.set(gx * 1.85, 0.03, gz * 1.85);
          group.add(tile);
        }
      }
      addNpc(-1.6, -0.5, 0.6, '#ec4899', '#09090b', 'dance', 'sunglasses');
      addNpc(1.8, 0.4, -0.8, '#38bdf8', '#09090b', 'dance');
      addNpc(-6.8, -2.0, Math.PI / 2, '#f59e0b', '#09090b', 'wave'); // Bartender
      addNpc(2.8, 7.5, Math.PI, '#09090b', '#09090b', 'idle', 'sunglasses'); // VIP Bouncer

      addProp(0, 0, -7.8, 5.2, 1.25, 1.8, darkMetal);
      addProp(0, 1.25, -7.4, 2.4, 0.25, 0.8, screenCyan, false);
      addNpc(0, -8.8, 0, '#a855f7', '#09090b', 'dance', 'sunglasses');

      addProp(7.4, 0, -1.5, 3.6, 0.55, 4.4, velvetPurple);
      addStation({
        id: 'int:quilox_vip',
        name: 'Quilox VVIP Bottle Service Table',
        actionLabel: 'Order Ace of Spades / Azul (+Street Cred)',
        x: 5.0,
        z: -1.5,
        color: '#d946ef',
        icon: '🍾',
      });
      break;
    }

    case 'clothing': {
      addNpc(-5.5, -4.5, 0.4, '#f59e0b', '#0f172a', 'idle', 'sunglasses');
      addNpc(5.5, -4.5, -0.4, '#ec4899', '#f8fafc', 'idle', 'cap');
      addNpc(-2.8, 2.0, Math.PI / 2, '#14b8a6', '#0f172a', 'wave'); // Stylist Worker
      addProp(-6.5, 0, 1.2, 3.8, 1.65, 0.9, silverMetal);
      addProp(6.5, 0, 1.2, 3.8, 1.65, 0.9, silverMetal);

      addProp(0, 0, -6.8, 4.6, 0.25, 2.6, oakWood, false);
      addProp(0, 0.25, -8.2, 3.2, 2.8, 0.15, screenCyan);
      addStation({
        id: 'int:clothing_rack',
        name: '3D Designer Fitting Podium',
        actionLabel: 'Customize Character Outfit, Skin, Cap & Shades',
        x: 0,
        z: -5.2,
        color: '#ec4899',
        icon: '👕',
      });
      break;
    }

    case 'lagoon': {
      addProp(0, 0, -5.8, 6.8, 1.05, 1.4, oakWood);
      addNpc(-1.8, -7.3, 0, '#facc15', '#0f172a', 'wave', 'cap');
      addNpc(1.8, -7.3, 0, '#0ea5e9', '#0f172a', 'idle', 'cap');
      addStation({
        id: 'int:lagoon_dispatch',
        name: 'Waterfront Danfo & Ferry Dispatch',
        actionLabel: 'Start Danfo Conductor Shift',
        x: 0,
        z: -3.6,
        color: '#22d3ee',
        icon: '🚐',
      });
      break;
    }
  }

  return {
    districtId,
    title: cfg.title,
    subtitle: cfg.subtitle,
    group,
    colliders,
    cameraBlockers,
    stations,
    npcs,
    securityCameras,
    animatedRings,
    animatedSprites,
    spawnX: 0,
    spawnZ: halfD - 3.2,
    spawnHeading: Math.PI,
    bounds: {
      minX: -halfW + 0.85,
      maxX: halfW - 0.85,
      minZ: -halfD + 0.85,
      maxZ: halfD - 0.85,
    },
  };
}
