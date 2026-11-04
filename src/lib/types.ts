export type SocialClass = 'nepo' | 'lapo' | 'techbro' | 'returnee';
export type CityId = 'lagos' | 'abuja';
export type PhoneOS = 'ios' | 'android';

export interface PhoneModelSpec {
  id: string;
  name: string;
  brand: string;
  os: PhoneOS;
  osVersion: string;
  releaseYear: number;
  price: number;
  frameColor: string;
  accentColor: string;
  cameraSpec: string;
  chipset: string;
  batteryBonus: number;
  credBonus: number;
}

export interface LaptopModelSpec {
  id: string;
  name: string;
  brand: string;
  chip: string;
  ram: string;
  price: number;
  payMultiplier: number; // 1.15 .. 1.90x on Dev & Bank jobs
  description: string;
  icon: string;
}

export interface Vitals {
  health: number; // 0 - 100
  armor: number; // 0 - 100
  hunger: number; // 0 - 100 (100 is full)
  thirst: number; // 0 - 100 (100 is hydrated)
  energy: number; // 0 - 100 (Stamina)
  streetCred: number; // 0 - 100 (Reputation)
  stress: number; // 0 - 100 (0 is chill)
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'weapon' | 'medical' | 'tool' | 'food' | 'tech' | 'key';
  icon: string;
  weight: number; // in kg
  quantity: number;
  durability: number; // 0 - 100
  hotkey?: number; // 1 - 5
  description: string;
  price?: number;
}

export type VehicleCategory =
  | 'super'
  | 'suv'
  | 'transit'
  | 'police'
  | 'sedan'
  | 'motorcycle'
  | 'plane';

export interface GraphicsSettings {
  resolutionScale: number; // 0.5, 0.75, 1.0, 1.25, 1.5
  bloomEnabled: boolean;
  shadowsEnabled: boolean;
  fov?: number; // base camera field of view (50 - 90)
  mouseSensitivity?: number; // 0.25 - 2.5 multiplier
  invertY?: boolean;
  brightness?: number; // 0.6 - 1.5 exposure multiplier
}

export interface BankTransaction {
  id: string;
  type: 'sent' | 'received' | 'deposit' | 'withdraw' | 'purchase';
  counterparty: string;
  bankName: string;
  amount: number;
  note: string;
  timestamp: string;
  sessionId: string;
}

export interface VehicleTelemetry {
  isDriving: boolean;
  vehicleId: string | null;
  vehicleName: string;
  vehicleCategory: VehicleCategory;
  speedKmh: number;
  rpm: number; // 0 - 100
  gear: string;
  fuel: number; // 0 - 100
  engineHealth: number; // 0 - 100
  seatbeltOn: boolean;
  lightsOn: boolean;
  sirenOn: boolean;
  altitudeMeters?: number;
  pitchRad?: number;
  rollRad?: number;
  headingDeg?: number;
  isBoosting?: boolean;
}

export interface OwnedVehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  plate: string;
  color: string;
  topSpeedKmh: number;
  price: number;
  fuel: number;
  condition: number;
}

export type Emote = 'none' | 'wave' | 'dance' | 'handsup' | 'sit' | 'pushups' | 'salute' | 'facepalm';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'fog';

export interface MapTarget {
  id: string;
  x: number;
  z: number;
  label: string;
  color: string;
}

export interface WorldRealtimeState {
  x: number;
  z: number;
  heading: number; // radians, character / vehicle facing
  cameraYaw: number; // radians, camera look direction (radar rotation)
  cameraMode: 'chase' | 'isometric' | 'hood';
  streetName: string;
  isSprinting: boolean;
  nearVehicle: { id: string; name: string; color: string } | null;
  nearInteractable: { id: string; name: string; actionLabel: string } | null;
  vehicle: VehicleTelemetry;
  police: { x: number; z: number }[];
  missionDistance: number | null;
  insideBuilding?: LagosDistrict | null;
  insideTitle?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'contact';
  text: string;
  timestamp: string;
}

export interface CallOption {
  label: string;
  response: string;
  effect?: {
    cashDelta?: number;
    credDelta?: number;
    stressDelta?: number;
    clearWanted?: boolean;
    triggerHeist?: boolean;
    spawnVehicleId?: string;
    healPlayer?: boolean;
  };
}

export interface PhoneContact {
  id: string;
  name: string;
  role: string;
  number: string;
  avatar: string;
  color: string;
  isOnline: boolean;
  greeting: string;
  callOptions: CallOption[];
  quickTexts: {
    playerText: string;
    replyText: string;
    effect?: {
      cashDelta?: number;
      credDelta?: number;
      stressDelta?: number;
      waypointDistrict?: LagosDistrict;
    };
  }[];
}

export interface RandomLifeEvent {
  id: string;
  title: string;
  category: 'police' | 'street' | 'romance' | 'hustle' | 'emergency';
  icon: string;
  description: string;
  choices: {
    label: string;
    outcomeText: string;
    cashDelta?: number;
    credDelta?: number;
    healthDelta?: number;
    stressDelta?: number;
    wantedDelta?: number;
  }[];
}

export type Gender = 'male' | 'female' | 'nonbinary' | 'non-binary';
export type HairStyle = 'fade' | 'afro' | 'braids' | 'dreads' | 'waves' | 'bob' | 'buzz' | 'bald';
export type BodyBuild = 'slim' | 'athletic' | 'muscular' | 'heavy';
export type FacialHair = 'none' | 'stubble' | 'goatee' | 'beard';

