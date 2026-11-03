import * as THREE from 'three';
import { VehicleCategory } from '@/lib/types';
import { buildPlane } from './planeModel';

export interface CarModel {
  group: THREE.Group;
  frontWheels: THREE.Group[]; // steer pivots
  wheelMeshes: THREE.Mesh[]; // spin
  paintMat: THREE.MeshStandardMaterial;
  tailMat: THREE.MeshStandardMaterial;
  headMat: THREE.MeshStandardMaterial;
  barRed?: THREE.MeshStandardMaterial;
  barBlue?: THREE.MeshStandardMaterial;
  gearGroup?: THREE.Group;
  contrailGroup?: THREE.Group;
  fanMeshes?: THREE.Mesh[];
  strobeMat?: THREE.MeshStandardMaterial;
  radius: number;
}

const DIMS: Record<
  Exclude<VehicleCategory, 'motorcycle' | 'plane'>,
  { w: number; l: number; bodyH: number; cabH: number; cabL: number; cabZ: number; ride: number }
> = {
  super: { w: 2.06, l: 4.68, bodyH: 0.48, cabH: 0.43, cabL: 1.98, cabZ: -0.16, ride: 0.3 },
  sedan: { w: 1.96, l: 4.72, bodyH: 0.62, cabH: 0.56, cabL: 2.36, cabZ: -0.18, ride: 0.35 },
  police: { w: 2.02, l: 4.88, bodyH: 0.65, cabH: 0.57, cabL: 2.38, cabZ: -0.2, ride: 0.37 },
  suv: { w: 2.18, l: 4.82, bodyH: 0.9, cabH: 0.8, cabL: 3.08, cabZ: -0.3, ride: 0.47 },
  transit: { w: 2.12, l: 4.98, bodyH: 1.02, cabH: 1.04, cabL: 4.38, cabZ: -0.16, ride: 0.43 },
};

let carShadowTex: THREE.CanvasTexture | null = null;
function getCarShadowTexture() {
  if (carShadowTex) return carShadowTex;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 128, 18, 64, 128, 118);
  g.addColorStop(0, 'rgba(0,0,0,0.72)');
  g.addColorStop(0.65, 'rgba(0,0,0,0.34)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  carShadowTex = new THREE.CanvasTexture(c);
  return carShadowTex;
}

