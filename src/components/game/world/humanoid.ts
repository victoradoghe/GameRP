import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Emote } from '@/lib/types';

/**
 * High-detail procedural articulated 3D humanoid used for the playable character,
 * city pedestrians, and indoor building staff NPCs.
 * Forward is +Z. Every limb hangs from a pivot group so it animates smoothly.
 */

export interface HumanoidOptions {
  shirt: string;
  pants: string;
  skin: string;
  hair?: string;
  shoes?: string;
  accent?: string;
  hat?: 'none' | 'cap' | 'sunglasses' | 'fila' | 'fedora';
  glasses?: 'none' | 'sunglasses' | 'optical' | 'gold_rim';
  necklace?: 'none' | 'gold_chain' | 'pearls' | 'silver_chain';
  gender?: 'male' | 'female' | 'nonbinary' | 'non-binary';
  age?: number;
  build?: 'slim' | 'athletic' | 'muscular' | 'heavy';
  hairStyle?: 'fade' | 'afro' | 'braids' | 'dreads' | 'waves' | 'bob' | 'buzz' | 'bald';
  hairColor?: string;
  facialHair?: 'none' | 'stubble' | 'goatee' | 'beard';
  outfitStyle?: 'agbada' | 'senator' | 'street' | 'techbro' | 'drip' | 'casual';
  customGlbUrl?: string;
  castShadow?: boolean;
}

export type HumanoidState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'down'
  | Exclude<Emote, 'none'>;

type PoseKey =
  | 'lHip' | 'rHip' | 'lKnee' | 'rKnee'
  | 'lSh' | 'rSh' | 'lShZ' | 'rShZ' | 'lEl' | 'rEl'
  | 'spineX' | 'spineY' | 'headX' | 'headY'
  | 'bodyY' | 'bodyRX' | 'hipsY';

type Pose = Record<PoseKey, number>;

const ZERO_POSE: Pose = {
  lHip: 0, rHip: 0, lKnee: 0, rKnee: 0,
  lSh: 0, rSh: 0, lShZ: 0.07, rShZ: -0.07, lEl: -0.12, rEl: -0.12,
  spineX: 0, spineY: 0, headX: 0, headY: 0,
  bodyY: 0, bodyRX: 0, hipsY: 0,
};

