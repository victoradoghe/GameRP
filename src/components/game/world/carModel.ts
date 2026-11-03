import * as THREE from 'three';
import { VehicleCategory } from '@/lib/types';

export interface CarModel {
  group: THREE.Group;
  frontWheels: THREE.Group[]; // steer pivots
  wheelMeshes: THREE.Mesh[]; // spin
  paintMat: THREE.MeshStandardMaterial;
  tailMat: THREE.MeshStandardMaterial;
  headMat: THREE.MeshStandardMaterial;
  barRed?: THREE.MeshStandardMaterial;
  barBlue?: THREE.MeshStandardMaterial;
  radius: number;
}

const DIMS: Record<
  VehicleCategory,
  { w: number; l: number; bodyH: number; cabH: number; cabL: number; cabZ: number; ride: number }
> = {
  super: { w: 2.04, l: 4.62, bodyH: 0.52, cabH: 0.44, cabL: 1.95, cabZ: -0.18, ride: 0.31 },
  sedan: { w: 1.96, l: 4.68, bodyH: 0.64, cabH: 0.58, cabL: 2.32, cabZ: -0.2, ride: 0.36 },
  police: { w: 2.02, l: 4.85, bodyH: 0.66, cabH: 0.58, cabL: 2.35, cabZ: -0.22, ride: 0.38 },
  suv: { w: 2.18, l: 4.78, bodyH: 0.92, cabH: 0.82, cabL: 3.05, cabZ: -0.32, ride: 0.48 },
  transit: { w: 2.12, l: 4.95, bodyH: 1.02, cabH: 1.04, cabL: 4.35, cabZ: -0.18, ride: 0.44 },
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
  g.addColorStop(0, 'rgba(0,0,0,0.68)');
  g.addColorStop(0.65, 'rgba(0,0,0,0.34)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  carShadowTex = new THREE.CanvasTexture(c);
  return carShadowTex;
}

export function buildCar(category: VehicleCategory, color: string, castShadow = true): CarModel {
  const d = DIMS[category];
  const group = new THREE.Group();

  // Automotive Clearcoat Physical Paint
  const paint = new THREE.MeshPhysicalMaterial({
    color: category === 'police' ? '#0b1120' : color,
    metalness: category === 'transit' ? 0.35 : category === 'super' ? 0.82 : 0.65,
    roughness: category === 'transit' ? 0.36 : category === 'super' ? 0.14 : 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: '#070d19',
    metalness: 0.15,
    roughness: 0.04,
    transmission: 0.25,
    transparent: true,
    opacity: 0.88,
    clearcoat: 1.0,
  });

  const trim = new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.45,
    metalness: 0.4,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: '#e4e4e7',
    roughness: 0.15,
    metalness: 0.95,
  });

  // Soft Ground Contact Shadow
  const shTex = getCarShadowTexture();
  if (shTex) {
    const ao = new THREE.Mesh(
      new THREE.PlaneGeometry(d.w * 1.32, d.l * 1.24),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.018;
    group.add(ao);
  }

  // Lower main chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.bodyH, d.l), paint);
  body.position.y = d.ride + d.bodyH / 2;
  body.castShadow = castShadow;
  body.receiveShadow = true;
  group.add(body);

  // Side skirts & sculpted beltline crease
  for (const sx of [1, -1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, d.l * 0.62), trim);
    skirt.position.set(sx * (d.w / 2 + 0.01), d.ride + 0.06, 0);
    group.add(skirt);

    // Wheel arch flares
    for (const sz of [1, -1]) {
      const flare = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.82), trim);
      flare.position.set(sx * (d.w / 2 + 0.01), d.ride + 0.16, sz * d.l * 0.32);
      group.add(flare);
    }
  }

  // Front & Rear aero bumpers + grille + diffuser
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.99, 0.24, 0.28), trim);
  bumperF.position.set(0, d.ride + 0.12, d.l / 2 + 0.05);
  group.add(bumperF);

  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(d.w * 0.56, d.bodyH * 0.5, 0.06),
    category === 'suv' ? chrome : trim
  );
  grille.position.set(0, d.ride + d.bodyH * 0.46, d.l / 2 + 0.02);
  group.add(grille);

  const bumperR = bumperF.clone();
  bumperR.position.z = -d.l / 2 - 0.05;
  group.add(bumperR);

  // Nigerian Green-White-Green License Plates (Front & Rear)
  const plateMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
  const plateGreen = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.4 });
  for (const zSign of [1, -1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.02), plateMat);
    plate.position.set(0, d.ride + 0.16, zSign * (d.l / 2 + 0.19));
    const pBand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.022), plateGreen);
    pBand.position.set(0, d.ride + 0.195, zSign * (d.l / 2 + 0.19));
    group.add(plate, pBand);
  }

  // Dual Chrome Exhaust Tips
  for (const sx of [1, -1]) {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 10), chrome);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(sx * d.w * 0.28, d.ride + 0.08, -d.l / 2 - 0.14);
    group.add(exhaust);
  }

  // Cabin (glasshouse) + Sloped Windshield + Roof + Side Mirrors
  const cabY = d.ride + d.bodyH + d.cabH / 2;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.87, d.cabH, d.cabL), glass);
  cabin.position.set(0, cabY, d.cabZ);
  group.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.85, 0.075, d.cabL * 0.88), paint);
  roof.position.set(0, cabY + d.cabH / 2 + 0.032, d.cabZ);
  roof.castShadow = castShadow;
  group.add(roof);

  // Side Wing Mirrors
  if (category !== 'transit') {
    for (const sx of [1, -1]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.12), paint);
      mirror.position.set(sx * (d.w * 0.49), d.ride + d.bodyH + 0.14, d.cabZ + d.cabL * 0.36);
      group.add(mirror);
    }
  }

  // Roof A/C Pillars
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.07, d.cabH, 0.075), paint);
      pillar.position.set(sx * d.w * 0.425, cabY, d.cabZ + sz * d.cabL * 0.45);
      group.add(pillar);
    }
  }

  // Category-specific signature details
  if (category === 'transit') {
    // Authentic Lagos Yellow Danfo Black Twin Stripes + Roof Rack
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.5 });
    for (const y of [d.ride + 0.34, d.ride + 0.66]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(d.w + 0.025, 0.095, d.l * 0.98), stripeMat);
      s.position.y = y;
      group.add(s);
    }
    const rack = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.8, 0.08, d.cabL * 0.72), trim);
    rack.position.set(0, cabY + d.cabH / 2 + 0.11, d.cabZ);
    group.add(rack);
  }
  if (category === 'police') {
    const doors = new THREE.Mesh(
      new THREE.BoxGeometry(d.w + 0.024, d.bodyH * 0.72, d.l * 0.44),
      new THREE.MeshPhysicalMaterial({ color: '#f8fafc', roughness: 0.25, clearcoat: 0.8 })
    );
    doors.position.set(0, d.ride + d.bodyH / 2, -0.08);
    group.add(doors);
    // Push-bar bullbar on front bumper
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.54, 0.38, 0.12), trim);
    bullbar.position.set(0, d.ride + 0.26, d.l / 2 + 0.18);
    group.add(bullbar);
  }
  if (category === 'suv') {
    // G-Wagon rear spare wheel cover + roof rails
    const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 18), paint);
    spare.rotation.x = Math.PI / 2;
    spare.position.set(0, d.ride + d.bodyH * 0.75, -d.l / 2 - 0.12);
    const spareRing = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.16, 18), chrome);
    spareRing.rotation.x = Math.PI / 2;
    spareRing.position.copy(spare.position);
    group.add(spare, spareRing);
  }
  if (category === 'sedan') {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.19, 0.24),
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#facc15',
        emissiveIntensity: 0.9,
      })
    );
    sign.position.set(0, cabY + d.cabH / 2 + 0.16, d.cabZ);
    group.add(sign);
  }
  if (category === 'super') {
    // Active Carbon GT Wing + Hood Air Intake
    const wing = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.96, 0.055, 0.42), trim);
    wing.position.set(0, d.ride + d.bodyH + 0.32, -d.l / 2 + 0.28);
    group.add(wing);
    for (const sx of [1, -1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.32, 0.12), trim);
      strut.position.set(sx * 0.58, d.ride + d.bodyH + 0.16, -d.l / 2 + 0.28);
      group.add(strut);
    }
  }

  // Matrix LED Headlights + Full-Width Cyber Taillight Bar
  const headMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e0f2fe',
    emissiveIntensity: 0.85,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    emissive: '#ef4444',
    emissiveIntensity: 0.95,
  });
  for (const sx of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.13, 0.06), headMat);
    hl.position.set(sx * d.w * 0.33, d.ride + d.bodyH * 0.72, d.l / 2 + 0.015);
    group.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.06), tailMat);
    tl.position.set(sx * d.w * 0.33, d.ride + d.bodyH * 0.72, -d.l / 2 - 0.015);
    group.add(tl);
  }
  if (category === 'super' || category === 'suv') {
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.84, 0.055, 0.055), tailMat);
    lightBar.position.set(0, d.ride + d.bodyH * 0.74, -d.l / 2 - 0.016);
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
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.13, 0.28), barRed);
    r.position.set(-0.31, cabY + d.cabH / 2 + 0.12, d.cabZ);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.13, 0.28), barBlue);
    b.position.set(0.31, cabY + d.cabH / 2 + 0.12, d.cabZ);
    group.add(r, b);
  }

  // Multi-spoke Alloy Wheels + Red Brake Calipers
  const tyreGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 20);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.295, 12);
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.31, 10);
  const tyreMat = new THREE.MeshStandardMaterial({ color: '#111113', roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#e4e4e7',
    metalness: 0.92,
    roughness: 0.18,
  });
  const caliperMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    roughness: 0.35,
    metalness: 0.5,
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
    pivot.position.set(sx * (d.w / 2 - 0.07), 0.36, sz * wz);
    const tyre = new THREE.Mesh(tyreGeo, tyreMat);
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = castShadow;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    const hub = new THREE.Mesh(hubGeo, trim);
    tyre.add(rim, hub);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), caliperMat);
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
