'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PhoneIncoming, PhoneOff, HeartPulse, Users, MapPin, X } from 'lucide-react';
import { LagosWorld3D, VehicleAction } from '@/components/game/LagosWorld3D';
import { GameHUD } from '@/components/game/GameHUD';
import { EkoPhone } from '@/components/game/EkoPhone';
import { CharacterCustomizer } from '@/components/game/CharacterCustomizer';
import { HelpTutorialModal } from '@/components/game/HelpTutorialModal';
import { DanfoMiniGame } from '@/components/game/DanfoMiniGame';
import { TechBroMiniGame } from '@/components/game/TechBroMiniGame';
import { AfrobeatsMiniGame } from '@/components/game/AfrobeatsMiniGame';
import { AmalaModal } from '@/components/game/AmalaModal';
import { QuiloxModal } from '@/components/game/QuiloxModal';
import { NoPixelInventoryModal } from '@/components/game/NoPixelInventoryModal';
import { NoPixelRadialMenu } from '@/components/game/NoPixelRadialMenu';
import { NoPixelHeistModal } from '@/components/game/NoPixelHeistModal';
import { RandomEventModal } from '@/components/game/RandomEventModal';
import { NoPixelCityMapModal } from '@/components/game/NoPixelCityMapModal';
import { BennysCustomsModal } from '@/components/game/BennysCustomsModal';
import { PedInteractionModal } from '@/components/game/PedInteractionModal';
import { BuildingInteriorModal } from '@/components/game/BuildingInteriorModal';
import { PropertyGarageModal } from '@/components/game/PropertyGarageModal';
import { GameSettingsMenu, FpsCounter } from '@/components/game/GameSettingsMenu';
import { CharacterCreationModal } from '@/components/game/CharacterCreationModal';
import { GameMainMenu } from '@/components/game/GameMainMenu';
import { AutoSaveIndicator } from '@/components/game/AutoSaveIndicator';
import {
  PlayerStats,
  Vitals,
  LagosDistrict,
  CityId,
  NotificationItem,
  WorldRealtimeState,
  InventoryItem,
  PhoneContact,
  RandomLifeEvent,
  Emote,
  Weather,
  MapTarget,
  ActiveMission,
  JobKind,
  ChatLine,
  GraphicsSettings,
  BankVaultSpec,
  AutoSaveData,
} from '@/lib/types';
import {
  INITIAL_LAPO_PLAYER,
  INITIAL_VITALS,
  DEFAULT_INVENTORY_ITEMS,
  PHONE_CONTACTS,
  ALL_LIFE_EVENTS,
  DISTRICTS,
  getDistrictsForCity,
  LAPTOP_MODELS_CATALOG,
  SERVER_PLAYERS,
  OOC_CHATTER,
  SPAWN_POINTS,
  BANK_VAULTS_CATALOG,
} from '@/lib/gameState';
import { RadialWheelModal } from '@/components/game/RadialWheelModal';
import { generateAddresses } from '@/lib/cityLayout';
import { audioEngine } from '@/lib/audioEngine';

const VALID_EMOTES: Emote[] = [
  'none',
  'wave',
  'dance',
  'handsup',
  'sit',
  'pushups',
  'salute',
  'facepalm',
];

const RACE_CHECKPOINTS = [
  { x: -60, z: -20, label: 'Checkpoint 1/4 • Marina Corner' },
  { x: -60, z: 60, label: 'Checkpoint 2/4 • Ikeja North Loop' },
  { x: 60, z: 60, label: 'Checkpoint 3/4 • Lekki Expressway' },
  { x: 60, z: -20, label: 'Checkpoint 4/4 • Victoria Finish Line' },
];

