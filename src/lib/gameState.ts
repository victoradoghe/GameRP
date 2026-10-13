import { DistrictInfo, PlayerStats, Vitals, TweetItem } from './types';

export const DISTRICTS: DistrictInfo[] = [
  {
    id: 'shitta',
    name: 'Amala Shitta (Surulere)',
    tagline: 'Hot Amala, Ewedu & Gbegiri with cold Maltina',
    x: 0,
    z: 0,
    description: 'The culinary soul of the Mainland. The line is long, the steam is rising, and the goat meat is soft.',
    color: '#EAB308',
  },
  {
    id: 'yaba',
    name: 'Yaba Tech Corridor',
    tagline: 'Silicon Lagoon — Startups, Pitches & Caffeine',
    x: -28,
    z: -20,
    description: 'Home of coders, designers, venture capitalists, and co-working spaces with 24/7 inverters.',
    color: '#3B82F6',
  },
  {
    id: 'quilox',
    name: 'Club Quilox (Victoria Island)',
    tagline: 'VIP Champagne, Sparkling Lights & Afrobeats',
    x: 30,
    z: -25,
    description: 'Where Lagos big boys, influencers, and diaspora ballers pop bottles till sunrise.',
    color: '#A855F7',
  },
  {
    id: 'lekki',
    name: 'Lekki Phase 1',
    tagline: 'Mansions, Estate Gates & Flashy SUVs',
    x: 35,
    z: 18,
    description: 'Highbrow island life. Paved driveways, tall gates, and landlords charging rent in millions.',
    color: '#10B981',
  },
  {
    id: 'computervillage',
    name: 'Computer Village (Ikeja)',
    tagline: 'Gadgets, Hustle, Phone Swaps & Tech Repair',
    x: -32,
    z: 22,
    description: 'The largest electronics market in West Africa. "Brother, buy iPhone! We get screen guard!"',
    color: '#F97316',
  },
  {
    id: 'lagoon',
    name: 'Third Mainland Bridge',
    tagline: 'The 11.8km artery connecting Island to Mainland',
    x: 0,
    z: -45,
    description: 'Danfo buses racing over the misty Atlantic lagoon waters. Avoid rush-hour gridlock!',
    color: '#06B6D4',
  },
];

export const INITIAL_NEPO_PLAYER: PlayerStats = {
  id: 'player-1',
  name: 'Timi Adeleke',
  tagline: 'Nepo Prince with a trust fund and Lekki penthouse',
  origin: 'nepo',
  cash: 4500000, // ₦4.5M cash
  bankBalance: 12500000, // ₦12.5M in bank
  loanBalance: 0,
  outfit: {
    style: 'drip',
    color: '#3B82F6',
    hat: 'sunglasses',
  },
  job: 'Angel Investor / Creative Director',
  salary: 1200000,
  housing: 'lekki-duplex',
  rentDueDays: 30,
  rentAmount: 3500000,
  inventory: {
    generator: true,
    generatorFuelLitres: 50,
    solarInverter: true,
    danfoPass: false,
    laptop: true,
    vipPassQuilox: true,
  },
  musicTracksReleased: 1,
  fansCount: 14500,
};

export const INITIAL_LAPO_PLAYER: PlayerStats = {
  id: 'player-1',
  name: 'Sunday Okafor',
  tagline: 'Mainland Hustler with ₦1,500 and a 10-year vision',
  origin: 'lapo',
  cash: 3500, // ₦3,500 cash
  bankBalance: 1200, // ₦1,200 in Kuda
  loanBalance: 15000, // LAPO microfinance loan
  outfit: {
    style: 'street',
    color: '#EAB308',
    hat: 'cap',
  },
  job: null,
  salary: 0,
  housing: 'squatting',
  rentDueDays: 7,
  rentAmount: 25000,
  inventory: {
    generator: false,
    generatorFuelLitres: 0,
    solarInverter: false,
    danfoPass: true,
    laptop: false,
    vipPassQuilox: false,
  },
  musicTracksReleased: 0,
  fansCount: 42,
};

export const INITIAL_VITALS: Vitals = {
  health: 95,
  hunger: 80,
  energy: 85,
  streetCred: 45,
  stress: 20,
};

export interface JobListing {
  id: string;
  title: string;
  company: string;
  district: string;
  salaryPerShift: number;
  energyCost: number;
  stressGain: number;
  reqCred: number;
  description: string;
}