function buildMotorcycle(color: string, castShadow = true): CarModel {
  const group = new THREE.Group();

  const paint = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.72,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    metalness: 0.75,
    roughness: 0.32,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: '#52525b',
    metalness: 0.88,
    roughness: 0.28,
  });

  const goldForkMat = new THREE.MeshStandardMaterial({
    color: '#eab308',
    metalness: 0.92,
    roughness: 0.18,
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: '#e4e4e7',
    metalness: 0.95,
    roughness: 0.14,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.78,
    metalness: 0.08,
  });

  const headMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e0f2fe',
    emissiveIntensity: 1.2,
  });

  const tailMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    emissive: '#ef4444',
    emissiveIntensity: 1.1,
  });

  const shTex = getCarShadowTexture();
  if (shTex) {
    const ao = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 2.55),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.018;
    group.add(ao);
  }

  // Exposed V4 Engine Block + Crankcase + Radiator
  const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.48), engineMat);
  engineBlock.position.set(0, 0.48, 0.05);
  engineBlock.castShadow = castShadow;
  group.add(engineBlock);

  const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.08), frameMat);
  radiator.position.set(0, 0.54, 0.36);
  radiator.rotation.x = 0.26;
  group.add(radiator);

  // Tubular Trellis Frame Spars
  for (const sx of [1, -1]) {
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.78, 8), frameMat);
    spar.rotation.x = 1.18;
    spar.position.set(sx * 0.17, 0.72, 0.16);
    group.add(spar);

    // Rider Footpegs
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.13, 8), chrome);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(sx * 0.24, 0.34, -0.12);
    group.add(peg);
  }

  // Sculpted Fuel Tank
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.62), paint);
  tank.position.set(0, 0.84, 0.14);
  tank.rotation.x = -0.12;
  tank.castShadow = castShadow;
  group.add(tank);

  const tankCap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12), chrome);
  tankCap.position.set(0, 0.98, 0.2);
  group.add(tankCap);

  // Side Aero Fairings
  for (const sx of [1, -1]) {
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.38, 0.66), paint);
    fairing.position.set(sx * 0.2, 0.62, 0.28);
    fairing.rotation.x = 0.22;
    fairing.castShadow = castShadow;
    group.add(fairing);
  }

  // Stepped Sport Saddle + Upswept Tail Cowl
  const riderSeat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.44), leatherMat);
  riderSeat.position.set(0, 0.78, -0.28);
  group.add(riderSeat);

  const tailCowl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.46), paint);
  tailCowl.position.set(0, 0.89, -0.64);
  tailCowl.rotation.x = 0.18;
  tailCowl.castShadow = castShadow;
  group.add(tailCowl);

  // Rear LED Taillight + Fender Eliminator Plate
  const tailLed = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.055, 0.05), tailMat);
  tailLed.position.set(0, 0.91, -0.88);
  group.add(tailLed);

  // Optional ChopChop / Dispatch Insulated Cargo Box for Orange Commuter Bikes
  const lowerHex = color.toLowerCase();
  if (lowerHex === '#f97316' || lowerHex === '#fb923c') {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.38, 0.42),
      new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.35 })
    );
    box.position.set(0, 1.12, -0.68);
    box.castShadow = castShadow;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.06, 0.43),
      new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#facc15', emissiveIntensity: 0.4 })
    );
    stripe.position.set(0, 1.12, -0.68);
    group.add(box, stripe);
  }

  // Swingarm + Upswept Titanium Exhaust Canister
  const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.62), frameMat);
  swingarm.position.set(0, 0.36, -0.44);
  group.add(swingarm);

  const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.56, 12), chrome);
  exhaustPipe.rotation.x = Math.PI / 2 - 0.32;
  exhaustPipe.position.set(0.22, 0.46, -0.48);
  group.add(exhaustPipe);

  // Wheels & Gold Brake Discs
  const tyreMat = new THREE.MeshStandardMaterial({ color: '#111113', roughness: 0.86 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.85, roughness: 0.22 });

  const makeMotoWheel = (radius: number, width: number) => {
    const wGroup = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 22), tyreMat);
    wGroup.rotation.z = Math.PI / 2;
    wGroup.castShadow = castShadow;

    const innerRim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.012, 16),
      rimMat
    );
    wGroup.add(innerRim);

    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, width + 0.025, 16),
      goldForkMat
    );
    wGroup.add(disc);
    return wGroup;
  };

  const wheelMeshes: THREE.Mesh[] = [];
  const frontWheels: THREE.Group[] = [];

  // Rear Drive Wheel
  const rearPivot = new THREE.Group();
  rearPivot.position.set(0, 0.34, -0.74);
  const rearWheel = makeMotoWheel(0.34, 0.19);
  rearPivot.add(rearWheel);
  group.add(rearPivot);
  wheelMeshes.push(rearWheel);

  // Steerable Front Fork Assembly + Nose Fairing + Handlebars + TFT Dash + Front Wheel
  const steerPivot = new THREE.Group();
  steerPivot.position.set(0, 0.33, 0.74);

  const frontWheel = makeMotoWheel(0.33, 0.14);
  steerPivot.add(frontWheel);
  wheelMeshes.push(frontWheel);

  // Front mudguard
  const fender = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.34), paint);
  fender.position.set(0, 0.28, 0.02);
  steerPivot.add(fender);

  // Dual Gold USD Telescopic Forks
  for (const sx of [1, -1]) {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.76, 10), goldForkMat);
    fork.rotation.x = -0.34;
    fork.position.set(sx * 0.11, 0.34, -0.12);
    steerPivot.add(fork);
  }

  // Nose Cowl + Twin Matrix Headlight + Tinted Windscreen Bubble
  const noseCowl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.34), paint);
  noseCowl.position.set(0, 0.62, -0.06);
  noseCowl.rotation.x = 0.25;
  steerPivot.add(noseCowl);

  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.06), headMat);
  headlight.position.set(0, 0.58, 0.12);
  steerPivot.add(headlight);

  const windscreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.26),
    new THREE.MeshPhysicalMaterial({
      color: '#020617',
      roughness: 0.05,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1,
    })
  );
  windscreen.position.set(0, 0.8, -0.14);
  windscreen.rotation.x = -0.52;
  steerPivot.add(windscreen);

  // Handlebars + Grips + Bar-end Mirrors + Glowing TFT Cluster
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.68, 10), chrome);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 0.72, -0.24);
  steerPivot.add(bar);

  const tftScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.08, 0.02),
    new THREE.MeshStandardMaterial({
      color: '#0ea5e9',
      emissive: '#38bdf8',
      emissiveIntensity: 0.9,
    })
  );
  tftScreen.position.set(0, 0.76, -0.18);
  tftScreen.rotation.x = -0.5;
  steerPivot.add(tftScreen);

  for (const sx of [1, -1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 8), leatherMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(sx * 0.3, 0.72, -0.24);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.03), frameMat);
    mirror.position.set(sx * 0.37, 0.8, -0.22);
    steerPivot.add(grip, mirror);
  }

  group.add(steerPivot);
  frontWheels.push(steerPivot);

  return {
    group,
    frontWheels,
    wheelMeshes,
    paintMat: paint,
    tailMat,
    headMat,
    radius: 1.05,
  };
}

