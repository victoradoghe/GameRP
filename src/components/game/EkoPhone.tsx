'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Camera,
  Flame,
  Star,
  CheckCircle2,
  RefreshCw,
  Key,
  Eye,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Wallet,
  Briefcase,
  MessageCircle,
  ShoppingBag,
  Home,
  Car,
  X,
  Send,
  Mic,
  Volume2,
  MapPin,
  Settings,
  ChevronLeft,
  StopCircle,
  CloudRain,
  Sun,
  Cloud,
  CloudFog,
  PlaneTakeoff,
  Zap,
  Fuel,
  Smartphone,
} from 'lucide-react';
import {
  PlayerStats,
  Vitals,
  TweetItem,
  PhoneContact,
  ChatMessage,
  LagosDistrict,
  ActiveMission,
  JobKind,
  Weather,
  CityId,
  GraphicsSettings,
  BankTransaction,
} from '@/lib/types';
import {
  JOBS_DATABASE,
  FOOD_MENU,
  REAL_ESTATE,
  INITIAL_TWEETS,
  PHONE_CONTACTS,
  VEHICLES_CATALOG,
  PHONE_WALLPAPERS,
  PHONE_MODELS_CATALOG,
  FLIGHT_ROUTES_CATALOG,
  BANK_VAULTS_CATALOG,
  AIRCRAFT_CATALOG,
  SERVER_PLAYERS,
  getDistrictsForCity,
  JobListing,
} from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface EkoPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  vitals: Vitals;
  isNepaActive: boolean;
  weather: Weather;
  timeOfDay: number;
  activeMission: ActiveMission | null;
  incomingCaller?: PhoneContact | null;
  onClearIncomingCall?: () => void;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onUpdateVitals: React.Dispatch<React.SetStateAction<Vitals>>;
  onStartMission: (kind: JobKind) => void;
  onStopMission: () => void;
  onStartMiniGame: (gameId: 'danfo' | 'techbro' | 'afrobeats' | 'heist') => void;
  onSpawnVehicle: (vehicleId: string) => void;
  onClearWanted: () => void;
  onSetWaypoint: (district: LagosDistrict) => void;
  onSetWeather: (w: Weather) => void;
  onSetTimeOfDay: (hour: number) => void;
  onFlyToCity?: (targetCity: CityId, airlineName: string) => void;
  onEnterBuilding?: (buildingId: LagosDistrict) => void;
  onAddNotification: (
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'success' | 'alert' | 'dispatch'
  ) => void;
  graphicsSettings?: GraphicsSettings;
  onChangeGraphics?: (g: GraphicsSettings) => void;
}

type PhoneApp =
  | 'home'
  | 'calls'
  | 'messages'
  | 'bank'
  | 'jobs'
  | 'garage'
  | 'gps'
  | 'twitter'
  | 'food'
  | 'realestate'
  | 'flights'
  | 'power'
  | 'settings'
  | 'camera';