export interface Humanoid {
  root: THREE.Group;
  body: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  head: THREE.Group;
  lShoulder: THREE.Group;
  rShoulder: THREE.Group;
  lElbow: THREE.Group;
  rElbow: THREE.Group;
  lHip: THREE.Group;
  rHip: THREE.Group;
  lKnee: THREE.Group;
  rKnee: THREE.Group;
  phone: THREE.Group;
  shades: THREE.Group;
  cap: THREE.Group;
  fila?: THREE.Group;
  fedora?: THREE.Group;
  beardGroup?: THREE.Group;
  hairGroup?: THREE.Group;
  chainGroup?: THREE.Group;
  mats: {
    shirt: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    skin: THREE.MeshStandardMaterial;
    hair?: THREE.MeshStandardMaterial;
  };
  pose: Pose;
  phase: number;
}

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getContactShadowTexture() {
  if (sharedShadowTex) return sharedShadowTex;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  g.addColorStop(0, 'rgba(0,0,0,0.52)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  sharedShadowTex = new THREE.CanvasTexture(c);
  return sharedShadowTex;
}

function capsule(r: number, len: number, mat: THREE.Material, cast: boolean) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export function buildHumanoid(opts: HumanoidOptions): Humanoid {
  const cast = opts.castShadow ?? false;
  const isFemale = opts.gender === 'female';
  const age = opts.age ?? 26;
  const isElder = age >= 50;
  const build = opts.build ?? 'athletic';
  const buildScale = build === 'heavy' ? 1.16 : build === 'muscular' ? 1.09 : build === 'slim' ? 0.92 : 1.0;
  const outfitStyle = opts.outfitStyle ?? 'street';

  // Materials & Shaders
  const shirt = new THREE.MeshStandardMaterial({
    color: opts.shirt,
    roughness: outfitStyle === 'drip' ? 0.32 : outfitStyle === 'agbada' ? 0.48 : 0.65,
    metalness: outfitStyle === 'drip' ? 0.22 : 0.06,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: opts.pants,
    roughness: 0.76,
    metalness: 0.05,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: opts.skin,
    roughness: 0.46,
    metalness: 0.03,
  });

  // Base hair & elder grey streak logic
  const baseHairColor = opts.hairColor || opts.hair || '#121214';
  const displayHairColor = isElder ? '#71717a' : baseHairColor;
  const hairMat = new THREE.MeshStandardMaterial({
    color: displayHairColor,
    roughness: 0.88,
  });
  const beardMat = new THREE.MeshStandardMaterial({
    color: isElder ? '#52525b' : displayHairColor,
    roughness: 0.9,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: opts.shoes ?? '#f8fafc',
    roughness: 0.38,
    metalness: 0.12,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.52,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.22,
    metalness: 0.75,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.18,
    metalness: 0.94,
  });
  const lipMat = new THREE.MeshStandardMaterial({
    color: isFemale ? '#9f1239' : opts.skin,
    roughness: 0.35,
  });

  const root = new THREE.Group();

  // Grounded contact shadow disc
  const shTex = getContactShadowTexture();
  if (shTex) {
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85 * buildScale, 0.85 * buildScale),
      new THREE.MeshBasicMaterial({
        map: shTex,
        transparent: true,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.015;
    root.add(contactShadow);
  }

  const body = new THREE.Group();
  root.add(body);

  // ---- Hips & Belt ----
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  body.add(hips);

  const hipsWidth = isFemale ? 0.38 * buildScale : 0.35 * buildScale;
  const hipsDepth = isFemale ? 0.25 * buildScale : 0.23 * buildScale;
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(hipsWidth, 0.18, hipsDepth), pants);
  pelvis.castShadow = cast;
  hips.add(pelvis);

  // Female hip curve accents
  if (isFemale) {
    for (const s of [1, -1]) {
      const hipCurve = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), pants);
      hipCurve.scale.set(0.65, 0.9, 0.8);
      hipCurve.position.set((hipsWidth / 2 - 0.02) * s, -0.01, 0);
      hips.add(hipCurve);
    }
  }

  const belt = new THREE.Mesh(new THREE.BoxGeometry(hipsWidth + 0.016, 0.045, hipsDepth + 0.014), darkMat);
  belt.position.y = 0.065;
  hips.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.048, 0.02), goldMat);
  buckle.position.set(0, 0.065, hipsDepth / 2 + 0.007);
  hips.add(buckle);

  const legSpacing = isFemale ? 0.114 * buildScale : 0.102 * buildScale;
  const makeLeg = (side: 1 | -1) => {
    const hip = new THREE.Group();
    hip.position.set(legSpacing * side, -0.04, 0);
    hips.add(hip);

    const thighRadius = (isFemale ? 0.082 : 0.078) * buildScale;
    const thigh = capsule(thighRadius, 0.3, pants, cast);
    thigh.position.y = -0.22;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);

    const shinRadius = 0.064 * buildScale;
    const shin = capsule(shinRadius, 0.3, pants, cast);
    shin.position.y = -0.2;
    knee.add(shin);

    // Designer Sneaker with Tread, Outsole & Laces
    const sneakerGroup = new THREE.Group();
    sneakerGroup.position.set(0, -0.425, 0.048);
    const upperShoe = new THREE.Mesh(new THREE.BoxGeometry(0.115 * buildScale, 0.062, 0.25), shoeMat);
    upperShoe.castShadow = cast;
    const midsole = new THREE.Mesh(new THREE.BoxGeometry(0.122 * buildScale, 0.026, 0.265), soleMat);
    midsole.position.y = -0.032;
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.075 * buildScale, 0.03, 0.07), shirt);
    tongue.position.set(0, 0.03, -0.02);
    // Subtle shoe laces
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.06 * buildScale, 0.008, 0.09), soleMat);
    lace.position.set(0, 0.033, 0.03);
    sneakerGroup.add(upperShoe, midsole, tongue, lace);
    knee.add(sneakerGroup);

    return { hip, knee };
  };
  const L = makeLeg(1);
  const R = makeLeg(-1);

  // ---- Spine / Torso / Bust / Agbada / Senator ----
  const spine = new THREE.Group();
  spine.position.y = 0.06;
  hips.add(spine);

  const chestWidthScale = isFemale ? 1.18 * buildScale : 1.36 * buildScale;
  const chest = capsule(0.172, 0.27, shirt, cast);
  chest.scale.set(chestWidthScale, 1, isFemale ? 0.72 : 0.76);
  chest.position.y = 0.275;
  spine.add(chest);

  // Female Bust Anatomy (Refined subtle curvature)
  if (isFemale) {
    for (const s of [1, -1]) {
      const breast = new THREE.Mesh(new THREE.SphereGeometry(0.068 * buildScale, 14, 12), shirt);
      breast.scale.set(1.0, 0.95, 1.15);
      breast.position.set(0.066 * s, 0.31, 0.115);
      spine.add(breast);
    }
  }

  // Nigerian Traditional Agbada Wings & Embroidered Bib
  if (outfitStyle === 'agbada') {
    // Ornate embroidered central chest bib with golden trim
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.035), shirt);
    bib.position.set(0, 0.29, 0.135);
    const bibTrim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.29, 0.038), goldMat);
    bibTrim.position.set(0, 0.29, 0.136);
    spine.add(bib, bibTrim);
  } else if (outfitStyle === 'senator') {
    // Sharp central button placket
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.36, 0.02), darkMat);
    placket.position.set(0, 0.31, 0.128);
    for (let by = 0.18; by <= 0.44; by += 0.09) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), goldMat);
      btn.position.set(0, by, 0.139);
      spine.add(btn);
    }
    spine.add(placket);
  } else if (outfitStyle === 'street') {
    // Hoodie pouch pocket
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.04), shirt);
    pouch.position.set(0, 0.17, 0.12);
    spine.add(pouch);
  }

  // Collar + Cuban Chain
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.02, 8, 18),
    shirt
  );
  collar.rotation.x = Math.PI / 2 + 0.18;
  collar.position.set(0, 0.52, 0.015);
  spine.add(collar);

  const chainGroup = new THREE.Group();
  const chain = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.009, 8, 20),
    goldMat
  );
  chain.rotation.x = Math.PI / 2 + 0.32;
  chain.position.set(0, 0.495, 0.045);
  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 12), goldMat);
  medallion.position.set(0, 0.42, 0.115);
  medallion.rotation.x = Math.PI / 2;
  chainGroup.add(chain, medallion);
  chainGroup.visible = opts.necklace !== 'none';
  spine.add(chainGroup);

  const neckRadius = (isFemale ? 0.046 : 0.054) * buildScale;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(neckRadius, neckRadius + 0.008, 0.11, 12), skin);
  neck.position.y = 0.58;
  spine.add(neck);

  // ---- Head, Face, Hair, Facial Hair & Accessories ----
  const head = new THREE.Group();
  head.position.y = 0.62;
  spine.add(head);

  const headWidth = isFemale ? 0.88 : 0.94;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.122, 24, 20), skin);
  skull.scale.set(headWidth, 1.08, 0.98);
  skull.position.y = 0.122;
  skull.castShadow = cast;
  head.add(skull);

  // Ears + Earrings
  const earGeo = new THREE.SphereGeometry(0.024, 10, 8);
  for (const s of [1, -1]) {
    const ear = new THREE.Mesh(earGeo, skin);
    ear.scale.set(0.55, 1.1, 0.8);
    ear.position.set(0.112 * s, 0.125, 0);
    head.add(ear);

    if (isFemale || outfitStyle === 'drip') {
      const earring = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), goldMat);
      earring.position.set(0.116 * s, 0.108, 0);
      head.add(earring);
    }
  }

  // Realistic Eyes (Sclera + Iris + Pupil)
  const scleraGeo = new THREE.SphereGeometry(0.018, 10, 10);
  const pupilGeo = new THREE.SphereGeometry(0.009, 8, 8);
  const scleraMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const irisMat = new THREE.MeshBasicMaterial({ color: '#3f2212' });
  for (const s of [1, -1]) {
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.scale.set(1.12, 0.86, 0.5);
    sclera.position.set(0.041 * s, 0.142, 0.106);
    head.add(sclera);

    const iris = new THREE.Mesh(pupilGeo, irisMat);
    iris.position.set(0.041 * s, 0.142, 0.113);
    head.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), darkMat);
    pupil.position.set(0.041 * s, 0.142, 0.116);
    head.add(pupil);

    // Eyelashes & Brows
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.038, isFemale ? 0.006 : 0.009, 0.01), hairMat);
    brow.position.set(0.041 * s, 0.164, 0.112);
    brow.rotation.z = -0.06 * s;
    head.add(brow);
  }

  // Sculpted Nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.044, 10), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.114, 0.122);
  head.add(nose);

  // Lips
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.014, 0.012), lipMat);
  lips.position.set(0, 0.078, 0.116);
  head.add(lips);

  // ---- Hairstyles (Braids, Bob, Afro, Fade, Waves, Dreads) ----
  const hairGroup = new THREE.Group();
  const hairStyle = opts.hairStyle ?? (isFemale ? 'braids' : 'fade');

  if (hairStyle === 'braids') {
    // Voluminous box braids crown + cascading braided cords
    const braidCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.129, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    braidCap.position.y = 0.138;
    hairGroup.add(braidCap);

    // Cascading box braids down back & shoulders
    const braidAngles = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2, -1.2];
    for (const a of braidAngles) {
      const braidCord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.008, 0.36, 6),
        hairMat
      );
      braidCord.position.set(Math.sin(a) * 0.11, 0.02, -Math.cos(a) * 0.09 - 0.02);
      braidCord.rotation.z = Math.sin(a) * 0.15;
      braidCord.rotation.x = 0.22;
      // Gold braid cuff ring
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.015, 8), goldMat);
      cuff.position.y = -0.12;
      braidCord.add(cuff);
      hairGroup.add(braidCord);
    }
  } else if (hairStyle === 'afro') {
    // Voluminous Afro crown
    const afroMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 18, 16),
      hairMat
    );
    afroMesh.scale.set(1.08, 1.15, 1.08);
    afroMesh.position.set(0, 0.18, -0.01);
    hairGroup.add(afroMesh);
  } else if (hairStyle === 'bob') {
    // Chic chin-length bob framing face
    const bobCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.132, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.65),
      hairMat
    );
    bobCap.position.y = 0.135;
    bobCap.scale.set(1.02, 1.12, 1.08);
    hairGroup.add(bobCap);
  } else if (hairStyle === 'dreads') {
    // Dreadlock twist crown + hanging locks
    const dreadCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    dreadCap.position.y = 0.14;
    hairGroup.add(dreadCap);
    for (let di = 0; di < 8; di++) {
      const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.011, 0.22, 6), hairMat);
      const ang = (di / 8) * Math.PI * 1.6 - 0.8;
      lock.position.set(Math.sin(ang) * 0.12, 0.08, -Math.cos(ang) * 0.1);
      hairGroup.add(lock);
    }
  } else if (hairStyle === 'waves') {
    // 360 wave textured cap
    const waveCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.127, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    waveCap.position.y = 0.138;
    waveCap.scale.set(0.96, 1.06, 1.02);
    hairGroup.add(waveCap);
  } else if (hairStyle === 'buzz' || hairStyle === 'bald') {
    if (hairStyle === 'buzz') {
      const buzzCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.124, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.46),
        hairMat
      );
      buzzCap.position.y = 0.136;
      hairGroup.add(buzzCap);
    }
  } else {
    // Modern Taper Fade
    const fadeHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.128, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    fadeHair.position.y = 0.14;
    fadeHair.scale.set(0.96, 1.08, 1.04);
    hairGroup.add(fadeHair);
  }
  head.add(hairGroup);

  // ---- Facial Hair (Beard, Goatee, Stubble) ----
  const beardGroup = new THREE.Group();
  const facialHair = opts.facialHair ?? (!isFemale ? 'stubble' : 'none');
  if (facialHair === 'beard') {
    const fullBeard = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.026, 8, 16, Math.PI),
      beardMat
    );
    fullBeard.rotation.x = Math.PI / 2 + 0.35;
    fullBeard.position.set(0, 0.075, 0.04);
    const chinBeard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.048, 0.04), beardMat);
    chinBeard.position.set(0, 0.04, 0.098);
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.015, 0.02), beardMat);
    mustache.position.set(0, 0.094, 0.118);
    beardGroup.add(fullBeard, chinBeard, mustache);
  } else if (facialHair === 'goatee') {
    const chinGoatee = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.052, 0.035), beardMat);
    chinGoatee.position.set(0, 0.045, 0.1);
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.014, 0.018), beardMat);
    stache.position.set(0, 0.094, 0.118);
    beardGroup.add(chinGoatee, stache);
  } else if (facialHair === 'stubble') {
    const stubbleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), beardMat);
    stubbleMesh.position.set(0, 0.065, 0.106);
    beardGroup.add(stubbleMesh);
  }
  head.add(beardGroup);

  // Designer Sunglasses Group
  const shades = new THREE.Group();
  const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.044, 0.02), darkMat);
  lensL.position.set(0.048, 0.145, 0.116);
  const lensR = lensL.clone();
  lensR.position.x = -0.048;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.015), goldMat);
  bridge.position.set(0, 0.15, 0.118);
  shades.add(lensL, lensR, bridge);
  shades.visible = opts.hat === 'sunglasses' || opts.glasses === 'sunglasses';
  head.add(shades);

  // Streetwear Snapback Cap
  const cap = new THREE.Group();
  const capTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.133, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    shirt
  );
  capTop.position.y = 0.15;
  cap.add(capTop);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.014, 0.13), darkMat);
  brim.position.set(0, 0.156, 0.152);
  cap.add(brim);
  cap.visible = opts.hat === 'cap';
  head.add(cap);

  // Traditional Yoruba Fila Gobi Cap
  const fila = new THREE.Group();
  const filaBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.126, 0.132, 0.11, 16),
    shirt
  );
  filaBody.position.set(0.02, 0.19, -0.01);
  filaBody.rotation.z = -0.18; // angled elegantly to the right
  const filaTopFold = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.16), shirt);
  filaTopFold.position.set(0.035, 0.24, -0.01);
  filaTopFold.rotation.z = -0.22;
  fila.add(filaBody, filaTopFold);
  fila.visible = opts.hat === 'fila';
  head.add(fila);

  // Elder Dignified Fedora
  const fedora = new THREE.Group();
  const fedoraBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.015, 20), darkMat);
  fedoraBrim.position.y = 0.15;
  const fedoraCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.135, 0.08, 16), darkMat);
  fedoraCrown.position.y = 0.19;
  const fedoraRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.136, 0.136, 0.02, 16), goldMat);
  fedoraRibbon.position.y = 0.165;
  fedora.add(fedoraBrim, fedoraCrown, fedoraRibbon);
  fedora.visible = opts.hat === 'fedora';
  head.add(fedora);

  // ---- Arms, Agbada Wide Sleeves + Hands ----
  const shoulderDist = (isFemale ? 0.225 : 0.252) * buildScale;
  const makeArm = (side: 1 | -1) => {
    const sh = new THREE.Group();
    sh.position.set(shoulderDist * side, 0.48, 0);
    spine.add(sh);

    const shoulderRadius = (isFemale ? 0.064 : 0.076) * buildScale;
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(shoulderRadius, 14, 12), shirt);
    sh.add(shoulderBall);

    // Agbada flowing sleeve wing
    if (outfitStyle === 'agbada') {
      const agbadaSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.06), shirt);
      agbadaSleeve.position.set(0.06 * side, -0.16, 0);
      agbadaSleeve.rotation.z = side * -0.18;
      sh.add(agbadaSleeve);
    }

    const armRadius = (isFemale ? 0.048 : 0.058) * buildScale;
    const upper = capsule(armRadius, 0.2, shirt, cast);
    upper.position.y = -0.15;
    sh.add(upper);

    const el = new THREE.Group();
    el.position.y = -0.3;
    sh.add(el);

    const foreRadius = (isFemale ? 0.042 : 0.05) * buildScale;
    const fore = capsule(foreRadius, 0.19, skin, cast);
    fore.position.y = -0.13;
    el.add(fore);

    if (side === 1) {
      // Luxury Presidential Rolex Watch on left wrist
      const watchBand = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.026, 14), goldMat);
      watchBand.position.y = -0.21;
      const watchBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 12), goldMat);
      watchBezel.position.set(0, -0.21, 0.052);
      watchBezel.rotation.x = Math.PI / 2;
      el.add(watchBand, watchBezel);
    }

    // Realistic sculpted hand with palm and fingers
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.27, 0);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.058 * buildScale, 0.065, 0.038), skin);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.028, 6, 8), skin);
    thumb.position.set(0.032 * side, -0.01, 0.018);
    thumb.rotation.z = side * -0.35;
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.052 * buildScale, 0.04, 0.024), skin);
    fingers.position.set(0, -0.042, 0.008);
    handGroup.add(palm, thumb, fingers);
    el.add(handGroup);

    return { sh, el };
  };
  const LA = makeArm(1);
  const RA = makeArm(-1);

  // Smartphone held in the right hand (titanium bezel + glowing OLED glass)
  const phone = new THREE.Group();
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.158, 0.012),
    darkMat
  );
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.072, 0.146),
    new THREE.MeshStandardMaterial({
      color: '#0ea5e9',
      emissive: '#38bdf8',
      emissiveIntensity: 1.4,
      roughness: 0.1,
    })
  );
  phoneScreen.position.z = 0.007;
  phoneScreen.rotation.y = Math.PI;
  const phoneScreenFront = phoneScreen.clone();
  phoneScreenFront.rotation.y = 0;
  phoneScreenFront.position.z = 0.0065;
  phone.add(phoneBody, phoneScreen, phoneScreenFront);
  phone.position.set(0, -0.3, 0.055);
  phone.rotation.x = -0.42;
  phone.visible = false;
  RA.el.add(phone);

  return {
    root,
    body,
    hips,
    spine,
    head,
    lShoulder: LA.sh,
    rShoulder: RA.sh,
    lElbow: LA.el,
    rElbow: RA.el,
    lHip: L.hip,
    rHip: R.hip,
    lKnee: L.knee,
    rKnee: R.knee,
    phone,
    shades,
    cap,
    fila,
    fedora,
    beardGroup,
    hairGroup,
    chainGroup,
    mats: { shirt, pants, skin, hair: hairMat },
    pose: { ...ZERO_POSE },
    phase: Math.random() * 10,
  };
}

