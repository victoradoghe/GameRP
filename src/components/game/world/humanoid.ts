import * as THREE from 'three';
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
  hat?: 'none' | 'cap' | 'sunglasses';
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
  mats: {
    shirt: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    skin: THREE.MeshStandardMaterial;
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
  const shirt = new THREE.MeshStandardMaterial({
    color: opts.shirt,
    roughness: 0.62,
    metalness: 0.08,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: opts.pants,
    roughness: 0.78,
    metalness: 0.05,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: opts.skin,
    roughness: 0.52,
    metalness: 0.04,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: opts.hair ?? '#121214',
    roughness: 0.85,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: opts.shoes ?? '#f8fafc',
    roughness: 0.4,
    metalness: 0.12,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.55,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.22,
    metalness: 0.75,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.2,
    metalness: 0.92,
  });

  const root = new THREE.Group();

  // Grounded contact shadow disc so character never floats on indoor/outdoor floors
  const shTex = getContactShadowTexture();
  if (shTex) {
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.85),
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

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.23), pants);
  pelvis.castShadow = cast;
  hips.add(pelvis);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.365, 0.045, 0.242), darkMat);
  belt.position.y = 0.065;
  hips.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.048, 0.02), goldMat);
  buckle.position.set(0, 0.065, 0.122);
  hips.add(buckle);

  const makeLeg = (side: 1 | -1) => {
    const hip = new THREE.Group();
    hip.position.set(0.102 * side, -0.04, 0);
    hips.add(hip);

    const thigh = capsule(0.078, 0.3, pants, cast);
    thigh.position.y = -0.22;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);

    const shin = capsule(0.064, 0.3, pants, cast);
    shin.position.y = -0.2;
    knee.add(shin);

    // Two-tone sneaker
    const sneakerGroup = new THREE.Group();
    sneakerGroup.position.set(0, -0.425, 0.048);
    const upperShoe = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.062, 0.25), shoeMat);
    upperShoe.castShadow = cast;
    const midsole = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.026, 0.265), soleMat);
    midsole.position.y = -0.032;
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.03, 0.07), shirt);
    tongue.position.set(0, 0.03, -0.02);
    sneakerGroup.add(upperShoe, midsole, tongue);
    knee.add(sneakerGroup);

    return { hip, knee };
  };
  const L = makeLeg(1);
  const R = makeLeg(-1);

  // ---- Spine / Torso / Collar / Gold Chain ----
  const spine = new THREE.Group();
  spine.position.y = 0.06;
  hips.add(spine);

  const chest = capsule(0.172, 0.27, shirt, cast);
  chest.scale.set(1.32, 1, 0.74);
  chest.position.y = 0.275;
  spine.add(chest);

  // Collar + subtle luxury chain
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.02, 8, 18),
    shirt
  );
  collar.rotation.x = Math.PI / 2 + 0.18;
  collar.position.set(0, 0.52, 0.015);
  spine.add(collar);

  const chain = new THREE.Mesh(
    new THREE.TorusGeometry(0.078, 0.007, 6, 18),
    goldMat
  );
  chain.rotation.x = Math.PI / 2 + 0.32;
  chain.position.set(0, 0.495, 0.045);
  spine.add(chain);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.11, 10), skin);
  neck.position.y = 0.58;
  spine.add(neck);

  // ---- Head, Face, Hair & Accessories ----
  const head = new THREE.Group();
  head.position.y = 0.62;
  spine.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.122, 22, 18), skin);
  skull.scale.set(0.93, 1.08, 0.98);
  skull.position.y = 0.122;
  skull.castShadow = cast;
  head.add(skull);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.024, 8, 8);
  for (const s of [1, -1]) {
    const ear = new THREE.Mesh(earGeo, skin);
    ear.scale.set(0.55, 1.1, 0.8);
    ear.position.set(0.112 * s, 0.125, 0);
    head.add(ear);
  }

  // Modern tapered fade / textured hair crown
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.127, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
    hairMat
  );
  hair.position.y = 0.138;
  hair.scale.set(0.96, 1.07, 1.03);
  head.add(hair);

  // Eyes + Eyebrows + Whites
  const scleraGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const pupilGeo = new THREE.SphereGeometry(0.01, 8, 8);
  const scleraMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  for (const s of [1, -1]) {
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.scale.set(1.1, 0.85, 0.5);
    sclera.position.set(0.041 * s, 0.142, 0.106);
    head.add(sclera);

    const pupil = new THREE.Mesh(pupilGeo, darkMat);
    pupil.position.set(0.041 * s, 0.142, 0.114);
    head.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.008, 0.01), hairMat);
    brow.position.set(0.041 * s, 0.163, 0.112);
    brow.rotation.z = -0.06 * s;
    head.add(brow);
  }

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.042, 8), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.114, 0.122);
  head.add(nose);

  // Designer Sunglasses Group
  const shades = new THREE.Group();
  const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.044, 0.02), darkMat);
  lensL.position.set(0.048, 0.145, 0.116);
  const lensR = lensL.clone();
  lensR.position.x = -0.048;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.015), goldMat);
  bridge.position.set(0, 0.15, 0.118);
  shades.add(lensL, lensR, bridge);
  shades.visible = opts.hat === 'sunglasses';
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

  // ---- Arms + Luxury Wristwatch ----
  const makeArm = (side: 1 | -1) => {
    const sh = new THREE.Group();
    sh.position.set(0.242 * side, 0.48, 0);
    spine.add(sh);

    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), shirt);
    sh.add(shoulderBall);

    const upper = capsule(0.056, 0.2, shirt, cast);
    upper.position.y = -0.15;
    sh.add(upper);

    const el = new THREE.Group();
    el.position.y = -0.3;
    sh.add(el);

    const fore = capsule(0.048, 0.19, skin, cast);
    fore.position.y = -0.13;
    el.add(fore);

    if (side === 1) {
      // Wristwatch on left arm
      const watchBand = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.025, 12), goldMat);
      watchBand.position.y = -0.22;
      el.add(watchBand);
    }

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), skin);
    hand.position.y = -0.28;
    hand.scale.set(0.9, 1.1, 0.72);
    el.add(hand);

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
    mats: { shirt, pants, skin },
    pose: { ...ZERO_POSE },
    phase: Math.random() * 10,
  };
}

/** Update appearance without rebuilding the mesh */
export function applyOutfit(h: Humanoid, opts: Partial<HumanoidOptions>) {
  if (opts.shirt) h.mats.shirt.color.set(opts.shirt);
  if (opts.pants) h.mats.pants.color.set(opts.pants);
  if (opts.skin) h.mats.skin.color.set(opts.skin);
  if (opts.hat) {
    h.shades.visible = opts.hat === 'sunglasses';
    h.cap.visible = opts.hat === 'cap';
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
