'use client';

import React, { useState, useEffect } from 'react';
import {
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
  | 'settings';

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
}) => {
  const [activeApp, setActiveApp] = useState<PhoneApp>('home');
  const [wallpaperId, setWallpaperId] = useState<string>('aurora');

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
              {renderAppHeader('Job Center', 'text-blue-400')}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {activeMission && (
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-black text-amber-300">
                        ON DUTY: {activeMission.title}
                      </span>
                      <button
                        onClick={onStopMission}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                      >
                        Clock Out
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-200">{activeMission.objective}</p>
                  </div>
                )}

                {JOBS_DATABASE.map((job) => (
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
                ))}
              </div>
            </div>
          )}

          {/* ==================== VALET GARAGE ==================== */}
          {activeApp === 'garage' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Valet & PDM Dealership', 'text-pink-400')}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                {VEHICLES_CATALOG.map((v) => {
                  const isOwned = (player.ownedVehicles || []).includes(v.id);
                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl bg-zinc-900/90 border border-white/8 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl shrink-0 border border-white/20"
                            style={{ backgroundColor: v.color }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white truncate">{v.name}</h4>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {v.plate} • {v.topSpeedKmh} KM/H
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isOwned
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isOwned ? 'OWNED' : formatNaira(v.price)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyOrSpawnVehicle(v)}
                        className={`w-full py-1.5 rounded-xl text-xs font-black transition-all ${
                          isOwned
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                            : 'bg-pink-600 hover:bg-pink-500 text-white'
                        }`}
                      >
                        {isOwned ? 'Deliver Curbside (Valet)' : `Purchase (${formatNaira(v.price)})`}
                      </button>
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

          {/* ==================== AEROBOOK FLIGHTS APP (LOS ⇄ ABV) ==================== */}
          {activeApp === 'flights' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('AeroBook — Flights LOS ⇄ ABV', 'text-sky-400')}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                <div className="p-3 rounded-2xl bg-sky-950/45 border border-sky-500/35 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-sky-300">
                    <span>FROM: {currentCity === 'lagos' ? 'LOS (Ikeja)' : 'ABV (Abuja)'}</span>
                    <span>➔</span>
                    <span>TO: {currentCity === 'lagos' ? 'ABV (Abuja FCT)' : 'LOS (Lagos)'}</span>
                  </div>
                  <p className="text-xs font-extrabold text-white">
                    Book Mobile e-Ticket & Instant Takeoff
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

          {/* ==================== FLEECA BANK ==================== */}
          {activeApp === 'bank' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Fleeca Bank & Crypto', 'text-teal-400')}
              <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                <div className="p-3.5 rounded-2xl bg-teal-950/50 border border-teal-500/35">
                  <span className="text-[11px] text-teal-300">Checking Balance</span>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">
                    {formatNaira(player.bankBalance)}
                  </p>
                  <p className="text-[10px] text-zinc-300 font-mono mt-1">
                    Cash: {formatNaira(player.cash)} • QBit: {player.cryptoBalance || 15}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/8 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                    Quick Cash / Bank Transfer
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
                      Deposit
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-1.5 rounded-xl text-xs"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>

                 <div className="p-3 rounded-2xl bg-zinc-900 border border-purple-500/30 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-purple-300">QBit Crypto Exchange (QBT)</span>
                    <span className="font-mono text-emerald-400">1 QBT = ₦12,500</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Wallet Holdings:</span>
                    <span className="font-mono font-black text-purple-300">
                      {player.cryptoBalance || 15} QBT (
                      {formatNaira((player.cryptoBalance || 15) * 12500)})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const cost = 5 * 12500;
                        if (player.bankBalance < cost) {
                          onAddNotification(
                            'Insufficient Checking',
                            'Need ₦62,500 in Checking to buy 5 QBT.',
                            'warning'
                          );
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
                          onAddNotification(
                            'Low QBit Balance',
                            'Need at least 5 QBT to sell.',
                            'warning'
                          );
                          return;
                        }
                        const payout = 5 * 12500;
                        audioEngine.playCashEarn();
                        onUpdatePlayer((prev) => ({
                          ...prev,
                          bankBalance: prev.bankBalance + payout,
                          cryptoBalance: (prev.cryptoBalance || 15) - 5,
                        }));
                        onAddNotification(
                          'QBit Liquidated',
                          'Sold 5 QBT — +₦62,500 wired to Checking!',
                          'success'
                        );
                      }}
                      className="bg-zinc-800 hover:bg-emerald-600 text-zinc-100 font-bold py-1.5 rounded-xl text-[11px] transition-colors"
                    >
                      Sell 5 QBT (+₦62.5k)
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/25 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-amber-400">Micro-Credit Line</span>
                    <span className="text-zinc-400">15% APR</span>
                  </div>
                  {player.loanBalance > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Balance Due:</span>
                        <span className="font-mono font-bold text-rose-400">
                          {formatNaira(player.loanBalance)}
                        </span>
                      </div>
                      <button
                        onClick={handleRepayLoan}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-1.5 rounded-xl text-xs"
                      >
                        Repay from Pocket Cash
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Max ₦250,000"
                        value={loanInput}
                        onChange={(e) => setLoanInput(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={handleTakeLoan}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-1.5 rounded-xl text-xs"
                      >
                        Request Instant Loan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TWATTER ==================== */}
          {activeApp === 'twitter' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Twatter', 'text-sky-400')}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/8 space-y-2">
                  <textarea
                    rows={2}
                    placeholder="What’s happening in the city?"
                    value={newTweetText}
                    onChange={(e) => setNewTweetText(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 resize-none focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePostTweet}
                      className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1"
                    >
                      <Send size={11} /> Post
                    </button>
                  </div>
                </div>

                {tweets.map((tweet) => (
                  <div
                    key={tweet.id}
                    className="p-2.5 rounded-2xl bg-zinc-900/85 border border-white/8 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {tweet.author}{' '}
                        {tweet.verified && <span className="text-sky-400">✓</span>}
                      </span>
                      <span className="text-[10px] text-zinc-500">{tweet.timeAgo}</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{tweet.content}</p>
                    <div className="flex gap-4 text-[10px] text-zinc-400 pt-0.5">
                      <span>❤️ {tweet.likes}</span>
                      <span>🔄 {tweet.retweets}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== CHOPCHOP FOOD ==================== */}
          {activeApp === 'food' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('ChopChop Delivery', 'text-amber-400')}
              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {FOOD_MENU.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-white/8 space-y-1.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-white">{item.name}</h4>
                      <span className="font-mono font-black text-xs text-amber-300 shrink-0">
                        {formatNaira(item.price)}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400">{item.desc}</p>
                    <button
                      onClick={() => handleOrderFood(item)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-1.5 rounded-xl text-xs"
                    >
                      Order (+{item.hungerRestore} Hunger / +{item.thirstRestore} Thirst)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== DYNASTY 8 REAL ESTATE ==================== */}
          {activeApp === 'realestate' && (
            <div className="flex flex-col flex-1 min-h-0">
              {renderAppHeader('Dynasty 8 Real Estate', 'text-indigo-400')}
              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {REAL_ESTATE.map((prop) => {
                  const isCurrent = player.housing === prop.id;
                  return (
                    <div
                      key={prop.id}
                      className={`p-3 rounded-2xl bg-zinc-900/90 border space-y-1.5 ${
                        isCurrent ? 'border-indigo-400' : 'border-white/8'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-white">{prop.name}</h4>
                          <span className="text-[10px] text-zinc-400">
                            Comfort {prop.comfort}/100 • Req {prop.credReq} Cred
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-indigo-300">
                          {prop.rent === 0 ? 'Free' : formatNaira(prop.rent)}
                        </span>
                      </div>

                      {isCurrent ? (
                        <div className="py-1 rounded-xl bg-indigo-500/20 text-indigo-200 text-center text-[11px] font-bold">
                          Current Residence
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (player.cash < prop.deposit) {
                              onAddNotification(
                                'Insufficient Cash',
                                `Need ${formatNaira(prop.deposit)} deposit.`,
                                'warning'
                              );
                              return;
                            }
                            if (vitals.streetCred < prop.credReq) {
                              onAddNotification(
                                'Cred Too Low',
                                `Need ${prop.credReq} Street Cred.`,
                                'warning'
                              );
                              return;
                            }
                            audioEngine.playCashEarn();
                            onUpdatePlayer((prev) => ({
                              ...prev,
                              cash: prev.cash - prop.deposit,
                              housing: prop.id as typeof prev.housing,
                              rentAmount: prop.rent,
                            }));
                            onAddNotification('Dynasty 8', `Leased ${prop.name}!`, 'success');
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded-xl text-xs"
                        >
                          Lease ({formatNaira(prop.deposit)})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
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