export interface CharacterAppearance {
  gender: Gender;
  age: number;
  build: BodyBuild;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  facialHair?: FacialHair;
  outfitStyle: 'agbada' | 'senator' | 'street' | 'techbro' | 'drip' | 'casual';
  shirtColor: string;
  pantsColor: string;
  hat: 'none' | 'cap' | 'sunglasses' | 'fila' | 'fedora';
  glasses?: 'none' | 'sunglasses' | 'optical' | 'gold_rim';
  necklace?: 'none' | 'gold_chain' | 'pearls' | 'silver_chain';
  customGlbUrl?: string;
}

export interface AutoSaveData {
  version?: number;
  player: PlayerStats;
  vitals: Vitals;
  wantedStars: number;
  timeOfDay?: number;
  activeCity: CityId;
  savedAt?: number;
  timestamp?: number;
  equippedItemId?: string | null;
  slotName?: string;
}

export interface PlayerStats {
  id: string;
  stateId: number;
  phoneNumber: string;
  name: string;
  gender?: Gender;
  age?: number;
  appearance?: CharacterAppearance;
  tagline: string;
  origin: SocialClass;
  cash: number;
  bankBalance: number;
  cryptoBalance: number;
  loanBalance: number;
  outfit: {
    style: 'agbada' | 'senator' | 'street' | 'techbro' | 'drip';
    color: string;
    hat: 'none' | 'cap' | 'sunglasses';
    skin?: string;
    pants?: string;
  };
  job: string | null;
  isOnDuty: boolean;
  salary: number;
  housing: 'squatting' | 'face-me-i-face-you' | 'mainland-flat' | 'lekki-duplex' | 'ikoyi-mansion';
  rentDueDays: number;
  rentAmount: number;
  inventory: {
    generator: boolean;
    generatorFuelLitres: number;
    solarInverter: boolean;
    danfoPass: boolean;
    laptop: boolean;
    vipPassQuilox: boolean;
  };
  activeCity?: CityId;
  phoneModelId?: string;
  ownedPhones?: string[];
  laptopModelId?: string;
  ownedLaptops?: string[];
  nepaUnitsKwh?: number;
  nepaBillArrears?: number;
  solarKw?: number; // 0 = none, 5 = 5kVA Solar, 10 = 10kVA Hybrid Solar
  homeSafeCash?: number;
  items: InventoryItem[];
  ownedVehicles: string[];
  garageVehicles?: string[]; // IDs of vehicles currently parked in physical property garage
  ownedProperties?: string[]; // IDs of purchased properties
  ownedPlanes?: string[];
  transactions?: BankTransaction[];
  musicTracksReleased: number;
  fansCount: number;
}

export interface PropertySpec {
  id: 'squatting' | 'face-me-i-face-you' | 'mainland-flat' | 'lekki-duplex' | 'ikoyi-mansion';
  name: string;
  category: 'bedsit' | 'flat' | 'condo' | 'villa' | 'mansion';
  district: string;
  rent: number;
  buyPrice: number;
  deposit: number;
  credReq: number;
  comfort: number;
  garageCapacity: number;
  hasUpstairs: boolean;
  location: { x: number; z: number; blockX: number; blockZ: number };
  amenities: string[];
  badge: string;
  roomsDescription?: string;
}

export type LagosDistrict =
  | 'shitta'
  | 'fleeca'
  | 'gtbank'
  | 'cbn'
  | 'pillbox'
  | 'mrpd'
  | 'yaba'
  | 'quilox'
  | 'computervillage'
  | 'istore'
  | 'gas'
  | 'lekki'
  | 'clothing'
  | 'lagoon'
  | 'home'
  | 'airport';

export interface BankVaultSpec {
  id: 'fleeca' | 'gtbank' | 'cbn';
  name: string;
  abujaName: string;
  tier: 1 | 2 | 3;
  securityLevel: 'Standard CCTV & Guards' | 'Biometric Lasers & Armed Unit' | 'Sovereign Laser Grid & SWAT';
  camerasCount: number;
  guardsCount: number;
  minLoot: number;
  maxLoot: number;
  requiredTool?: string;
  wantedStarsOnAlarm: number;
  color: string;
  description: string;
}

export interface DistrictInfo {
  id: LagosDistrict;
  name: string;
  code: string;
  tagline: string;
  x: number; // interaction marker position (on the sidewalk)
  z: number;
  blockX: number; // city block that holds the landmark building
  blockZ: number;
  description: string;
  color: string;
  blipIcon: string;
  actionLabel: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  code?: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert' | 'dispatch';
  timestamp: string;
}

export interface TweetItem {
  id: string;
  author: string;
  handle: string;
  avatarColor: string;
  verified: boolean;
  badgeType?: 'blue' | 'gold' | 'gov';
  content: string;
  likes: number;
  retweets: number;
  replies?: number;
  views?: string;
  liked?: boolean;
  retweeted?: boolean;
  bookmarked?: boolean;
  mediaGradient?: string;
  mediaCaption?: string;
  imageDataUrl?: string;
  comments?: { id: string; author: string; handle: string; text: string; timeAgo: string }[];
  timeAgo: string;
}

// ---------- Jobs / in-world missions ----------
export type JobKind =
  | 'delivery'
  | 'taxi'
  | 'police'
  | 'ems'
  | 'mechanic'
  | 'heist'
  | 'race'
  | 'security'
  | 'banker'
  | 'developer'
  | 'pilot';

export interface ActiveMission {
  jobKind: JobKind;
  title: string;
  stage: number; // 0 = go to pickup, 1 = go to dropoff ...
  objective: string;
  target: MapTarget;
  reward: number;
  completedRuns: number;
  earnedThisShift: number;
  startedAt: number;
}

export interface ChatLine {
  id: string;
  kind: 'me' | 'ooc' | 'system' | 'do' | 'npc';
  author: string;
  text: string;
  ts: number;
}
