import * as THREE from 'three';
import { Emote } from '@/lib/types';

/**
 * Procedural, jointed humanoid used for the player AND for pedestrians.
 * Forward is +Z. Every limb hangs from a pivot group so it can be rotated like a rig.
 */

export interface HumanoidOptions {
  shirt: string;
  pants: string;
  skin: string;
  hair?: string;
  shoes?: string;
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
  lSh: 0, rSh: 0, lShZ: 0.06, rShZ: -0.06, lEl: -0.1, rEl: -0.1,
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
  phone: THREE.Mesh;
  shades: THREE.Mesh;
  cap: THREE.Group;
  mats: {
    shirt: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    skin: THREE.MeshStandardMaterial;
  };
  pose: Pose;
  phase: number;
}

function capsule(r: number, len: number, mat: THREE.Material, cast: boolean) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
  m.castShadow = cast;
  return m;
}

export function buildHumanoid(opts: HumanoidOptions): Humanoid {
  const cast = opts.castShadow ?? false;
  const shirt = new THREE.MeshStandardMaterial({ color: opts.shirt, roughness: 0.75 });
  const pants = new THREE.MeshStandardMaterial({ color: opts.pants, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: opts.skin, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: opts.hair ?? '#111111', roughness: 0.9 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: opts.shoes ?? '#f4f4f5', roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.3, metalness: 0.6 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // ---- Hips & legs ----
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  body.add(hips);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.22), pants);
  pelvis.castShadow = cast;
  hips.add(pelvis);

  const makeLeg = (side: 1 | -1) => {
    const hip = new THREE.Group();
    hip.position.set(0.1 * side, -0.04, 0);
    hips.add(hip);
    const thigh = capsule(0.075, 0.3, pants, cast);
    thigh.position.y = -0.22;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    const shin = capsule(0.062, 0.3, pants, cast);
    shin.position.y = -0.2;
    knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.25), shoeMat);
    foot.position.set(0, -0.43, 0.05);
    foot.castShadow = cast;
    knee.add(foot);
    return { hip, knee };
  };
  const L = makeLeg(1);
  const R = makeLeg(-1);

  // ---- Spine / torso ----
  const spine = new THREE.Group();
  spine.position.y = 0.06;
  hips.add(spine);

  const chest = capsule(0.17, 0.26, shirt, cast);
  chest.scale.set(1.3, 1, 0.72);
  chest.position.y = 0.27;
  spine.add(chest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 8), skin);
  neck.position.y = 0.58;
  spine.add(neck);

  // ---- Head ----
  const head = new THREE.Group();
  head.position.y = 0.62;
  spine.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 16), skin);
  skull.scale.set(0.92, 1.08, 0.98);
  skull.position.y = 0.12;
  skull.castShadow = cast;
  head.add(skull);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.126, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
    hairMat
  );
  hair.position.y = 0.135;
  hair.scale.set(0.95, 1.05, 1.02);
  head.add(hair);

  const eyeGeo = new THREE.SphereGeometry(0.014, 8, 6);
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(eyeGeo, darkMat);
    eye.position.set(0.04 * s, 0.14, 0.108);
    head.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 6), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.11, 0.12);
  head.add(nose);

  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.03), darkMat);
  shades.position.set(0, 0.145, 0.112);
  shades.visible = opts.hat === 'sunglasses';
  head.add(shades);

  const cap = new THREE.Group();
  const capTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.132, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    shirt
  );
  capTop.position.y = 0.15;
  cap.add(capTop);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.12), shirt);
  brim.position.set(0, 0.155, 0.15);
  cap.add(brim);
  cap.visible = opts.hat === 'cap';
  head.add(cap);

  // ---- Arms ----
  const makeArm = (side: 1 | -1) => {
    const sh = new THREE.Group();
    sh.position.set(0.24 * side, 0.48, 0);
    spine.add(sh);
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), shirt);
    sh.add(shoulderBall);
    const upper = capsule(0.055, 0.2, shirt, cast);
    upper.position.y = -0.15;
    sh.add(upper);
    const el = new THREE.Group();
    el.position.y = -0.3;
    sh.add(el);
    const fore = capsule(0.047, 0.19, skin, cast);
    fore.position.y = -0.13;
    el.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), skin);
    hand.position.y = -0.28;
    hand.scale.set(0.9, 1.1, 0.7);
    el.add(hand);
    return { sh, el };
  };
  const LA = makeArm(1);
  const RA = makeArm(-1);

  // Phone held in the right hand (shown while the phone UI is open)
  const phone = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.15, 0.012),
    new THREE.MeshStandardMaterial({ color: '#111', emissive: '#38bdf8', emissiveIntensity: 0.6 })
  );
  phone.position.set(0, -0.3, 0.05);
  phone.rotation.x = -0.4;
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
 * Compute the target pose for a state and blend the rig towards it.
 * `speed` = horizontal speed in units/sec (drives the walk cycle).
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
    h.phase += dt * Math.max(speed, 1) * (run ? 1.05 : 1.55);
    const s = Math.sin(h.phase);
    const c = Math.cos(h.phase);
    const amp = run ? 0.85 : 0.5;
    p.lHip = -s * amp;
    p.rHip = s * amp;
    p.lKnee = 0.12 + Math.max(0, -c) * (run ? 1.4 : 0.8);
    p.rKnee = 0.12 + Math.max(0, c) * (run ? 1.4 : 0.8);
    p.lSh = s * (run ? 0.9 : 0.45);
    p.rSh = -s * (run ? 0.9 : 0.45);
    p.lEl = run ? -1.3 : -0.3;
    p.rEl = run ? -1.3 : -0.3;
    p.lShZ = 0.1;
    p.rShZ = -0.1;
    p.spineX = run ? 0.22 : 0.04;
    p.spineY = s * (run ? 0.12 : 0.06);
    p.bodyY = Math.abs(s) * (run ? 0.07 : 0.035);
  } else if (state === 'idle') {
    p.spineX = Math.sin(t * 1.6) * 0.015;
    p.lSh = Math.sin(t * 1.6) * 0.03;
    p.rSh = Math.sin(t * 1.6 + 1) * 0.03;
    p.headY = Math.sin(t * 0.35) * 0.35;
    p.headX = Math.sin(t * 0.5) * 0.05;
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

  // Phone overlay: right arm brings phone in front of chest, head tilts down
  if (holdingPhone && (state === 'idle' || state === 'walk')) {
    p.rSh = -0.85;
    p.rShZ = 0.25;
    p.rEl = -1.55;
    p.headX = 0.32;
    p.headY = 0;
  }
  h.phone.visible = holdingPhone && (state === 'idle' || state === 'walk');

  // Blend towards target pose (critically-damped feel)
  const k = 1 - Math.exp(-dt * 12);
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