export function buildCar(category: VehicleCategory, color: string, castShadow = true): CarModel {
  if (category === 'plane') {
    const planeAccent =
      color.toLowerCase() === '#0f172a' || color.toLowerCase() === '#18181b'
        ? '#f59e0b'
        : '#0284c7';
    const p = buildPlane(color, planeAccent, 0.86, castShadow);
    return {
      group: p.group,
      frontWheels: p.frontWheels,
      wheelMeshes: p.wheelMeshes,
      paintMat: p.paintMat,
      tailMat: p.tailMat,
      headMat: p.headMat,
      gearGroup: p.gearGroup,
      contrailGroup: p.contrailGroup,
      fanMeshes: p.fanMeshes,
      strobeMat: p.strobeMat,
      radius: p.radius,
    };
  }

  if (category === 'motorcycle') {
    return buildMotorcycle(color, castShadow);
  }

  const d = DIMS[category];
  const group = new THREE.Group();

  // Automotive Multi-Stage Clearcoat Physical Paint
  const paint = new THREE.MeshPhysicalMaterial({
    color: category === 'police' ? '#0b1120' : color,
    metalness: category === 'transit' ? 0.35 : category === 'super' ? 0.85 : 0.68,
    roughness: category === 'transit' ? 0.34 : category === 'super' ? 0.12 : 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  // Realistic Semi-Transparent Tinted Glass so 3D Interior Cabin is Visible
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#0b1324',
    metalness: 0.12,
    roughness: 0.04,
    transmission: 0.42,
    transparent: true,
    opacity: 0.58,
    clearcoat: 1.0,
  });

  const trim = new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.42,
    metalness: 0.45,
  });

  const interiorLeather = new THREE.MeshStandardMaterial({
    color: category === 'super' ? '#1c1917' : '#18181b',
    roughness: 0.72,
    metalness: 0.1,
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: '#e4e4e7',
    roughness: 0.14,
    metalness: 0.95,
  });

  // Soft Ground Contact Shadow
  const shTex = getCarShadowTexture();
  if (shTex) {
    const ao = new THREE.Mesh(
      new THREE.PlaneGeometry(d.w * 1.34, d.l * 1.25),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.018;
    group.add(ao);
  }

  // Lower main chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.bodyH, d.l * 0.92), paint);
  body.position.y = d.ride + d.bodyH / 2;
  body.castShadow = castShadow;
  body.receiveShadow = true;
  group.add(body);

  // Sculpted Aerodynamic Sloped Front Hood & Nose Cone
  if (category !== 'transit') {
    const hoodLen = d.l * 0.28;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.94, 0.12, hoodLen), paint);
    hood.position.set(0, d.ride + d.bodyH - 0.02, d.l * 0.34);
    hood.rotation.x = category === 'super' ? 0.14 : 0.08;
    hood.castShadow = castShadow;
    group.add(hood);

    // Front aero nose wedge
    const nose = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.96, d.bodyH * 0.78, 0.36), paint);
    nose.position.set(0, d.ride + d.bodyH * 0.4, d.l * 0.47);
    nose.castShadow = castShadow;
    group.add(nose);

    // Rear trunk deck
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.95, d.bodyH * 0.88, 0.34), paint);
    trunk.position.set(0, d.ride + d.bodyH * 0.46, -d.l * 0.47);
    trunk.castShadow = castShadow;
    group.add(trunk);
  }

  // Side skirts, flush door handles & sculpted wheel arch flares
  for (const sx of [1, -1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, d.l * 0.62), trim);
    skirt.position.set(sx * (d.w / 2 + 0.01), d.ride + 0.06, 0);
    group.add(skirt);

    // Flush Chrome/Carbon Door Handles
    for (const handleZ of [0.24, -0.58]) {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.035, 0.17),
        category === 'super' ? trim : chrome
      );
      handle.position.set(sx * (d.w / 2 + 0.015), d.ride + d.bodyH * 0.78, handleZ);
      group.add(handle);
    }

    // Wheel arch flares
    for (const sz of [1, -1]) {
      const flare = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.84), trim);
      flare.position.set(sx * (d.w / 2 + 0.01), d.ride + 0.16, sz * d.l * 0.32);
      group.add(flare);
    }
  }

  // Front Splitter, Grille & Rear Aero Diffuser
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.99, 0.16, 0.26), trim);
  bumperF.position.set(0, d.ride + 0.08, d.l / 2 + 0.03);
  group.add(bumperF);

  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(d.w * 0.58, d.bodyH * 0.48, 0.06),
    category === 'suv' ? chrome : trim
  );
  grille.position.set(0, d.ride + d.bodyH * 0.44, d.l / 2 + 0.02);
  group.add(grille);

  const bumperR = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.98, 0.2, 0.24), trim);
  bumperR.position.set(0, d.ride + 0.1, -d.l / 2 - 0.02);
  group.add(bumperR);

  // Nigerian Green-White-Green License Plates (Front & Rear)
  const plateMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
  const plateGreen = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.4 });
  for (const zSign of [1, -1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.02), plateMat);
    plate.position.set(0, d.ride + 0.16, zSign * (d.l / 2 + 0.16));
    const pBand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.022), plateGreen);
    pBand.position.set(0, d.ride + 0.195, zSign * (d.l / 2 + 0.16));
    group.add(plate, pBand);
  }

  // Dual Chrome Exhaust Tips
  for (const sx of [1, -1]) {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 12), chrome);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(sx * d.w * 0.29, d.ride + 0.08, -d.l / 2 - 0.12);
    group.add(exhaust);
  }

  // 3D Interior Cabin (Visible through Tinted Glass!)
  const cabFloorY = d.ride + d.bodyH - 0.04;
  const dash = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.78, 0.22, 0.36), interiorLeather);
  dash.position.set(0, cabFloorY + 0.14, d.cabZ + d.cabL * 0.34);
  group.add(dash);

  // Glowing Infotainment Screen on Dashboard
  const navScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.12, 0.02),
    new THREE.MeshStandardMaterial({
      color: '#0ea5e9',
      emissive: '#38bdf8',
      emissiveIntensity: 0.75,
    })
  );
  navScreen.position.set(0, cabFloorY + 0.25, d.cabZ + d.cabL * 0.28);
  group.add(navScreen);

  // Driver Steering Wheel (Left-hand drive, +X side when facing +Z)
  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.022, 8, 16),
    trim
  );
  steeringWheel.position.set(d.w * 0.21, cabFloorY + 0.24, d.cabZ + d.cabL * 0.22);
  steeringWheel.rotation.x = -0.35;
  group.add(steeringWheel);

  // Front Sport Bucket Seats + Headrests
  for (const sx of [1, -1]) {
    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, d.cabH * 0.72, 0.12),
      interiorLeather
    );
    seatBack.position.set(sx * d.w * 0.21, cabFloorY + d.cabH * 0.34, d.cabZ - 0.05);
    seatBack.rotation.x = -0.14;
    const headrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.09),
      interiorLeather
    );
    headrest.position.set(sx * d.w * 0.21, cabFloorY + d.cabH * 0.72, d.cabZ - 0.09);
    group.add(seatBack, headrest);
  }

  // Cabin Glasshouse + Angled Windshield/Rear Glass + Roof + Shark-Fin Antenna
  const cabY = d.ride + d.bodyH + d.cabH / 2;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.85, d.cabH, d.cabL * 0.82), glass);
  cabin.position.set(0, cabY, d.cabZ);
  group.add(cabin);

  // Raked Front Windshield & Rear Fastback Glass
  if (category !== 'transit') {
    const frontWindshield = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.83, d.cabH * 1.12, 0.06),
      glass
    );
    frontWindshield.position.set(0, cabY - 0.01, d.cabZ + d.cabL * 0.45);
    frontWindshield.rotation.x = category === 'super' ? -0.68 : -0.52;
    group.add(frontWindshield);

    const rearWindshield = new THREE.Mesh(
      new THREE.BoxGeometry(d.w * 0.82, d.cabH * 1.08, 0.06),
      glass
    );
    rearWindshield.position.set(0, cabY - 0.01, d.cabZ - d.cabL * 0.45);
    rearWindshield.rotation.x = category === 'super' ? 0.72 : category === 'suv' ? 0.22 : 0.54;
    group.add(rearWindshield);
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.84, 0.068, d.cabL * 0.76), paint);
  roof.position.set(0, cabY + d.cabH / 2 + 0.028, d.cabZ);
  roof.castShadow = castShadow;
  group.add(roof);

  // Shark-fin GPS / 5G Roof Antenna
  if (category !== 'transit' && category !== 'police') {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.18), trim);
    fin.position.set(0, cabY + d.cabH / 2 + 0.08, d.cabZ - d.cabL * 0.28);
    fin.rotation.x = 0.25;
    group.add(fin);
  }

  // Sculpted Side Wing Mirrors on Stems
  if (category !== 'transit') {
    for (const sx of [1, -1]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.085, 0.12), paint);
      mirror.position.set(sx * (d.w * 0.49), d.ride + d.bodyH + 0.13, d.cabZ + d.cabL * 0.34);
      group.add(mirror);
    }
  }

  // Angled Roof A/C Pillars
  for (const sx of [1, -1]) {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.065, d.cabH * 1.08, 0.07), paint);
    aPillar.position.set(sx * d.w * 0.415, cabY, d.cabZ + d.cabL * 0.44);
    aPillar.rotation.x = category === 'transit' ? -0.12 : -0.48;
    const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.075, d.cabH * 1.06, 0.09), paint);
    cPillar.position.set(sx * d.w * 0.415, cabY, d.cabZ - d.cabL * 0.44);
    cPillar.rotation.x = category === 'transit' ? 0.08 : category === 'suv' ? 0.2 : 0.48;
    group.add(aPillar, cPillar);
  }

  // Category-specific signature details
  if (category === 'transit') {
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.5 });
    for (const y of [d.ride + 0.34, d.ride + 0.66]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(d.w + 0.025, 0.095, d.l * 0.94), stripeMat);
      s.position.y = y;
      group.add(s);
    }
    const rack = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.8, 0.08, d.cabL * 0.72), trim);
    rack.position.set(0, cabY + d.cabH / 2 + 0.1, d.cabZ);
    group.add(rack);
  }
  if (category === 'police') {
    const doors = new THREE.Mesh(
      new THREE.BoxGeometry(d.w + 0.024, d.bodyH * 0.72, d.l * 0.44),
      new THREE.MeshPhysicalMaterial({ color: '#f8fafc', roughness: 0.25, clearcoat: 0.8 })
    );
    doors.position.set(0, d.ride + d.bodyH / 2, -0.08);
    group.add(doors);
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.54, 0.38, 0.12), trim);
    bullbar.position.set(0, d.ride + 0.26, d.l / 2 + 0.16);
    group.add(bullbar);
  }
  if (category === 'suv') {
    const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 18), paint);
    spare.rotation.x = Math.PI / 2;
    spare.position.set(0, d.ride + d.bodyH * 0.75, -d.l / 2 - 0.1);
    const spareRing = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.16, 18), chrome);
    spareRing.rotation.x = Math.PI / 2;
    spareRing.position.copy(spare.position);
    group.add(spare, spareRing);
  }
  if (category === 'sedan') {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.17, 0.22),
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#facc15',
        emissiveIntensity: 0.9,
      })
    );
    sign.position.set(0, cabY + d.cabH / 2 + 0.14, d.cabZ);
    group.add(sign);
  }
  if (category === 'super') {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.96, 0.05, 0.4), trim);
    wing.position.set(0, d.ride + d.bodyH + 0.3, -d.l / 2 + 0.26);
    group.add(wing);
    for (const sx of [1, -1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.12), trim);
      strut.position.set(sx * 0.58, d.ride + d.bodyH + 0.15, -d.l / 2 + 0.26);
      group.add(strut);
    }
  }

  // Matrix LED Headlights + Boomerang DRLs + Full-Width Cyber Taillight Bar
  const headMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e0f2fe',
    emissiveIntensity: 0.95,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    emissive: '#ef4444',
    emissiveIntensity: 1.0,
  });
  for (const sx of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.06), headMat);
    hl.position.set(sx * d.w * 0.33, d.ride + d.bodyH * 0.68, d.l / 2 + 0.02);
    hl.rotation.z = sx * -0.08;
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.11, 0.06), tailMat);
    tl.position.set(sx * d.w * 0.33, d.ride + d.bodyH * 0.72, -d.l / 2 - 0.02);
    group.add(tl);
  }
  if (category === 'super' || category === 'suv' || category === 'sedan') {
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.84, 0.045, 0.055), tailMat);
    lightBar.position.set(0, d.ride + d.bodyH * 0.74, -d.l / 2 - 0.022);
    group.add(lightBar);
  }

  let barRed: THREE.MeshStandardMaterial | undefined;
  let barBlue: THREE.MeshStandardMaterial | undefined;
  if (category === 'police') {
    barRed = new THREE.MeshStandardMaterial({
      color: '#991b1b',
      emissive: '#ef4444',
      emissiveIntensity: 0.35,
    });
    barBlue = new THREE.MeshStandardMaterial({
      color: '#1e40af',
      emissive: '#3b82f6',
      emissiveIntensity: 0.35,
    });
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.26), barRed);
    r.position.set(-0.31, cabY + d.cabH / 2 + 0.1, d.cabZ);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.26), barBlue);
    b.position.set(0.31, cabY + d.cabH / 2 + 0.1, d.cabZ);
    group.add(r, b);
  }

  // 5-Spoke Star Alloy Wheels + Perforated Rotors + Red Brembo Brake Calipers
  const tyreGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.27, 22);
  const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.28, 16);
  const hubGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.3, 12);
  const spokeGeo = new THREE.BoxGeometry(0.46, 0.292, 0.042);

  const tyreMat = new THREE.MeshStandardMaterial({ color: '#111113', roughness: 0.86 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: category === 'super' ? '#d4d4d8' : '#e4e4e7',
    metalness: 0.94,
    roughness: 0.16,
  });
  const rotorMat = new THREE.MeshStandardMaterial({
    color: '#71717a',
    metalness: 0.85,
    roughness: 0.35,
  });
  const caliperMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    roughness: 0.32,
    metalness: 0.55,
  });

  const frontWheels: THREE.Group[] = [];
  const wheelMeshes: THREE.Mesh[] = [];
  const wz = d.l * 0.32;
  for (const [sx, sz] of [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ] as [number, number][]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * (d.w / 2 - 0.06), 0.36, sz * wz);
    const tyre = new THREE.Mesh(tyreGeo, tyreMat);
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = castShadow;

    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    const hub = new THREE.Mesh(hubGeo, trim);
    tyre.add(rotor, hub);

    // 5-spoke star alloy pattern
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.rotation.y = (s * Math.PI) / 5;
      tyre.add(spoke);
    }

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.12), caliperMat);
    caliper.position.set(sx * 0.08, 0.06, -0.14);
    pivot.add(tyre, caliper);

    group.add(pivot);
    wheelMeshes.push(tyre);
    if (sz === 1) frontWheels.push(pivot);
  }

  return {
    group,
    frontWheels,
    wheelMeshes,
    paintMat: paint,
    tailMat,
    headMat,
    barRed,
    barBlue,
    radius: Math.max(d.w, d.l) / 2 - 0.3,
  };
}
