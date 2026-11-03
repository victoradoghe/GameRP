import * as THREE from 'three';

export interface PlaneModel {
  group: THREE.Group;
  frontWheels: THREE.Group[];
  wheelMeshes: THREE.Mesh[];
  fanMeshes: THREE.Mesh[];
  gearGroup: THREE.Group;
  contrailGroup: THREE.Group;
  paintMat: THREE.MeshPhysicalMaterial;
  headMat: THREE.MeshStandardMaterial;
  tailMat: THREE.MeshStandardMaterial;
  strobeMat: THREE.MeshStandardMaterial;
  radius: number;
}

export function buildPlane(
  color = '#f8fafc',
  accent = '#0ea5e9',
  scale = 1,
  castShadow = true
): PlaneModel {
  const group = new THREE.Group();
  const root = new THREE.Group();
  root.scale.setScalar(scale);
  group.add(root);

  const paintMat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.45,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: accent,
    metalness: 0.62,
    roughness: 0.2,
    clearcoat: 0.9,
  });

  const darkTrim = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.55,
    roughness: 0.35,
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    metalness: 0.94,
    roughness: 0.14,
  });

  const cockpitGlass = new THREE.MeshPhysicalMaterial({
    color: '#030712',
    metalness: 0.25,
    roughness: 0.05,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.9,
  });

  const cabinWindowMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: '#fde68a',
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });

  const headMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e0f2fe',
    emissiveIntensity: 1.4,
  });

  const tailMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: '#ef4444',
    emissiveIntensity: 1.2,
  });

  const navGreenMat = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    emissive: '#22c55e',
    emissiveIntensity: 1.5,
  });

  const strobeMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 1.8,
  });

  const fuselageY = 1.65;

  // Main cylindrical pressurized fuselage (+Z is nose, -Z is tail)
  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.84, 7.6, 22),
    paintMat
  );
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, fuselageY, 0.2);
  fuselage.castShadow = castShadow;
  fuselage.receiveShadow = true;
  root.add(fuselage);

  // Aerodynamic nose cone (+Z)
  const noseSection = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.86, 2.35, 22),
    paintMat
  );
  noseSection.rotation.x = Math.PI / 2;
  noseSection.position.set(0, fuselageY - 0.04, 5.15);
  noseSection.castShadow = castShadow;
  root.add(noseSection);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 14), darkTrim);
  noseTip.scale.set(1, 0.92, 1.55);
  noseTip.position.set(0, fuselageY - 0.06, 6.32);
  root.add(noseTip);

  // Nose landing taxi light
  const noseLight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.08), headMat);
  noseLight.position.set(0, fuselageY - 0.52, 5.4);
  root.add(noseLight);

  // Cockpit wrap-around visor glass
  const visor = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 1.28), cockpitGlass);
  visor.position.set(0, fuselageY + 0.44, 4.45);
  visor.rotation.x = 0.22;
  root.add(visor);

  // Tapered tail cone (-Z)
  const tailCone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.22, 3.3, 20),
    paintMat
  );
  tailCone.rotation.x = Math.PI / 2;
  tailCone.position.set(0, fuselageY + 0.14, -5.22);
  tailCone.castShadow = castShadow;
  root.add(tailCone);

  // Executive cheatline stripe along both sides of the fuselage
  for (const sx of [1, -1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 8.2), accentMat);
    stripe.position.set(sx * 0.85, fuselageY + 0.04, 0.1);
    root.add(stripe);

    // Oval illuminated passenger cabin windows
    for (let i = 0; i < 7; i++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.22, 0.17),
        cabinWindowMat
      );
      win.position.set(sx * 0.85, fuselageY + 0.24, 2.75 - i * 0.82);
      root.add(win);
    }
  }

  // Swept Main Wings + Blended Winglets + Nav Lights
  for (const sx of [1, -1]) {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(sx * 0.65, fuselageY - 0.36, 0.35);
    wingPivot.rotation.y = sx * -0.34; // swept back toward -Z
    wingPivot.rotation.z = sx * 0.045; // subtle dihedral

    const mainWing = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.13, 1.48),
      paintMat
    );
    mainWing.position.set(sx * 2.45, 0, 0);
    mainWing.castShadow = castShadow;
    mainWing.receiveShadow = true;
    wingPivot.add(mainWing);

    const leadingEdge = new THREE.Mesh(
      new THREE.BoxGeometry(5.15, 0.09, 0.16),
      chrome
    );
    leadingEdge.position.set(sx * 2.45, 0.01, 0.76);
    wingPivot.add(leadingEdge);

    const accentTip = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.14, 1.15),
      accentMat
    );
    accentTip.position.set(sx * 4.45, 0.005, -0.08);
    wingPivot.add(accentTip);

    // Scimitar Winglet
    const winglet = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.92, 0.66),
      accentMat
    );
    winglet.position.set(sx * 5.05, 0.42, -0.18);
    winglet.rotation.z = sx * -0.18;
    wingPivot.add(winglet);

    // Wingtip Navigation Light (+X = port/red, -X = starboard/green) + Strobe
    const navLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      sx > 0 ? tailMat : navGreenMat
    );
    navLight.position.set(sx * 5.08, 0.08, 0.38);
    wingPivot.add(navLight);

    const tipStrobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      strobeMat
    );
    tipStrobe.position.set(sx * 5.08, 0.88, -0.35);
    wingPivot.add(tipStrobe);

    root.add(wingPivot);
  }

  // Twin High-Bypass Turbofan Engines + Spinning Fan Blades
  const fanMeshes: THREE.Mesh[] = [];
  const exhaustGlowMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 0.9,
  });

  for (const sx of [1, -1]) {
    const engGroup = new THREE.Group();
    engGroup.position.set(sx * 1.48, fuselageY + 0.36, -3.25);

    // Pylon strut attaching nacelle to rear fuselage
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.95), darkTrim);
    pylon.position.set(-sx * 0.48, -0.08, 0);
    engGroup.add(pylon);

    // Nacelle cowling
    const nacelle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.41, 1.95, 18),
      paintMat
    );
    nacelle.rotation.x = Math.PI / 2;
    nacelle.castShadow = castShadow;
    engGroup.add(nacelle);

    // Chrome intake lip
    const intakeLip = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.055, 10, 20),
      chrome
    );
    intakeLip.position.z = 0.96;
    engGroup.add(intakeLip);

    // Spinning turbofan rotor + cross blades
    const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16), darkTrim);
    fanHub.rotation.x = Math.PI / 2;
    fanHub.position.z = 0.84;
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.02), chrome);
      blade.rotation.z = (b * Math.PI) / 4;
      blade.position.y = 0.04;
      fanHub.add(blade);
    }
    engGroup.add(fanHub);
    fanMeshes.push(fanHub);

    // Exhaust nozzle & subtle turbine glow
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.39, 0.38, 16),
      darkTrim
    );
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.z = -1.08;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 14), exhaustGlowMat);
    glow.rotation.y = Math.PI;
    glow.position.z = -1.26;
    engGroup.add(exhaust, glow);

    root.add(engGroup);
  }

  // Swept Vertical Tail Stabilizer + T-Tail Horizontal Stabilizers
  const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.35, 1.85), paintMat);
  vTail.position.set(0, fuselageY + 1.42, -5.55);
  vTail.rotation.x = -0.28;
  vTail.castShadow = castShadow;
  root.add(vTail);

  const vTailAccent = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.65), accentMat);
  vTailAccent.position.set(0, fuselageY + 1.48, -6.12);
  vTailAccent.rotation.x = -0.28;
  root.add(vTailAccent);

  const tailTopStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), strobeMat);
  tailTopStrobe.position.set(0, fuselageY + 2.66, -6.05);
  root.add(tailTopStrobe);

  for (const sx of [1, -1]) {
    const hStab = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.1, 0.85), paintMat);
    hStab.position.set(sx * 1.02, fuselageY + 2.42, -6.02);
    hStab.rotation.y = sx * -0.28;
    root.add(hStab);
  }

  // Retractable Tricycle Landing Gear
  const gearGroup = new THREE.Group();
  const frontWheels: THREE.Group[] = [];
  const wheelMeshes: THREE.Mesh[] = [];
  const tyreMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.88 });

  // Nose Gear
  const nosePivot = new THREE.Group();
  nosePivot.position.set(0, 0.28, 4.35);
  const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.72, 10), chrome);
  noseStrut.position.y = 0.34;
  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16), tyreMat);
  noseWheel.rotation.z = Math.PI / 2;
  nosePivot.add(noseStrut, noseWheel);
  gearGroup.add(nosePivot);
  frontWheels.push(nosePivot);
  wheelMeshes.push(noseWheel);

  // Twin Main Gear Bogies
  for (const sx of [1, -1]) {
    const mainPivot = new THREE.Group();
    mainPivot.position.set(sx * 1.38, 0.32, -0.35);
    const mainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.92, 10), chrome);
    mainStrut.position.y = 0.42;
    const mainWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.26, 16), tyreMat);
    mainWheel.rotation.z = Math.PI / 2;
    mainPivot.add(mainStrut, mainWheel);
    gearGroup.add(mainPivot);
    wheelMeshes.push(mainWheel);
  }
  root.add(gearGroup);

  // High-Altitude Wingtip Contrails (shown when airborne at speed)
  const contrailGroup = new THREE.Group();
  const contrailMat = new THREE.MeshBasicMaterial({
    color: '#f8fafc',
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  for (const sx of [1, -1]) {
    const trail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.55, 16, 8),
      contrailMat
    );
    trail.rotation.x = Math.PI / 2;
    trail.position.set(sx * 5.2, fuselageY - 0.1, -10.2);
    contrailGroup.add(trail);
  }
  contrailGroup.visible = false;
  root.add(contrailGroup);

  return {
    group,
    frontWheels,
    wheelMeshes,
    fanMeshes,
    gearGroup,
    contrailGroup,
    paintMat,
    headMat,
    tailMat,
    strobeMat,
    radius: 3.6 * scale,
  };
}
