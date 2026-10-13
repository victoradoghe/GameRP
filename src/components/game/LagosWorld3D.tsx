'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LagosDistrict, DistrictInfo } from '@/lib/types';
import { DISTRICTS } from '@/lib/gameState';

interface LagosWorld3DProps {
  currentDistrict: LagosDistrict;
  onDistrictSelect: (district: LagosDistrict) => void;
  onInteract: (locationId: string) => void;
  playerOutfitColor: string;
  isNepaActive: boolean;
  isNightTime: boolean;
  timeHour: number; // 0 - 24
}

export const LagosWorld3D: React.FC<LagosWorld3DProps> = ({
  currentDistrict,
  onDistrictSelect,
  onInteract,
  playerOutfitColor,
  isNepaActive,
  isNightTime,
  timeHour,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const interactionTriggerRef = useRef<{ id: string; name: string } | null>(null);

  // Store references for animations and physics
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const danfoGroupRef = useRef<THREE.Group[]>([]);
  const spotLightRef1 = useRef<THREE.SpotLight | null>(null);
  const spotLightRef2 = useRef<THREE.SpotLight | null>(null);
  const nepaSparkRef = useRef<THREE.PointLight | null>(null);
  const steamParticlesRef = useRef<THREE.Points | null>(null);

  // Player position & physics
  const playerPos = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerTarget = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerVelocity = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isWalkingRef = useRef<boolean>(false);
  const walkCycleRef = useRef<number>(0);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (interactionTriggerRef.current) {
          onInteract(interactionTriggerRef.current.id);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onInteract]);

  // Teleport player when changing district from outside
  useEffect(() => {
    const target = DISTRICTS.find((d) => d.id === currentDistrict);
    if (target) {
      playerPos.current = { x: target.x, z: target.z };
      playerTarget.current = { x: target.x, z: target.z };
    }
  }, [currentDistrict]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 32, 38);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Dynamic Atmosphere & Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isNightTime ? 0.35 : 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      isNightTime ? 0x6366f1 : 0xfffae6,
      isNightTime ? 0.4 : 1.2
    );
    sunLight.position.set(40, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // NEPA Transformer Spark Light
    const nepaSpark = new THREE.PointLight(0x38bdf8, 0, 20);
    nepaSpark.position.set(-20, 4, 10);
    scene.add(nepaSpark);
    nepaSparkRef.current = nepaSpark;

    // Club Quilox Moving Sky Searchlights
    const spot1 = new THREE.SpotLight(0xd946ef, 3, 100, Math.PI / 8, 0.4);
    spot1.position.set(30, 10, -25);
    scene.add(spot1);
    spotLightRef1.current = spot1;

    const spot2 = new THREE.SpotLight(0x06b6d4, 3, 100, Math.PI / 8, 0.4);
    spot2.position.set(32, 10, -23);
    scene.add(spot2);
    spotLightRef2.current = spot2;

    // 3. Ground Terrain & Lagos Lagoon
    // Mainland ground
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightTime ? 0x0f172a : 0x1e293b,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lagoon Water (South section)
    const waterGeo = new THREE.PlaneGeometry(160, 45);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.05, -55);
    scene.add(water);

    // Third Mainland Expressway Bridge
    const bridgeGeo = new THREE.BoxGeometry(160, 1.2, 14);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 0.8, -48);
    bridge.receiveShadow = true;
    scene.add(bridge);

    // Main Roads & Intersections
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // Highway 1 (East - West)
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(160, 10), roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.set(0, 0.02, 0);
    road1.receiveShadow = true;
    scene.add(road1);

    // Avenue 2 (North - South)
    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 160), roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.set(0, 0.02, 0);
    road2.receiveShadow = true;
    scene.add(road2);

    // Yellow road lane dividers
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = -70; i < 70; i += 8) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.4), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.03, 0);
      scene.add(line);

      const lineV = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 4), lineMat);
      lineV.rotation.x = -Math.PI / 2;
      lineV.position.set(0, 0.03, i);
      scene.add(lineV);
    }

    // 4. Iconic Lagos Landmarks
    // A. Amala Shitta Canteen (Center-South)
    const amalaGroup = new THREE.Group();
    amalaGroup.position.set(0, 0, 12);

    // Building structure
    const amalaBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(12, 5, 10),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 })
    );
    amalaBuilding.position.y = 2.5;
    amalaBuilding.castShadow = true;
    amalaBuilding.receiveShadow = true;
    amalaGroup.add(amalaBuilding);

    // Roof Canopy
    const amalaRoof = new THREE.Mesh(
      new THREE.ConeGeometry(9, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    amalaRoof.position.y = 6.2;
    amalaRoof.rotation.y = Math.PI / 4;
    amalaRoof.castShadow = true;
    amalaGroup.add(amalaRoof);

    // Glowing Billboard Sign
    const signGeo = new THREE.BoxGeometry(9, 1.6, 0.4);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
    });
    const amalaSign = new THREE.Mesh(signGeo, signMat);
    amalaSign.position.set(0, 5.8, 5.2);
    amalaGroup.add(amalaSign);

    // Big cooking pot outside with steam
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7 })
    );
    pot.position.set(4, 0.7, 6.5);
    amalaGroup.add(pot);

    // Steam particles rising from the Amala pot
    const steamCount = 30;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount * 3; i += 3) {
      steamPositions[i] = 4 + (Math.random() - 0.5) * 1;
      steamPositions[i + 1] = 1.4 + Math.random() * 2;
      steamPositions[i + 2] = 6.5 + (Math.random() - 0.5) * 1;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.6,
    });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    amalaGroup.add(steamParticles);
    steamParticlesRef.current = steamParticles;

    scene.add(amalaGroup);

    // B. Club Quilox (Victoria Island, VIP)
    const quiloxGroup = new THREE.Group();
    quiloxGroup.position.set(30, 0, -25);

    const clubBase = new THREE.Mesh(
      new THREE.BoxGeometry(16, 12, 16),
      new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.8, roughness: 0.2 })
    );
    clubBase.position.y = 6;
    clubBase.castShadow = true;
    clubBase.receiveShadow = true;
    quiloxGroup.add(clubBase);

    // Neon Accent Trim
    const neonTrim = new THREE.Mesh(
      new THREE.BoxGeometry(16.4, 0.6, 16.4),
      new THREE.MeshStandardMaterial({
        color: 0xd946ef,
        emissive: 0xd946ef,
        emissiveIntensity: 2,
      })
    );
    neonTrim.position.y = 10;
    quiloxGroup.add(neonTrim);

    const neonTrim2 = new THREE.Mesh(
      new THREE.BoxGeometry(16.4, 0.6, 16.4),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 2,
      })
    );
    neonTrim2.position.y = 6;
    quiloxGroup.add(neonTrim2);

    scene.add(quiloxGroup);

    // C. Yaba Tech Corridor Glass Towers
    const yabaGroup = new THREE.Group();
    yabaGroup.position.set(-28, 0, -20);

    const techTower1 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 22, 10),
      new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        metalness: 0.8,
        roughness: 0.1,
      })
    );
    techTower1.position.y = 11;
    techTower1.castShadow = true;
    yabaGroup.add(techTower1);

    const techTower2 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 16, 8),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.7,
        roughness: 0.2,
      })
    );
    techTower2.position.set(9, 8, 2);
    techTower2.castShadow = true;
    yabaGroup.add(techTower2);

    scene.add(yabaGroup);

    // D. Lekki Phase 1 Luxury Mansions
    const lekkiGroup = new THREE.Group();
    lekkiGroup.position.set(35, 0, 18);

    const mansion = new THREE.Mesh(
      new THREE.BoxGeometry(14, 7, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    mansion.position.y = 3.5;
    mansion.castShadow = true;
    lekkiGroup.add(mansion);

    // Luxury pool
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-10, 0.05, 0);
    lekkiGroup.add(pool);

    scene.add(lekkiGroup);

    // E. Computer Village Electronics Mart (Ikeja)
    const cvGroup = new THREE.Group();
    cvGroup.position.set(-32, 0, 22);

    const cvMall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 })
    );
    cvMall.position.y = 3;
    cvMall.castShadow = true;
    cvGroup.add(cvMall);

    scene.add(cvGroup);

    // F. NEPA Transformer Substation & Street Lights
    const nepaStation = new THREE.Group();
    nepaStation.position.set(-20, 0, 10);
    const transformerCore = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 3.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
    );
    transformerCore.position.y = 1.75;
    nepaStation.add(transformerCore);

    // Transformer cage / fence
    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 3.8, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x334155, wireframe: true })
    );
    cage.position.y = 1.9;
    nepaStation.add(cage);
    scene.add(nepaStation);

    // 5. Procedural Lagos Palm Trees
    const createPalmTree = (x: number, z: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      trunk.castShadow = true;
      tree.add(trunk);

      // Leaves
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 4), leafMat);
        leaf.position.y = 6;
        leaf.rotation.x = Math.PI / 2.5;
        leaf.rotation.y = (i * Math.PI * 2) / 5;
        leaf.castShadow = true;
        tree.add(leaf);
      }
      return tree;
    };

    const treeLocations = [
      [15, 12],
      [18, 16],
      [22, -10],
      [28, 8],
      [42, 10],
      [-12, -10],
      [-15, 14],
      [-18, -32],
    ];
    treeLocations.forEach(([x, z]) => scene.add(createPalmTree(x, z)));

    // 6. Iconic Danfo Buses & Moving Traffic
    const createDanfoBus = () => {
      const bus = new THREE.Group();

      // Yellow Body
      const bodyGeo = new THREE.BoxGeometry(4.6, 2.2, 2.2);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.5;
      body.castShadow = true;
      bus.add(body);

      // Twin Black Horizontal Stripes (Iconic Lagos Danfo livery)
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.22, 2.22), stripeMat);
      stripe1.position.y = 1.25;
      bus.add(stripe1);

      const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.22, 2.22), stripeMat);
      stripe2.position.y = 1.6;
      bus.add(stripe2);

      // Windshield & Windows
      const winMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.24), winMat);
      win.position.set(1.1, 1.85, 0);
      bus.add(win);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
      const wheelPositions = [
        [1.4, 0.45, 1.15],
        [1.4, 0.45, -1.15],
        [-1.4, 0.45, 1.15],
        [-1.4, 0.45, -1.15],
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        bus.add(wheel);
      });

      return bus;
    };

    const danfoList: THREE.Group[] = [];
    const bus1 = createDanfoBus();
    bus1.position.set(-60, 0, 2);
    scene.add(bus1);
    danfoList.push(bus1);

    const bus2 = createDanfoBus();
    bus2.position.set(60, 0, -2);
    bus2.rotation.y = Math.PI;
    scene.add(bus2);
    danfoList.push(bus2);

    const bus3 = createDanfoBus();
    bus3.position.set(0, 0.8, -48);
    scene.add(bus3);
    danfoList.push(bus3);

    danfoGroupRef.current = danfoList;

    // 7. Interactive 3D Player Avatar
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 0);

    // Torso / Outfit
    const torsoMat = new THREE.MeshStandardMaterial({
      color: playerOutfitColor || 0x3b82f6,
      roughness: 0.5,
    });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 1.3, 8), torsoMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    playerGroup.add(torso);

    // Head with Nigerian Skin Tone
    const headMat = new THREE.MeshStandardMaterial({ color: 0x6d4023, roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), headMat);
    head.position.y = 2.3;
    head.castShadow = true;
    playerGroup.add(head);

    // Cool Sunglasses / Cap
    const shadesMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9 });
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.2), shadesMat);
    shades.position.set(0, 2.32, 0.38);
    playerGroup.add(shades);

    // Left & Right Legs
    const legGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.8, 8);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });

    const legLeft = new THREE.Mesh(legGeo, pantsMat);
    legLeft.position.set(-0.25, 0.4, 0);
    legLeft.castShadow = true;
    playerGroup.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, pantsMat);
    legRight.position.set(0.25, 0.4, 0);
    legRight.castShadow = true;
    playerGroup.add(legRight);

    // Floating Green Arrow / Marker above Player
    const arrowGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const marker = new THREE.Mesh(arrowGeo, arrowMat);
    marker.rotation.x = Math.PI;
    marker.position.y = 3.3;
    playerGroup.add(marker);

    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;

    // 8. Ground Click-to-Move Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(ground);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        playerTarget.current = { x: point.x, z: point.z };
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Keyboard movement processing
      let moveX = 0;
      let moveZ = 0;
      const speed = 14 * delta;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveZ -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveZ += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        // Normalize
        const len = Math.hypot(moveX, moveZ);
        playerPos.current.x += (moveX / len) * speed;
        playerPos.current.z += (moveZ / len) * speed;
        playerTarget.current = { ...playerPos.current };
        isWalkingRef.current = true;
      } else {
        // Interpolate to click target
        const dx = playerTarget.current.x - playerPos.current.x;
        const dz = playerTarget.current.z - playerPos.current.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.4) {
          playerPos.current.x += (dx / dist) * Math.min(speed, dist);
          playerPos.current.z += (dz / dist) * Math.min(speed, dist);
          isWalkingRef.current = true;
        } else {
          isWalkingRef.current = false;
        }
      }

      // Constrain player to map bounds
      playerPos.current.x = Math.max(-65, Math.min(65, playerPos.current.x));
      playerPos.current.z = Math.max(-65, Math.min(65, playerPos.current.z));

      // Update Player Mesh
      if (playerMeshRef.current) {
        playerMeshRef.current.position.x = playerPos.current.x;
        playerMeshRef.current.position.z = playerPos.current.z;

        // Walking leg swing & bobbing
        if (isWalkingRef.current) {
          walkCycleRef.current += delta * 14;
          legLeft.rotation.x = Math.sin(walkCycleRef.current) * 0.6;
          legRight.rotation.x = -Math.sin(walkCycleRef.current) * 0.6;
          torso.position.y = 1.35 + Math.abs(Math.sin(walkCycleRef.current * 2)) * 0.08;
          head.position.y = 2.3 + Math.abs(Math.sin(walkCycleRef.current * 2)) * 0.08;
        } else {
          legLeft.rotation.x = 0;
          legRight.rotation.x = 0;
          torso.position.y = 1.35;
          head.position.y = 2.3;
        }

        // Float arrow bobbing
        marker.position.y = 3.3 + Math.sin(time * 3) * 0.15;
        marker.rotation.y = time * 2;
      }

      // Smooth Camera Follow
      const targetCamX = playerPos.current.x;
      const targetCamZ = playerPos.current.z + 28;
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.lookAt(playerPos.current.x, 1.5, playerPos.current.z);

      // Animate Danfo Traffic
      if (danfoList[0]) {
        danfoList[0].position.x += 18 * delta;
        if (danfoList[0].position.x > 75) danfoList[0].position.x = -75;
      }
      if (danfoList[1]) {
        danfoList[1].position.x -= 22 * delta;
        if (danfoList[1].position.x < -75) danfoList[1].position.x = 75;
      }
      if (danfoList[2]) {
        danfoList[2].position.x += 28 * delta;
        if (danfoList[2].position.x > 75) danfoList[2].position.x = -75;
      }

      // Animate Club Quilox Sky Spotlights
      if (spot1 && spot2) {
        spot1.target.position.set(
          30 + Math.sin(time * 1.5) * 20,
          35,
          -25 + Math.cos(time * 1.5) * 20
        );
        spot1.target.updateMatrixWorld();
        spot2.target.position.set(
          30 + Math.cos(time * 1.8) * 20,
          35,
          -25 + Math.sin(time * 1.8) * 20
        );
        spot2.target.updateMatrixWorld();
      }

      // NEPA Spark Light Flickering
      if (nepaSparkRef.current) {
        if (!isNepaActive && Math.random() > 0.88) {
          nepaSparkRef.current.intensity = Math.random() * 4;
        } else {
          nepaSparkRef.current.intensity = isNepaActive ? 0.3 : 0;
        }
      }

      // Animate Steam rising from Amala pot
      if (steamParticlesRef.current) {
        const positions = steamParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += delta * 1.2;
          if (positions[i] > 3.8) {
            positions[i] = 1.4;
          }
        }
        steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Check District Proximity triggers
      let foundDistrict: DistrictInfo | null = null;
      for (const d of DISTRICTS) {
        const dist = Math.hypot(playerPos.current.x - d.x, playerPos.current.z - d.z);
        if (dist < 10) {
          foundDistrict = d;
          break;
        }
      }

      if (foundDistrict) {
        interactionTriggerRef.current = { id: foundDistrict.id, name: foundDistrict.name };
      } else {
        interactionTriggerRef.current = null;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [playerOutfitColor, isNepaActive, isNightTime]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* Floating Prompt on Proximity */}
      {interactionTriggerRef.current && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-danfo-yellow/50 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-slight pointer-events-auto z-20">
          <span className="w-3 h-3 rounded-full bg-danfo-yellow animate-ping" />
          <span className="text-sm font-semibold tracking-wide">
            Near <strong className="text-danfo-yellow">{interactionTriggerRef.current.name}</strong>
          </span>
          <button
            onClick={() => interactionTriggerRef.current && onInteract(interactionTriggerRef.current.id)}
            className="bg-danfo-yellow text-black font-bold px-3 py-1 rounded-full text-xs hover:bg-yellow-400 active:scale-95 transition-all shadow"
          >
            ENTER (Press E)
          </button>
        </div>
      )}

      {/* Touch Joystick / Virtual D-Pad for Mobile Players */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col items-center gap-1.5 md:hidden pointer-events-auto bg-black/50 backdrop-blur-md p-3 rounded-2xl border border-white/10">
        <button
          onTouchStart={() => (keysPressed.current['w'] = true)}
          onTouchEnd={() => (keysPressed.current['w'] = false)}
          className="w-12 h-12 bg-white/20 active:bg-danfo-yellow active:text-black rounded-xl font-bold flex items-center justify-center text-lg text-white"
        >
          ▲
        </button>
        <div className="flex gap-1.5">
          <button
            onTouchStart={() => (keysPressed.current['a'] = true)}
            onTouchEnd={() => (keysPressed.current['a'] = false)}
            className="w-12 h-12 bg-white/20 active:bg-danfo-yellow active:text-black rounded-xl font-bold flex items-center justify-center text-lg text-white"
          >
            ◀
          </button>
          <button
            onTouchStart={() => (keysPressed.current['s'] = true)}
            onTouchEnd={() => (keysPressed.current['s'] = false)}
            className="w-12 h-12 bg-white/20 active:bg-danfo-yellow active:text-black rounded-xl font-bold flex items-center justify-center text-lg text-white"
          >
            ▼
          </button>
          <button
            onTouchStart={() => (keysPressed.current['d'] = true)}
            onTouchEnd={() => (keysPressed.current['d'] = false)}
            className="w-12 h-12 bg-white/20 active:bg-danfo-yellow active:text-black rounded-xl font-bold flex items-center justify-center text-lg text-white"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