export default function LagosLifeGamePage() {
  // Core Player & Vitals State
  const [player, setPlayer] = useState<PlayerStats>(INITIAL_LAPO_PLAYER);
  const addresses = useMemo(() => generateAddresses(player.activeCity || 'lagos'), [player.activeCity]);
  const [vitals, setVitals] = useState<Vitals>(INITIAL_VITALS);
  const [timeOfDay, setTimeOfDay] = useState<number>(19.5); // Golden dusk / neon transition
  const [weather, setWeather] = useState<Weather>('clear');
  const [isNepaActive, setIsNepaActive] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // World & Character States
  const [wantedStars, setWantedStars] = useState<number>(0);
  const [emote, setEmote] = useState<Emote>('none');
  const [meText, setMeText] = useState<{ text: string; ts: number } | null>(null);
  const [voiceMode, setVoiceMode] = useState<'whisper' | 'normal' | 'shout'>('normal');
  const [isRadioOn, setIsRadioOn] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'chase' | 'isometric' | 'hood'>('chase');
  const [altHeld, setAltHeld] = useState<boolean>(false);

  // Navigation, Missions & World Triggers
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [waypoint, setWaypoint] = useState<MapTarget | null>(null);
  const [teleportRequest, setTeleportRequest] = useState<{
    x: number;
    z: number;
    ts: number;
  } | null>(null);
  const [spawnVehicleRequest, setSpawnVehicleRequest] = useState<{
    id: string;
    timestamp: number;
  } | null>(null);
  const [vehicleControlTrigger, setVehicleControlTrigger] = useState<{
    action: VehicleAction;
    timestamp: number;
  } | null>(null);
  const [tuneVehicleRequest, setTuneVehicleRequest] = useState<{
    color?: string;
    repair?: boolean;
    refuel?: boolean;
    boostLevel?: number;
    ts: number;
  } | null>(null);
  const [enterBuildingRequest, setEnterBuildingRequest] = useState<{
    id: LagosDistrict;
    ts: number;
  } | null>(null);
  const [exitBuildingRequest, setExitBuildingRequest] = useState<number | null>(null);

  // RP / OOC Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatLines, setChatLines] = useState<ChatLine[]>([
    {
      id: 'c-init-1',
      kind: 'system',
      author: 'SYSTEM',
      text: 'Welcome to NoPixel V // Eko & Abuja 3D! Walk up to ANY building door and press [E] to enter its full 3D interior!',
      ts: Date.now(),
    },
    {
      id: 'c-init-2',
      kind: 'ooc',
      author: 'OfficerBalogun',
      text: 'PD units 10-8 patrolling Broad Street. Drive safe citizens.',
      ts: Date.now(),
    },
  ]);

  // Action Progress Bar & Live Events
  const [actionProgress, setActionProgress] = useState<{ label: string; pct: number } | null>(
    null
  );
  const [incomingCaller, setIncomingCaller] = useState<PhoneContact | null>(null);
  const [activeRandomEvent, setActiveRandomEvent] = useState<RandomLifeEvent | null>(null);

  // Real-time 3D World Telemetry
  const [worldState, setWorldState] = useState<WorldRealtimeState>({
    x: 0,
    z: 16,
    heading: Math.PI,
    cameraYaw: Math.PI,
    cameraMode: 'chase',
    streetName: 'Broad Street',
    isSprinting: false,
    nearVehicle: null,
    nearInteractable: null,
    vehicle: {
      isDriving: false,
      vehicleId: null,
      vehicleName: '',
      vehicleCategory: 'sedan',
      speedKmh: 0,
      rpm: 0,
      gear: 'N',
      fuel: 100,
      engineHealth: 100,
      seatbeltOn: false,
      lightsOn: true,
      sirenOn: false,
    },
    police: [],
    missionDistance: null,
  });

  // UI Panels & Modals
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isRadialOpen, setIsRadialOpen] = useState<boolean>(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);
  const [isHeistOpen, setIsHeistOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDanfoOpen, setIsDanfoOpen] = useState<boolean>(false);
  const [isTechBroOpen, setIsTechBroOpen] = useState<boolean>(false);
  const [isAfrobeatsOpen, setIsAfrobeatsOpen] = useState<boolean>(false);
  const [isAmalaOpen, setIsAmalaOpen] = useState<boolean>(false);
  const [isQuiloxOpen, setIsQuiloxOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isBennysOpen, setIsBennysOpen] = useState<boolean>(false);
  const [activePedName, setActivePedName] = useState<string | null>(null);
  const [activeBuildingId, setActiveBuildingId] = useState<LagosDistrict | null>(null);
  const [buildingModalSection, setBuildingModalSection] = useState<string | undefined>(undefined);
  const [isGarageOpen, setIsGarageOpen] = useState<boolean>(false);

  // GTA VI Item Wheel, Graphics/Resolution Settings & Multi-Bank Vault Heist State
  const [isItemWheelOpen, setIsItemWheelOpen] = useState<boolean>(false);
  const [equippedItemId, setEquippedItemId] = useState<string | null>(null);
  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>({
    resolutionScale: 1.0,
    bloomEnabled: true,
    shadowsEnabled: true,
    fov: 60,
    mouseSensitivity: 1.0,
    invertY: false,
    brightness: 1.0,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showFps, setShowFps] = useState<boolean>(false);
  const [hudVisible, setHudVisible] = useState<boolean>(true);
  const [masterVolume, setMasterVolume] = useState<number>(85);
  const [musicVolume, setMusicVolume] = useState<number>(75);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState<boolean>(true);
  const [isCharacterCreationOpen, setIsCharacterCreationOpen] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);
  const [sessionStartedAt] = useState<number>(() => Date.now());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [vaultCamsDisabled, setVaultCamsDisabled] = useState<
    Partial<Record<BankVaultSpec['id'], boolean>>
  >({});
  const [vaultCooldowns, setVaultCooldowns] = useState<
    Partial<Record<BankVaultSpec['id'], number>>
  >({});

  const openBuildingModal = useCallback((id: LagosDistrict, section?: string) => {
    setBuildingModalSection(section);
    setActiveBuildingId(id);
  }, []);

  const isDowned = vitals.health <= 0;

  const anyBlockingModal =
    isMainMenuOpen ||
    isCharacterCreationOpen ||
    isSettingsOpen ||
    isLoggedOut ||
    isInventoryOpen ||
    isItemWheelOpen ||
    isGarageOpen ||
    isRadialOpen ||
    isScoreboardOpen ||
    isHeistOpen ||
    isCustomizerOpen ||
    isHelpOpen ||
    isDanfoOpen ||
    isTechBroOpen ||
    isAfrobeatsOpen ||
    isAmalaOpen ||
    isQuiloxOpen ||
    isMapOpen ||
    isBennysOpen ||
    !!activeBuildingId ||
    !!activePedName ||
    !!activeRandomEvent;

  // Free cursor whenever any UI panel, phone, chat, downed state, or ALT is active
  const cursorFree = anyBlockingModal || isPhoneOpen || isChatOpen || isDowned || altHeld;
  const movementLocked = anyBlockingModal || isChatOpen;

  const pushChat = useCallback((kind: ChatLine['kind'], author: string, text: string) => {
    setChatLines((prev) => [
      ...prev.slice(-30),
      {
        id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        kind,
        author,
        text,
        ts: Date.now(),
      },
    ]);
  }, []);

  const addNotification = useCallback(
    (
      title: string,
      message: string,
      type: 'info' | 'warning' | 'success' | 'alert' | 'dispatch' = 'info',
      code?: string
    ) => {
      const newNotice: NotificationItem = {
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        title,
        code,
        message,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setNotifications((prev) => [newNotice, ...prev.slice(0, 3)]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotice.id));
      }, 5000);
    },
    []
  );

  // Load saved state safely (supporting new v7 auto-save & legacy v5)
  useEffect(() => {
    try {
      const v7Save = localStorage.getItem('lagos_life_autosave_v7');
      if (v7Save) {
        const parsed: AutoSaveData = JSON.parse(v7Save);
        if (parsed.player) {
          setPlayer({
            ...INITIAL_LAPO_PLAYER,
            ...parsed.player,
            items: parsed.player.items?.length ? parsed.player.items : DEFAULT_INVENTORY_ITEMS,
          });
          setHasSavedGame(true);
        }
        if (parsed.vitals) {
          setVitals({
            ...INITIAL_VITALS,
            ...parsed.vitals,
            health: Math.max(25, parsed.vitals.health ?? 96),
          });
        }
        if (typeof parsed.wantedStars === 'number') {
          setWantedStars(parsed.wantedStars);
        }
        if (parsed.equippedItemId) {
          setEquippedItemId(parsed.equippedItemId);
        }
        if (parsed.timestamp) {
          setLastSavedAt(parsed.timestamp);
        }
        return;
      }
      // Fallback for v5 saves
      const savedPlayer = localStorage.getItem('lagos_life_3d_player_v5');
      const savedVitals = localStorage.getItem('lagos_life_3d_vitals_v5');
      if (savedPlayer) {
        const parsed = JSON.parse(savedPlayer);
        setPlayer({
          ...INITIAL_LAPO_PLAYER,
          ...parsed,
          items: parsed.items?.length ? parsed.items : DEFAULT_INVENTORY_ITEMS,
        });
        setHasSavedGame(true);
      }
      if (savedVitals) {
        const parsedV = JSON.parse(savedVitals);
        setVitals({
          ...INITIAL_VITALS,
          ...parsedV,
          health: Math.max(25, parsedV.health ?? 96),
        });
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }, []);

  // Universal Auto-Save Function
  const triggerAutoSave = useCallback(
    (customPlayer?: PlayerStats, customVitals?: Vitals) => {
      try {
        setIsAutoSaving(true);
        const playerToSave = customPlayer || player;
        const vitalsToSave = customVitals || vitals;
        const saveData: AutoSaveData = {
          version: 7,
          timestamp: Date.now(),
          player: playerToSave,
          vitals: vitalsToSave,
          wantedStars,
          activeCity: playerToSave.activeCity || 'lagos',
          equippedItemId,
        };
        localStorage.setItem('lagos_life_autosave_v7', JSON.stringify(saveData));
        localStorage.setItem('lagos_life_3d_player_v5', JSON.stringify(playerToSave));
        localStorage.setItem('lagos_life_3d_vitals_v5', JSON.stringify(vitalsToSave));
        setHasSavedGame(true);
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSavedAt(Date.now());
        }, 400);
      } catch (e) {
        console.warn('Auto-save write error:', e);
        setIsAutoSaving(false);
      }
    },
    [player, vitals, wantedStars, equippedItemId]
  );

  // Background Auto-Save Loop: every 25 seconds when active in-game
  useEffect(() => {
    if (isMainMenuOpen || isCharacterCreationOpen) return;
    const interval = setInterval(() => {
      triggerAutoSave();
    }, 25000);
    return () => clearInterval(interval);
  }, [isMainMenuOpen, isCharacterCreationOpen, triggerAutoSave]);

  // Audio volume & Pause / Settings handlers
  const handleMasterVolumeChange = useCallback((vol: number) => {
    setMasterVolume(vol);
    audioEngine.setMasterVolume(vol);
  }, []);

  const handleMusicVolumeChange = useCallback((vol: number) => {
    setMusicVolume(vol);
    audioEngine.setMusicVolume(vol);
  }, []);

  const handleSaveGame = useCallback(() => {
    triggerAutoSave();
    audioEngine.playCashEarn();
    addNotification('Game Saved', 'Auto-save updated: character status, inventory & bank balance.', 'success');
  }, [triggerAutoSave, addNotification]);

  const handleLogout = useCallback(() => {
    triggerAutoSave();
    setIsSettingsOpen(false);
    setIsMainMenuOpen(true);
    setIsLoggedOut(true);
    audioEngine.playCameraClick();
    addNotification('Returned to Title', 'Game auto-saved. Welcome back to Main Menu.', 'info');
  }, [triggerAutoSave, addNotification]);

  const handleResetCharacter = useCallback(() => {
    try {
      localStorage.removeItem('lagos_life_autosave_v7');
      localStorage.removeItem('lagos_life_3d_player_v5');
      localStorage.removeItem('lagos_life_3d_vitals_v5');
    } catch {}
    setPlayer(INITIAL_LAPO_PLAYER);
    setVitals(INITIAL_VITALS);
    setWantedStars(0);
    setEquippedItemId(null);
    setHasSavedGame(false);
    setLastSavedAt(null);
    setIsSettingsOpen(false);
    audioEngine.playVehicleIgnition();
    addNotification('Character Reset', 'New citizen identity spawned at Eko Central Hospital.', 'info');
  }, [addNotification]);

  // Action Progress Bar helper
  const runActionBar = useCallback((label: string, durationMs: number, onDone: () => void) => {
    let elapsed = 0;
    const step = 50;
    setActionProgress({ label, pct: 5 });
    const interval = setInterval(() => {
      elapsed += step;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setActionProgress({ label, pct });
      if (elapsed >= durationMs) {
        clearInterval(interval);
        setActionProgress(null);
        onDone();
      }
    }, step);
  }, []);

  // Helper to pick a random address away from a point
  const pickRandomAddress = useCallback(
    (avoidX = 0, avoidZ = 0, minDist = 35) => {
      const candidates = addresses.filter(
        (a) => Math.hypot(a.x - avoidX, a.z - avoidZ) >= minDist
      );
      const pool = candidates.length > 0 ? candidates : addresses;
      return pool[Math.floor(Math.random() * pool.length)];
    },
    [addresses]
  );

  // ==================== IN-WORLD 3D MISSION ENGINE ====================
  const handleStartMission = useCallback(
    (kind: JobKind) => {
      const cityList = getDistrictsForCity(player.activeCity || 'lagos');
      const shitta = cityList.find((d) => d.id === 'shitta')!;
      const fleeca = cityList.find((d) => d.id === 'fleeca')!;
      const yaba = cityList.find((d) => d.id === 'yaba')!;

      // If starting an outdoor street shift while inside a 3D room, step outside automatically!
      if (worldState.insideBuilding && kind !== 'heist') {
        setExitBuildingRequest(Date.now());
      }
      if (kind === 'police') {
        setTimeout(() => {
          setSpawnVehicleRequest({ id: 'veh-police', timestamp: Date.now() });
        }, 280);
      }

      if (kind === 'delivery') {
        setActiveMission({
          jobKind: 'delivery',
          title: 'ChopChop Delivery',
          stage: 0,
          objective: 'Pick up hot order at Amala Shitta',
          target: {
            id: 'deliv-pickup-' + Date.now(),
            x: shitta.x,
            z: shitta.z,
            label: 'Amala Shitta Pickup',
            color: '#f59e0b',
          },
          reward: 14000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        addNotification('Shift Started', 'Head to Amala Shitta to pick up your first order!', 'info');
      } else if (kind === 'taxi') {
        const addr = pickRandomAddress(worldState.x, worldState.z, 30);
        setActiveMission({
          jobKind: 'taxi',
          title: 'Downtown Cab Co.',
          stage: 0,
          objective: `Pick up passenger at ${addr.name}`,
          target: {
            id: 'taxi-pickup-' + Date.now(),
            x: addr.x,
            z: addr.z,
            label: addr.name,
            color: '#facc15',
          },
          reward: 18500,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        addNotification('Cab Dispatch', `Passenger waiting at ${addr.name}.`, 'info');
      } else if (kind === 'mechanic') {
        const addr = pickRandomAddress(worldState.x, worldState.z, 35);
        setActiveMission({
          jobKind: 'mechanic',
          title: 'Benny’s Roadside',
          stage: 0,
          objective: `Repair broken vehicle at ${addr.name}`,
          target: {
            id: 'mech-' + Date.now(),
            x: addr.x,
            z: addr.z,
            label: addr.name,
            color: '#f97316',
          },
          reward: 22000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        addNotification('Benny’s Tow Call', `Stranded motorist at ${addr.name}.`, 'info');
      } else if (kind === 'police') {
        const addr = pickRandomAddress(worldState.x, worldState.z, 40);
        const codes = ['10-31 Prowler', '10-50 Collision', '10-80 Street Disturbance', '10-90 Alarm'];
        const code = codes[Math.floor(Math.random() * codes.length)];
        setActiveMission({
          jobKind: 'police',
          title: 'Eko PD Patrol',
          stage: 0,
          objective: `Respond to ${code} near ${addr.name}`,
          target: {
            id: 'pd-' + Date.now(),
            x: addr.x,
            z: addr.z,
            label: addr.name,
            color: '#3b82f6',
          },
          reward: 30000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        audioEngine.playDispatchAlert();
        addNotification('PD Dispatch', `Respond Code-3 to ${code} at ${addr.name}!`, 'dispatch', '10-8');
      } else if (kind === 'ems') {
        const addr = pickRandomAddress(worldState.x, worldState.z, 35);
        setActiveMission({
          jobKind: 'ems',
          title: 'Pillbox EMS',
          stage: 0,
          objective: `Stabilise 911 patient at ${addr.name}`,
          target: {
            id: 'ems-pickup-' + Date.now(),
            x: addr.x,
            z: addr.z,
            label: addr.name,
            color: '#ef4444',
          },
          reward: 32000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        audioEngine.playDispatchAlert();
        addNotification('EMS 911 Call', `Civilian down at ${addr.name}!`, 'dispatch', '10-52');
      } else if (kind === 'heist') {
        setActiveMission({
          jobKind: 'heist',
          title: 'Fleeca Vault Heist',
          stage: 0,
          objective: 'Infiltrate Fleeca Bank & breach the vault panel',
          target: {
            id: 'heist-bank-' + Date.now(),
            x: fleeca.x,
            z: fleeca.z,
            label: 'Fleeca Bank',
            color: '#ef4444',
          },
          reward: 350000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        addNotification(
          'Heist Prep Active',
          'Drive to Fleeca Bank on Broad Street to breach the vault!',
          'warning'
        );
      } else if (kind === 'race') {
        const cp = RACE_CHECKPOINTS[0];
        setActiveMission({
          jobKind: 'race',
          title: 'Midnight Street Circuit',
          stage: 0,
          objective: cp.label,
          target: {
            id: 'race-cp-0-' + Date.now(),
            x: cp.x,
            z: cp.z,
            label: cp.label,
            color: '#ec4899',
          },
          reward: 150000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        audioEngine.playDispatchAlert();
        addNotification(
          'Midnight Race Started! 🏎️',
          'Hit all 4 street checkpoints around the city ring road!',
          'warning'
        );
      } else if (kind === 'developer') {
        setActiveMission({
          jobKind: 'developer',
          title: 'Cloud & Field Server Dev',
          stage: 0,
          objective: `Deploy cloud build at ${yaba.name}`,
          target: {
            id: 'dev-hub-' + Date.now(),
            x: yaba.x,
            z: yaba.z,
            label: 'Tech Hub Rack',
            color: '#6366f1',
          },
          reward: 42000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        addNotification(
          'Software Dev Shift 💻',
          'Head to the Tech Hub server rack or use your Laptop at Home!',
          'info'
        );
      } else if (kind === 'banker') {
        setActiveMission({
          jobKind: 'banker',
          title: 'Fleeca Bullion & Compliance',
          stage: 0,
          objective: 'Report to Fleeca Bank Hall to pick up bullion manifest',
          target: {
            id: 'banker-hq-' + Date.now(),
            x: fleeca.x,
            z: fleeca.z,
            label: 'Fleeca Bank HQ',
            color: '#10b981',
          },
          reward: 38000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        addNotification(
          'Corporate Banker Shift 🏦',
          'Report to Fleeca Bank for bullion escort & compliance clearance!',
          'info'
        );
      } else if (kind === 'security') {
        const addr = pickRandomAddress(worldState.x, worldState.z, 35);
        setActiveMission({
          jobKind: 'security',
          title: 'Sentinel Security Guard',
          stage: 0,
          objective: `Patrol & clear perimeter alarm at ${addr.name}`,
          target: {
            id: 'sec-patrol-' + Date.now(),
            x: addr.x,
            z: addr.z,
            label: addr.name,
            color: '#eab308',
          },
          reward: 26000,
          completedRuns: 0,
          earnedThisShift: 0,
          startedAt: Date.now(),
        });
        audioEngine.playDispatchAlert();
        addNotification(
          'Security Guard Patrol 🛡️',
          `Inspect perimeter alarm at ${addr.name}!`,
          'info'
        );
      }
    },
    [addNotification, pickRandomAddress, player.activeCity, worldState.insideBuilding, worldState.x, worldState.z]
  );

  const handleMissionReached = useCallback(() => {
    if (!activeMission) return;
    const shitta = DISTRICTS.find((d) => d.id === 'shitta')!;
    const pillbox = DISTRICTS.find((d) => d.id === 'pillbox')!;

    if (activeMission.jobKind === 'delivery') {
      if (activeMission.stage === 0) {
        const drop = pickRandomAddress(shitta.x, shitta.z, 42);
        audioEngine.playClick();
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 1,
                objective: `Deliver order to ${drop.name}`,
                target: {
                  id: 'deliv-drop-' + Date.now(),
                  x: drop.x,
                  z: drop.z,
                  label: drop.name,
                  color: '#10b981',
                },
              }
            : null
        );
        addNotification('Order Collected', `Deliver hot food to ${drop.name}!`, 'info');
      } else {
        const tip = Math.floor(Math.random() * 4500) + 1500;
        const payout = activeMission.reward + tip;
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, cash: p.cash + payout }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 3) }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 0,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: 'Return to Amala Shitta for next order',
                target: {
                  id: 'deliv-pickup-' + Date.now(),
                  x: shitta.x,
                  z: shitta.z,
                  label: 'Amala Shitta',
                  color: '#f59e0b',
                },
              }
            : null
        );
        addNotification(
          'Delivery Complete!',
          `Earned ₦${payout.toLocaleString()} (incl. ₦${tip.toLocaleString()} tip)!`,
          'success'
        );
      }
      return;
    }

    if (activeMission.jobKind === 'taxi') {
      if (activeMission.stage === 0) {
        const dest = pickRandomAddress(activeMission.target.x, activeMission.target.z, 55);
        audioEngine.playSeatbeltChime();
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 1,
                objective: `Drop passenger off at ${dest.name}`,
                target: {
                  id: 'taxi-drop-' + Date.now(),
                  x: dest.x,
                  z: dest.z,
                  label: dest.name,
                  color: '#10b981',
                },
              }
            : null
        );
        addNotification('Passenger Onboard', `Destination: ${dest.name}.`, 'info');
      } else {
        const payout = activeMission.reward + Math.floor(Math.random() * 6000);
        const nextPickup = pickRandomAddress(activeMission.target.x, activeMission.target.z, 40);
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, cash: p.cash + payout }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 4) }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 0,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Pick up next fare at ${nextPickup.name}`,
                target: {
                  id: 'taxi-pickup-' + Date.now(),
                  x: nextPickup.x,
                  z: nextPickup.z,
                  label: nextPickup.name,
                  color: '#facc15',
                },
              }
            : null
        );
        addNotification('Fare Paid!', `Received ₦${payout.toLocaleString()}!`, 'success');
      }
      return;
    }

    if (activeMission.jobKind === 'mechanic') {
      runActionBar('DIAGNOSING & REPAIRING VEHICLE...', 1500, () => {
        const payout = activeMission.reward;
        const nextCall = pickRandomAddress(activeMission.target.x, activeMission.target.z, 45);
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, cash: p.cash + payout }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 5) }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Repair breakdown at ${nextCall.name}`,
                target: {
                  id: 'mech-' + Date.now(),
                  x: nextCall.x,
                  z: nextCall.z,
                  label: nextCall.name,
                  color: '#f97316',
                },
              }
            : null
        );
        addNotification('Roadside Repair Complete!', `Earned ₦${payout.toLocaleString()}!`, 'success');
      });
      return;
    }

    if (activeMission.jobKind === 'police') {
      runActionBar('SECURING SCENE & LOGGING MDT REPORT...', 1500, () => {
        const payout = activeMission.reward;
        const nextAddr = pickRandomAddress(activeMission.target.x, activeMission.target.z, 45);
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, bankBalance: p.bankBalance + payout }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 6) }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Respond to 10-31 call at ${nextAddr.name}`,
                target: {
                  id: 'pd-' + Date.now(),
                  x: nextAddr.x,
                  z: nextAddr.z,
                  label: nextAddr.name,
                  color: '#3b82f6',
                },
              }
            : null
        );
        addNotification(
          'Scene Code-4!',
          `₦${payout.toLocaleString()} PD pay deposited to Bank.`,
          'success'
        );
      });
      return;
    }

    if (activeMission.jobKind === 'ems') {
      if (activeMission.stage === 0) {
        runActionBar('STABILISING PATIENT WITH PILLBOX IFAK...', 1400, () => {
          audioEngine.playUpNepa();
          setActiveMission((m) =>
            m
              ? {
                  ...m,
                  stage: 1,
                  objective: 'Transport patient to Pillbox Medical Center',
                  target: {
                    id: 'ems-hosp-' + Date.now(),
                    x: pillbox.x,
                    z: pillbox.z,
                    label: 'Pillbox Medical',
                    color: '#38bdf8',
                  },
                }
              : null
          );
          addNotification('Patient Stabilised', 'Transport to Pillbox Medical!', 'info');
        });
      } else {
        const payout = activeMission.reward;
        const nextAddr = pickRandomAddress(pillbox.x, pillbox.z, 45);
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, bankBalance: p.bankBalance + payout }));
        setVitals((v) => ({
          ...v,
          health: Math.min(100, v.health + 15),
          streetCred: Math.min(100, v.streetCred + 6),
        }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 0,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Stabilise 911 patient at ${nextAddr.name}`,
                target: {
                  id: 'ems-pickup-' + Date.now(),
                  x: nextAddr.x,
                  z: nextAddr.z,
                  label: nextAddr.name,
                  color: '#ef4444',
                },
              }
            : null
        );
        addNotification(
          'Patient Admitted!',
          `₦${payout.toLocaleString()} EMS pay deposited to Bank!`,
          'success'
        );
      }
      return;
    }

    if (activeMission.jobKind === 'heist') {
      if (activeMission.stage === 0) {
        setIsHeistOpen(true);
      } else {
        const bonus = activeMission.reward;
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, cash: p.cash + bonus }));
        setWantedStars(0);
        setActiveMission(null);
        addNotification(
          'Clean Getaway Complete!',
          `Laundered extra ₦${bonus.toLocaleString()} at Lagoon Pier & lost the heat!`,
          'success'
        );
      }
      return;
    }

    if (activeMission.jobKind === 'race') {
      const nextStage = activeMission.stage + 1;
      if (nextStage < RACE_CHECKPOINTS.length) {
        const cp = RACE_CHECKPOINTS[nextStage];
        audioEngine.playSeatbeltChime();
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: nextStage,
                objective: cp.label,
                target: {
                  id: `race-cp-${nextStage}-` + Date.now(),
                  x: cp.x,
                  z: cp.z,
                  label: cp.label,
                  color: '#ec4899',
                },
              }
            : null
        );
        addNotification('Checkpoint Cleared!', `Next: ${cp.label}`, 'info');
      } else {
        const payout = activeMission.reward;
        audioEngine.playCashEarn();
        setPlayer((p) => ({
          ...p,
          cash: p.cash + payout,
          cryptoBalance: (p.cryptoBalance || 15) + 10,
        }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 15) }));
        const firstCp = RACE_CHECKPOINTS[0];
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 0,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Lap ${m.completedRuns + 2}: ${firstCp.label}`,
                target: {
                  id: 'race-cp-0-' + Date.now(),
                  x: firstCp.x,
                  z: firstCp.z,
                  label: firstCp.label,
                  color: '#ec4899',
                },
              }
            : null
        );
        addNotification(
          'Circuit Lap Won! 🏆',
          `Earned ₦${payout.toLocaleString()} + 10 QBit + 15 Cred!`,
          'success'
        );
      }
      return;
    }

    const laptopSpec =
      LAPTOP_MODELS_CATALOG.find((l) => l.id === player.laptopModelId) || LAPTOP_MODELS_CATALOG[0];

    if (activeMission.jobKind === 'developer') {
      runActionBar(`PATCHING KUBERNETES NODE ON ${laptopSpec.name.toUpperCase()}...`, 1400, () => {
        const payout = Math.round(activeMission.reward * laptopSpec.payMultiplier);
        const nextNode = pickRandomAddress(activeMission.target.x, activeMission.target.z, 42);
        audioEngine.playCashEarn();
        setPlayer((p) => ({
          ...p,
          bankBalance: p.bankBalance + payout,
          cryptoBalance: (p.cryptoBalance || 15) + 3,
        }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 6) }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Patch fiber server node at ${nextNode.name}`,
                target: {
                  id: 'dev-node-' + Date.now(),
                  x: nextNode.x,
                  z: nextNode.z,
                  label: nextNode.name,
                  color: '#6366f1',
                },
              }
            : null
        );
        addNotification(
          'Production Node Patched! 💻',
          `₦${payout.toLocaleString()} (${laptopSpec.payMultiplier}x Laptop Bonus) + 3 QBit wired to Bank!`,
          'success'
        );
      });
      return;
    }

    if (activeMission.jobKind === 'banker') {
      const fleeca = DISTRICTS.find((d) => d.id === 'fleeca')!;
      if (activeMission.stage === 0) {
        const clientAddr = pickRandomAddress(fleeca.x, fleeca.z, 45);
        audioEngine.playSeatbeltChime();
        setActiveMission((m) =>
          m
            ? {
                ...m,
                stage: 1,
                objective: `Verify corporate bullion settlement at ${clientAddr.name}`,
                target: {
                  id: 'banker-client-' + Date.now(),
                  x: clientAddr.x,
                  z: clientAddr.z,
                  label: clientAddr.name,
                  color: '#10b981',
                },
              }
            : null
        );
        addNotification('Bullion Manifest Loaded', `Escort settlement to ${clientAddr.name}.`, 'info');
      } else {
        runActionBar('CLEARING CBN RTGS SETTLEMENT LEDGER...', 1300, () => {
          const payout = Math.round(activeMission.reward * laptopSpec.payMultiplier);
          audioEngine.playCashEarn();
          setPlayer((p) => ({ ...p, bankBalance: p.bankBalance + payout }));
          setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 5) }));
          setActiveMission((m) =>
            m
              ? {
                  ...m,
                  stage: 0,
                  completedRuns: m.completedRuns + 1,
                  earnedThisShift: m.earnedThisShift + payout,
                  objective: 'Return to Fleeca Bank HQ for next bullion manifest',
                  target: {
                    id: 'banker-hq-' + Date.now(),
                    x: fleeca.x,
                    z: fleeca.z,
                    label: 'Fleeca Bank HQ',
                    color: '#10b981',
                  },
                }
              : null
          );
          addNotification(
            'Corporate Settlement Cleared! 🏦',
            `₦${payout.toLocaleString()} Banker commission deposited to Bank!`,
            'success'
          );
        });
      }
      return;
    }

    if (activeMission.jobKind === 'security') {
      runActionBar('SCANNING PERIMETER & LOGGING GUARD CHECKPOINT...', 1250, () => {
        const payout = activeMission.reward;
        const nextPost = pickRandomAddress(activeMission.target.x, activeMission.target.z, 40);
        audioEngine.playCashEarn();
        setPlayer((p) => ({ ...p, bankBalance: p.bankBalance + payout }));
        setVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 4) }));
        setActiveMission((m) =>
          m
            ? {
                ...m,
                completedRuns: m.completedRuns + 1,
                earnedThisShift: m.earnedThisShift + payout,
                objective: `Patrol & secure perimeter at ${nextPost.name}`,
                target: {
                  id: 'sec-patrol-' + Date.now(),
                  x: nextPost.x,
                  z: nextPost.z,
                  label: nextPost.name,
                  color: '#eab308',
                },
              }
            : null
        );
        addNotification(
          'Perimeter Secured! 🛡️',
          `₦${payout.toLocaleString()} Security Guard pay deposited to Bank!`,
          'success'
        );
      });
    }
  }, [activeMission, addNotification, pickRandomAddress, player.laptopModelId, runActionBar]);

  // Use Inventory / Hotbar Item
  const handleUseItem = useCallback(
    (item: InventoryItem) => {
      if (item.id === 'ekophone_pro') {
        setIsInventoryOpen(false);
        setIsPhoneOpen(true);
        return;
      }
      if (item.id === 'thermite_laptop') {
        setIsInventoryOpen(false);
        setIsHeistOpen(true);
        return;
      }
      if (item.id === 'heavy_armor') {
        setIsInventoryOpen(false);
        runActionBar('EQUIPPING CLASS-IV BODY ARMOR...', 1100, () => {
          audioEngine.playSeatbeltChime();
          setVitals((v) => ({ ...v, armor: Math.min(100, v.armor + 50) }));
          addNotification('Armor Equipped', '+50 Tactical Kevlar Armor applied.', 'success');
        });
        return;
      }
      if (item.id === 'ifak_medkit') {
        setIsInventoryOpen(false);
        runActionBar('APPLYING PILLBOX IFAK MEDKIT...', 1100, () => {
          audioEngine.playUpNepa();
          setVitals((v) => ({
            ...v,
            health: Math.min(100, v.health + 45),
            stress: Math.max(0, v.stress - 15),
          }));
          addNotification('IFAK Medkit Used', '+45 Health restored.', 'success');
        });
        return;
      }
      if (item.id === 'amala_pack' || item.id === 'energy_drink') {
        setIsInventoryOpen(false);
        runActionBar(`CONSUMING ${item.name.toUpperCase()}...`, 950, () => {
          audioEngine.playEatFood();
          setVitals((v) => ({
            ...v,
            hunger: Math.min(100, v.hunger + 45),
            thirst: Math.min(100, v.thirst + 50),
            energy: Math.min(100, v.energy + 45),
            stress: Math.max(0, v.stress - 20),
          }));
          addNotification('Vitals Replenished', `Consumed ${item.name}!`, 'success');
        });
        return;
      }
      if (item.id === 'adv_lockpick') {
        setIsInventoryOpen(false);
        runActionBar('HOTWIRING IGNITION...', 1300, () => {
          setSpawnVehicleRequest({ id: 'veh-super', timestamp: Date.now() });
          addNotification('Vehicle Hotwired', 'Pfister Neon GT R unlocked!', 'success');
        });
        return;
      }
      addNotification(item.name, item.description, 'info');
    },
    [addNotification, runActionBar]
  );

  // Buy Item from 24/7 Shop
  const handleBuyItem = (shopItem: InventoryItem) => {
    const cost = shopItem.price || 5000;
    if (player.cash < cost) {
      addNotification(
        'Insufficient Pocket Cash',
        'Use an ATM or Fleeca Bank app to withdraw cash first!',
        'warning'
      );
      return;
    }
    audioEngine.playCashEarn();
    setPlayer((prev) => {
      const existingIdx = (prev.items || []).findIndex((i) => i.id === shopItem.id);
      const nextItems = [...(prev.items || [])];
      if (existingIdx >= 0) {
        nextItems[existingIdx] = {
          ...nextItems[existingIdx],
          quantity: nextItems[existingIdx].quantity + 1,
        };
      } else {
        nextItems.push({ ...shopItem, quantity: 1 });
      }
      return {
        ...prev,
        cash: prev.cash - cost,
        items: nextItems,
      };
    });
    addNotification('24/7 Purchase', `Bought 1x ${shopItem.name}.`, 'success');
  };

  // GTA VI Item Wheel — Remove / Drop items from pockets
  const handleRemoveItem = useCallback(
    (itemId: string, qty: number) => {
      let removedName = '';
      setPlayer((prev) => {
        const nextItems = (prev.items || [])
          .map((it) => {
            if (it.id !== itemId) return it;
            removedName = it.name;
            return { ...it, quantity: it.quantity - qty };
          })
          .filter((it) => it.quantity > 0);
        return { ...prev, items: nextItems };
      });
      setEquippedItemId((eq) =>
        eq === itemId && !(player.items || []).some((i) => i.id === itemId && i.quantity > qty)
          ? null
          : eq
      );
      audioEngine.playClick();
      setMeText({ text: '* drops an item on the ground *', ts: Date.now() });
      setTimeout(() => {
        addNotification('Item Removed 🗑️', `Dropped ${qty}x ${removedName || 'item'}.`, 'info');
      }, 0);
    },
    [addNotification, player.items]
  );

  // Multi-Bank Vault Heist: Disable CCTV Cameras
  const handleDisableVaultCameras = useCallback(
    (bankId: BankVaultSpec['id']) => {
      const spec = BANK_VAULTS_CATALOG.find((v) => v.id === bankId) ?? BANK_VAULTS_CATALOG[0];
      if (vaultCamsDisabled[bankId]) {
        addNotification('CCTV Already Looped', `${spec.camerasCount} cameras are showing a fake feed.`, 'info');
        return;
      }
      const hasJammer = (player.items || []).some((i) => i.id === 'cctv_jammer');
      const duration = hasJammer ? 1200 : 2600 + spec.tier * 900;
      runActionBar(
        hasJammer
          ? `JAMMING ${spec.camerasCount} CCTV CAMERA FEEDS...`
          : `SPLICING CCTV CABLES MANUALLY (${spec.camerasCount} CAMS)...`,
        duration,
        () => {
          // Without a jammer, there is a chance a guard notices you
          const caught = !hasJammer && Math.random() < 0.15 * spec.tier;
          if (caught) {
            audioEngine.playDispatchAlert();
            setWantedStars((w) => Math.min(5, Math.max(w, spec.wantedStarsOnAlarm - 1)));
            addNotification(
              'Guard Spotted You! 🚨',
              'A vault guard saw you tampering with the CCTV. Police dispatched!',
              'dispatch'
            );
            return;
          }
          setVaultCamsDisabled((prev) => ({ ...prev, [bankId]: true }));
          audioEngine.playRadioClick();
          addNotification(
            'CCTV Looped 📹',
            `All ${spec.camerasCount} cameras at ${spec.name} are now looping old footage.`,
            'success'
          );
        }
      );
    },
    [addNotification, player.items, runActionBar, vaultCamsDisabled]
  );

  // Multi-Bank Vault Heist: Breach Vault (₦4.5M → ₦115M+ depending on bank tier & security)
  const handleBreachVault = useCallback(
    (bankId: BankVaultSpec['id']) => {
      const spec = BANK_VAULTS_CATALOG.find((v) => v.id === bankId) ?? BANK_VAULTS_CATALOG[0];
      const now = Date.now();
      const cd = vaultCooldowns[bankId] ?? 0;
      if (cd > now) {
        const mins = Math.ceil((cd - now) / 60000);
        addNotification('Vault Emptied', `${spec.name} is being restocked. Try again in ${mins} min.`, 'warning');
        return;
      }
      const ids = new Set((player.items || []).map((i) => i.id));
      const hasLaptop = ids.has('thermite_laptop') || ids.has('plasma_drill') || ids.has('c4_thermite');
      if (!hasLaptop) {
        addNotification(
          'Missing Heist Tools',
          'You need a Thermite Hack Laptop, Plasma Drill or C4 Thermite (Computer Village / 24/7 Supply).',
          'warning'
        );
        return;
      }
      if (spec.tier === 3 && !ids.has('c4_thermite')) {
        addNotification(
          'Sovereign Door Too Thick',
          'The CBN Bullion Reserve requires a C4 Thermite charge to breach.',
          'warning'
        );
        return;
      }
      const camsOff = !!vaultCamsDisabled[bankId];
      if (!camsOff) {
        audioEngine.playDispatchAlert();
        setWantedStars((w) => Math.min(5, Math.max(w, spec.wantedStarsOnAlarm)));
        addNotification(
          'SILENT ALARM TRIPPED 🚨',
          `${spec.camerasCount} live cameras saw you! ${spec.wantedStarsOnAlarm}★ response en route.`,
          'dispatch'
        );
      }
      const drillMs = 2200 + spec.tier * 1400 - (ids.has('plasma_drill') ? 900 : 0);
      runActionBar(
        `BREACHING TIER ${spec.tier} VAULT DOOR — ${spec.securityLevel.toUpperCase()}...`,
        drillMs,
        () => {
          let mult = 1;
          if (ids.has('plasma_drill')) mult += 0.2;
          if (ids.has('c4_thermite') && spec.tier < 3) mult += 0.1;
          if (camsOff) mult += 0.08;
          const base = spec.minLoot + Math.random() * (spec.maxLoot - spec.minLoot);
          const loot = Math.round((base * mult) / 1000) * 1000;
          audioEngine.playCashEarn();
          setPlayer((p) => {
            // Consume single-use C4 charge
            const items = (p.items || [])
              .map((it) => (it.id === 'c4_thermite' ? { ...it, quantity: it.quantity - 1 } : it))
              .filter((it) => it.quantity > 0);
            return { ...p, cash: p.cash + loot, items };
          });
          setVitals((v) => ({
            ...v,
            streetCred: Math.min(100, v.streetCred + 6 * spec.tier),
            stress: Math.min(100, v.stress + 12 * spec.tier),
          }));
          setVaultCooldowns((prev) => ({ ...prev, [bankId]: Date.now() + 8 * 60000 }));
          setVaultCamsDisabled((prev) => ({ ...prev, [bankId]: false }));
          setWantedStars((w) => Math.min(5, Math.max(w, camsOff ? spec.tier : spec.wantedStarsOnAlarm)));
          pushChat('system', 'DISPATCH', `10-90 in progress at ${spec.name}! All units respond.`);
          addNotification(
            `VAULT CRACKED 💰 ₦${loot.toLocaleString()}`,
            `Bagged ₦${loot.toLocaleString()} from ${spec.name}! Escape the police and launder it.`,
            'success'
          );
        }
      );
    },
    [addNotification, player.items, pushChat, runActionBar, vaultCamsDisabled, vaultCooldowns]
  );

  // Trigger a Random Real-Life RP Event
  const handleTriggerRandomEvent = useCallback(() => {
    const pick = ALL_LIFE_EVENTS[Math.floor(Math.random() * ALL_LIFE_EVENTS.length)];
    audioEngine.playDispatchAlert();
    setActiveRandomEvent(pick);
  }, []);

  // RP Chat Submission & Slash Commands
  const handleSubmitChat = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('/me ')) {
        const act = trimmed.slice(4).trim();
        if (act) {
          setMeText({ text: `* ${act} *`, ts: Date.now() });
          pushChat('me', player.name, act);
        }
        return;
      }
      if (trimmed.startsWith('/do ')) {
        const desc = trimmed.slice(4).trim();
        if (desc) pushChat('do', player.name, desc);
        return;
      }
      if (trimmed.startsWith('/e ')) {
        const arg = trimmed.slice(3).trim().toLowerCase();
        if (arg === 'stop' || arg === 'c' || arg === 'none') {
          setEmote('none');
        } else if (VALID_EMOTES.includes(arg as Emote)) {
          setEmote(arg as Emote);
          pushChat('me', player.name, `performs ${arg}`);
        } else {
          pushChat(
            'system',
            'SYSTEM',
            'Available emotes: wave, dance, handsup, sit, pushups, salute, facepalm, stop'
          );
        }
        return;
      }
      if (trimmed.startsWith('/weather ')) {
        const w = trimmed.slice(9).trim().toLowerCase() as Weather;
        if (['clear', 'cloudy', 'rain', 'fog'].includes(w)) {
          setWeather(w);
          pushChat('system', 'SYSTEM', `Weather changed to ${w.toUpperCase()}.`);
        }
        return;
      }
      if (trimmed.startsWith('/time ')) {
        const hr = parseFloat(trimmed.slice(6).trim());
        if (!Number.isNaN(hr)) {
          setTimeOfDay(((hr % 24) + 24) % 24);
          pushChat('system', 'SYSTEM', `Clock set to ${Math.floor(hr)}:00.`);
        }
        return;
      }
      if (trimmed === '/clear') {
        setChatLines([]);
        return;
      }
      if (trimmed === '/help') {
        setIsHelpOpen(true);
        return;
      }

      pushChat('ooc', player.name, trimmed);
    },
    [player.name, pushChat]
  );

  // Global Hotkeys (F1, TAB, M, T, U, V, ALT, ESC, 1-5)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltHeld(true);
      }

      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        const anyModalOpen =
          isPhoneOpen ||
          isRadialOpen ||
          isItemWheelOpen ||
          isInventoryOpen ||
          isScoreboardOpen ||
          isHelpOpen ||
          isChatOpen ||
          isMapOpen ||
          isBennysOpen ||
          activeBuildingId !== null ||
          activePedName !== null ||
          isCustomizerOpen ||
          isDanfoOpen ||
          isTechBroOpen ||
          isAfrobeatsOpen ||
          isAmalaOpen ||
          isQuiloxOpen ||
          isHeistOpen;

        if (anyModalOpen) {
          setIsPhoneOpen(false);
          setIsRadialOpen(false);
          setIsItemWheelOpen(false);
          setIsInventoryOpen(false);
          setIsScoreboardOpen(false);
          setIsHelpOpen(false);
          setIsChatOpen(false);
          setIsMapOpen(false);
          setIsBennysOpen(false);
          setActiveBuildingId(null);
          setActivePedName(null);
          setIsCustomizerOpen(false);
          setIsDanfoOpen(false);
          setIsTechBroOpen(false);
          setIsAfrobeatsOpen(false);
          setIsAmalaOpen(false);
          setIsQuiloxOpen(false);
          setIsHeistOpen(false);
          return;
        }

        audioEngine.playClick();
        setIsSettingsOpen(true);
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        audioEngine.playClick();
        setIsRadialOpen((prev) => !prev);
      } else if (e.key === 'Tab') {
        // GTA VI-style circular Item Wheel
        e.preventDefault();
        audioEngine.playClick();
        setIsItemWheelOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        audioEngine.playClick();
        setIsInventoryOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        audioEngine.playClick();
        setIsPhoneOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        audioEngine.playClick();
        setIsMapOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsChatOpen(true);
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        audioEngine.playClick();
        setIsScoreboardOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'v') {
        audioEngine.playClick();
        setCameraMode((prev) =>
          prev === 'chase' ? 'hood' : prev === 'hood' ? 'isometric' : 'chase'
        );
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const slotIdx = parseInt(e.key, 10) - 1;
        const item = (player.items || [])[slotIdx];
        if (item) handleUseItem(item);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltHeld(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    player.items,
    handleUseItem,
    isSettingsOpen,
    isPhoneOpen,
    isRadialOpen,
    isItemWheelOpen,
    isInventoryOpen,
    isScoreboardOpen,
    isHelpOpen,
    isChatOpen,
    isMapOpen,
    isBennysOpen,
    activeBuildingId,
    activePedName,
    isCustomizerOpen,
    isDanfoOpen,
    isTechBroOpen,
    isAfrobeatsOpen,
    isAmalaOpen,
    isQuiloxOpen,
    isHeistOpen,
  ]);

  // Smooth Continuous World Clock + Sprinting Stamina Loop (1Hz)
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeOfDay((t) => (t + 0.025) % 24);
      setVitals((v) => ({
        ...v,
        energy: worldState.isSprinting
          ? Math.max(0, v.energy - 1.4)
          : Math.min(100, v.energy + 0.45),
      }));
    }, 1000);
    return () => clearInterval(tick);
  }, [worldState.isSprinting]);

  // Ambient City Life Loop: Vitals Hunger/Thirst, OOC Server Chatter, Calls & Weather (every 24s)
  useEffect(() => {
    const ambient = setInterval(() => {
      setVitals((prev) => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 0.8),
        thirst: Math.max(0, prev.thirst - 1.0),
      }));

      // Live Server RP / OOC Chatter
      const line = OOC_CHATTER[Math.floor(Math.random() * OOC_CHATTER.length)];
      pushChat(line.kind, line.author, line.text);

      // Occasional incoming NPC call
      if (Math.random() > 0.78 && !isPhoneOpen && !incomingCaller) {
        const contact = PHONE_CONTACTS[Math.floor(Math.random() * PHONE_CONTACTS.length)];
        audioEngine.playPhoneRing();
        setIncomingCaller(contact);
      }

      // Gentle dynamic weather transitions
      if (Math.random() > 0.85) {
        const pool: Weather[] = ['clear', 'clear', 'cloudy', 'rain', 'fog'];
        setWeather(pool[Math.floor(Math.random() * pool.length)]);
      }

      // Occasional NEPA Grid event (Solar Roof keeps home powered even during grid blackouts!)
      if (Math.random() > 0.88) {
        setIsNepaActive((curr) => {
          const next = !curr;
          if (!next) {
            audioEngine.playBlackout();
            addNotification(
              'Grid Outage',
              (player.solarKw ?? 0) > 0
                ? `NEPA grid tripped — your ${player.solarKw}kVA Solar Roof kept your house online!`
                : 'Substation tripped — backup generators active.',
              'warning'
            );
          } else {
            audioEngine.playUpNepa();
            addNotification('Power Restored ⚡', 'City grid back online!', 'success');
          }
          return next;
        });
      }
    }, 24000);

    return () => clearInterval(ambient);
  }, [addNotification, incomingCaller, isPhoneOpen, player.solarKw, pushChat]);

  // Commercial Flight Handler (Lagos LOS ⇄ Abuja ABV)
  const handleFlyToCity = useCallback(
    (targetCity: CityId, airlineName: string) => {
      const destLabel =
        targetCity === 'abuja'
          ? 'Abuja (Nnamdi Azikiwe Int’l ABV)'
          : 'Lagos (Murtala Muhammed Int’l LOS)';
      runActionBar(
        `BOARDING ${airlineName.toUpperCase()} FLIGHT TO ${targetCity.toUpperCase()}...`,
        1600,
        () => {
          audioEngine.playUpNepa();
          setPlayer((p) => ({ ...p, activeCity: targetCity }));
          setWaypoint(null);
          setTimeout(() => {
            setEnterBuildingRequest({ id: 'airport', ts: Date.now() });
          }, 40);
          pushChat('system', 'FAAN ATC', `${player.name} landed at ${destLabel} via ${airlineName}.`);
          addNotification(
            'Flight Landed ✈️',
            `Welcome to ${destLabel}! Step out the Arrival Doors to explore the city.`,
            'success'
          );
        }
      );
    },
    [addNotification, player.name, pushChat, runActionBar]
  );

  // Interact with 3D Landmarks, Enterable 3D Buildings, 3D Furniture Stations, ATMs, Pedestrians & Services
  const handleInteract = useCallback(
    (locationId: string) => {
      audioEngine.playClick();

      // 1. Entering or Exiting a Walkable 3D Building Interior (from HUD button or keyboard)
      if (locationId.startsWith('enter:')) {
        const distId = locationId.slice(6) as LagosDistrict;
        setEnterBuildingRequest({ id: distId, ts: Date.now() });
        return;
      }
      if (locationId === 'int:exit') {
        setExitBuildingRequest(Date.now());
        return;
      }

      // 2. HOME 3D INTERIOR STATIONS
      if (locationId === 'int:home_bed') {
        runActionBar('SLEEPING IN KING-SIZE MASTER BED...', 1300, () => {
          audioEngine.playUpNepa();
          setVitals((v) => ({
            ...v,
            energy: 100,
            health: 100,
            stress: Math.max(0, v.stress - 45),
          }));
          setMeText({ text: '* wakes up refreshed *', ts: Date.now() });
          addNotification(
            'Well Rested 🛏️',
            '100% Energy & Health restored in your Master Suite!',
            'success'
          );
        });
        return;
      }
      if (locationId === 'int:home_fridge') {
        runActionBar('PREPARING FRESH HOME MEAL...', 1100, () => {
          audioEngine.playEatFood();
          setVitals((v) => ({
            ...v,
            hunger: Math.min(100, v.hunger + 65),
            thirst: Math.min(100, v.thirst + 65),
            energy: Math.min(100, v.energy + 25),
            stress: Math.max(0, v.stress - 15),
          }));
          setMeText({ text: '* enjoys a hot meal *', ts: Date.now() });
          addNotification(
            'Home Kitchen 🍽️',
            'Replenished +65 Hunger, +65 Thirst & +25 Stamina!',
            'success'
          );
        });
        return;
      }
      if (locationId === 'int:home_wardrobe' || locationId === 'int:clothing_rack') {
        setIsCustomizerOpen(true);
        return;
      }
      if (
        locationId === 'int:home_laptop' ||
        locationId === 'int:home_solar' ||
        locationId === 'int:home_safe'
      ) {
        openBuildingModal('home', locationId.slice(9));
        return;
      }
      if (locationId === 'int:home_garage' || locationId === 'garage') {
        setIsGarageOpen(true);
        return;
      }

      // 3. COMPUTER VILLAGE / BANEX TECH STORE 3D STATIONS
      if (locationId === 'int:cv_ios') {
        openBuildingModal('computervillage', 'ios');
        return;
      }
      if (locationId === 'int:cv_android') {
        openBuildingModal('computervillage', 'android');
        return;
      }
      if (locationId === 'int:cv_laptops') {
        openBuildingModal('computervillage', 'laptops');
        return;
      }
      if (locationId === 'int:cv_counter') {
        openBuildingModal('computervillage', 'phones');
        return;
      }

      // 4. SHOPPING MALL 3D STATIONS
      if (locationId === 'int:mall_grocery') {
        openBuildingModal('lekki', 'groceries');
        return;
      }
      if (locationId === 'int:mall_solar') {
        openBuildingModal('lekki', 'solar');
        return;
      }
      if (locationId === 'int:mall_luxury') {
        openBuildingModal('lekki', 'luxury');
        return;
      }
      if (locationId === 'int:mall_realestate') {
        openBuildingModal('lekki', 'realestate');
        return;
      }

      // 5. BANK BRANCH 3D STATIONS (Zenith/Fleeca, GTCO & CBN share station IDs)
      const insideBank: BankVaultSpec['id'] =
        worldState.insideBuilding === 'gtbank' || worldState.insideBuilding === 'cbn'
          ? worldState.insideBuilding
          : 'fleeca';
      if (locationId === 'int:bank_teller' || locationId === 'int:bank_desk') {
        openBuildingModal(insideBank);
        return;
      }
      if (locationId === 'int:bank_cams') {
        handleDisableVaultCameras(insideBank);
        return;
      }
      if (locationId === 'int:bank_vault') {
        handleBreachVault(insideBank);
        return;
      }

      // 6. AIRPORT TERMINAL 3D STATIONS
      if (locationId === 'int:airport_checkin' || locationId === 'int:airport_gate') {
        openBuildingModal('airport');
        return;
      }

      // 7. POLICE & SECURITY HQ 3D STATIONS
      if (locationId === 'int:pd_desk') {
        openBuildingModal('mrpd');
        return;
      }
      if (locationId === 'int:pd_armory') {
        runActionBar('EQUIPPING CLASS-IV KEVLAR & DUTY MEDKIT...', 1100, () => {
          audioEngine.playSeatbeltChime();
          setVitals((v) => ({
            ...v,
            armor: 100,
            health: 100,
            stress: Math.max(0, v.stress - 20),
          }));
          addNotification(
            'Tactical Armory 🛡️',
            '100% Kevlar Armor & 100% Health equipped!',
            'success'
          );
        });
        return;
      }

      // 8. TECH HUB CAMPUS 3D STATIONS
      if (locationId === 'int:yaba_code') {
        setIsTechBroOpen(true);
        return;
      }
      if (locationId === 'int:yaba_servers') {
        openBuildingModal('yaba');
        return;
      }

      // 9. NNPC MEGA STATION, NEPA & BENNY'S 3D STATIONS
      if (locationId === 'int:gas_energy') {
        openBuildingModal('gas');
        return;
      }
      if (locationId === 'int:gas_bennys' || locationId === 'bennys') {
        setIsBennysOpen(true);
        return;
      }

      // 10. AMALA CANTEEN, HOSPITAL, QUILOX & LAGOON PIER 3D STATIONS
      if (locationId === 'int:amala_counter') {
        setIsAmalaOpen(true);
        return;
      }
      if (locationId === 'int:hosp_heal') {
        runActionBar('RECEIVING CHIEF SURGEON TRAUMA CHECKUP...', 1300, () => {
          const fee = player.cash >= 2500 ? 2500 : 0;
          audioEngine.playUpNepa();
          if (fee > 0) setPlayer((p) => ({ ...p, cash: p.cash - fee }));
          setVitals((v) => ({ ...v, health: 100, stress: Math.max(0, v.stress - 35) }));
          addNotification(
            'Trauma Center Discharged 🏥',
            `100% Health restored${fee ? ' (-₦2,500 co-pay)' : ''}!`,
            'success'
          );
        });
        return;
      }
      if (locationId === 'int:hosp_ems') {
        handleStartMission('ems');
        return;
      }
      if (locationId === 'int:quilox_vip') {
        setIsQuiloxOpen(true);
        return;
      }
      if (locationId === 'int:lagoon_dispatch') {
        setIsDanfoOpen(true);
        return;
      }

      // 11. OUTDOOR INTERACTIONS (Pedestrians, ATMs, or Direct District Entry)
      if (locationId.startsWith('ped:')) {
        const pedLabel = worldState.nearInteractable?.name || 'Street Citizen';
        setActivePedName(pedLabel);
        return;
      }
      if (locationId === 'atm') {
        setIsPhoneOpen(true);
        addNotification('Fleeca ATM', 'Connected to Checking Account on your phone.', 'info');
        return;
      }

      const validDistricts: LagosDistrict[] = [
        'home',
        'airport',
        'computervillage',
        'lekki',
        'fleeca',
        'gas',
        'mrpd',
        'yaba',
        'shitta',
        'pillbox',
        'clothing',
        'quilox',
        'lagoon',
        'cbn',
        'gtbank',
        'istore',
      ];
      if (validDistricts.includes(locationId as LagosDistrict)) {
        setEnterBuildingRequest({ id: locationId as LagosDistrict, ts: Date.now() });
        return;
      }

      setIsPhoneOpen(true);
    },
    [
      addNotification,
      handleStartMission,
      openBuildingModal,
      player.cash,
      runActionBar,
      worldState.nearInteractable?.name,
      worldState.insideBuilding,
      handleDisableVaultCameras,
      handleBreachVault,
    ]
  );

  // Ron Petrol Refuel Handler (called by LagosWorld3D when driving under canopy + pressing [E])
  const handleRefuelRequest = useCallback(
    (missingPct: number): boolean => {
      const cost = Math.max(500, Math.round(missingPct * 85));
      if (player.cash < cost && player.bankBalance < cost) {
        addNotification(
          'Card Declined',
          `Need ₦${cost.toLocaleString()} to refuel at Ron Petrol!`,
          'warning'
        );
        return false;
      }
      audioEngine.playCashEarn();
      setPlayer((p) =>
        p.cash >= cost
          ? { ...p, cash: p.cash - cost }
          : { ...p, bankBalance: p.bankBalance - cost }
      );
      addNotification('Tank Filled ⛽', `Paid ₦${cost.toLocaleString()} at Ron Petrol.`, 'success');
      return true;
    },
    [addNotification, player.bankBalance, player.cash]
  );

  // Damage, Crime & Police Arrest Handlers
  const handleDamage = useCallback(
    (amount: number, reason: string) => {
      setVitals((v) => {
        const armorAbsorb = Math.min(v.armor, Math.round(amount * 0.55));
        const hpLoss = Math.max(1, amount - armorAbsorb);
        return {
          ...v,
          armor: Math.max(0, v.armor - armorAbsorb),
          health: Math.max(0, v.health - hpLoss),
          stress: Math.min(100, v.stress + 6),
        };
      });
      if (amount >= 12) {
        addNotification('Injury Sustained', reason, 'alert');
      }
    },
    [addNotification]
  );

  const handleCrime = useCallback(
    (kind: string) => {
      setWantedStars((w) => Math.min(5, Math.max(1, w + 1)));
      audioEngine.playDispatchAlert();
      addNotification('10-32 Crime Reported', `${kind} — Eko PD units responding!`, 'dispatch', '10-80');
    },
    [addNotification]
  );

  const handleBusted = useCallback(() => {
    const fine = Math.min(player.cash, 35000);
    setPlayer((p) => ({ ...p, cash: Math.max(0, p.cash - fine) }));
    setWantedStars(0);
    setTeleportRequest({ x: 40, z: -13, ts: Date.now() });
    pushChat('system', 'MRPD', `${player.name} was processed and fined ₦${fine.toLocaleString()}.`);
    addNotification(
      'Busted by Eko PD!',
      `Processed at Mission Row PD (-₦${fine.toLocaleString()} fine).`,
      'alert'
    );
  }, [addNotification, player.cash, player.name, pushChat]);

  const handleReviveEMS = () => {
    const fee = Math.min(player.bankBalance, 3500);
    audioEngine.playUpNepa();
    setPlayer((p) => ({ ...p, bankBalance: Math.max(0, p.bankBalance - fee) }));
    setVitals((v) => ({ ...v, health: 100, hunger: Math.max(50, v.hunger), thirst: Math.max(50, v.thirst) }));
    setTeleportRequest({ x: -40, z: 14, ts: Date.now() });
    addNotification('Pillbox Trauma Team', 'Revived & discharged at Pillbox Medical!', 'success');
  };

  // Audio toggles
  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    audioEngine.isMuted = nextMuted;
    setIsAudioMuted(nextMuted);
    if (nextMuted) {
      audioEngine.setEngine(false, 0);
      if (isPlayingMusic) {
        audioEngine.stopAfrobeatsGroove();
        setIsPlayingMusic(false);
      }
    }
  };

  const handleToggleMusic = () => {
    if (isAudioMuted) {
      audioEngine.isMuted = false;
      setIsAudioMuted(false);
    }
    const playing = audioEngine.toggleAfrobeatsGroove();
    setIsPlayingMusic(playing);
  };

  const handleStartMiniGame = (gameId: 'danfo' | 'techbro' | 'afrobeats' | 'heist') => {
    if (gameId === 'danfo') setIsDanfoOpen(true);
    if (gameId === 'techbro') setIsTechBroOpen(true);
    if (gameId === 'afrobeats') setIsAfrobeatsOpen(true);
    if (gameId === 'heist') setIsHeistOpen(true);
  };

  const handleSetDistrictWaypoint = useCallback(
    (distId: LagosDistrict) => {
      const cityList = getDistrictsForCity(player.activeCity || 'lagos');
      const d = cityList.find((item) => item.id === distId);
      if (!d) return;
      setWaypoint({
        id: 'wp-' + d.id + '-' + Date.now(),
        x: d.x,
        z: d.z,
        label: d.name,
        color: '#a855f7',
      });
    },
    [player.activeCity]
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050814]">
      {/* 3D WebGL Open-World City & Articulated Playable Character */}
      <LagosWorld3D
        outfit={player.outfit}
        appearance={player.appearance}
        activeCity={player.activeCity || 'lagos'}
        solarKw={player.solarKw || 0}
        timeOfDay={timeOfDay}
        weather={weather}
        isNepaActive={isNepaActive}
        cameraMode={cameraMode}
        emote={emote}
        holdingPhone={isPhoneOpen}
        movementLocked={movementLocked}
        cursorFree={cursorFree}
        isDowned={isDowned}
        energy={vitals.energy}
        wantedStars={wantedStars}
        missionTarget={activeMission?.target ?? null}
        waypoint={waypoint}
        teleportRequest={teleportRequest}
        spawnVehicleRequest={spawnVehicleRequest}
        vehicleControlTrigger={vehicleControlTrigger}
        enterBuildingRequest={enterBuildingRequest}
        exitBuildingRequest={exitBuildingRequest}
        tuneVehicleRequest={tuneVehicleRequest}
        meText={meText}
        graphicsSettings={graphicsSettings}
        activeMissionJobKind={activeMission?.jobKind ?? null}
        housing={player.housing}
        ownedVehicles={player.ownedVehicles}
        garageVehicles={player.garageVehicles}
        onOpenGarage={() => setIsGarageOpen(true)}
        onInteract={handleInteract}
        onRefuelRequest={handleRefuelRequest}
        onMissionReached={handleMissionReached}
        onWaypointReached={() => {
          setWaypoint(null);
          addNotification('GPS Arrived', 'Reached your waypoint.', 'info');
        }}
        onBusted={handleBusted}
        onWantedEscaped={() => {
          setWantedStars(0);
          addNotification('Pursuit Evaded', 'You lost Eko PD interceptors!', 'success');
        }}
        onCrime={handleCrime}
        onDamage={handleDamage}
        onEmoteCancel={() => setEmote('none')}
        onUpdateWorldState={setWorldState}
      />

      {/* Clean, Uncluttered NoPixel V HUD */}
      {hudVisible && !isLoggedOut && (
        <GameHUD
          player={player}
          vitals={vitals}
          worldState={worldState}
          wantedStars={wantedStars}
          timeOfDay={timeOfDay}
          weather={weather}
          emote={emote}
          activeMission={activeMission}
          missionTarget={activeMission?.target ?? null}
          waypoint={waypoint}
          isPhoneOpen={isPhoneOpen}
          isChatOpen={isChatOpen}
          chatLines={chatLines}
          voiceMode={voiceMode}
          isRadioOn={isRadioOn}
          isAudioMuted={isAudioMuted}
          isPlayingMusic={isPlayingMusic}
          onlineCount={SERVER_PLAYERS.length + 1}
          onOpenChat={() => setIsChatOpen(true)}
          onCloseChat={() => setIsChatOpen(false)}
          onSubmitChat={handleSubmitChat}
          onCycleVoiceMode={() => {
            audioEngine.playRadioClick();
            setVoiceMode((m) =>
              m === 'whisper' ? 'normal' : m === 'normal' ? 'shout' : 'whisper'
            );
          }}
          onToggleRadio={() => {
            audioEngine.playRadioClick();
            setIsRadioOn((r) => !r);
          }}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenPhone={() => {
            audioEngine.playClick();
            setIsPhoneOpen((o) => !o);
          }}
          onOpenInventory={() => {
            audioEngine.playClick();
            setIsInventoryOpen(true);
          }}
          onOpenRadial={() => {
            audioEngine.playClick();
            setIsRadialOpen(true);
          }}
          onOpenItemWheel={() => {
            audioEngine.playClick();
            setIsItemWheelOpen(true);
          }}
          onOpenSettings={() => {
            audioEngine.playClick();
            setIsSettingsOpen(true);
          }}
          graphicsSettings={graphicsSettings}
          onChangeGraphics={setGraphicsSettings}
          onOpenMap={() => {
            audioEngine.playClick();
            setIsMapOpen(true);
          }}
          onOpenScoreboard={() => {
            audioEngine.playClick();
            setIsScoreboardOpen(true);
          }}
          onOpenHelp={() => {
            audioEngine.playClick();
            setIsHelpOpen(true);
          }}
          onOpenHome={() => {
            audioEngine.playClick();
            setEnterBuildingRequest({ id: 'home', ts: Date.now() });
          }}
          onOpenAirport={() => {
            audioEngine.playClick();
            setEnterBuildingRequest({ id: 'airport', ts: Date.now() });
          }}
          onExitBuilding={() => {
            audioEngine.playClick();
            setExitBuildingRequest(Date.now());
          }}
          onStopMission={() => {
            setActiveMission(null);
            addNotification('Shift Ended', 'Clocked out of current job.', 'info');
          }}
          onCancelEmote={() => setEmote('none')}
          onUseHotbarItem={handleUseItem}
          onSetWaypoint={setWaypoint}
          onInteractPromptClick={() => {
            const near = worldState.nearInteractable;
            if (!near) return;
            if (near.id === 'refuel') {
              handleRefuelRequest(100 - worldState.vehicle.fuel);
            } else {
              handleInteract(near.id);
            }
          }}
          onVehicleAction={(action) =>
            setVehicleControlTrigger({ action, timestamp: Date.now() })
          }
        />
      )}

      {/* Real-time FPS & Resolution Performance Monitor */}
      {showFps && !isLoggedOut && <FpsCounter />}

      {/* NoPixel Action Task Progress Bar */}
      {actionProgress && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-72 bg-[#090d16]/95 border border-teal-400/60 rounded-2xl p-3 shadow-2xl pointer-events-none animate-fade-in">
          <div className="flex justify-between text-[10px] font-mono font-black text-teal-300 mb-1.5">
            <span>{actionProgress.label}</span>
            <span>{actionProgress.pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 transition-all duration-75"
              style={{ width: `${actionProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Incapacitated / Downed EMS Revival Banner */}
      {isDowned && (
        <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 pointer-events-auto">
          <div className="bg-rose-950/95 backdrop-blur-xl border-2 border-rose-500 rounded-3xl px-6 py-4 shadow-[0_0_50px_rgba(244,63,94,0.5)] text-white max-w-md w-full text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-rose-300 font-mono font-black text-xs uppercase tracking-widest">
              <HeartPulse size={18} className="animate-ping" />
              <span>INCAPACITATED — 10-52 EMS REQUIRED</span>
            </div>
            <p className="text-xs text-zinc-200">
              You are critically injured on {worldState.streetName}. Dispatch Pillbox Medical trauma transport?
            </p>
            <button
              onClick={handleReviveEMS}
              className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all"
            >
              Call Pillbox EMS Transport & Revive (₦3,500)
            </button>
          </div>
        </div>
      )}

      {/* Live Incoming Phone Call Toast */}
      {incomingCaller && !isPhoneOpen && (
        <div className="fixed bottom-24 right-4 z-40 w-72 bg-[#090d16]/95 backdrop-blur-xl border border-emerald-400/70 rounded-3xl p-3.5 shadow-2xl text-white animate-fade-in">
          <div className="flex items-center gap-3 mb-2.5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl animate-bounce"
              style={{ backgroundColor: incomingCaller.color }}
            >
              {incomingCaller.avatar}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                INCOMING CALL
              </span>
              <h4 className="text-xs font-extrabold truncate">{incomingCaller.name}</h4>
              <p className="text-[10px] text-zinc-400 truncate">{incomingCaller.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                audioEngine.playClick();
                setIncomingCaller(null);
              }}
              className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1"
            >
              <PhoneOff size={13} /> Decline
            </button>
            <button
              onClick={() => {
                audioEngine.playClick();
                setIsPhoneOpen(true);
              }}
              className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1"
            >
              <PhoneIncoming size={13} /> Answer
            </button>
          </div>
        </div>
      )}

      {/* NoPixel Dispatch & Notification Toaster */}
      <div className="fixed top-24 right-4 z-30 flex flex-col gap-2 pointer-events-none max-w-xs">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto px-3.5 py-2.5 rounded-2xl shadow-2xl border-l-4 backdrop-blur-xl text-xs animate-fade-in ${
              n.type === 'dispatch'
                ? 'bg-blue-950/92 border-rose-500 text-blue-100'
                : n.type === 'success'
                ? 'bg-[#090d16]/92 border-emerald-400 text-emerald-100'
                : n.type === 'warning'
                ? 'bg-[#090d16]/92 border-amber-400 text-amber-100'
                : n.type === 'alert'
                ? 'bg-rose-950/92 border-rose-500 text-rose-100'
                : 'bg-[#090d16]/92 border-teal-400 text-zinc-100'
            }`}
          >
            <div className="flex justify-between items-center font-bold gap-2">
              <div className="flex items-center gap-1.5">
                {n.code && (
                  <span className="bg-rose-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded">
                    {n.code}
                  </span>
                )}
                <span>{n.title}</span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">{n.timestamp}</span>
            </div>
            <p className="text-[11px] leading-snug text-zinc-300 mt-0.5">{n.message}</p>
          </div>
        ))}
      </div>

      {/* Corner-Docked NoPixel Smartphone (Character holds phone in 3D while open!) */}
      <EkoPhone
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        player={player}
        vitals={vitals}
        isNepaActive={isNepaActive}
        weather={weather}
        timeOfDay={timeOfDay}
        activeMission={activeMission}
        incomingCaller={incomingCaller}
        onClearIncomingCall={() => setIncomingCaller(null)}
        onUpdatePlayer={setPlayer}
        onUpdateVitals={setVitals}
        onStartMission={handleStartMission}
        onStopMission={() => setActiveMission(null)}
        onStartMiniGame={handleStartMiniGame}
        onSpawnVehicle={(vehicleId) => {
          setSpawnVehicleRequest({ id: vehicleId, timestamp: Date.now() });
          addNotification('Valet Delivered', 'Vehicle parked curbside — drive with W/A/S/D!', 'success');
        }}
        onClearWanted={() => setWantedStars(0)}
        onSetWaypoint={handleSetDistrictWaypoint}
        onSetWeather={setWeather}
        onSetTimeOfDay={setTimeOfDay}
        onAddNotification={addNotification}
        onFlyToCity={handleFlyToCity}
        onEnterBuilding={(bId) => {
          setIsPhoneOpen(false);
          setEnterBuildingRequest({ id: bId, ts: Date.now() });
        }}
        graphicsSettings={graphicsSettings}
        onChangeGraphics={setGraphicsSettings}
      />

      {/* GTA VI Circular Item Wheel [TAB] — Equip, Use or Remove Items */}
      <RadialWheelModal
        isOpen={isItemWheelOpen}
        onClose={() => setIsItemWheelOpen(false)}
        inventory={player.items || []}
        equippedItemId={equippedItemId}
        onUseItem={(item) => {
          setIsItemWheelOpen(false);
          handleUseItem(item);
        }}
        onEquipItem={(id) => {
          setEquippedItemId(id);
          const it = (player.items || []).find((i) => i.id === id);
          setMeText({
            text: it ? `* pulls out ${it.name} *` : '* holsters everything *',
            ts: Date.now(),
          });
        }}
        onRemoveItem={handleRemoveItem}
        onOpenPhone={() => setIsPhoneOpen(true)}
      />

      {/* Server Scoreboard & Fast-Spawn Modal [U] */}
      {isScoreboardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none"
          onClick={() => setIsScoreboardOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#090d16] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-teal-400" />
                <div>
                  <h3 className="text-sm font-black uppercase">
                    NoPixel V // Eko Server Roster ({SERVER_PLAYERS.length + 1}/64)
                  </h3>
                  <p className="text-[10px] text-zinc-400">Active Citizens & Fast-Spawn Bus</p>
                </div>
              </div>
              <button
                onClick={() => setIsScoreboardOpen(false)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Quick Spawn Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <MapPin size={11} className="text-teal-400" /> Fast-Travel / Spawn Locations
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPAWN_POINTS.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => {
                        audioEngine.playClick();
                        setTeleportRequest({ x: sp.x, z: sp.z, ts: Date.now() });
                        setIsScoreboardOpen(false);
                        addNotification('Fast Travel', `Arrived at ${sp.label}.`, 'info');
                      }}
                      className="p-2.5 rounded-xl bg-zinc-900 hover:bg-teal-950/60 border border-white/10 hover:border-teal-400/50 text-left flex items-center gap-2 transition-colors"
                    >
                      <span className="text-base">{sp.icon}</span>
                      <span className="text-xs font-bold text-zinc-100 truncate">{sp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Players Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Connected Citizens
                </span>
                <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5 text-xs">
                  <div className="px-3.5 py-2 bg-teal-500/15 flex justify-between items-center font-bold">
                    <span>
                      #{player.stateId} {player.name} (YOU)
                    </span>
                    <span className="text-[11px] text-teal-300 font-mono">
                      {player.job || 'Citizen'} • 18ms
                    </span>
                  </div>
                  {SERVER_PLAYERS.map((sp, i) => (
                    <div
                      key={sp.name}
                      className="px-3.5 py-2 bg-zinc-900/70 flex justify-between items-center"
                    >
                      <span className="text-zinc-200 font-medium">
                        #{1050 + i} {sp.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {sp.job} • {sp.ping}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NoPixel [TAB] Grid Inventory & 24/7 Supply Shop */}
      <NoPixelInventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        player={player}
        onUseItem={handleUseItem}
        onBuyItem={handleBuyItem}
      />

      {/* NoPixel [F1] Radial Action & Emote Wheel */}
      <NoPixelRadialMenu
        isOpen={isRadialOpen}
        currentEmote={emote}
        onClose={() => setIsRadialOpen(false)}
        onSelectEmote={(em) => setEmote(em)}
        onOpenPhone={() => setIsPhoneOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSpawnVehicle={(id) => {
          setSpawnVehicleRequest({ id, timestamp: Date.now() });
          addNotification('Valet Spawned', 'Hop in and drive with W/A/S/D!', 'success');
        }}
        onTeleport={(x, z, label) => {
          setTeleportRequest({ x, z, ts: Date.now() });
          addNotification('Fast Travel', `Teleported to ${label}.`, 'info');
        }}
        onQuickHealArmor={() => {
          runActionBar('APPLYING IFAK & KEVLAR PLATES...', 1000, () => {
            audioEngine.playUpNepa();
            setVitals((v) => ({ ...v, health: 100, armor: 100, stress: 0 }));
            addNotification('Vitals Restored', '100% Health & Armor applied!', 'success');
          });
        }}
        onCycleCamera={() =>
          setCameraMode((c) =>
            c === 'chase' ? 'hood' : c === 'hood' ? 'isometric' : 'chase'
          )
        }
        onTriggerRandomEvent={handleTriggerRandomEvent}
      />

      {/* Fleeca Bank Vault Thermite Heist Modal */}
      <NoPixelHeistModal
        isOpen={isHeistOpen}
        onClose={() => setIsHeistOpen(false)}
        onSuccess={(cashReward, cryptoReward) => {
          const pier = DISTRICTS.find((d) => d.id === 'lagoon')!;
          setPlayer((prev) => ({
            ...prev,
            cash: prev.cash + cashReward,
            cryptoBalance: (prev.cryptoBalance || 15) + cryptoReward,
          }));
          setVitals((prev) => ({
            ...prev,
            streetCred: Math.min(100, prev.streetCred + 20),
          }));
          setWantedStars((w) => Math.min(5, Math.max(3, w + 3)));
          setActiveMission({
            jobKind: 'heist',
            title: 'Fleeca Getaway',
            stage: 1,
            objective: 'Escape PD & launder loot bags at Lagoon Pier',
            target: {
              id: 'heist-drop-' + Date.now(),
              x: pier.x,
              z: pier.z,
              label: 'Lagoon Pier Drop',
              color: '#a855f7',
            },
            reward: 350000,
            completedRuns: 1,
            earnedThisShift: cashReward,
            startedAt: Date.now(),
          });
          audioEngine.playDispatchAlert();
          addNotification(
            'Vault Breached! Escape Now!',
            `Grabbed ₦${cashReward.toLocaleString()} + ${cryptoReward} QBit! Drive to Lagoon Pier to launder extra ₦350k!`,
            'dispatch',
            '10-90'
          );
        }}
        onFail={() => {
          setWantedStars((w) => Math.min(5, Math.max(2, w + 2)));
          audioEngine.playDispatchAlert();
          addNotification(
            'Silent Alarm Triggered!',
            'Security lockdown at Fleeca Bank! Police units responding Code-3!',
            'dispatch',
            '10-90'
          );
        }}
      />

      {/* Dynamic City RP Encounter Modal */}
      <RandomEventModal
        event={activeRandomEvent}
        onClose={() => setActiveRandomEvent(null)}
        onSelectChoice={(c) => {
          if (c.cashDelta) {
            setPlayer((p) => ({ ...p, cash: Math.max(0, p.cash + c.cashDelta!) }));
          }
          if (c.credDelta || c.stressDelta || c.healthDelta) {
            setVitals((v) => ({
              ...v,
              health: Math.max(10, Math.min(100, v.health + (c.healthDelta || 0))),
              streetCred: Math.max(0, Math.min(100, v.streetCred + (c.credDelta || 0))),
              stress: Math.max(0, Math.min(100, v.stress + (c.stressDelta || 0))),
            }));
          }
          if (c.wantedDelta) {
            setWantedStars((w) => Math.max(0, Math.min(5, w + c.wantedDelta!)));
          }
        }}
      />

      {/* Suburban Clothing & 3D Character Customizer */}
      <CharacterCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        player={player}
        onSave={(updated) => {
          setPlayer(updated);
          triggerAutoSave(updated);
          addNotification('Outfit Updated', '3D appearance updated & auto-saved!', 'success');
        }}
      />

      {/* AAA Character Creation Studio (Age, Gender, 3D Melanin Anatomy, Traditional Yoruba & Igbo Attire) */}
      <CharacterCreationModal
        isOpen={isCharacterCreationOpen}
        onClose={() => setIsCharacterCreationOpen(false)}
        existingPlayer={player}
        onComplete={(newPlayer, newVitals) => {
          setPlayer(newPlayer);
          let mergedVitals = vitals;
          if (newVitals) {
            mergedVitals = { ...vitals, ...newVitals };
            setVitals(mergedVitals);
          }
          triggerAutoSave(newPlayer, mergedVitals);
          setIsCharacterCreationOpen(false);
          setIsMainMenuOpen(false);
          setIsLoggedOut(false);
          audioEngine.playVehicleIgnition();
          addNotification(
            'Citizen Registered!',
            `Welcome to ${newPlayer.activeCity === 'abuja' ? 'Abuja FCT' : 'Lagos State'}, ${newPlayer.name}!`,
            'success'
          );
        }}
      />

      {/* Controls & RP Guide */}
      <HelpTutorialModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Danfo Conductor Arcade Shift */}
      <DanfoMiniGame
        isOpen={isDanfoOpen}
        onClose={() => setIsDanfoOpen(false)}
        onComplete={(earnings, cred) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash + earnings }));
          setVitals((prev) => ({
            ...prev,
            energy: Math.max(0, prev.energy - 15),
            streetCred: Math.min(100, prev.streetCred + cred),
          }));
          addNotification(
            'Transit Shift Complete!',
            `Pocketed ₦${earnings.toLocaleString()} and +${cred} Cred!`,
            'success'
          );
        }}
      />

      {/* Tech Bro Fintech Sprint */}
      <TechBroMiniGame
        isOpen={isTechBroOpen}
        onClose={() => setIsTechBroOpen(false)}
        hasGenerator={player.inventory.generator}
        generatorFuelLitres={player.inventory.generatorFuelLitres}
        onComplete={(salary, cred) => {
          setPlayer((prev) => ({ ...prev, bankBalance: prev.bankBalance + salary }));
          setVitals((prev) => ({
            ...prev,
            energy: Math.max(0, prev.energy - 20),
            streetCred: Math.min(100, prev.streetCred + cred),
          }));
          addNotification(
            'Sprint Deployed!',
            `₦${salary.toLocaleString()} wired to Fleeca Bank!`,
            'success'
          );
        }}
      />

      {/* Afrobeats Studio */}
      <AfrobeatsMiniGame
        isOpen={isAfrobeatsOpen}
        onClose={() => setIsAfrobeatsOpen(false)}
        onComplete={(royalties, fans) => {
          setPlayer((prev) => ({
            ...prev,
            bankBalance: prev.bankBalance + royalties,
            musicTracksReleased: prev.musicTracksReleased + 1,
            fansCount: prev.fansCount + fans,
          }));
          setVitals((prev) => ({
            ...prev,
            streetCred: Math.min(100, prev.streetCred + 20),
          }));
          addNotification(
            'Hit Single Dropped!',
            `Earned ₦${royalties.toLocaleString()} in streaming royalties!`,
            'success'
          );
        }}
      />

      {/* Amala Shitta Canteen */}
      <AmalaModal
        isOpen={isAmalaOpen}
        onClose={() => setIsAmalaOpen(false)}
        playerCash={player.cash}
        onEatPlate={(cost, hungerRest, energyRest, stressDown) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash - cost }));
          setVitals((prev) => ({
            ...prev,
            hunger: Math.min(100, prev.hunger + hungerRest),
            thirst: Math.min(100, prev.thirst + 40),
            energy: Math.min(100, prev.energy + energyRest),
            stress: Math.max(0, prev.stress - stressDown),
          }));
          addNotification('Amala Shitta 🍲', 'Hot plate finished — vitals restored!', 'success');
        }}
      />

      {/* Club Quilox VIP */}
      <QuiloxModal
        isOpen={isQuiloxOpen}
        onClose={() => setIsQuiloxOpen(false)}
        playerCash={player.cash}
        streetCred={vitals.streetCred}
        onParty={(cost, cred, stressRelief) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash - cost }));
          setVitals((prev) => ({
            ...prev,
            streetCred: Math.min(100, prev.streetCred + cred),
            stress: Math.max(0, prev.stress - stressRelief),
          }));
          addNotification('Quilox VIP 🍾', `Gained +${cred} Street Cred!`, 'success');
        }}
      />

      {/* Full-Screen Interactive Satellite & Postal City Map [N] */}
      <NoPixelCityMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        worldState={worldState}
        missionTarget={activeMission?.target ?? null}
        waypoint={waypoint}
        activeCity={player.activeCity || 'lagos'}
        onSetWaypoint={setWaypoint}
        onTeleport={(x, z, label) => {
          setTeleportRequest({ x, z, ts: Date.now() });
          addNotification('Fast Travel', `Arrived at ${label}.`, 'info');
        }}
        onFlyToCity={handleFlyToCity}
        onEnterBuilding={(bId) => {
          setIsMapOpen(false);
          setEnterBuildingRequest({ id: bId, ts: Date.now() });
        }}
      />

      {/* Interactive Building Station Terminal UI (Opened from 3D Interior Furniture Stations) */}
      <BuildingInteriorModal
        buildingId={activeBuildingId}
        initialSection={buildingModalSection}
        onClose={() => {
          setActiveBuildingId(null);
          setBuildingModalSection(undefined);
        }}
        onStepOutside={() => setExitBuildingRequest(Date.now())}
        player={player}
        vitals={vitals}
        isNepaActive={isNepaActive}
        onUpdatePlayer={setPlayer}
        onUpdateVitals={setVitals}
        onAddNotification={addNotification}
        onStartMission={handleStartMission}
        onOpenTechMiniGame={() => setIsTechBroOpen(true)}
        onOpenHeist={() => setIsHeistOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenBennys={() => setIsBennysOpen(true)}
        onOpenGarageModal={() => setIsGarageOpen(true)}
        onFlyToCity={handleFlyToCity}
        vaultCamsDisabled={vaultCamsDisabled}
        onDisableCameras={handleDisableVaultCameras}
        onBreachVault={handleBreachVault}
        onSpawnVehicle={(id) => setSpawnVehicleRequest({ id, timestamp: Date.now() })}
      />

      {/* Property Garage & Showroom Vehicle Bays Modal */}
      <PropertyGarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        housing={player.housing}
        ownedVehicles={player.ownedVehicles || []}
        garageVehicles={player.garageVehicles}
        onDriveVehicle={(vehicleId) => {
          setSpawnVehicleRequest({ id: vehicleId, timestamp: Date.now() });
          setIsGarageOpen(false);
          addNotification('Garage Bay Open', 'Drove vehicle out from property garage!', 'success');
        }}
        onUpdateGarageVehicles={(newGarageVehicles) => {
          setPlayer((prev) => {
            const updated = { ...prev, garageVehicles: newGarageVehicles };
            triggerAutoSave(updated);
            return updated;
          });
        }}
        onAddNotification={addNotification}
      />

      {/* Benny's Original Motorworks & Ron Petrol Service Bay */}
      <BennysCustomsModal
        isOpen={isBennysOpen}
        onClose={() => setIsBennysOpen(false)}
        vehicle={worldState.vehicle}
        playerCash={player.cash}
        playerBank={player.bankBalance}
        onTune={(opts, cost, label) => {
          if (player.cash < cost && player.bankBalance < cost) {
            addNotification(
              'Insufficient Funds',
              `Need ₦${cost.toLocaleString()} for ${label}.`,
              'warning'
            );
            return;
          }
          audioEngine.playCashEarn();
          setPlayer((p) =>
            p.cash >= cost
              ? { ...p, cash: p.cash - cost }
              : { ...p, bankBalance: p.bankBalance - cost }
          );
          setTuneVehicleRequest({ ...opts, ts: Date.now() });
          addNotification('Benny’s Motorworks 🔧', `Installed: ${label}!`, 'success');
        }}
      />

      {/* 3D Sidewalk Citizen RP Interaction Modal */}
      <PedInteractionModal
        pedName={activePedName}
        onClose={() => setActivePedName(null)}
        playerCash={player.cash}
        streetCred={vitals.streetCred}
        onOutcome={(fx) => {
          if (fx.cashDelta) {
            setPlayer((p) => ({ ...p, cash: Math.max(0, p.cash + fx.cashDelta!) }));
          }
          if (fx.credDelta || fx.stressDelta || fx.healthDelta) {
            setVitals((v) => ({
              ...v,
              health: Math.max(10, Math.min(100, v.health + (fx.healthDelta || 0))),
              streetCred: Math.max(0, Math.min(100, v.streetCred + (fx.credDelta || 0))),
              stress: Math.max(0, Math.min(100, v.stress + (fx.stressDelta || 0))),
            }));
          }
          if (fx.crime) {
            handleCrime(fx.crime);
          } else {
            addNotification(activePedName || 'Street Citizen', fx.message, 'info');
          }
        }}
      />

      {/* GTA IV / GTA V Style Settings & Pause Menu */}
      <GameSettingsMenu
        isOpen={isSettingsOpen}
        fromTitleScreen={isMainMenuOpen || isLoggedOut}
        onResume={() => setIsSettingsOpen(false)}
        player={player}
        vitals={vitals}
        timeOfDay={timeOfDay}
        wantedStars={wantedStars}
        sessionStartedAt={sessionStartedAt}
        lastSavedAt={lastSavedAt}
        graphicsSettings={graphicsSettings}
        onChangeGraphics={setGraphicsSettings}
        showFps={showFps}
        onToggleShowFps={() => setShowFps((f) => !f)}
        hudVisible={hudVisible}
        onToggleHud={() => setHudVisible((h) => !h)}
        isAudioMuted={isAudioMuted}
        onToggleMute={handleToggleMute}
        masterVolume={masterVolume}
        onChangeMasterVolume={handleMasterVolumeChange}
        musicVolume={musicVolume}
        onChangeMusicVolume={handleMusicVolumeChange}
        isPlayingMusic={isPlayingMusic}
        onToggleMusic={handleToggleMusic}
        isRadioOn={isRadioOn}
        onToggleRadio={() => {
          audioEngine.playRadioClick();
          setIsRadioOn((r) => !r);
        }}
        cameraMode={cameraMode}
        onChangeCameraMode={setCameraMode}
        onSaveGame={handleSaveGame}
        onLogout={handleLogout}
        onResetCharacter={handleResetCharacter}
        onOpenMap={() => {
          setIsSettingsOpen(false);
          setIsMapOpen(true);
        }}
        onOpenHelp={() => {
          setIsSettingsOpen(false);
          setIsHelpOpen(true);
        }}
        onOpenCustomizer={() => {
          setIsSettingsOpen(false);
          setIsCharacterCreationOpen(true);
        }}
      />

      {/* Persistent AAA Auto-Save Indicator */}
      <AutoSaveIndicator
        isSaving={isAutoSaving}
        lastSavedAt={lastSavedAt}
        onManualSave={triggerAutoSave}
      />

      {/* Professional Starting Main Menu */}
      <GameMainMenu
        isOpen={isMainMenuOpen || isLoggedOut}
        player={player}
        vitals={vitals}
        lastSavedAt={lastSavedAt}
        hasSavedGame={hasSavedGame}
        graphicsSettings={graphicsSettings}
        isAudioMuted={isAudioMuted}
        masterVolume={masterVolume}
        onResumeGame={() => {
          setIsMainMenuOpen(false);
          setIsLoggedOut(false);
        }}
        onOpenCharacterCreator={() => {
          setIsCharacterCreationOpen(true);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
        }}
        onOpenHelp={() => {
          setIsHelpOpen(true);
        }}
        onResetGame={handleResetCharacter}
        onToggleAudioMute={handleToggleMute}
        onChangeMasterVolume={handleMasterVolumeChange}
      />
    </main>
  );
}