/** Update appearance without rebuilding the full mesh */
export function applyOutfit(h: Humanoid, opts: Partial<HumanoidOptions>) {
  if (opts.shirt) h.mats.shirt.color.set(opts.shirt);
  if (opts.pants) h.mats.pants.color.set(opts.pants);
  if (opts.skin) h.mats.skin.color.set(opts.skin);
  if (opts.hair && h.mats.hair) h.mats.hair.color.set(opts.hair);
  if (opts.hat) {
    h.shades.visible = opts.hat === 'sunglasses';
    h.cap.visible = opts.hat === 'cap';
    if (h.fila) h.fila.visible = opts.hat === 'fila';
    if (h.fedora) h.fedora.visible = opts.hat === 'fedora';
  }
}

/**
 * Compute target pose for a state and blend rig smoothly.
 */
export function animateHumanoid(
  h: Humanoid,
  state: HumanoidState,
  speed: number,
  t: number,
  dt: number,
  holdingPhone = false
) {
  const p: Pose = { ...ZERO_POSE };

  if (state === 'walk' || state === 'run') {
    const run = state === 'run';
    h.phase += dt * Math.max(speed, 1) * (run ? 1.08 : 1.55);
    const s = Math.sin(h.phase);
    const c = Math.cos(h.phase);
    const amp = run ? 0.86 : 0.52;
    p.lHip = -s * amp;
    p.rHip = s * amp;
    p.lKnee = 0.12 + Math.max(0, -c) * (run ? 1.38 : 0.78);
    p.rKnee = 0.12 + Math.max(0, c) * (run ? 1.38 : 0.78);
    p.lSh = s * (run ? 0.9 : 0.46);
    p.rSh = -s * (run ? 0.9 : 0.46);
    p.lEl = run ? -1.28 : -0.32;
    p.rEl = run ? -1.28 : -0.32;
    p.lShZ = 0.1;
    p.rShZ = -0.1;
    p.spineX = run ? 0.2 : 0.045;
    p.spineY = s * (run ? 0.13 : 0.065);
    p.bodyY = Math.abs(s) * (run ? 0.072 : 0.036);
  } else if (state === 'idle') {
    p.spineX = Math.sin(t * 1.6) * 0.016;
    p.lSh = Math.sin(t * 1.6) * 0.03;
    p.rSh = Math.sin(t * 1.6 + 1) * 0.03;
    p.headY = Math.sin(t * 0.4) * 0.28;
    p.headX = Math.sin(t * 0.55) * 0.045;
  } else if (state === 'jump') {
    p.lHip = -0.7;
    p.rHip = -0.15;
    p.lKnee = 1.1;
    p.rKnee = 0.5;
    p.lSh = -0.6;
    p.rSh = -0.6;
    p.lShZ = 0.5;
    p.rShZ = -0.5;
    p.lEl = -0.6;
    p.rEl = -0.6;
  } else if (state === 'wave') {
    p.rSh = -2.7;
    p.rShZ = -0.35 + Math.sin(t * 9) * 0.3;
    p.rEl = -0.5 + Math.sin(t * 9) * 0.35;
    p.headY = -0.2;
  } else if (state === 'handsup') {
    p.lSh = -2.95;
    p.rSh = -2.95;
    p.lShZ = 0.3;
    p.rShZ = -0.3;
    p.lEl = -0.35;
    p.rEl = -0.35;
    p.headX = -0.1;
  } else if (state === 'salute') {
    p.rSh = -1.6;
    p.rShZ = -0.9;
    p.rEl = -2.2;
  } else if (state === 'facepalm') {
    p.rSh = -1.3;
    p.rShZ = 0.35;
    p.rEl = -2.3;
    p.headX = 0.35;
    p.spineX = 0.08;
  } else if (state === 'dance') {
    const b = t * 6.5;
    p.bodyY = Math.abs(Math.sin(b)) * 0.09;
    p.spineY = Math.sin(b / 2) * 0.45;
    p.spineX = 0.08;
    p.lSh = -1.3 + Math.sin(b) * 0.7;
    p.rSh = -1.3 + Math.cos(b) * 0.7;
    p.lShZ = 0.4;
    p.rShZ = -0.4;
    p.lEl = -1.3;
    p.rEl = -1.3;
    p.lHip = Math.sin(b) * 0.3;
    p.rHip = -Math.sin(b) * 0.3;
    p.lKnee = 0.3 + Math.max(0, Math.sin(b)) * 0.4;
    p.rKnee = 0.3 + Math.max(0, -Math.sin(b)) * 0.4;
    p.headX = Math.sin(b * 2) * 0.12;
  } else if (state === 'sit') {
    p.hipsY = -0.5;
    p.lHip = -1.5;
    p.rHip = -1.5;
    p.lKnee = 1.5;
    p.rKnee = 1.5;
    p.lSh = -0.3;
    p.rSh = -0.3;
    p.lEl = -0.9;
    p.rEl = -0.9;
    p.headY = Math.sin(t * 0.4) * 0.3;
  } else if (state === 'pushups') {
    const b = (Math.sin(t * 3.2) + 1) / 2;
    p.bodyRX = 1.32;
    p.bodyY = 0.22 + b * 0.18;
    p.lSh = -1.45;
    p.rSh = -1.45;
    p.lEl = -0.2 - (1 - b) * 0.9;
    p.rEl = -0.2 - (1 - b) * 0.9;
    p.headX = -0.4;
  } else if (state === 'down') {
    p.bodyRX = -1.5;
    p.bodyY = 0.15;
    p.lSh = -0.4;
    p.rSh = 0.3;
    p.lShZ = 0.9;
    p.rShZ = -0.6;
    p.lKnee = 0.4;
  }

  if (holdingPhone && (state === 'idle' || state === 'walk')) {
    p.rSh = -0.85;
    p.rShZ = 0.25;
    p.rEl = -1.55;
    p.headX = 0.32;
    p.headY = 0;
  }
  h.phone.visible = holdingPhone && (state === 'idle' || state === 'walk');

  const k = 1 - Math.exp(-dt * 13);
  (Object.keys(p) as PoseKey[]).forEach((key) => {
    h.pose[key] += (p[key] - h.pose[key]) * k;
  });

  const c = h.pose;
  h.lHip.rotation.x = c.lHip;
  h.rHip.rotation.x = c.rHip;
  h.lKnee.rotation.x = c.lKnee;
  h.rKnee.rotation.x = c.rKnee;
  h.lShoulder.rotation.x = c.lSh;
  h.rShoulder.rotation.x = c.rSh;
  h.lShoulder.rotation.z = c.lShZ;
  h.rShoulder.rotation.z = c.rShZ;
  h.lElbow.rotation.x = c.lEl;
  h.rElbow.rotation.x = c.rEl;
  h.spine.rotation.x = c.spineX;
  h.spine.rotation.y = c.spineY;
  h.head.rotation.x = c.headX;
  h.head.rotation.y = c.headY;
  h.body.position.y = c.bodyY;
  h.body.rotation.x = c.bodyRX;
  h.hips.position.y = 0.95 + c.hipsY;
}

/**
 * Loads an external industry-standard rigged 3D character (GLB/GLTF)
 * and prepares it for optimal rendering and lighting.
 */
export async function loadGlbAvatar(url: string): Promise<THREE.Group | null> {
  return new Promise((resolve) => {
    try {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          resolve(model);
        },
        undefined,
        (err) => {
          console.warn('Custom GLB avatar load error:', err);
          resolve(null);
        }
      );
    } catch (e) {
      console.warn('GLTFLoader initialize error:', e);
      resolve(null);
    }
  });
}
