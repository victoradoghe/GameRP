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

const DIMS: Record<VehicleCategory, { w: number; l: number; bodyH: number; cabH: number; cabL: number; cabZ: number; ride: number }> = {
  super: { w: 2.0, l: 4.5, bodyH: 0.55, cabH: 0.45, cabL: 1.9, cabZ: -0.2, ride: 0.32 },
  sedan: { w: 1.95, l: 4.6, bodyH: 0.65, cabH: 0.6, cabL: 2.3, cabZ: -0.2, ride: 0.38 },
  police: { w: 2.0, l: 4.8, bodyH: 0.68, cabH: 0.6, cabL: 2.3, cabZ: -0.25, ride: 0.4 },
  suv: { w: 2.15, l: 4.7, bodyH: 0.95, cabH: 0.85, cabL: 3.0, cabZ: -0.35, ride: 0.5 },
  transit: { w: 2.1, l: 4.9, bodyH: 1.0, cabH: 1.05, cabL: 4.3, cabZ: -0.2, ride: 0.45 },
};

export function buildCar(category: VehicleCategory, color: string, castShadow = true): CarModel {
  const d = DIMS[category];
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({
    color: category === 'police' ? '#0f172a' : color,
    metalness: category === 'super' ? 0.8 : 0.55,
    roughness: category === 'super' ? 0.18 : 0.32,
  });
  const glass = new THREE.MeshStandardMaterial({ color: '#0b1220', metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.85 });
  const trim = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.6 });

  // Lower body
  const body = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.bodyH, d.l), paint);
  body.position.y = d.ride + d.bodyH / 2;
  body.castShadow = castShadow;
  group.add(body);

  // Hood slope / bumpers
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.98, 0.22, 0.25), trim);
  bumperF.position.set(0, d.ride + 0.12, d.l / 2 + 0.05);
  group.add(bumperF);
  const bumperR = bumperF.clone();
  bumperR.position.z = -d.l / 2 - 0.05;
  group.add(bumperR);

  // Cabin (glasshouse) with roof
  const cabY = d.ride + d.bodyH + d.cabH / 2;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.88, d.cabH, d.cabL), glass);
  cabin.position.set(0, cabY, d.cabZ);
  group.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.86, 0.07, d.cabL * 0.9), paint);
  roof.position.set(0, cabY + d.cabH / 2 + 0.03, d.cabZ);
  roof.castShadow = castShadow;
  group.add(roof);
  // Pillars
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.07, d.cabH, 0.07), paint);
      pillar.position.set(sx * d.w * 0.43, cabY, d.cabZ + sz * d.cabL * 0.46);
      group.add(pillar);
    }
  }

  // Livery
  if (category === 'transit') {
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a' });
    for (const y of [d.ride + 0.35, d.ride + 0.65]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(d.w + 0.02, 0.1, d.l * 0.98), stripeMat);
      s.position.y = y;
      group.add(s);
    }
  }
  if (category === 'police') {
    const doors = new THREE.Mesh(
      new THREE.BoxGeometry(d.w + 0.02, d.bodyH * 0.7, d.l * 0.45),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 })
    );
    doors.position.set(0, d.ride + d.bodyH / 2, -0.1);
    group.add(doors);
  }
  if (category === 'sedan') {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.2, 0.25),
      new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#fde047', emissiveIntensity: 0.6 })
    );
    sign.position.set(0, cabY + d.cabH / 2 + 0.17, d.cabZ);
    group.add(sign);
  }
  if (category === 'super') {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(d.w * 0.95, 0.06, 0.4), trim);
    wing.position.set(0, d.ride + d.bodyH + 0.3, -d.l / 2 + 0.3);
    group.add(wing);
    for (const sx of [1, -1]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.1), trim);
      strut.position.set(sx * 0.6, d.ride + d.bodyH + 0.15, -d.l / 2 + 0.3);
      group.add(strut);
    }
  }

  // Lights
  const headMat = new THREE.MeshStandardMaterial({ color: '#fefce8', emissive: '#fef9c3', emissiveIntensity: 0.4 });
  const tailMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', emissive: '#ef4444', emissiveIntensity: 0.5 });
  for (const sx of [1, -1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.05), headMat);
    hl.position.set(sx * d.w * 0.33, d.ride + d.bodyH * 0.7, d.l / 2 + 0.01);
    group.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.05), tailMat);
    tl.position.set(sx * d.w * 0.33, d.ride + d.bodyH * 0.7, -d.l / 2 - 0.01);
    group.add(tl);
  }

  let barRed: THREE.MeshStandardMaterial | undefined;
  let barBlue: THREE.MeshStandardMaterial | undefined;
  if (category === 'police') {
    barRed = new THREE.MeshStandardMaterial({ color: '#7f1d1d', emissive: '#ef4444', emissiveIntensity: 0.2 });
    barBlue = new THREE.MeshStandardMaterial({ color: '#1e3a8a', emissive: '#3b82f6', emissiveIntensity: 0.2 });
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.13, 0.28), barRed);
    r.position.set(-0.3, cabY + d.cabH / 2 + 0.12, d.cabZ);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.13, 0.28), barBlue);
    b.position.set(0.3, cabY + d.cabH / 2 + 0.12, d.cabZ);
    group.add(r, b);
  }

  // Wheels: tyre + rim; front pair on steering pivots
  const tyreGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.3, 8);
  const tyreMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#d4d4d8', metalness: 0.9, roughness: 0.25 });
  const frontWheels: THREE.Group[] = [];
  const wheelMeshes: THREE.Mesh[] = [];
  const wz = d.l * 0.32;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as [number, number][]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * (d.w / 2 - 0.08), 0.36, sz * wz);
    const tyre = new THREE.Mesh(tyreGeo, tyreMat);
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = castShadow;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    tyre.add(rim);
    pivot.add(tyre);
    group.add(pivot);
    wheelMeshes.push(tyre);
    if (sz === 1) frontWheels.push(pivot);
  }

  return { group, frontWheels, wheelMeshes, paintMat: paint, tailMat, headMat, barRed, barBlue, radius: Math.max(d.w, d.l) / 2 - 0.3 };
}