export const JOBS_DATABASE: JobListing[] = [
  {
    id: 'danfo_conductor',
    title: 'Danfo Bus Conductor',
    company: 'NURTW Oshodi-Obalende Route',
    district: 'Mainland Hub',
    salaryPerShift: 18500,
    energyCost: 25,
    stressGain: 20,
    reqCred: 0,
    description: 'Hang from the open door, shout destinations at top speed, and collect exact change.',
  },
  {
    id: 'phone_technician',
    title: 'Gadget Hustler / Screen Fixer',
    company: 'Slot Village Ikeja',
    district: 'Computer Village',
    salaryPerShift: 32000,
    energyCost: 20,
    stressGain: 15,
    reqCred: 15,
    description: 'Flash software, replace screens, and sell accessories to walking customers.',
  },
  {
    id: 'tech_bro_dev',
    title: 'Full-Stack Software Engineer',
    company: 'PayLagoon Fintech Yaba',
    district: 'Yaba Tech Corridor',
    salaryPerShift: 95000,
    energyCost: 30,
    stressGain: 25,
    reqCred: 35,
    description: 'Ship APIs, sprint before product demo, and pray NEPA doesn’t hit during a live deploy.',
  },
  {
    id: 'afrobeats_producer',
    title: 'Afrobeats Beatmaker / Sound Engineer',
    company: 'Starboy Sounds VI',
    district: 'Victoria Island',
    salaryPerShift: 140000,
    energyCost: 28,
    stressGain: 12,
    reqCred: 50,
    description: 'Layer syncopated log drums and brass chords. If Wizkid taps the beat, your life changes.',
  },
  {
    id: 'real_estate_broker',
    title: 'Luxury Property Realtor',
    company: 'Banana Island Prime Estates',
    district: 'Lekki Phase 1',
    salaryPerShift: 320000,
    energyCost: 35,
    stressGain: 30,
    reqCred: 70,
    description: 'Close deals on waterfront duplexes and earn mouthwatering 10% agent commission.',
  },
];

export const FOOD_MENU = [
  {
    id: 'puff_puff',
    name: 'Hot Roadside Puff-Puff & Gala',
    price: 800,
    hungerRestore: 20,
    energyRestore: 10,
    stressRelief: 5,
    desc: 'Quick street snack while stuck in traffic.',
  },
  {
    id: 'amala_special',
    name: 'Amala with Ewedu, Gbegiri & Soft Goat Meat',
    price: 3500,
    hungerRestore: 65,
    energyRestore: 40,
    stressRelief: 30,
    desc: 'The iconic Shitta powerhouse. Melts in the mouth, restores your entire soul.',
  },
  {
    id: 'seafood_okra',
    name: 'Lekki Fishermans Seafood Okra & Prawns',
    price: 16000,
    hungerRestore: 85,
    energyRestore: 60,
    stressRelief: 45,
    desc: 'Rich island delicacy with jumbo crab, snails, and fresh croaker fish.',
  },
  {
    id: 'quilox_champagne',
    name: 'Dom Pérignon & Suya Platter',
    price: 95000,
    hungerRestore: 40,
    energyRestore: 50,
    stressRelief: 60,
    desc: 'Club fuel! Popping bottles in the VIP lounge sends your Street Cred skyrocketing.',
  },
];

export const REAL_ESTATE = [
  {
    id: 'squatting',
    name: 'Free Squat with Bros in Bariga',
    rent: 0,
    deposit: 0,
    credReq: 0,
    comfort: 15,
  },
  {
    id: 'face-me-i-face-you',
    name: 'Room & Parlour (Mushin)',
    rent: 35000,
    deposit: 70000,
    credReq: 10,
    comfort: 40,
  },
  {
    id: 'mainland-flat',
    name: '2-Bedroom Apartment (Surulere)',
    rent: 220000,
    deposit: 500000,
    credReq: 35,
    comfort: 70,
  },
  {
    id: 'lekki-duplex',
    name: '4-Bedroom Semi-Detached Duplex (Lekki Phase 1)',
    rent: 1800000,
    deposit: 4000000,
    credReq: 60,
    comfort: 90,
  },
  {
    id: 'ikoyi-mansion',
    name: 'Waterfront Penthouse (Banana Island Ikoyi)',
    rent: 6500000,
    deposit: 15000000,
    credReq: 85,
    comfort: 100,
  },
];

export const INITIAL_TWEETS: TweetItem[] = [
  {
    id: 't-1',
    author: 'Chief Eko Hustle',
    handle: '@LagosTrafikRadar',
    avatarColor: '#F59E0B',
    verified: true,
    content: 'Third Mainland bridge moving at snail speed right now. Danfo conductor and passenger already exchanging slap at Adekunle exit 😭',
    likes: 4210,
    retweets: 1120,
    timeAgo: '4m ago',
  },
  {
    id: 't-2',
    author: 'Tech Sis in Lekki',
    handle: '@kemi_codes',
    avatarColor: '#EC4899',
    verified: true,
    content: 'NEPA took light exactly 30 seconds before my Y-Combinator interview started. My inverter kicked in like a superhero. Buy solar or perish in this city!',
    likes: 8900,
    retweets: 2450,
    timeAgo: '12m ago',
  },
  {
    id: 't-3',
    author: 'Surulere Foodie',
    handle: '@AmalaShittaFan',
    avatarColor: '#10B981',
    verified: false,
    content: 'If you are having a bad day, just come to Shitta. One plate of piping hot Amala with roundabout will reset your ancestral trauma.',
    likes: 12400,
    retweets: 3890,
    timeAgo: '28m ago',
  },
  {
    id: 't-4',
    author: 'Davido Clone',
    handle: '@OBO_Junior',
    avatarColor: '#6366F1',
    verified: true,
    content: 'Quilox was on fire last night! 30 billion for the account! Who dey outside tonight?? 🍾✨',
    likes: 18900,
    retweets: 5400,
    timeAgo: '1h ago',
  },
];
