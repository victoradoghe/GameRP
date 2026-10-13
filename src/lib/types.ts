export type SocialClass = 'nepo' | 'lapo';

export interface Vitals {
  health: number; // 0 - 100
  hunger: number; // 0 - 100 (100 is full)
  energy: number; // 0 - 100
  streetCred: number; // 0 - 100 (Reputation)
  stress: number; // 0 - 100 (0 is chill)
}

export interface PlayerStats {
  id: string;
  name: string;
  tagline: string;
  origin: SocialClass;
  cash: number; // in Naira ₦
  bankBalance: number;
  loanBalance: number;
  outfit: {
    style: 'agbada' | 'senator' | 'street' | 'techbro' | 'drip';
    color: string;
    hat: 'none' | 'cap' | 'sunglasses';
  };
  job: string | null;
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
  musicTracksReleased: number;
  fansCount: number;
}

export type LagosDistrict = 
  | 'yaba' // Tech Mainland
  | 'shitta' // Food & Culture
  | 'lekki' // Islands & Affluence
  | 'quilox' // Nightlife VIP
  | 'computervillage' // Hustle & Electronics
  | 'lagoon'; // Third Mainland Bridge view

export interface DistrictInfo {
  id: LagosDistrict;
  name: string;
  tagline: string;
  x: number;
  z: number;
  description: string;
  color: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
}

export interface TweetItem {
  id: string;
  author: string;
  handle: string;
  avatarColor: string;
  verified: boolean;
  content: string;
  likes: number;
  retweets: number;
  timeAgo: string;
}