export const EkoPhone: React.FC<EkoPhoneProps> = ({
  isOpen,
  onClose,
  player,
  vitals,
  isNepaActive,
  weather,
  timeOfDay,
  activeMission,
  incomingCaller,
  onClearIncomingCall,
  onUpdatePlayer,
  onUpdateVitals,
  onStartMission,
  onStopMission,
  onStartMiniGame,
  onSpawnVehicle,
  onClearWanted,
  onSetWaypoint,
  onSetWeather,
  onSetTimeOfDay,
  onFlyToCity,
  onAddNotification,
  graphicsSettings,
  onChangeGraphics,
}) => {
  const [activeApp, setActiveApp] = useState<PhoneApp>('home');
  const [wallpaperId, setWallpaperId] = useState<string>('aurora');

  // Food delivery app state
  const [foodFilter, setFoodFilter] = useState<string>('all');
  const [activeDelivery, setActiveDelivery] = useState<{
    item: (typeof FOOD_MENU)[0];
    courierName: string;
    courierVehicle: string;
    progress: number;
    etaSeconds: number;
    completed: boolean;
  } | null>(null);

  // Real estate app state
  const [realEstateFilter, setRealEstateFilter] = useState<string>('all');
  const [inspectingProp, setInspectingProp] = useState<(typeof REAL_ESTATE)[0] | null>(null);

  // Valet garage state
  const [garageFilter, setGarageFilter] = useState<string>('all');

  // Jobs app tabs
  const [jobsTab, setJobsTab] = useState<'openings' | 'taxi' | 'police' | 'bullion'>('openings');

  // Camera app state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraFlash, setCameraFlash] = useState<'auto' | 'on' | 'off'>('auto');
  const [cameraZoom, setCameraZoom] = useState<number>(1);
  const [photoCaption, setPhotoCaption] = useState<string>('');

  // GPS category filter
  const [gpsFilter, setGpsFilter] = useState<string>('all');

  // Live ChopChop Food Delivery Progress Timer
  useEffect(() => {
    if (!activeDelivery || activeDelivery.completed) return;
    const interval = setInterval(() => {
      setActiveDelivery((prev) => {
        if (!prev) return null;
        if (prev.etaSeconds <= 1) {
          audioEngine.playEatFood();
          audioEngine.playCashEarn();
          onUpdateVitals((v) => ({
            ...v,
            hunger: Math.min(100, v.hunger + prev.item.hungerRestore),
            thirst: Math.min(100, (v.thirst || 80) + (prev.item.thirstRestore || 35)),
            energy: Math.min(100, v.energy + prev.item.energyRestore),
            stress: Math.max(0, v.stress - prev.item.stressRelief),
          }));
          onAddNotification(
            'ChopChop Delivered 🍲',
            `${prev.courierName} just delivered ${prev.item.name}! Vitals replenished.`,
            'success'
          );
          return { ...prev, progress: 100, etaSeconds: 0, completed: true };
        }
        const nextSec = prev.etaSeconds - 1;
        const totalDuration = (prev.item as any).prepTimeSec || 5;
        const nextProgress = Math.min(95, Math.round(((totalDuration - nextSec) / totalDuration) * 100));
        return { ...prev, etaSeconds: nextSec, progress: nextProgress };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeDelivery, onUpdateVitals, onAddNotification]);

  // X (Twatter) splash loader + feed tabs
  const [xLoading, setXLoading] = useState<boolean>(false);
  const [xTab, setXTab] = useState<'foryou' | 'following' | 'trending'>('foryou');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplies, setOpenReplies] = useState<string | null>(null);

  // Multi-bank & P2P Send Money
  const [bankTab, setBankTab] = useState<'account' | 'send' | 'history' | 'vaults'>('account');
  const [activeBankName, setActiveBankName] = useState<string>('Zenith / Fleeca');
  const [sendRecipient, setSendRecipient] = useState<string>('');
  const [sendAcct, setSendAcct] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendNote, setSendNote] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<BankTransaction | null>(null);

  // Flights app tab
  const [flightTab, setFlightTab] = useState<'commercial' | 'jets'>('commercial');

  useEffect(() => {
    if (activeApp !== 'twitter') return;
    setXLoading(true);
    const t = setTimeout(() => setXLoading(false), 900);
    return () => clearTimeout(t);
  }, [activeApp]);

  // Calling State
  const [activeCallContact, setActiveCallContact] = useState<PhoneContact | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callReplyText, setCallReplyText] = useState<string>('');
  const [dialedNumber, setDialedNumber] = useState<string>('');
  const [callTab, setCallTab] = useState<'contacts' | 'keypad'>('contacts');

  // SMS / iMessage State
  const [selectedChatContact, setSelectedChatContact] = useState<PhoneContact | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
    'c-fixer': [
      {
        id: 'm-1',
        sender: 'contact',
        text: 'Yo! Fleeca vault on Broad Street is loaded today. Call or text me when you’re ready to breach.',
        timestamp: '14:02',
      },
    ],
    'c-babe': [
      {
        id: 'm-2',
        sender: 'contact',
        text: 'Babyyy 💕 Me and the girls are going to Quilox tonight! Send me urgent ₦30k for my hair pls 🥺',
        timestamp: '14:10',
      },
    ],
    'c-mama': [
      {
        id: 'm-3',
        sender: 'contact',
        text: 'My pikin, hope you have eaten hot Amala today? Call me for prayers!',
        timestamp: '13:45',
      },
    ],
    'c-mechanic': [
      {
        id: 'm-4',
        sender: 'contact',
        text: 'Boss! Your whips are tuned up. Use Valet or call me anytime for roadside delivery!',
        timestamp: '12:30',
      },
    ],
  });
  const [customSmsInput, setCustomSmsInput] = useState<string>('');

  // Twitter & Banking State
  const [tweets, setTweets] = useState<TweetItem[]>(INITIAL_TWEETS);
  const [newTweetText, setNewTweetText] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [loanInput, setLoanInput] = useState('');

  useEffect(() => {
    if (incomingCaller && isOpen) {
      setActiveApp('calls');
      setActiveCallContact(incomingCaller);
      setCallDuration(0);
      setCallReplyText(incomingCaller.greeting);
      if (onClearIncomingCall) onClearIncomingCall();
    }
  }, [incomingCaller, isOpen, onClearIncomingCall]);

  useEffect(() => {
    if (!activeCallContact) return;
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [activeCallContact]);

  if (!isOpen) return null;

  const formatNaira = (amount: number) => '₦' + amount.toLocaleString('en-NG');
  const formatCallTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatGameClock = (tod: number) => {
    const h = Math.floor(tod) % 24;
    const m = Math.floor((tod - Math.floor(tod)) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const activeWallpaper =
    PHONE_WALLPAPERS.find((w) => w.id === wallpaperId) || PHONE_WALLPAPERS[0];

  const handleStartCall = (contact: PhoneContact) => {
    audioEngine.playPhoneRing();
    setActiveCallContact(contact);
    setCallDuration(0);
    setCallReplyText(contact.greeting);
  };

  const handleDialKeypad = () => {
    if (!dialedNumber.trim()) return;
    const found =
      PHONE_CONTACTS.find(
        (c) =>
          c.number.toLowerCase().includes(dialedNumber.toLowerCase()) ||
          (dialedNumber === '911' && c.id === 'c-police')
      ) || PHONE_CONTACTS[0];
    handleStartCall(found);
  };

  const handleSelectCallOption = (opt: PhoneContact['callOptions'][0]) => {
    audioEngine.playClick();
    setCallReplyText(opt.response);

    if (opt.effect) {
      const {
        cashDelta,
        credDelta,
        stressDelta,
        clearWanted,
        triggerHeist,
        spawnVehicleId,
        healPlayer,
      } = opt.effect;

      if (cashDelta && cashDelta < 0 && player.cash < Math.abs(cashDelta)) {
        setCallReplyText('Wait... insufficient pocket cash! Withdraw from Fleeca Bank first.');
        return;
      }

      if (cashDelta) {
        audioEngine.playCashEarn();
        onUpdatePlayer((prev) => ({ ...prev, cash: prev.cash + cashDelta }));
      }
      if (credDelta || stressDelta || healPlayer) {
        onUpdateVitals((prev) => ({
          ...prev,
          health: healPlayer ? 100 : prev.health,
          armor: healPlayer ? 100 : prev.armor,
          streetCred: Math.max(0, Math.min(100, prev.streetCred + (credDelta || 0))),
          stress: Math.max(0, Math.min(100, prev.stress + (stressDelta || 0))),
        }));
      }
      if (clearWanted) {
        onClearWanted();
        onAddNotification('Warrant Cleared', 'All Police Dispatch units called off.', 'success');
      }
      if (spawnVehicleId) {
        onSpawnVehicle(spawnVehicleId);
      }
      if (triggerHeist) {
        setActiveCallContact(null);
        onStartMission('heist');
        onClose();
      }
    }
  };

  const handleSendSms = (
    contact: PhoneContact,
    text: string,
    autoReply?: string,
    effect?: {
      cashDelta?: number;
      credDelta?: number;
      stressDelta?: number;
      waypointDistrict?: LagosDistrict;
    }
  ) => {
    if (!text.trim()) return;
    audioEngine.playClick();

    const nowStr = formatGameClock(timeOfDay);
    const playerMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'player',
      text,
      timestamp: nowStr,
    };

    setChatHistories((prev) => ({
      ...prev,
      [contact.id]: [...(prev[contact.id] || []), playerMsg],
    }));
    setCustomSmsInput('');

    setTimeout(() => {
      audioEngine.playSmsChime();
      const smartReplies: Record<string, string> = {
        'c-fixer':
          'Copy that. Drive to Fleeca Bank on Broad Street or start the Fleeca Vault Job in Job Center.',
        'c-babe':
          'Aww baby you know how to make me smile! Pick me up in a G-Wagon for Quilox tonight 💕✨',
        'c-mama':
          'Amen my child! Remember to eat hot Amala at Shitta so your stamina stays strong!',
        'c-mechanic':
          '10-4 Boss! Pull up to Ron Petrol or use Valet Garage to deliver any vehicle curbside.',
        'c-police':
          '911 Dispatch acknowledged. Visit Pillbox Medical for treatment or MRPD to clock in.',
        'c-landlord':
          'Noted! Check Dynasty 8 anytime to upgrade to Lekki Phase 1 or Banana Island.',
      };

      const replyContent =
        autoReply || smartReplies[contact.id] || 'Got your message! Call me when free.';
      const replyMsg: ChatMessage = {
        id: 'msg-r-' + Date.now(),
        sender: 'contact',
        text: replyContent,
        timestamp: nowStr,
      };

      setChatHistories((prev) => ({
        ...prev,
        [contact.id]: [...(prev[contact.id] || []), replyMsg],
      }));

      if (effect) {
        if (effect.cashDelta) {
          onUpdatePlayer((p) => ({ ...p, cash: Math.max(0, p.cash + effect.cashDelta!) }));
        }
        if (effect.credDelta || effect.stressDelta) {
          onUpdateVitals((v) => ({
            ...v,
            streetCred: Math.min(100, v.streetCred + (effect.credDelta || 0)),
            stress: Math.max(0, v.stress + (effect.stressDelta || 0)),
          }));
        }
        if (effect.waypointDistrict) {
          onSetWaypoint(effect.waypointDistrict);
          onAddNotification(
            'GPS Pin Set',
            `Purple route set to ${effect.waypointDistrict.toUpperCase()}.`,
            'info'
          );
        }
      }
    }, 550);
  };

  const handleDeposit = () => {
    const val = parseInt(transferAmount);
    if (!val || val <= 0 || player.cash < val) return;
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash - val,
      bankBalance: prev.bankBalance + val,
    }));
    setTransferAmount('');
    onAddNotification('Fleeca Deposit', `Deposited ${formatNaira(val)} to Checking.`, 'success');
  };

  const handleWithdraw = () => {
    const val = parseInt(transferAmount);
    if (!val || val <= 0 || player.bankBalance < val) return;
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash + val,
      bankBalance: prev.bankBalance - val,
    }));
    setTransferAmount('');
    onAddNotification('ATM Withdrawal', `Withdrew ${formatNaira(val)} cash.`, 'info');
  };

  const handleTakeLoan = () => {
    const val = parseInt(loanInput);
    if (!val || val <= 0 || val > 250000) return;
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash + val,
      loanBalance: prev.loanBalance + Math.round(val * 1.15),
    }));
    setLoanInput('');
    onAddNotification('Credit Approved', `Received ${formatNaira(val)} credit line.`, 'warning');
  };

  const handleRepayLoan = () => {
    if (player.loanBalance <= 0 || player.cash <= 0) return;
    const payment = Math.min(player.cash, player.loanBalance);
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash - payment,
      loanBalance: prev.loanBalance - payment,
    }));
    onAddNotification('Loan Payment', `Paid ${formatNaira(payment)} toward credit.`, 'success');
  };

  const handleStartJob = (job: JobListing) => {
    if (vitals.streetCred < job.reqCred) {
      onAddNotification(
        'Street Cred Required',
        `Requires ${job.reqCred} Cred (Current: ${Math.round(vitals.streetCred)}).`,
        'warning'
      );
      return;
    }
    if (vitals.energy < job.energyCost) {
      onAddNotification(
        'Low Stamina',
        'Grab food at Amala Shitta or ChopChop before starting a shift!',
        'warning'
      );
      return;
    }

    audioEngine.playClick();
    onUpdatePlayer((prev) => ({
      ...prev,
      job: job.title,
      isOnDuty: true,
    }));

    if (job.needsVehicle) {
      onSpawnVehicle(job.needsVehicle);
    }

    if (job.missionKind) {
      onStartMission(job.missionKind);
      onClose();
      return;
    }

    if (job.miniGame) {
      onStartMiniGame(job.miniGame);
      onClose();
    }
  };

  const handleBuyOrSpawnVehicle = (veh: (typeof VEHICLES_CATALOG)[0]) => {
    const isOwned = (player.ownedVehicles || []).includes(veh.id);
    if (!isOwned) {
      if (player.cash >= veh.price) {
        audioEngine.playCashEarn();
        onUpdatePlayer((prev) => ({
          ...prev,
          cash: prev.cash - veh.price,
          ownedVehicles: [...(prev.ownedVehicles || []), veh.id],
        }));
        onSpawnVehicle(veh.id);
        onAddNotification('Vehicle Purchased!', `Bought & spawned ${veh.name}!`, 'success');
        onClose();
      } else if (player.bankBalance >= veh.price) {
        audioEngine.playCashEarn();
        onUpdatePlayer((prev) => ({
          ...prev,
          bankBalance: prev.bankBalance - veh.price,
          ownedVehicles: [...(prev.ownedVehicles || []), veh.id],
        }));
        onSpawnVehicle(veh.id);
        onAddNotification(
          'Vehicle Financed via Bank!',
          `Bought & spawned ${veh.name}!`,
          'success'
        );
        onClose();
      } else {
        onAddNotification(
          'Insufficient Funds',
          `Need ${formatNaira(veh.price)} in Cash or Bank to purchase ${veh.name}.`,
          'warning'
        );
      }
      return;
    }

    audioEngine.playClick();
    onSpawnVehicle(veh.id);
    onClose();
  };

  const handleOrderFood = (item: (typeof FOOD_MENU)[0]) => {
    if (player.cash < item.price) {
      onAddNotification('Insufficient Cash', 'Withdraw cash from Fleeca Bank first.', 'warning');
      return;
    }
    audioEngine.playEatFood();
    onUpdatePlayer((prev) => ({ ...prev, cash: prev.cash - item.price }));
    onUpdateVitals((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + item.hungerRestore),
      thirst: Math.min(100, (prev.thirst || 80) + (item.thirstRestore || 35)),
      energy: Math.min(100, prev.energy + item.energyRestore),
      stress: Math.max(0, prev.stress - item.stressRelief),
    }));
    onAddNotification('ChopChop Express', `Delivered ${item.name}! Vitals replenished.`, 'success');
  };

  const handlePostTweet = () => {
    if (!newTweetText.trim()) return;
    audioEngine.playClick();
    const newTweet: TweetItem = {
      id: 't-' + Date.now(),
      author: player.name,
      handle: '@' + player.name.toLowerCase().replace(/\s+/g, '_'),
      avatarColor: player.outfit.color || '#14b8a6',
      verified: true,
      content: newTweetText,
      likes: Math.floor(Math.random() * 140) + 25,
      retweets: Math.floor(Math.random() * 40) + 5,
      timeAgo: 'Just now',
    };
    setTweets([newTweet, ...tweets]);
    setNewTweetText('');
    onUpdateVitals((prev) => ({
      ...prev,
      streetCred: Math.min(100, prev.streetCred + 2),
    }));
  };

  const activePhoneSpec =
    PHONE_MODELS_CATALOG.find((p) => p.id === player.phoneModelId) ||
    PHONE_MODELS_CATALOG[3];
  const isAndroid = activePhoneSpec.os === 'android';
  const currentCity: CityId = player.activeCity || 'lagos';
  const cityDistricts = getDistrictsForCity(currentCity);

  const renderAppHeader = (title: string, colorClass = 'text-teal-400', onBack?: () => void) => (
    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10 shrink-0">
      <button
        onClick={onBack || (() => setActiveApp('home'))}
        className="flex items-center gap-0.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={15} />
        <span>Back</span>
      </button>
      <h3 className={`font-extrabold text-xs tracking-wide uppercase ${colorClass}`}>{title}</h3>
      <div className="w-10" />
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[346px] sm:w-[364px] h-[655px] max-h-[87vh] pointer-events-auto select-none animate-fade-in">
      {/* Sleek Corner-Docked Smartphone Frame — Adapts to iOS Titanium vs Android S25/Pixel */}
      <div
        className={`relative w-full h-full border-[5px] shadow-[0_20px_70px_rgba(0,0,0,0.88)] flex flex-col overflow-hidden text-zinc-100 transition-all ${
          isAndroid ? 'rounded-[26px]' : 'rounded-[44px]'
        }`}
        style={{
          background: activeApp === 'home' ? activeWallpaper.css : '#090d16',
          borderColor: activePhoneSpec.frameColor || '#27272a',
        }}
      >
        {/* Top Status Bar — Apple Dynamic Island vs Android Punch-Hole Camera */}
        <div className="relative pt-2.5 px-4 pb-1.5 flex justify-between items-center text-[11px] font-semibold text-zinc-200 z-20 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px]">{formatGameClock(timeOfDay)}</span>
            <span className="text-[9px] font-mono text-teal-300 uppercase">
              {currentCity === 'abuja' ? 'ABV' : 'LOS'}
            </span>
          </div>

          {isAndroid ? (
            /* Android Infinity-O Punch-Hole Camera + OS Badge */
            <div className="flex items-center gap-1.5 bg-black/65 px-2.5 py-0.5 rounded-full border border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-600 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-sky-400/70" />
              </div>
              <span className="text-[8px] font-mono text-emerald-300 tracking-wider">
                {activeCallContact ? 'CALL' : 'ANDROID 5G'}
              </span>
            </div>
          ) : (
            /* Apple iOS Dynamic Island */
            <div className="w-26 h-4.5 bg-black rounded-full flex items-center justify-center gap-1.5 border border-white/12 shadow-inner">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeCallContact
                    ? 'bg-emerald-400 animate-ping'
                    : activeMission
                    ? 'bg-amber-400'
                    : 'bg-sky-400'
                }`}
              />
              <span className="text-[8px] font-mono text-zinc-300 tracking-wider">
                {activeCallContact ? 'ON CALL' : activeMission ? 'ON SHIFT' : ' iOS 5G'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-emerald-400">100%</span>
            <div className="w-4 h-2 border border-zinc-300 rounded-xs p-[1px]">
              <div className="w-full h-full bg-emerald-400" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/45 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors"
              title="Put Phone Away [M]"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Main Screen Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-1 flex flex-col min-h-0">
          {/* ==================== HOME SCREEN ==================== */}
          {activeApp === 'home' && (
            <div className="flex flex-col justify-between flex-1 py-0.5">
              <div className="space-y-2.5">
                {/* Active Device & Citizen State ID Glass Card */}
                <div className="p-2.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-white truncate">
                          {player.name}
                        </span>
                        <span className="text-[9px] font-mono bg-teal-500/25 text-teal-200 px-1.5 py-0.5 rounded border border-teal-400/30">
                          #{player.stateId || 1042}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-300 font-mono block truncate">
                        {activePhoneSpec.name} • {currentCity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-zinc-300 block">Bank</span>
                      <span className="font-mono font-black text-xs text-emerald-300">
                        {formatNaira(player.bankBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Android Google / Gemini AI Search Bar (Exclusive to Android OS) */}
                {isAndroid && (
                  <button
                    onClick={() => setActiveApp('gps')}
                    className="w-full px-3 py-1.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-between text-[10px] text-zinc-200"
                  >
                    <span className="font-bold text-emerald-300">G</span>
                    <span className="truncate">Search {currentCity === 'abuja' ? 'Abuja FCT' : 'Lagos'} Google Maps...</span>
                    <span className="text-sky-300 font-mono">AI ✨</span>
                  </button>
                )}

                {/* Active Job Shift Widget (if currently on an in-world mission) */}
                {activeMission && (
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black uppercase text-amber-300">
                        ACTIVE SHIFT • {activeMission.title}
                      </span>
                      <button
                        onClick={onStopMission}
                        className="text-[10px] font-bold text-rose-300 hover:text-rose-200 flex items-center gap-0.5"
                      >
                        <StopCircle size={11} /> End
                      </button>
                    </div>
                    <p className="text-[11px] text-white font-semibold leading-snug">
                      {activeMission.objective}
                    </p>
                  </div>
                )}

                {/* 8-App Home Grid (4x2) */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {[
                    {
                      id: 'camera' as PhoneApp,
                      label: 'Camera',
                      icon: <Camera size={20} />,
                      bg: 'bg-rose-500/25 text-rose-300 border-rose-400/35',
                    },
                    {
                      id: 'flights' as PhoneApp,
                      label: 'Flights',
                      icon: <PlaneTakeoff size={20} />,
                      bg: 'bg-sky-500/25 text-sky-300 border-sky-400/35',
                    },
                    {
                      id: 'power' as PhoneApp,
                      label: 'Solar/NEPA',
                      icon: <Zap size={20} />,
                      bg: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/35',
                    },
                    {
                      id: 'garage' as PhoneApp,
                      label: 'Valet',
                      icon: <Car size={20} />,
                      bg: 'bg-pink-500/25 text-pink-300 border-pink-400/35',
                    },
                    {
                      id: 'gps' as PhoneApp,
                      label: 'Maps GPS',
                      icon: <MapPin size={20} />,
                      bg: 'bg-purple-500/25 text-purple-300 border-purple-400/35',
                    },
                    {
                      id: 'twitter' as PhoneApp,
                      label: 'Twatter',
                      icon: <MessageCircle size={20} />,
                      bg: 'bg-blue-500/25 text-blue-300 border-blue-400/35',
                    },
                    {
                      id: 'food' as PhoneApp,
                      label: 'ChopChop',
                      icon: <ShoppingBag size={20} />,
                      bg: 'bg-amber-500/25 text-amber-300 border-amber-400/35',
                    },
                    {
                      id: 'realestate' as PhoneApp,
                      label: 'Dynasty 8',
                      icon: <Home size={20} />,
                      bg: 'bg-indigo-500/25 text-indigo-300 border-indigo-400/35',
                    },
                    {
                      id: 'settings' as PhoneApp,
                      label: 'Phones/OS',
                      icon: <Settings size={20} />,
                      bg: 'bg-zinc-500/25 text-zinc-200 border-zinc-400/35',
                    },
                  ].map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        audioEngine.playClick();
                        setActiveApp(app.id);
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/10 transition-all group"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-105 transition-transform ${app.bg}`}
                      >
                        {app.icon}
                      </div>
                      <span className="text-[10px] font-semibold text-white truncate max-w-full">
                        {app.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned 4-Icon NoPixel OS Bottom Dock */}
              <div className="p-2 rounded-3xl bg-black/50 backdrop-blur-xl border border-white/15 grid grid-cols-4 gap-2 mt-2">
                {[
                  {
                    id: 'calls' as PhoneApp,
                    label: 'Phone',
                    icon: <Phone size={20} />,
                    cls: 'bg-emerald-500 text-black',
                  },
                  {
                    id: 'messages' as PhoneApp,
                    label: 'SMS',
                    icon: <MessageSquare size={20} />,
                    cls: 'bg-sky-500 text-white',
                    badge: 4,
                  },
                  {
                    id: 'jobs' as PhoneApp,
                    label: 'Jobs',
                    icon: <Briefcase size={20} />,
                    cls: 'bg-blue-500 text-white',
                  },
                  {
                    id: 'bank' as PhoneApp,
                    label: 'Bank',
                    icon: <Wallet size={20} />,
                    cls: 'bg-teal-500 text-black',
                  },
                ].map((dock) => (
                  <button
                    key={dock.id}
                    onClick={() => {
                      audioEngine.playClick();
                      setActiveApp(dock.id);
                    }}
                    className="relative flex flex-col items-center gap-0.5 py-1 group"
                    title={dock.label}
                  >
                    {dock.badge && (
                      <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center z-10">
                        {dock.badge}
                      </span>
                    )}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${dock.cls}`}
                    >
                      {dock.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-200">{dock.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================== PHONE CALLS & DIALER ==================== */}
          {activeApp === 'calls' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Voice Phone', 'text-emerald-400', () => {
                setActiveCallContact(null);
                setActiveApp('home');
              })}

              {activeCallContact ? (
                <div className="p-3.5 rounded-3xl bg-gradient-to-b from-emerald-950/60 to-zinc-900 border border-emerald-500/35 text-center space-y-3 overflow-y-auto">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border border-white/25 mb-1.5"
                      style={{ backgroundColor: activeCallContact.color }}
                    >
                      {activeCallContact.avatar}
                    </div>
                    <h4 className="font-extrabold text-sm text-white">{activeCallContact.name}</h4>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Connected • {formatCallTime(callDuration)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/65 border border-white/10 text-left">
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold block mb-0.5">
                      {activeCallContact.name.split(' ')[0]}:
                    </span>
                    <p className="text-xs text-zinc-100 leading-relaxed italic">
                      &ldquo;{callReplyText}&rdquo;
                    </p>
                  </div>

                  <div className="space-y-1.5 text-left">
                    {activeCallContact.callOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectCallOption(opt)}
                        className="w-full p-2.5 rounded-xl bg-zinc-800/90 hover:bg-emerald-600/30 border border-zinc-700 hover:border-emerald-400 text-[11px] font-semibold text-white text-left transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4 pt-1">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                      <Mic size={15} />
                    </div>
                    <button
                      onClick={() => {
                        audioEngine.playClick();
                        setActiveCallContact(null);
                      }}
                      className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg"
                      title="Hang Up"
                    >
                      <PhoneOff size={18} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400">
                      <Volume2 size={15} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => setCallTab('contacts')}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        callTab === 'contacts' ? 'bg-emerald-500 text-black' : 'text-zinc-400'
                      }`}
                    >
                      Contacts ({PHONE_CONTACTS.length})
                    </button>
                    <button
                      onClick={() => setCallTab('keypad')}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        callTab === 'keypad' ? 'bg-emerald-500 text-black' : 'text-zinc-400'
                      }`}
                    >
                      Keypad
                    </button>
                  </div>

                  {callTab === 'contacts' ? (
                    <div className="space-y-2">
                      {PHONE_CONTACTS.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-2xl bg-zinc-900/90 border border-white/8 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                              style={{
                                backgroundColor: c.color + '28',
                                border: `1px solid ${c.color}`,
                              }}
                            >
                              {c.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-white truncate">{c.name}</h4>
                              <p className="text-[10px] text-zinc-400 font-mono truncate">
                                {c.number}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedChatContact(c);
                                setActiveApp('messages');
                              }}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-sky-600 text-sky-400 hover:text-white transition-colors"
                              title="Message"
                            >
                              <MessageSquare size={14} />
                            </button>
                            <button
                              onClick={() => handleStartCall(c)}
                              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
                              title="Call"
                            >
                              <PhoneCall size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1 text-center">
                      <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono text-lg font-black tracking-widest text-emerald-400 h-11 flex items-center justify-center">
                        {dialedNumber || '911 / NUMBER'}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(
                          (digit) => (
                            <button
                              key={digit}
                              onClick={() => {
                                audioEngine.playClick();
                                setDialedNumber((d) => (d + digit).slice(0, 14));
                              }}
                              className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold text-white"
                            >
                              {digit}
                            </button>
                          )
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDialedNumber('')}
                          className="flex-1 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleDialKeypad}
                          className="flex-[2] py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                        >
                          <PhoneCall size={14} /> Call
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== MESSAGES (SMS) ==================== */}
          {activeApp === 'messages' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader(
                selectedChatContact ? selectedChatContact.name.split(' ')[0] : 'Messages',
                'text-sky-400',
                () => {
                  if (selectedChatContact) setSelectedChatContact(null);
                  else setActiveApp('home');
                }
              )}

              {!selectedChatContact ? (
                <div className="space-y-2 overflow-y-auto flex-1">
                  {PHONE_CONTACTS.map((c) => {
                    const history = chatHistories[c.id] || [];
                    const lastMsg = history[history.length - 1];
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          audioEngine.playClick();
                          setSelectedChatContact(c);
                        }}
                        className="w-full p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/8 flex items-center gap-2.5 text-left transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{
                            backgroundColor: c.color + '28',
                            border: `1px solid ${c.color}`,
                          }}
                        >
                          {c.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-white truncate">{c.name}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {lastMsg?.timestamp || 'Now'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {lastMsg ? lastMsg.text : c.greeting}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
                    {(chatHistories[selectedChatContact.id] || []).map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[85%] ${
                          m.sender === 'player' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div
                          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                            m.sender === 'player'
                              ? 'bg-sky-600 text-white rounded-br-xs'
                              : 'bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-bl-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-0.5 px-1">{m.timestamp}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1.5 shrink-0">
                    <div className="flex flex-col gap-1">
                      {selectedChatContact.quickTexts.map((qt, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            handleSendSms(
                              selectedChatContact,
                              qt.playerText,
                              qt.replyText,
                              qt.effect
                            )
                          }
                          className="text-left px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-sky-950/60 border border-zinc-800 text-[10px] text-sky-300 truncate"
                        >
                          💬 {qt.playerText}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="iMessage..."
                        value={customSmsInput}
                        onChange={(e) => setCustomSmsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendSms(selectedChatContact, customSmsInput);
                        }}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() => handleSendSms(selectedChatContact, customSmsInput)}
                        className="bg-sky-500 hover:bg-sky-400 text-white px-2.5 rounded-xl flex items-center justify-center"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== JOB CENTER ==================== */}
          {activeApp === 'jobs' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Career & Dispatch CAD', 'text-blue-400')}

              {/* Subtabs: Career Openings | Taxi Hailing | Police 911 CAD | Bullion Transport */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 shrink-0 text-[10px] font-bold">
                {[
                  { id: 'openings', label: 'All Jobs' },
                  { id: 'taxi', label: '🚖 Taxi Hail' },
                  { id: 'police', label: '👮 911 CAD' },
                  { id: 'bullion', label: '🏦 Bullion' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      audioEngine.playClick();
                      setJobsTab(tab.id as any);
                    }}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all ${
                      jobsTab === tab.id
                        ? 'bg-blue-500 text-white font-black'
                        : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Active Duty Status Card */}
              {activeMission && (
                <div className="mb-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 space-y-1.5 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-black text-amber-300 uppercase">
                      ON DUTY: {activeMission.title}
                    </span>
                    <button
                      onClick={onStopMission}
                      className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500"
                    >
                      Clock Out
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-200">{activeMission.objective}</p>
                </div>
              )}

              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {jobsTab === 'taxi' && (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 font-mono">
                      🚖 LAGRIDE / BOLT DISPATCH QUEUE: Accept incoming passenger hail and follow glowing GPS beacon to pickup!
                    </div>
                    {[
                      {
                        passenger: 'Folake Adeleke',
                        rating: '4.9 ★ (88 trips)',
                        route: 'Victoria Island ➔ Lekki Toll Plaza',
                        fare: 18500,
                        kind: 'taxi' as JobKind,
                      },
                      {
                        passenger: 'Emeka Nwosu',
                        rating: '4.8 ★ (140 trips)',
                        route: 'Murtala Muhammed Airport ➔ Yaba Tech Hub',
                        fare: 26000,
                        kind: 'taxi' as JobKind,
                      },
                      {
                        passenger: 'Senator Al-Hassan',
                        rating: '5.0 ★ VIP',
                        route: 'Abuja CBD ➔ Transcorp Hilton',
                        fare: 45000,
                        kind: 'taxi' as JobKind,
                      },
                    ].map((hail, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-white">{hail.passenger}</h4>
                            <span className="text-[10px] text-zinc-400 font-mono">{hail.rating}</span>
                          </div>
                          <span className="font-mono font-black text-xs text-emerald-400">
                            +{formatNaira(hail.fare)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300 font-mono">{hail.route}</p>
                        <button
                          onClick={() => {
                            audioEngine.playCashEarn();
                            onStartMission(hail.kind);
                            onClose();
                            onAddNotification(
                              'Passenger Accepted 🚖',
                              `En route to pick up ${hail.passenger}. Follow the GPS beacon!`,
                              'success'
                            );
                          }}
                          className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
                        >
                          Accept Ride &amp; Set GPS Beacon
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {jobsTab === 'police' && (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-200 font-mono">
                      👮 EKO POLICE 911 CAD: Real-time emergency dispatches across Broad Street, Marina &amp; Third Mainland.
                    </div>
                    {[
                      {
                        code: '10-90 ALARM',
                        desc: 'Silent vault intrusion tripwire triggered at CBN Broad Street',
                        priority: 'CODE 3 ALL UNITS',
                        kind: 'police' as JobKind,
                        reward: 35000,
                      },
                      {
                        code: '10-99 PURSUIT',
                        desc: 'Blacked-out sports coupe fleeing Marina Expressway at 200+ KM/H',
                        priority: 'AIR-1 & INTERCEPTORS',
                        kind: 'police' as JobKind,
                        reward: 48000,
                      },
                    ].map((cad, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-900/90 border border-blue-500/30 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-black text-xs text-rose-400">{cad.code}</span>
                          <span className="font-mono font-bold text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            {cad.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-200 leading-snug">{cad.desc}</p>
                        <button
                          onClick={() => {
                            audioEngine.playPoliceSiren();
                            onStartMission(cad.kind);
                            onClose();
                            onAddNotification(
                              'Code 3 Dispatched 🚓',
                              `En route to ${cad.code}. Sirens authorized!`,
                              'dispatch'
                            );
                          }}
                          className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs"
                        >
                          Respond Code 3 (+{formatNaira(cad.reward)})
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {jobsTab === 'bullion' && (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-200 font-mono">
                      🏦 CBN CASH BULLION TRANSPORT: Escort high-value cash vans between Central Bank and commercial vault branches.
                    </div>
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-white">CBN Vault ➔ GTBank Marina Escort</h4>
                          <span className="text-[10px] text-zinc-400 font-mono">Cargo: ₦60,000,000 Minted Bullion</span>
                        </div>
                        <span className="font-mono font-black text-xs text-emerald-400">+₦120,000</span>
                      </div>
                      <p className="text-[10px] text-zinc-300">
                        Drive the Armored Bullion Van through heavy city traffic without letting Syndicate robbers breach the hull.
                      </p>
                      <button
                        onClick={() => {
                          audioEngine.playCashEarn();
                          onStartMission('security' as JobKind);
                          onClose();
                          onAddNotification(
                            'Bullion Escort Active 🏦',
                            'Lead the Armored Cash Van to the delivery bank checkpoint.',
                            'success'
                          );
                        }}
                        className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md"
                      >
                        Start Bullion Escort Shift
                      </button>
                    </div>
                  </div>
                )}

                {jobsTab === 'openings' && (
                  JOBS_DATABASE.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-2xl bg-zinc-900/90 border space-y-1.5 ${
                        job.category === 'criminal'
                          ? 'border-rose-500/35'
                          : job.category === 'whitelisted'
                          ? 'border-sky-500/35'
                          : 'border-white/8'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{job.icon}</span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white truncate">{job.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {job.company} • Req {job.reqCred} Cred
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-black text-[11px] text-emerald-400 shrink-0">
                          +{formatNaira(job.salaryPerShift)}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-snug">{job.description}</p>

                      <button
                        onClick={() => handleStartJob(job)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                          job.category === 'criminal'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : job.missionKind
                            ? 'bg-teal-500 hover:bg-teal-400 text-black font-black'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {job.missionKind
                          ? 'Start 3D City Shift (GPS Route)'
                          : 'Launch Studio / Arcade Shift'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== VALET GARAGE ==================== */}
          {activeApp === 'garage' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Valet & PDM Dealership', 'text-pink-400')}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 shrink-0 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'All Fleet' },
                  { id: 'super', label: '🏎️ Supercars' },
                  { id: 'motorcycle', label: '🏍️ Motorcycles' },
                  { id: 'plane', label: '✈️ Aircraft' },
                  { id: 'transit', label: '🚌 Commercial' },
                  { id: 'suv', label: '🚙 SUVs' },
                  { id: 'sedan', label: '🚗 Sedans' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      audioEngine.playClick();
                      setGarageFilter(tab.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all ${
                      garageFilter === tab.id
                        ? 'bg-pink-500 text-black font-black'
                        : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Fleet List */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {VEHICLES_CATALOG.filter(
                  (v) => garageFilter === 'all' || v.category === garageFilter
                ).map((v) => {
                  const isOwned = (player.ownedVehicles || []).includes(v.id);
                  return (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 hover:border-pink-500/30 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl shrink-0 border border-white/20 shadow-md flex items-center justify-center font-bold text-xs"
                            style={{ backgroundColor: v.color }}
                          >
                            {v.category === 'plane' ? '✈️' : v.category === 'motorcycle' ? '🏍️' : '🚗'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-white truncate">{v.name}</h4>
                            <span className="text-[10px] font-mono text-zinc-400 block">
                              {v.plate} • {v.topSpeedKmh} KM/H
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isOwned
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isOwned ? 'OWNED' : formatNaira(v.price)}
                        </span>
                      </div>

                      {/* Real-Time Telemetry Gauges */}
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-zinc-300 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1">
                          <Fuel size={11} className="text-amber-400" />
                          <span>{v.fuel ?? 100}% Fuel</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wrench size={11} className="text-sky-400" />
                          <span>{v.condition ?? 100}% Cond</span>
                        </div>
                        <div className="text-right text-teal-300 font-bold">
                          {v.category === 'plane' ? 'RUNWAY 18L' : 'STREET VALET'}
                        </div>
                      </div>

                      {/* Remote Vehicle Controls for Owned Fleet */}
                      {isOwned ? (
                        <div className="grid grid-cols-3 gap-1 pt-0.5">
                          <button
                            onClick={() => {
                              audioEngine.playSeatbeltChime();
                              onAddNotification(
                                'Alarm Chirp 🔊',
                                `${v.name} doors locked. Immobilizer active.`,
                                'info'
                              );
                            }}
                            className="py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center justify-center gap-1 border border-white/10"
                            title="Alarm & Lock"
                          >
                            <Key size={11} /> Lock
                          </button>
                          <button
                            onClick={() => {
                              audioEngine.playVehicleIgnition();
                              onAddNotification(
                                'Remote Start 🔑',
                                `${v.name} engine ignition fired! Climate control on.`,
                                'success'
                              );
                            }}
                            className="py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 border border-white/10"
                            title="Remote Engine Start"
                          >
                            <Zap size={11} /> Start
                          </button>
                          <button
                            onClick={() => {
                              audioEngine.playCashEarn();
                              onSpawnVehicle(v.id);
                              onClose();
                              onAddNotification(
                                'Valet Dispatched 📍',
                                `${v.name} dropped right beside you on the road!`,
                                'success'
                              );
                            }}
                            className="py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-[10px] shadow-md flex items-center justify-center gap-1"
                          >
                            <Car size={11} /> Deliver
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (player.cash < v.price && player.bankBalance < v.price) {
                              onAddNotification(
                                'Insufficient Funds',
                                `Need ${formatNaira(v.price)} at PDM Dealership.`,
                                'warning'
                              );
                              return;
                            }
                            audioEngine.playCashEarn();
                            if (player.cash >= v.price) {
                              onUpdatePlayer((p) => ({
                                ...p,
                                cash: p.cash - v.price,
                                ownedVehicles: [...(p.ownedVehicles || []), v.id],
                              }));
                            } else {
                              onUpdatePlayer((p) => ({
                                ...p,
                                bankBalance: p.bankBalance - v.price,
                                ownedVehicles: [...(p.ownedVehicles || []), v.id],
                              }));
                            }
                            onAddNotification(
                              'PDM Purchase 🏎️',
                              `Purchased ${v.name}! Delivered to your Valet garage.`,
                              'success'
                            );
                          }}
                          className="w-full py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs shadow-md"
                        >
                          Buy from PDM ({formatNaira(v.price)})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== CITY GPS DIRECTORY ==================== */}
          {activeApp === 'gps' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader(
                `${currentCity === 'abuja' ? 'Abuja FCT' : 'Lagos'} Google Maps GPS`,
                'text-purple-400'
              )}
              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {cityDistricts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      audioEngine.playClick();
                      onSetWaypoint(d.id);
                      onAddNotification('GPS Destination Set', `Routing to ${d.name}.`, 'info');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/8 flex items-center justify-between gap-2 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{d.blipIcon}</span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{d.name}</h4>
                        <p className="text-[10px] text-zinc-400 truncate">{d.tagline}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-500/15 px-2 py-1 rounded-lg shrink-0">
                      SET PIN
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================== AEROBOOK FLIGHTS & PRIVATE JET HANGAR ==================== */}
          {activeApp === 'flights' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('AeroBook & Private Aviation', 'text-sky-400')}
              <div className="grid grid-cols-2 gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/10 mb-2 shrink-0">
                <button
                  onClick={() => setFlightTab('commercial')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    flightTab === 'commercial' ? 'bg-sky-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Commercial ({currentCity === 'lagos' ? 'LOS ➔ ABV' : 'ABV ➔ LOS'})
                </button>
                <button
                  onClick={() => setFlightTab('jets')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    flightTab === 'jets' ? 'bg-amber-400 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ✈️ Private Jet Hangar
                </button>
              </div>

              {flightTab === 'commercial' ? (
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                  <div className="p-3 rounded-2xl bg-sky-950/45 border border-sky-500/35 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-sky-300">
                      <span>FROM: {currentCity === 'lagos' ? 'LOS (Ikeja MMIA)' : 'ABV (Abuja NAIA)'}</span>
                      <span>➔</span>
                      <span>TO: {currentCity === 'lagos' ? 'ABV (Abuja FCT)' : 'LOS (Lagos City)'}</span>
                    </div>
                    <p className="text-xs font-extrabold text-white">
                      Direct Inter-City Commercial Flights
                    </p>
                  </div>

                  {FLIGHT_ROUTES_CATALOG.map((fl) => (
                    <div
                      key={fl.id}
                      className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] font-mono bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">
                            {fl.cabin} • {fl.code}
                          </span>
                          <h4 className="text-xs font-black text-white mt-1">
                            {fl.icon} {fl.airline}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-black text-amber-300 shrink-0">
                          {formatNaira(fl.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const targetCity: CityId = currentCity === 'lagos' ? 'abuja' : 'lagos';
                          if (player.cash >= fl.price) {
                            onUpdatePlayer((p) => ({ ...p, cash: p.cash - fl.price }));
                          } else if (player.bankBalance >= fl.price) {
                            onUpdatePlayer((p) => ({ ...p, bankBalance: p.bankBalance - fl.price }));
                          } else {
                            onAddNotification(
                              'Insufficient Funds',
                              `Need ${formatNaira(fl.price)} to book ${fl.airline}.`,
                              'warning'
                            );
                            return;
                          }
                          audioEngine.playCashEarn();
                          onUpdateVitals((v) => ({
                            ...v,
                            energy: 100,
                            stress: Math.max(0, v.stress - fl.stressRelief),
                            streetCred: Math.min(100, v.streetCred + fl.credBonus),
                          }));
                          if (onFlyToCity) {
                            onFlyToCity(targetCity, fl.airline);
                            onClose();
                          }
                        }}
                        className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs"
                      >
                        Book & Fly to {currentCity === 'lagos' ? 'Abuja (ABV)' : 'Lagos (LOS)'}
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      onSetWaypoint('airport');
                      onAddNotification('Airport GPS Set', 'Routing to Airport Terminal.', 'info');
                      onClose();
                    }}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-300 font-bold text-xs"
                  >
                    📍 Set GPS Route to Airport Terminal
                  </button>
                </div>
              ) : (
                /* Private Jet Hangar — Buy & Summon in 3D */
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/35 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block">
                      MMIA & NAIA EXECUTIVE JET FLEET
                    </span>
                    <p className="text-xs text-zinc-200 leading-snug">
                      Own executive private jets, summon them to the runway, and fly in full 3D over Lagos & Abuja!
                    </p>
                  </div>

                  {AIRCRAFT_CATALOG.map((jet) => {
                    const isOwned = (player.ownedPlanes || []).includes(jet.id);
                    return (
                      <div
                        key={jet.id}
                        className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                              {jet.manufacturer} • {jet.seats} Passengers
                            </span>
                            <h4 className="text-xs font-black text-white mt-1 truncate">
                              ✈️ {jet.name}
                            </h4>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              Cruise: {jet.cruiseKmh} km/h • Range: {jet.rangeKm} km
                            </div>
                          </div>
                          <span className="font-mono text-xs font-black text-amber-300 shrink-0">
                            {isOwned ? 'OWNED' : formatNaira(jet.price)}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-300 leading-snug">{jet.description}</p>

                        <button
                          onClick={() => {
                            if (!isOwned) {
                              if (player.cash >= jet.price) {
                                onUpdatePlayer((p) => ({
                                  ...p,
                                  cash: p.cash - jet.price,
                                  ownedPlanes: [...(p.ownedPlanes || []), jet.id],
                                }));
                              } else if (player.bankBalance >= jet.price) {
                                onUpdatePlayer((p) => ({
                                  ...p,
                                  bankBalance: p.bankBalance - jet.price,
                                  ownedPlanes: [...(p.ownedPlanes || []), jet.id],
                                }));
                              } else {
                                onAddNotification(
                                  'Insufficient Funds',
                                  `Need ${formatNaira(jet.price)} to purchase ${jet.name}.`,
                                  'warning'
                                );
                                return;
                              }
                              audioEngine.playCashEarn();
                              onAddNotification(
                                'Private Jet Purchased! ✈️',
                                `You are now the proud owner of ${jet.name}!`,
                                'success'
                              );
                            }
                            // Spawn jet on runway and close phone
                            onSpawnVehicle(jet.id);
                            onClose();
                            onAddNotification(
                              'Aircraft Cleared on Runway 🛫',
                              `${jet.name} is prepped on the tarmac. Controls: W (Throttle), Space (Climb), C (Descend), Shift (Afterburner)!`,
                              'info'
                            );
                          }}
                          className={`w-full py-1.5 rounded-xl font-black text-xs transition-all ${
                            isOwned
                              ? 'bg-amber-400 hover:bg-amber-300 text-black'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                          }`}
                        >
                          {isOwned ? '🛫 Summon & Fly on Runway' : `Purchase (${formatNaira(jet.price)})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== SOLAR, NEPA BILL & FUEL APP ==================== */}
          {activeApp === 'power' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Smart Home: Solar, NEPA & Fuel', 'text-emerald-400')}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-950/45 border border-emerald-500/35 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold block">
                    HOME POWER TELEMETRY
                  </span>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Rooftop Solar Array:</span>
                    <span className="font-mono font-black text-emerald-300">
                      {(player.solarKw || 0) > 0 ? `${player.solarKw}kVA Active ☀️` : 'Not Installed'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">NEPA Prepaid Meter:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {player.nepaUnitsKwh ?? 65} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Generator Tank:</span>
                    <span className="font-mono font-bold text-orange-300">
                      {player.inventory.generatorFuelLitres || 0} Litres
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap size={14} /> Pay NEPA / EKEDC / AEDC Bill
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Buy +50 kWh prepaid meter token and clear any outstanding electricity arrears.
                  </p>
                  <button
                    onClick={() => {
                      const cost = 12000;
                      if (player.cash < cost && player.bankBalance < cost) {
                        onAddNotification('Low Funds', 'Need ₦12,000 for 50 kWh token.', 'warning');
                        return;
                      }
                      audioEngine.playUpNepa();
                      onUpdatePlayer((p) => ({
                        ...p,
                        cash: p.cash >= cost ? p.cash - cost : p.cash,
                        bankBalance: p.cash >= cost ? p.bankBalance : p.bankBalance - cost,
                        nepaUnitsKwh: (p.nepaUnitsKwh ?? 65) + 50,
                        nepaBillArrears: 0,
                      }));
                      onAddNotification('NEPA Token Loaded ⚡', '+50 kWh added to home meter!', 'success');
                    }}
                    className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
                  >
                    Buy +50 kWh Token (₦12,000)
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                  <h4 className="font-bold text-orange-300 flex items-center gap-1.5">
                    <Fuel size={14} /> Order 25L Generator Fuel Jerrycan
                  </h4>
                  <button
                    onClick={() => {
                      const cost = 18000;
                      if (player.cash < cost && player.bankBalance < cost) {
                        onAddNotification('Low Funds', 'Need ₦18,000 for 25L fuel.', 'warning');
                        return;
                      }
                      audioEngine.playCashEarn();
                      onUpdatePlayer((p) => ({
                        ...p,
                        cash: p.cash >= cost ? p.cash - cost : p.cash,
                        bankBalance: p.cash >= cost ? p.bankBalance : p.bankBalance - cost,
                        inventory: {
                          ...p.inventory,
                          generator: true,
                          generatorFuelLitres: (p.inventory.generatorFuelLitres || 0) + 25,
                        },
                      }));
                      onAddNotification('Fuel Delivered ⛽', '+25L added to home generator!', 'success');
                    }}
                    className="w-full py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs"
                  >
                    Deliver +25L Fuel (₦18,000)
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-2">
                  <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sun size={14} /> Install Rooftop Solar + Inverter
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Powers your house 24/7 with clean solar energy so NEPA blackouts never affect you.
                  </p>
                  <button
                    onClick={() => {
                      const cost = 450000;
                      if ((player.solarKw || 0) >= 5) {
                        onAddNotification('Solar Active', 'Rooftop solar is already active!', 'info');
                        return;
                      }
                      if (player.cash < cost && player.bankBalance < cost) {
                        onAddNotification('Low Funds', 'Need ₦450,000 for 5kVA Solar.', 'warning');
                        return;
                      }
                      audioEngine.playUpNepa();
                      onUpdatePlayer((p) => ({
                        ...p,
                        cash: p.cash >= cost ? p.cash - cost : p.cash,
                        bankBalance: p.cash >= cost ? p.bankBalance : p.bankBalance - cost,
                        solarKw: 5,
                        inventory: { ...p.inventory, solarInverter: true },
                      }));
                      onAddNotification('5kVA Solar Installed! ☀️', 'Your house now has 24/7 solar power!', 'success');
                    }}
                    className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
                  >
                    {(player.solarKw || 0) >= 5 ? '✓ Solar Inverter Active' : 'Install 5kVA Solar (₦450,000)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== MULTI-BANK & P2P SEND MONEY ==================== */}
          {activeApp === 'bank' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Banking & Money Transfer', 'text-teal-400')}

              {/* Bank selector row */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-1.5 shrink-0 text-[10px] font-bold">
                {[
                  { name: 'Zenith / Fleeca', tier: 'Tier 1' },
                  { name: 'GTCO Corporate', tier: 'Tier 2' },
                  { name: 'CBN Sovereign', tier: 'Tier 3' },
                  { name: 'OPay Instant', tier: 'Fintech' },
                ].map((b) => (
                  <button
                    key={b.name}
                    onClick={() => {
                      audioEngine.playClick();
                      setActiveBankName(b.name);
                    }}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap border transition-all ${
                      activeBankName === b.name
                        ? 'bg-teal-500 text-black border-teal-400 font-black shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {b.name} • {b.tier}
                  </button>
                ))}
              </div>

              {/* Subtabs: Account | Send Money | Transactions | Vault Intel */}
              <div className="grid grid-cols-4 gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/10 mb-2 shrink-0 text-[10px] font-bold">
                <button
                  onClick={() => setBankTab('account')}
                  className={`py-1 rounded-lg transition-all ${
                    bankTab === 'account' ? 'bg-teal-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Account
                </button>
                <button
                  onClick={() => setBankTab('send')}
                  className={`py-1 rounded-lg transition-all ${
                    bankTab === 'send' ? 'bg-teal-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Send 💸
                </button>
                <button
                  onClick={() => setBankTab('history')}
                  className={`py-1 rounded-lg transition-all ${
                    bankTab === 'history' ? 'bg-teal-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setBankTab('vaults')}
                  className={`py-1 rounded-lg transition-all ${
                    bankTab === 'vaults' ? 'bg-rose-500 text-white font-black' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  Vaults 🔐
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                {bankTab === 'account' && (
                  <>
                    <div className="p-3.5 rounded-2xl bg-teal-950/50 border border-teal-500/35">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-teal-300">
                            {activeBankName}
                          </span>
                          <p className="text-2xl font-black text-white font-mono mt-0.5">
                            {formatNaira(player.bankBalance)}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-400/30">
                          NUBAN: 0184920482
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-300 font-mono mt-2">
                        Pocket Cash: <strong className="text-amber-300">{formatNaira(player.cash)}</strong> • QBit: <strong className="text-purple-300">{player.cryptoBalance || 15} QBT</strong>
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-white/8 space-y-2.5">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                        Quick Cash Deposit / Withdraw
                      </span>
                      <input
                        type="number"
                        placeholder="Amount in ₦"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDeposit}
                          className="bg-teal-500 hover:bg-teal-400 text-black font-black py-1.5 rounded-xl text-xs"
                        >
                          Deposit Cash
                        </button>
                        <button
                          onClick={handleWithdraw}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-1.5 rounded-xl text-xs"
                        >
                          Withdraw Cash
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-purple-500/30 space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-purple-300">QBit Crypto Exchange (QBT)</span>
                        <span className="font-mono text-emerald-400">1 QBT = ₦12,500</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span>Holdings:</span>
                        <span className="font-mono font-black text-purple-300">
                          {player.cryptoBalance || 15} QBT ({formatNaira((player.cryptoBalance || 15) * 12500)})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const cost = 5 * 12500;
                            if (player.bankBalance < cost) {
                              onAddNotification('Insufficient Checking', 'Need ₦62,500 in Checking to buy 5 QBT.', 'warning');
                              return;
                            }
                            audioEngine.playCashEarn();
                            onUpdatePlayer((prev) => ({
                              ...prev,
                              bankBalance: prev.bankBalance - cost,
                              cryptoBalance: (prev.cryptoBalance || 15) + 5,
                            }));
                            onAddNotification('QBit Purchased', 'Bought +5 QBT for ₦62,500.', 'success');
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded-xl text-[11px]"
                        >
                          Buy 5 QBT (₦62.5k)
                        </button>
                        <button
                          onClick={() => {
                            const curr = player.cryptoBalance || 15;
                            if (curr < 5) {
                              onAddNotification('Low QBit Balance', 'Need at least 5 QBT to sell.', 'warning');
                              return;
                            }
                            const payout = 5 * 12500;
                            audioEngine.playCashEarn();
                            onUpdatePlayer((prev) => ({
                              ...prev,
                              bankBalance: prev.bankBalance + payout,
                              cryptoBalance: (prev.cryptoBalance || 15) - 5,
                            }));
                            onAddNotification('QBit Liquidated', 'Sold 5 QBT — +₦62,500 wired to Checking!', 'success');
                          }}
                          className="bg-zinc-800 hover:bg-emerald-600 text-zinc-100 font-bold py-1.5 rounded-xl text-[11px] transition-colors"
                        >
                          Sell 5 QBT (+₦62.5k)
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Send Money (P2P Transfer) */}
                {bankTab === 'send' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-zinc-900/90 border border-teal-500/35 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-teal-300 block">
                        P2P Real-Time NIP Instant Transfer
                      </span>

                      {/* Quick Recipient Chips */}
                      <div className="text-[9px] text-zinc-400 font-mono">Quick Recipients:</div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { name: 'Bisi (Lekki Babe)', acct: '0239103921', defAmt: '30000', note: 'Hair & Quilox VIP' },
                          { name: 'Mama (Ibadan)', acct: '1092830192', defAmt: '15000', note: 'Food & Upkeep' },
                          { name: 'Emeka (Fixer)', acct: '0039281920', defAmt: '50000', note: 'Vault Jammer Chip' },
                          { name: 'Tunde (PDM Motors)', acct: '9928192019', defAmt: '100000', note: 'Vehicle Down Payment' },
                        ].map((c) => (
                          <button
                            key={c.name}
                            onClick={() => {
                              setSendRecipient(c.name);
                              setSendAcct(c.acct);
                              setSendAmount(c.defAmt);
                              setSendNote(c.note);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-teal-950/60 border border-white/10 text-[9px] text-zinc-200"
                          >
                            + {c.name}
                          </button>
                        ))}
                      </div>

                      {/* Recipient Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400">Beneficiary / Citizen Name</label>
                        <input
                          type="text"
                          placeholder="Recipient Name (e.g. Bisi, Emeka, Officer)"
                          value={sendRecipient}
                          onChange={(e) => setSendRecipient(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Account Number */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400">10-Digit NUBAN Account</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="0123456789"
                            maxLength={10}
                            value={sendAcct}
                            onChange={(e) => setSendAcct(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                          />
                          {sendAcct.length >= 8 && (
                            <span className="absolute right-2.5 top-1.5 text-[9px] font-mono text-emerald-400 font-bold">
                              ✓ NIP VERIFIED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transfer Amount */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400">Transfer Amount (₦)</label>
                        <input
                          type="number"
                          placeholder="Amount in ₦"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                        <div className="flex gap-1 pt-1">
                          {['10000', '30000', '100000', '500000'].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setSendAmount(amt)}
                              className="px-2 py-0.5 rounded bg-zinc-800 text-[9px] font-mono text-zinc-300 hover:text-white"
                            >
                              +{formatNaira(parseInt(amt))}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Transfer Note */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400">Narration / Note</label>
                        <input
                          type="text"
                          placeholder="What's this for?"
                          value={sendNote}
                          onChange={(e) => setSendNote(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const val = parseInt(sendAmount);
                          if (!val || val <= 0) {
                            onAddNotification('Invalid Amount', 'Enter a valid transfer amount.', 'warning');
                            return;
                          }
                          if (player.bankBalance < val) {
                            onAddNotification('Insufficient Funds', `You need ${formatNaira(val)} in your bank account.`, 'warning');
                            return;
                          }
                          const beneficiary = sendRecipient.trim() || 'Citizen';
                          const tx: BankTransaction = {
                            id: 'tx-' + Date.now(),
                            type: 'sent',
                            counterparty: beneficiary,
                            bankName: activeBankName,
                            amount: val,
                            note: sendNote || 'P2P Wire Transfer',
                            timestamp: formatGameClock(timeOfDay),
                            sessionId: 'NIP-' + Math.floor(10000000 + Math.random() * 90000000),
                          };

                          audioEngine.playCashEarn();
                          onUpdatePlayer((p) => ({
                            ...p,
                            bankBalance: p.bankBalance - val,
                            transactions: [tx, ...(p.transactions || [])],
                          }));
                          setLastReceipt(tx);
                          onAddNotification(
                            'Transfer Successful! 💸',
                            `Sent ${formatNaira(val)} to ${beneficiary} via ${activeBankName}.`,
                            'success'
                          );

                          // Trigger RP dynamic reactions if sending to contacts!
                          if (beneficiary.toLowerCase().includes('babe')) {
                            onUpdateVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 3), stress: Math.max(0, v.stress - 15) }));
                            setTimeout(() => {
                              onAddNotification('Babe 💬', 'Thank you babyyy! See you at Quilox 💕✨', 'info');
                            }, 1200);
                          } else if (beneficiary.toLowerCase().includes('mama')) {
                            onUpdateVitals((v) => ({ ...v, stress: Math.max(0, v.stress - 25) }));
                            setTimeout(() => {
                              onAddNotification('Mama 💬', 'God bless you my pikin! Your pocket will never run dry!', 'info');
                            }, 1200);
                          }
                        }}
                        className="w-full py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs transition-all shadow-md mt-1"
                      >
                        ⚡ Authorize Instant Wire ({formatNaira(parseInt(sendAmount) || 0)})
                      </button>
                    </div>

                    {/* Receipt Modal Card */}
                    {lastReceipt && (
                      <div className="p-3 rounded-2xl bg-black/60 border border-emerald-400/40 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between items-center text-emerald-400 font-black">
                          <span>✓ TRANSACTION RECEIPT</span>
                          <span className="text-[10px] text-zinc-400">{lastReceipt.timestamp}</span>
                        </div>
                        <div className="flex justify-between text-white font-black text-sm">
                          <span>{formatNaira(lastReceipt.amount)}</span>
                          <span className="text-[10px] text-zinc-400">{lastReceipt.sessionId}</span>
                        </div>
                        <div className="text-[10px] text-zinc-300">
                          To: <strong className="text-white">{lastReceipt.counterparty}</strong> ({activeBankName})
                        </div>
                        <div className="text-[10px] text-zinc-400 italic">
                          &ldquo;{lastReceipt.note}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction History Tab */}
                {bankTab === 'history' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Statement & Audit Log
                    </span>
                    {(player.transactions || []).length === 0 ? (
                      <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 text-center text-xs text-zinc-400">
                        No previous transfers. Use the Send tab to transfer money to someone!
                      </div>
                    ) : (
                      (player.transactions || []).map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-2xl bg-zinc-900/90 border border-white/5 flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <div className="font-bold text-white">{t.counterparty}</div>
                            <div className="text-[10px] text-zinc-400">
                              {t.bankName} • {t.note}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-black ${t.type === 'received' ? 'text-emerald-400' : 'text-amber-300'}`}>
                              {t.type === 'received' ? '+' : '-'}{formatNaira(t.amount)}
                            </div>
                            <div className="text-[9px] text-zinc-500">{t.timestamp}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Vault Heist Intel Tab */}
                {bankTab === 'vaults' && (
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-200">
                      <strong>🚨 Bank Vault Infiltration Intel:</strong> Multiple banks throughout Lagos & Abuja house armored cash reserves. Disable security cameras or hack the vault matrix to breach!
                    </div>

                    {BANK_VAULTS_CATALOG.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: v.color + '26', color: v.color }}
                            >
                              TIER {v.tier} • {v.securityLevel}
                            </span>
                            <h4 className="text-xs font-black text-white mt-1">{v.name}</h4>
                          </div>
                          <span className="font-mono text-xs font-black text-emerald-400">
                            {formatNaira(v.minLoot)}–{formatNaira(v.maxLoot)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300 leading-snug">{v.description}</p>
                        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-zinc-400">
                          <div>CCTV Cameras: <strong className="text-white">{v.camerasCount} Active</strong></div>
                          <div>Armed Guards: <strong className="text-white">{v.guardsCount} Guards</strong></div>
                          <div>Alarm Rating: <strong className="text-amber-300">{v.wantedStarsOnAlarm}★ Police</strong></div>
                          <div>Required Tool: <strong className="text-sky-300">{v.requiredTool}</strong></div>
                        </div>
                        <button
                          onClick={() => {
                            onSetWaypoint(v.id as LagosDistrict);
                            onAddNotification('GPS Route Set', `Pin set to ${v.name}.`, 'info');
                            onClose();
                          }}
                          className="w-full py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-teal-300 font-bold text-xs"
                        >
                          📍 Set GPS Pin to Bank
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 𝕏 (TWITTER) WITH LOADING SCREEN & REBUILT FEED ==================== */}
          {activeApp === 'twitter' && (
            <div className="flex flex-col flex-1 min-h-0 bg-black text-white -mx-3.5 -my-1 px-3.5 py-1">
              {xLoading ? (
                /* Authentic Minimalist Pitch-Black 𝕏 Loading Screen (~900ms) */
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-fade-in bg-black">
                  <div className="text-5xl font-black text-white tracking-tighter select-none animate-pulse">
                    𝕏
                  </div>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                    Connecting to 𝕏 City Network...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Top Bar with 𝕏 Header & Navigation Tabs */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0 pt-1">
                    <button
                      onClick={() => setActiveApp('home')}
                      className="flex items-center gap-0.5 text-xs font-semibold text-zinc-400 hover:text-white"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-lg font-black text-white">𝕏</span>
                    <button
                      onClick={() => {
                        const newPostText = prompt('Compose new 𝕏 post:');
                        if (newPostText && newPostText.trim()) {
                          const tweet: TweetItem = {
                            id: 't-' + Date.now(),
                            author: player.name,
                            handle: '@' + player.name.toLowerCase().replace(/\s+/g, '_'),
                            avatarColor: player.outfit.color || '#3b82f6',
                            verified: true,
                            badgeType: 'blue',
                            content: newPostText.trim(),
                            likes: 1,
                            retweets: 0,
                            replies: 0,
                            views: '1',
                            liked: true,
                            timeAgo: 'Just now',
                          };
                          setTweets([tweet, ...tweets]);
                          audioEngine.playCashEarn();
                          onAddNotification('Post Published 𝕏', 'Your post is now live across the city!', 'success');
                        }
                      }}
                      className="px-2.5 py-1 rounded-full bg-white text-black font-bold text-[10px] hover:bg-zinc-200"
                    >
                      Post
                    </button>
                  </div>

                  {/* Feed Tabs: For you | Following | Trending */}
                  <div className="grid grid-cols-3 border-b border-zinc-800 text-xs font-bold text-center shrink-0">
                    {(['foryou', 'following', 'trending'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setXTab(tab)}
                        className={`py-2 relative transition-colors ${
                          xTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {tab === 'foryou' ? 'For You' : tab === 'following' ? 'Following' : 'Trending 🔥'}
                        {xTab === tab && (
                          <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-sky-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Compose Tweet Box */}
                  <div className="p-2.5 border-b border-zinc-800 flex gap-2.5 shrink-0 bg-black">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/20"
                      style={{ backgroundColor: player.outfit.color || '#3b82f6' }}
                    >
                      {player.name[0]}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <textarea
                        rows={2}
                        placeholder="What is happening in Lagos / Abuja?!"
                        value={newTweetText}
                        onChange={(e) => setNewTweetText(e.target.value)}
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 resize-none focus:outline-none"
                      />
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <div className="flex gap-2 text-sky-400 text-xs">
                          <span>📷</span>
                          <span>📊</span>
                          <span>📍</span>
                        </div>
                        <button
                          onClick={handlePostTweet}
                          className="bg-white hover:bg-zinc-200 text-black font-bold px-3 py-1 rounded-full text-[10px]"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feed Stream */}
                  <div className="space-y-0 divide-y divide-zinc-800 overflow-y-auto flex-1 pr-0.5">
                    {tweets.map((tweet) => {
                      const isLiked = tweet.liked;
                      const isRetweeted = tweet.retweeted;
                      return (
                        <div key={tweet.id} className="p-3 space-y-2 hover:bg-zinc-950/60 transition-colors">
                          <div className="flex items-start gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-white/10"
                              style={{ backgroundColor: tweet.avatarColor }}
                            >
                              {tweet.author[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs text-white truncate">{tweet.author}</span>
                                {tweet.verified && (
                                  <span className={`text-[10px] ${tweet.badgeType === 'gold' ? 'text-amber-400' : 'text-sky-400'}`}>
                                    ✓
                                  </span>
                                )}
                                <span className="text-[10px] text-zinc-500 truncate">{tweet.handle}</span>
                                <span className="text-[10px] text-zinc-600">·</span>
                                <span className="text-[10px] text-zinc-500 shrink-0">{tweet.timeAgo}</span>
                              </div>

                              <p className="text-xs text-zinc-100 leading-relaxed mt-1 break-words">
                                {tweet.content}
                              </p>

                              {tweet.mediaGradient && (
                                <div
                                  className="w-full h-24 rounded-xl mt-2 border border-white/10 flex items-center justify-center text-xs font-mono text-white/90"
                                  style={{ background: tweet.mediaGradient }}
                                >
                                  {tweet.mediaCaption || '📸 Attached In-Game Shot'}
                                </div>
                              )}

                              {/* Interactive Actions: Reply, Repost, Like, Views */}
                              <div className="flex items-center justify-between text-zinc-500 text-[11px] mt-2.5 max-w-[260px]">
                                <button
                                  onClick={() => setOpenReplies((id) => (id === tweet.id ? null : tweet.id))}
                                  className="flex items-center gap-1 hover:text-sky-400 transition-colors"
                                >
                                  <span>💬</span>
                                  <span>{tweet.replies || 3}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    audioEngine.playClick();
                                    setTweets((list) =>
                                      list.map((t) =>
                                        t.id === tweet.id
                                          ? {
                                              ...t,
                                              retweeted: !t.retweeted,
                                              retweets: t.retweeted ? t.retweets - 1 : t.retweets + 1,
                                            }
                                          : t
                                      )
                                    );
                                  }}
                                  className={`flex items-center gap-1 transition-colors ${
                                    isRetweeted ? 'text-emerald-400' : 'hover:text-emerald-400'
                                  }`}
                                >
                                  <span>🔁</span>
                                  <span>{tweet.retweets}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    audioEngine.playClick();
                                    setTweets((list) =>
                                      list.map((t) =>
                                        t.id === tweet.id
                                          ? {
                                              ...t,
                                              liked: !t.liked,
                                              likes: t.liked ? t.likes - 1 : t.likes + 1,
                                            }
                                          : t
                                      )
                                    );
                                  }}
                                  className={`flex items-center gap-1 transition-colors ${
                                    isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
                                  }`}
                                >
                                  <span>{isLiked ? '❤️' : '🤍'}</span>
                                  <span>{tweet.likes}</span>
                                </button>

                                <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                                  <span>👁️</span>
                                  <span>{tweet.views || '18.4K'}</span>
                                </span>
                              </div>

                              {/* Inline Replies drawer */}
                              {openReplies === tweet.id && (
                                <div className="mt-2.5 pt-2 border-t border-zinc-800 space-y-2">
                                  {(tweet.comments || [
                                    { id: 'c1', author: 'Chidi', handle: '@chidi_tech', text: 'Real talk! 💯', timeAgo: '2m' },
                                    { id: 'c2', author: 'Bisi', handle: '@bisi_vibes', text: 'Where we heading tonight? 🥂', timeAgo: '1m' },
                                  ]).map((com) => (
                                    <div key={com.id} className="text-[10px] bg-zinc-900/60 p-2 rounded-xl">
                                      <div className="flex justify-between text-zinc-400">
                                        <span className="font-bold text-white">{com.author}</span>
                                        <span>{com.timeAgo}</span>
                                      </div>
                                      <p className="text-zinc-200 mt-0.5">{com.text}</p>
                                    </div>
                                  ))}

                                  <div className="flex gap-1.5 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Reply to this thread..."
                                      value={replyDrafts[tweet.id] || ''}
                                      onChange={(e) =>
                                        setReplyDrafts({ ...replyDrafts, [tweet.id]: e.target.value })
                                      }
                                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                                    />
                                    <button
                                      onClick={() => {
                                        const draft = replyDrafts[tweet.id]?.trim();
                                        if (!draft) return;
                                        setTweets((list) =>
                                          list.map((t) =>
                                            t.id === tweet.id
                                              ? {
                                                  ...t,
                                                  replies: (t.replies || 0) + 1,
                                                  comments: [
                                                    ...(t.comments || []),
                                                    {
                                                      id: 'c-' + Date.now(),
                                                      author: player.name,
                                                      handle: '@' + player.name.toLowerCase().replace(/\s+/g, '_'),
                                                      text: draft,
                                                      timeAgo: 'Just now',
                                                    },
                                                  ],
                                                }
                                              : t
                                          )
                                        );
                                        setReplyDrafts({ ...replyDrafts, [tweet.id]: '' });
                                        audioEngine.playClick();
                                      }}
                                      className="px-2.5 py-1 bg-sky-500 rounded-xl text-black font-bold text-xs"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== CAMERA APP & SCREENSHOT ==================== */}
          {activeApp === 'camera' && (
            <div className="flex flex-col flex-1 min-h-0 bg-black text-white -mx-3.5 -my-1 px-3.5 py-1">
              {renderAppHeader('Ultra HD Viewfinder', 'text-rose-400')}

              {capturedPhoto ? (
                /* Photo Preview & Share to X Screen */
                <div className="flex-1 flex flex-col justify-between py-1 space-y-2 overflow-y-auto">
                  <div className="rounded-2xl overflow-hidden border border-white/20 relative shadow-2xl">
                    <img src={capturedPhoto} alt="Snapshot" className="w-full h-44 object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-emerald-400">
                      HDR 4K SNAPSHOT
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 block">
                      Share to 𝕏 (Twatter) Feed:
                    </label>
                    <input
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Caption this Lagos moment... #LagosLife3D"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setCapturedPhoto(null)}
                      className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
                    >
                      Retake
                    </button>
                    <button
                      onClick={() => {
                        audioEngine.playCashEarn();
                        const newTweet: TweetItem = {
                          id: 't-cam-' + Date.now(),
                          author: player.name,
                          handle: '@' + player.name.toLowerCase().replace(/\s+/g, '_'),
                          avatarColor: player.outfit.color || '#f43f5e',
                          verified: true,
                          badgeType: 'blue',
                          content: photoCaption || 'Just captured this view in the city! 🔥 #LagosLife3D #GameRP',
                          likes: 12,
                          retweets: 4,
                          replies: 1,
                          views: '1.2K',
                          mediaGradient: 'linear-gradient(135deg,#090d16 0%,#1e293b 100%)',
                          mediaCaption: 'LIVE 3D VIEW • LAGOS SKYLINE',
                          comments: [],
                          timeAgo: 'Just now',
                        };
                        setTweets((prev) => [newTweet, ...prev]);
                        setCapturedPhoto(null);
                        setPhotoCaption('');
                        setActiveApp('twitter');
                        onAddNotification('Posted to 𝕏 📸', 'Your photo was shared with followers!', 'success');
                      }}
                      className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg"
                    >
                      Post to 𝕏 Feed
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Viewfinder */
                <div className="flex-1 flex flex-col justify-between py-1">
                  {/* Viewfinder Frame with Rule of Thirds Grid */}
                  <div className="relative flex-1 rounded-2xl border-2 border-white/30 overflow-hidden flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs">
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>

                    {/* Viewfinder Center Target */}
                    <div className="w-12 h-12 rounded-full border border-amber-400/80 flex items-center justify-center animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    </div>

                    {/* Top Controls: Flash & Specs */}
                    <div className="absolute top-2 inset-x-3 flex justify-between items-center text-[10px] font-mono text-zinc-300">
                      <button
                        onClick={() => {
                          audioEngine.playClick();
                          setCameraFlash((f) => (f === 'auto' ? 'on' : f === 'on' ? 'off' : 'auto'));
                        }}
                        className="px-2 py-0.5 rounded bg-black/60 border border-white/10 uppercase"
                      >
                        ⚡ {cameraFlash}
                      </button>
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-emerald-400">
                        4K 60FPS
                      </span>
                    </div>

                    {/* Zoom Levels */}
                    <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                      {[1, 2, 3].map((z) => (
                        <button
                          key={z}
                          onClick={() => {
                            audioEngine.playClick();
                            setCameraZoom(z);
                          }}
                          className={`w-6 h-6 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ${
                            cameraZoom === z ? 'bg-amber-400 text-black' : 'bg-black/60 text-white'
                          }`}
                        >
                          {z}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Shutter Controls */}
                  <div className="pt-3 pb-1 flex items-center justify-around">
                    <button
                      onClick={() => setActiveApp('home')}
                      className="text-xs font-semibold text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>

                    {/* Big Circular Shutter Button */}
                    <button
                      onClick={() => {
                        audioEngine.playCameraClick();
                        const canvas = document.querySelector('canvas');
                        if (canvas) {
                          try {
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                            setCapturedPhoto(dataUrl);
                          } catch (err) {
                            setCapturedPhoto('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23090d16"/><text x="50%" y="50%" fill="white" font-size="16" text-anchor="middle">Lagos 3D Snapshot</text></svg>');
                          }
                        } else {
                          setCapturedPhoto('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23090d16"/><text x="50%" y="50%" fill="white" font-size="16" text-anchor="middle">Lagos 3D Snapshot</text></svg>');
                        }
                      }}
                      className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-transform"
                    >
                      <div className="w-full h-full rounded-full bg-white" />
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playClick();
                        setActiveApp('twitter');
                      }}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                    >
                      𝕏 Feed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== CHOPCHOP FOOD ==================== */}
          {activeApp === 'food' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('ChopChop Express Delivery', 'text-amber-400')}

              {/* Active Live Delivery Tracker Card */}
              {activeDelivery && (
                <div className="mb-2.5 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2 shrink-0 animate-fade-in">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Flame size={13} className="text-amber-400 animate-pulse" />
                      {activeDelivery.completed ? 'Order Delivered!' : 'Courier On The Way'}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-zinc-300">
                      {activeDelivery.completed ? 'ENJOY YOUR MEAL' : `ETA: ${activeDelivery.etaSeconds}s`}
                    </span>
                  </div>

                  {/* Visual Route Progress Bar */}
                  <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${activeDelivery.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-300">
                    <span className="font-mono text-zinc-400">
                      🏍️ {activeDelivery.courierName} ({activeDelivery.courierVehicle})
                    </span>
                    <span className="font-bold text-emerald-300">{activeDelivery.item.name}</span>
                  </div>
                </div>
              )}

              {/* Restaurant Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 shrink-0 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'All Eats', icon: '🍽️' },
                  { id: 'shitta', label: 'Shitta Amala', icon: '🍲' },
                  { id: 'the_place', label: 'The Place Lekki', icon: '🍛' },
                  { id: 'mega_chicken', label: 'Mega Chicken', icon: '🍗' },
                  { id: 'suya_spot', label: 'Suya Spot', icon: '🥩' },
                  { id: 'kfc', label: 'KFC VI', icon: '🍟' },
                  { id: 'quilox', label: 'Club Quilox', icon: '🍾' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      audioEngine.playClick();
                      setFoodFilter(tab.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
                      foodFilter === tab.id
                        ? 'bg-amber-500 text-black font-black shadow-md'
                        : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Menu Dish Cards */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {FOOD_MENU.filter((item: any) => foodFilter === 'all' || item.restaurant === foodFilter).map(
                  (item: any) => {
                    const isBusy = !!(activeDelivery && !activeDelivery.completed);
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-zinc-900/90 border border-white/8 space-y-2 hover:border-amber-400/30 transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-base">{item.icon || '🍲'}</span>
                              <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                            </div>
                            <span className="text-[10px] text-amber-400/90 font-mono block mt-0.5">
                              {item.restaurantName || 'Lagos Eatery'} • {item.badge || '⚡ Fast'}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-xs text-amber-300 block">
                              {formatNaira(item.price)}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">+₦500 delivery</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-zinc-300 leading-snug">{item.desc}</p>

                        <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono text-zinc-400">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            +{item.hungerRestore} Hunger
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                            +{item.thirstRestore || 35} Thirst
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            -{item.stressRelief || 20} Stress
                          </span>
                          {item.calories && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {item.calories}
                            </span>
                          )}
                        </div>

                        <button
                          disabled={isBusy}
                          onClick={() => {
                            const total = item.price + 500;
                            if (player.cash < total && player.bankBalance < total) {
                              onAddNotification(
                                'Insufficient Funds',
                                `Need ${formatNaira(total)} for meal + delivery fee.`,
                                'warning'
                              );
                              return;
                            }
                            audioEngine.playCashEarn();
                            if (player.cash >= total) {
                              onUpdatePlayer((p) => ({ ...p, cash: p.cash - total }));
                            } else {
                              onUpdatePlayer((p) => ({ ...p, bankBalance: p.bankBalance - total }));
                            }
                            const prepSec = item.prepTimeSec || 4;
                            setActiveDelivery({
                              item,
                              courierName: 'Musa Danladi',
                              courierVehicle: 'Bajaj Boxer 🏍️',
                              progress: 15,
                              etaSeconds: prepSec,
                              completed: false,
                            });
                            onAddNotification(
                              'Order Placed 🛵',
                              `Musa is picking up ${item.name} from ${item.restaurantName || 'kitchen'}.`,
                              'info'
                            );
                          }}
                          className={`w-full py-1.5 rounded-xl font-black text-xs transition-all ${
                            isBusy
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                          }`}
                        >
                          {isBusy ? 'Courier En Route...' : `Order Express (${formatNaira(item.price + 500)})`}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* ==================== DYNASTY 8 REAL ESTATE ==================== */}
          {activeApp === 'realestate' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Dynasty 8 Luxury Real Estate', 'text-indigo-400')}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 shrink-0 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'All Listings' },
                  { id: 'penthouse', label: '👑 Penthouses' },
                  { id: 'villa', label: '🏰 Mansions' },
                  { id: 'condo', label: '💻 Founder Lofts' },
                  { id: 'flat', label: '🏠 Studios' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      audioEngine.playClick();
                      setRealEstateFilter(tab.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all ${
                      realEstateFilter === tab.id
                        ? 'bg-indigo-500 text-white font-black'
                        : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Property Listings */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {REAL_ESTATE.filter(
                  (prop: any) => realEstateFilter === 'all' || prop.category === realEstateFilter
                ).map((prop: any) => {
                  const isCurrent = player.housing === prop.id;
                  return (
                    <div
                      key={prop.id}
                      className={`p-3.5 rounded-2xl bg-zinc-900/90 border space-y-2.5 transition-all ${
                        isCurrent ? 'border-indigo-400 bg-indigo-950/25 shadow-lg' : 'border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                              {prop.badge || 'Residence'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {prop.district || 'Lagos'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-white mt-0.5">{prop.name}</h4>
                          <span className="text-[10px] text-zinc-400">
                            Comfort {prop.comfort}/100 • Req {prop.credReq} Street Cred
                          </span>
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <span className="text-xs font-black text-indigo-300 block">
                            {prop.rent === 0 ? 'Free' : `${formatNaira(prop.rent)}/mo`}
                          </span>
                          {prop.buyPrice > 0 && (
                            <span className="text-[9px] text-zinc-400 block">
                              Deed: {formatNaira(prop.buyPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amenities Pills */}
                      {prop.amenities && (
                        <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                          {prop.amenities.map((am: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-white/5 text-zinc-300"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          onClick={() => {
                            audioEngine.playClick();
                            setInspectingProp(prop);
                          }}
                          className="py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1 border border-white/10"
                        >
                          <Eye size={12} /> 3D Virtual Tour
                        </button>

                        {isCurrent ? (
                          <div className="py-1.5 rounded-xl bg-indigo-500/25 border border-indigo-400 text-indigo-200 text-center text-xs font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} /> Current Home
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (player.cash < prop.deposit && player.bankBalance < prop.deposit) {
                                onAddNotification(
                                  'Insufficient Funds',
                                  `Need ${formatNaira(prop.deposit)} deposit.`,
                                  'warning'
                                );
                                return;
                              }
                              if (vitals.streetCred < prop.credReq) {
                                onAddNotification(
                                  'Cred Too Low',
                                  `Need ${prop.credReq} Street Cred for this luxury address.`,
                                  'warning'
                                );
                                return;
                              }
                              audioEngine.playCashEarn();
                              if (player.cash >= prop.deposit) {
                                onUpdatePlayer((p) => ({
                                  ...p,
                                  cash: p.cash - prop.deposit,
                                  housing: prop.id as any,
                                  rentAmount: prop.rent,
                                }));
                              } else {
                                onUpdatePlayer((p) => ({
                                  ...p,
                                  bankBalance: p.bankBalance - prop.deposit,
                                  housing: prop.id as any,
                                  rentAmount: prop.rent,
                                }));
                              }
                              onAddNotification(
                                'Dynasty 8 Contract Signed 🏠',
                                `Moved into ${prop.name}! Comfort ${prop.comfort}/100 active.`,
                                'success'
                              );
                            }}
                            className="py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md"
                          >
                            Lease ({formatNaira(prop.deposit)})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3D Property Inspection Floorplan Modal */}
              {inspectingProp && (
                <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md p-4 flex flex-col justify-between animate-fade-in text-white rounded-3xl">
                  <div className="space-y-3 overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-black">
                        3D VIRTUAL ARCHITECTURAL INSPECTION
                      </span>
                      <button
                        onClick={() => setInspectingProp(null)}
                        className="p-1 rounded-full bg-zinc-800 text-zinc-300 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <h3 className="text-sm font-black text-white">{inspectingProp.name}</h3>
                    <p className="text-[11px] text-zinc-300">{inspectingProp.district} • Comfort {inspectingProp.comfort}/100</p>

                    {/* Architectural Floorplan Blueprint Simulation */}
                    <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-400/40 space-y-2 font-mono text-[10px]">
                      <div className="flex justify-between border-b border-indigo-500/20 pb-1">
                        <span className="text-zinc-400">Master Bedroom:</span>
                        <span className="text-emerald-300 font-bold">Biometric Cash Safe Included</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/20 pb-1">
                        <span className="text-zinc-400">Power Security:</span>
                        <span className="text-amber-300 font-bold">Automatic Generator Transfer Switch</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/20 pb-1">
                        <span className="text-zinc-400">Security Perimeter:</span>
                        <span className="text-sky-300 font-bold">Armed Guard Sentry + CCTV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Deed Purchase Price:</span>
                        <span className="text-white font-black">{formatNaira(inspectingProp.buyPrice || 0)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 space-y-1">
                      <p className="font-bold text-white">Owner Privileges:</p>
                      <p className="text-[10px] text-zinc-400">
                        • Safe protects your cash against arrest and death.
                        • Zero stress drain while resting inside your residence.
                        • Quick teleport spawn point anytime from the City Map [M].
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectingProp(null)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white"
                  >
                    Close Virtual Tour
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== SETTINGS (PHONE OS, WALLPAPER, WEATHER, TIME) ==================== */}
          {activeApp === 'settings' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Devices, OS & City Sync', 'text-zinc-200')}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5 text-xs">
                {/* Active Smartphone Switcher (iOS & Android) */}
                <div className="p-3 rounded-2xl bg-zinc-900 border border-orange-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-orange-300 flex items-center gap-1">
                      <Smartphone size={12} /> Smartphone Model (iOS & Android)
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">
                      {activePhoneSpec.os.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {PHONE_MODELS_CATALOG.map((ph) => {
                      const owned = (player.ownedPhones || ['tecno-phantom-v2', 'iphone-15-pro']).includes(ph.id);
                      const active = activePhoneSpec.id === ph.id;
                      return (
                        <div
                          key={ph.id}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                            active
                              ? 'bg-orange-500/20 border-orange-400'
                              : 'bg-zinc-950 border-white/8'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-white block truncate">
                              {ph.os === 'ios' ? '' : '🤖'} {ph.name}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 block">
                              {ph.osVersion} • {owned ? 'Owned' : formatNaira(ph.price)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (active) return;
                              if (owned) {
                                audioEngine.playClick();
                                onUpdatePlayer((p) => ({ ...p, phoneModelId: ph.id }));
                                onAddNotification('OS Switched', `Now using ${ph.name}!`, 'info');
                                return;
                              }
                              if (player.cash < ph.price && player.bankBalance < ph.price) {
                                onAddNotification('Insufficient Funds', `Visit Computer Village or earn ${formatNaira(ph.price)}.`, 'warning');
                                return;
                              }
                              audioEngine.playCashEarn();
                              onUpdatePlayer((p) => ({
                                ...p,
                                cash: p.cash >= ph.price ? p.cash - ph.price : p.cash,
                                bankBalance: p.cash >= ph.price ? p.bankBalance : p.bankBalance - ph.price,
                                phoneModelId: ph.id,
                                ownedPhones: [...(p.ownedPhones || []), ph.id],
                              }));
                              onAddNotification('New Phone Activated 📱', `Switched to ${ph.name}!`, 'success');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                              active
                                ? 'bg-emerald-500/25 text-emerald-300'
                                : owned
                                ? 'bg-teal-500 text-black'
                                : 'bg-orange-500 text-black'
                            }`}
                          >
                            {active ? 'Active' : owned ? 'Use' : 'Buy'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Game Resolution & Graphics Engine Settings */}
                {graphicsSettings && onChangeGraphics && (
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-teal-500/35 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-teal-300 block">
                        ⚙️ Display Resolution &amp; 3D Graphics
                      </span>
                      <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded border border-white/10 font-bold">
                        {Math.round(graphicsSettings.resolutionScale * 100)}% Res
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Resolution Scaling</span>
                        <span>{graphicsSettings.resolutionScale >= 1.25 ? 'Supersample' : graphicsSettings.resolutionScale <= 0.75 ? 'Performance' : 'Native 1080p/4K'}</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        value={graphicsSettings.resolutionScale}
                        onChange={(e) =>
                          onChangeGraphics({
                            ...graphicsSettings,
                            resolutionScale: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-teal-400 cursor-pointer"
                      />
                      <div className="grid grid-cols-5 gap-1 pt-0.5">
                        {[0.5, 0.75, 1.0, 1.25, 1.5].map((scale) => (
                          <button
                            key={scale}
                            onClick={() =>
                              onChangeGraphics({ ...graphicsSettings, resolutionScale: scale })
                            }
                            className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              graphicsSettings.resolutionScale === scale
                                ? 'bg-teal-500 text-black shadow-sm'
                                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {Math.round(scale * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() =>
                          onChangeGraphics({
                            ...graphicsSettings,
                            bloomEnabled: !graphicsSettings.bloomEnabled,
                          })
                        }
                        className={`p-2 rounded-xl border text-[10px] font-bold flex justify-between items-center ${
                          graphicsSettings.bloomEnabled
                            ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                            : 'bg-zinc-950 border-white/10 text-zinc-400'
                        }`}
                      >
                        <span>HDR Bloom</span>
                        <span className="font-mono text-[9px]">{graphicsSettings.bloomEnabled ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() =>
                          onChangeGraphics({
                            ...graphicsSettings,
                            shadowsEnabled: !graphicsSettings.shadowsEnabled,
                          })
                        }
                        className={`p-2 rounded-xl border text-[10px] font-bold flex justify-between items-center ${
                          graphicsSettings.shadowsEnabled
                            ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                            : 'bg-zinc-950 border-white/10 text-zinc-400'
                        }`}
                      >
                        <span>Soft Shadows</span>
                        <span className="font-mono text-[9px]">{graphicsSettings.shadowsEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    Phone Wallpaper
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PHONE_WALLPAPERS.map((wp) => (
                      <button
                        key={wp.id}
                        onClick={() => setWallpaperId(wp.id)}
                        className={`h-10 rounded-xl border-2 transition-transform ${
                          wallpaperId === wp.id ? 'border-white scale-105' : 'border-transparent'
                        }`}
                        style={{ background: wp.css }}
                        title={wp.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    Weather Forecast Override
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'clear', label: 'Clear', icon: <Sun size={13} /> },
                        { id: 'cloudy', label: 'Cloud', icon: <Cloud size={13} /> },
                        { id: 'rain', label: 'Rain', icon: <CloudRain size={13} /> },
                        { id: 'fog', label: 'Fog', icon: <CloudFog size={13} /> },
                      ] as { id: Weather; label: string; icon: React.ReactNode }[]
                    ).map((w) => (
                      <button
                        key={w.id}
                        onClick={() => onSetWeather(w.id)}
                        className={`py-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-0.5 ${
                          weather === w.id
                            ? 'bg-teal-500/25 border-teal-400 text-teal-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {w.icon}
                        <span>{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/8 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    Time of Day Preset
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Morning', h: 8 },
                      { label: 'Noon', h: 13 },
                      { label: 'Sunset', h: 18.2 },
                      { label: 'Night', h: 22 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => onSetTimeOfDay(preset.h)}
                        className="py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-200"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar — Android 3-Button Bar vs Apple iOS Home Indicator */}
        {isAndroid ? (
          <div className="py-2 px-8 flex items-center justify-around bg-black/75 backdrop-blur-md border-t border-white/10 shrink-0 text-zinc-300 text-xs font-mono">
            <button
              onClick={() => {
                if (selectedChatContact) setSelectedChatContact(null);
                else setActiveApp('home');
              }}
              className="hover:text-white px-3 py-0.5"
              title="Android Back"
            >
              ◁
            </button>
            <button
              onClick={() => {
                setActiveCallContact(null);
                setSelectedChatContact(null);
                setActiveApp('home');
              }}
              className="hover:text-white px-3 py-0.5"
              title="Android Home"
            >
              ○
            </button>
            <button
              onClick={() => setActiveApp('settings')}
              className="hover:text-white px-3 py-0.5"
              title="Recent Apps / Devices"
            >
              ▢
            </button>
          </div>
        ) : (
          <div className="py-2 flex justify-center bg-black/55 backdrop-blur-md shrink-0">
            <button
              onClick={() => {
                setActiveCallContact(null);
                setSelectedChatContact(null);
                setActiveApp('home');
              }}
              className="w-28 h-1 bg-zinc-400/70 hover:bg-white rounded-full transition-colors"
              title="Home Screen"
            />
          </div>
        )}
      </div>
    </div>
  );
};
