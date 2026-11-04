'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Sun,
  Zap,
  Fuel,
  Laptop,
  BedDouble,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
  Building2,
  PlaneTakeoff,
  Briefcase,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Shirt,
  Wrench,
  Warehouse,
  Bath,
  Tv,
  Waves,
  Film,
  Coffee,
  Utensils,
  Layers,
  Crown,
  Wine,
  Key,
} from 'lucide-react';
import {
  PlayerStats,
  Vitals,
  LagosDistrict,
  CityId,
  JobKind,
  BankVaultSpec,
  PropertySpec,
} from '@/lib/types';
import {
  PHONE_MODELS_CATALOG,
  LAPTOP_MODELS_CATALOG,
  FLIGHT_ROUTES_CATALOG,
  REAL_ESTATE,
  BANK_VAULTS_CATALOG,
  AIRCRAFT_CATALOG,
} from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface BuildingInteriorModalProps {
  buildingId: LagosDistrict | null;
  initialSection?: string;
  onClose: () => void;
  onStepOutside?: () => void;
  player: PlayerStats;
  vitals: Vitals;
  isNepaActive: boolean;
  onUpdatePlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onUpdateVitals: React.Dispatch<React.SetStateAction<Vitals>>;
  onAddNotification: (
    title: string,
    msg: string,
    type?: 'info' | 'warning' | 'success' | 'alert' | 'dispatch'
  ) => void;
  onStartMission: (kind: JobKind) => void;
  onOpenTechMiniGame: () => void;
  onOpenHeist: () => void;
  onOpenCustomizer: () => void;
  onOpenInventory: () => void;
  onOpenBennys: () => void;
  onFlyToCity: (targetCity: CityId, airlineName: string) => void;
  vaultCamsDisabled?: Partial<Record<BankVaultSpec['id'], boolean>>;
  onDisableCameras?: (bankId: BankVaultSpec['id']) => void;
  onBreachVault?: (bankId: BankVaultSpec['id']) => void;
  onSpawnVehicle?: (vehicleId: string) => void;
  onOpenGarageModal?: () => void;
}

const BANK_CASES = [
  {
    id: 'bc-1',
    client: 'Dangote Cement Logistics PLC',
    amount: 48500000,
    purpose: 'Quarterly Fleet Diesel & Port Clearing Settlement',
    kycStatus: 'VERIFIED CAC & TIN • Biometric Match 99.8%',
    isFraud: false,
  },
  {
    id: 'bc-2',
    client: 'Prince X. Unknown Offshore Ltd',
    amount: 92000000,
    purpose: 'Urgent Unverified Wire to Cayman Shell Account',
    kycStatus: 'MISMATCHED SIGNATURE • Flagged IP Proxy',
    isFraud: true,
  },
  {
    id: 'bc-3',
    client: 'Paystack Merchant Settlement Hub',
    amount: 31200000,
    purpose: 'Daily POS & Web Checkout Merchant Payouts',
    kycStatus: 'CBN LICENSED • Automated Audit Passed',
    isFraud: false,
  },
  {
    id: 'bc-4',
    client: 'Ghost Syndicate Bearer Wire',
    amount: 64000000,
    purpose: 'Anonymous Crypto-to-Cash Vault Withdrawal',
    kycStatus: 'NO BVN RECORD • Forged Director Stamp',
    isFraud: true,
  },
];

export const BuildingInteriorModal: React.FC<BuildingInteriorModalProps> = ({
  buildingId,
  initialSection,
  onClose,
  onStepOutside,
  player,
  vitals,
  isNepaActive,
  onUpdatePlayer,
  onUpdateVitals,
  onAddNotification,
  onStartMission,
  onOpenTechMiniGame,
  onOpenHeist,
  onOpenCustomizer,
  onOpenInventory,
  onOpenBennys,
  onFlyToCity,
  vaultCamsDisabled,
  onDisableCameras,
  onBreachVault,
  onSpawnVehicle,
  onOpenGarageModal,
}) => {
  const [techTab, setTechTab] = useState<'phones' | 'laptops' | 'os_compare'>('phones');
  const [phoneOsFilter, setPhoneOsFilter] = useState<'all' | 'ios' | 'android'>('all');
  const [mallTab, setMallTab] = useState<'groceries' | 'solar' | 'luxury' | 'realestate'>('groceries');
  const [bankCaseIdx, setBankCaseIdx] = useState<number>(0);
  const [mansionFloor, setMansionFloor] = useState<'ground' | 'upstairs' | 'garage'>('ground');

  useEffect(() => {
    if (!initialSection) {
      setPhoneOsFilter('all');
      return;
    }
    if (initialSection === 'ios') {
      setTechTab('phones');
      setPhoneOsFilter('ios');
    } else if (initialSection === 'android') {
      setTechTab('phones');
      setPhoneOsFilter('android');
    } else if (initialSection === 'laptops') {
      setTechTab('laptops');
    } else if (initialSection === 'phones') {
      setTechTab('phones');
      setPhoneOsFilter('all');
    } else if (
      initialSection === 'groceries' ||
      initialSection === 'solar' ||
      initialSection === 'luxury' ||
      initialSection === 'realestate'
    ) {
      setMallTab(initialSection);
    }
  }, [initialSection, buildingId]);

  if (!buildingId) return null;

  const currentCity: CityId = player.activeCity || 'lagos';
  const otherCity: CityId = currentCity === 'lagos' ? 'abuja' : 'lagos';
  const formatNaira = (val: number) => '₦' + val.toLocaleString('en-NG');

  const equippedPhone =
    PHONE_MODELS_CATALOG.find((p) => p.id === player.phoneModelId) ||
    PHONE_MODELS_CATALOG[3];
  const equippedLaptop =
    LAPTOP_MODELS_CATALOG.find((l) => l.id === player.laptopModelId) ||
    LAPTOP_MODELS_CATALOG[0];

  const solarKw = player.solarKw || 0;
  const nepaUnits = player.nepaUnitsKwh ?? 65;
  const nepaArrears = player.nepaBillArrears ?? 0;
  const genFuel = player.inventory.generatorFuelLitres || 0;

  const hasHomePower =
    solarKw > 0 ||
    (isNepaActive && nepaUnits > 0) ||
    (player.inventory.generator && genFuel > 0);

  const chargeMoney = (cost: number): boolean => {
    if (player.cash >= cost) {
      onUpdatePlayer((p) => ({ ...p, cash: p.cash - cost }));
      return true;
    }
    if (player.bankBalance >= cost) {
      onUpdatePlayer((p) => ({ ...p, bankBalance: p.bankBalance - cost }));
      return true;
    }
    onAddNotification(
      'Insufficient Funds',
      `You need ${formatNaira(cost)} in Cash or Bank Checking.`,
      'warning'
    );
    return false;
  };

  // ==================== 1. PLAYER HOUSE / RESIDENCE INTERIOR ====================
  if (buildingId === 'home') {
    const houseObj: PropertySpec =
      REAL_ESTATE.find((r) => r.id === player.housing) || REAL_ESTATE[1];

    const isBillionaire = houseObj.id === 'ikoyi-mansion';
    const isDuplex = houseObj.id === 'lekki-duplex';
    const isFlat = houseObj.id === 'mainland-flat';
    const isFaceMe = houseObj.id === 'face-me-i-face-you' || houseObj.id === 'squatting';
    const garageCap = houseObj.garageCapacity || 2;
    const parkedCount = Math.min((player.garageVehicles?.length || (player.ownedVehicles || []).length), garageCap);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className={`w-full max-w-4xl bg-[#090d16] border rounded-3xl overflow-hidden shadow-[0_25px_90px_rgba(0,0,0,0.95)] text-white flex flex-col max-h-[90vh] ${
            isBillionaire
              ? 'border-amber-500/50 shadow-amber-500/15'
              : 'border-teal-500/35 shadow-teal-500/10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Interior Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${
              isBillionaire
                ? 'bg-gradient-to-r from-amber-950/90 via-zinc-900 to-zinc-900 border-amber-500/40'
                : 'bg-gradient-to-r from-teal-950/80 via-zinc-900 to-zinc-900 border-white/10'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-lg ${
                  isBillionaire
                    ? 'bg-amber-500/25 border-amber-400/60 text-amber-300'
                    : 'bg-teal-500/20 border-teal-400/40 text-teal-300'
                }`}
              >
                {isBillionaire ? <Crown size={24} /> : <Home size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-black ${
                      isBillionaire
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {isBillionaire
                      ? '★ BANANA ISLAND BILLIONAIRE MEGA MANSION'
                      : isDuplex
                      ? 'VI WATERFRONT LUXURY PENTHOUSE'
                      : isFlat
                      ? 'YABA TECH CORRIDOR MODERN FLAT'
                      : 'MAINLAND BUDGET RESIDENCE'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Comfort {houseObj.comfort}/100 • {garageCap}-Car Garage
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
                  <span>{currentCity === 'abuja' ? `Maitama Hills — ${houseObj.name}` : houseObj.name}</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenGarageModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGarageModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-black flex items-center gap-1.5 transition-colors"
                >
                  <Warehouse size={14} /> Garage ({parkedCount}/{garageCap})
                </button>
              )}
              {onStepOutside && (
                <button
                  onClick={() => {
                    onClose();
                    onStepOutside();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 text-xs font-bold text-rose-200 hover:text-white transition-colors"
                >
                  🚪 Step Outside
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Billionaire Multi-Level Floor Navigation Tab */}
          {isBillionaire && (
            <div className="px-6 py-2 bg-black/60 border-b border-amber-500/20 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-amber-400/80 font-bold mr-2">
                • Estate Navigation:
              </span>
              <button
                onClick={() => setMansionFloor('ground')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mansionFloor === 'ground'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                <Layers size={13} /> Ground Floor (Foyer, Living &amp; Chef Kitchen)
              </button>
              <button
                onClick={() => setMansionFloor('upstairs')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mansionFloor === 'upstairs'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                <Crown size={13} /> Upstairs Luxury Suites &amp; Jacuzzi Spa
              </button>
              <button
                onClick={() => setMansionFloor('garage')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mansionFloor === 'garage'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                <Warehouse size={13} /> 8-Car Showroom Garage
              </button>
            </div>
          )}

          <div className="p-5 overflow-y-auto space-y-4">
            {/* Live Power / Electricity Status Banner */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                solarKw > 0
                  ? 'bg-emerald-950/50 border-emerald-500/40'
                  : hasHomePower
                  ? 'bg-amber-950/40 border-amber-500/40'
                  : 'bg-rose-950/60 border-rose-500/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-xl">
                  {solarKw > 0 ? '☀️' : isNepaActive && nepaUnits > 0 ? '⚡' : '⛽'}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 block">
                    HOME ELECTRICITY &amp; POWER SOURCE
                  </span>
                  <h4 className="text-xs font-extrabold text-white">
                    {solarKw > 0
                      ? `${solarKw}kVA Hybrid Solar + Lithium Storage (24/7 Uninterrupted Clean Power)`
                      : isNepaActive && nepaUnits > 0
                      ? `${currentCity === 'abuja' ? 'AEDC' : 'EKEDC / NEPA'} Grid Power Online (${nepaUnits} kWh Meter Units)`
                      : player.inventory.generator && genFuel > 0
                      ? `Soundproof Backup Generator Running (${genFuel}L Fuel Left)`
                      : 'TOTAL BLACKOUT — Buy Solar, NEPA Units, or Generator Fuel!'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-amber-300">
                  Cash: {formatNaira(player.cash)}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-emerald-300">
                  Bank: {formatNaira(player.bankBalance)}
                </span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SCENARIO A: BILLIONAIRE MEGA MANSION (Multi-Level Upstairs & Ground) */}
            {/* ============================================================== */}
            {isBillionaire ? (
              mansionFloor === 'ground' ? (
                /* BILLIONAIRE GROUND FLOOR */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-400 font-bold border-b border-zinc-800 pb-1.5">
                    <span>• Ground Floor: Grand Foyer, Living Hall &amp; Gourmet Kitchen</span>
                    <span className="text-zinc-500">6 Specialized Rooms</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Room 1: Presidential Living Hall */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                          <Tv size={15} /> Presidential Living Hall (100" 8K TV)
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400">Ground Floor</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Italian velvet sectional sofas, double-height ceiling, fireplace, and 12-speaker Bose surround sound.
                      </p>
                      <button
                        onClick={() => {
                          audioEngine.playUpNepa();
                          onUpdateVitals((v) => ({ ...v, stress: 0, energy: Math.min(100, v.energy + 30) }));
                          onAddNotification('Living Hall Relaxation 🛋️', 'Relaxed on custom Italian sofas watching 8K cinema. Stress reduced to 0!', 'success');
                        }}
                        className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 font-bold text-xs transition-all"
                      >
                        🛋️ Relax in Living Hall (Reduce Stress to 0%)
                      </button>
                    </div>

                    {/* Room 2: Executive Chef Gourmet Kitchen */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                          <Utensils size={15} /> Executive Chef Kitchen &amp; Dining Hall
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400">Sub-Zero &amp; Wolf</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Italian Calacatta marble island, private chef station, wine cooler, and 14-seater mahogany dining hall.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (!chargeMoney(8500)) return;
                            audioEngine.playEatFood();
                            onUpdateVitals((v) => ({ ...v, hunger: 100, thirst: 100, energy: 100, health: Math.min(100, v.health + 20) }));
                            onAddNotification('Chef Gourmet Meal 🥩', 'Private chef served Wagyu Suya, Lobster Jollof & Vintage Champagne!', 'success');
                          }}
                          className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
                        >
                          🥩 5-Star Chef Meal (₦8.5k)
                        </button>
                        <button
                          onClick={() => {
                            if (!chargeMoney(15000)) return;
                            audioEngine.playCashEarn();
                            onAddNotification('Stocked Walk-In Pantry 🛒', 'Filled Sub-Zero double fridge with imported groceries and champagne!', 'success');
                          }}
                          className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
                        >
                          🛒 Stock Pantry (₦15k)
                        </button>
                      </div>
                    </div>

                    {/* Room 3: Private Cognac & Wine Bar */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-purple-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                          <Wine size={15} /> Private Cognac &amp; Wine Cellar Bar
                        </h4>
                        <span className="text-[10px] font-mono text-purple-400">VIP Cellar</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Curated collection of 1982 Bordeaux wines, vintage champagne, and rare aged cognac with bar seating.
                      </p>
                      <button
                        onClick={() => {
                          if (!chargeMoney(25000)) return;
                          audioEngine.playClick();
                          onUpdateVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 10), stress: 0 }));
                          onAddNotification('Vintage Pour 🍸', 'Poured 25-year-old Louis XIII Cognac. +10 Street Cred & Zero Stress!', 'success');
                        }}
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all"
                      >
                        🍸 Pour Vintage Cognac (₦25k • +10 Cred)
                      </button>
                    </div>

                    {/* Room 4: Biometric Walk-In Bank Vault Safe */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-emerald-300 flex items-center gap-1.5">
                          <Lock size={15} /> Biometric Walk-In Bank Vault
                        </h4>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          Vault: {formatNaira(player.homeSafeCash || 0)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Reinforced 8-inch steel vault door with biometric palm scanner. Holds up to ₦100,000,000 completely safe from police raids.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const amt = Math.min(player.cash, 500000);
                            if (amt <= 0) return;
                            audioEngine.playCashEarn();
                            onUpdatePlayer((p) => ({ ...p, cash: p.cash - amt, homeSafeCash: (p.homeSafeCash || 0) + amt }));
                            onAddNotification('Vault Stash 💰', `Locked ${formatNaira(amt)} in Billionaire Walk-In Vault!`, 'success');
                          }}
                          className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Stash ₦500k in Vault
                        </button>
                        <button
                          onClick={() => {
                            const safe = player.homeSafeCash || 0;
                            const amt = Math.min(safe, 500000);
                            if (amt <= 0) return;
                            audioEngine.playCashEarn();
                            onUpdatePlayer((p) => ({ ...p, cash: p.cash + amt, homeSafeCash: (p.homeSafeCash || 0) - amt }));
                            onAddNotification('Vault Withdrawal 💵', `Withdrew ${formatNaira(amt)} from Safe Vault.`, 'info');
                          }}
                          className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs"
                        >
                          Withdraw ₦500k
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : mansionFloor === 'upstairs' ? (
                /* BILLIONAIRE UPSTAIRS LUXURY FLOOR */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-400 font-bold border-b border-zinc-800 pb-1.5">
                    <span>• Upstairs Level: Master Presidential Suite, Jacuzzi Spa &amp; Rooftop Helipad</span>
                    <span className="text-zinc-500">Upstairs Suites</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Upstairs 1: Master Presidential Suite */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                          <Crown size={15} /> Master Presidential Suite &amp; Ocean Balcony
                        </h4>
                        <span className="text-[10px] font-mono text-amber-400">Top Floor</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        California King canopy bed, floor-to-ceiling glass doors opening to private oceanfront balcony, and walk-in dressing room.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            audioEngine.playUpNepa();
                            onUpdateVitals((v) => ({ ...v, energy: 100, health: 100, stress: 0 }));
                            onAddNotification('Deep Presidential Sleep 🛌', 'Slept in California King Master Suite — 100% Stamina, 100% Health, 0% Stress!', 'success');
                          }}
                          className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
                        >
                          🛌 King Bed Sleep
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onOpenCustomizer();
                          }}
                          className="py-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Shirt size={13} /> Dressing Studio
                        </button>
                      </div>
                    </div>

                    {/* Upstairs 2: Marble Spa Bathroom with Jacuzzi Whirlpool */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                          <Bath size={15} /> Marble Spa Bathroom with Jacuzzi Whirlpool
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-400">Jacuzzi &amp; Sauna</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Heated Jacuzzi hydrotherapy whirlpool tub, cedarwood dry steam sauna room, rainfall shower, and 24k gold fixtures.
                      </p>
                      <button
                        onClick={() => {
                          audioEngine.playUpNepa();
                          onUpdateVitals((v) => ({ ...v, stress: 0, health: 100 }));
                          onAddNotification('Jacuzzi Hydrotherapy 🛁', 'Soaked in the heated Jacuzzi whirlpool and cedarwood sauna! 100% Rejuvenated.', 'success');
                        }}
                        className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-md shadow-cyan-500/20"
                      >
                        🛁 Soak in Jacuzzi Whirlpool &amp; Sauna
                      </button>
                    </div>

                    {/* Upstairs 3: 2 VIP Guest Bedrooms */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                          <BedDouble size={15} /> 2 Luxury En-Suite Guest Bedrooms
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400">Suites 2 &amp; 3</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Two independent guest suites with king-size beds, en-suite marble bathrooms, and dedicated private verandas.
                      </p>
                      <button
                        onClick={() => {
                          audioEngine.playClick();
                          onAddNotification('Guest Suites Ready 🛏️', 'Accommodations ready for VIP associates, syndicate captains & friends.', 'info');
                        }}
                        className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
                      >
                        ✨ Inspect VIP Guest Accommodations
                      </button>
                    </div>

                    {/* Upstairs 4: Private Cinema Lounge & Rooftop Helipad */}
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-indigo-300 flex items-center gap-1.5">
                          <Film size={15} /> Private Cinema &amp; Rooftop Helipad
                        </h4>
                        <span className="text-[10px] font-mono text-indigo-400">Rooftop Skydeck</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        12-seat acoustic screening cinema room downstairs, plus rooftop penthouse terrace with infinity pool and FAA-certified helicopter landing pad.
                      </p>
                      <button
                        onClick={() => {
                          audioEngine.playClick();
                          onUpdateVitals((v) => ({ ...v, stress: 0 }));
                          onAddNotification('Private Screening 🎬', 'Hosted private cinema screening for friends. Stress reduced to 0!', 'success');
                        }}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs"
                      >
                        🎬 Host Private Cinema Screening
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* BILLIONAIRE SHOWROOM GARAGE TAB */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <Warehouse size={22} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">Banana Island 8-Car Showroom Garage</h4>
                          <span className="text-xs font-mono text-amber-300">
                            Capacity: {garageCap} Exotic Hypercars &amp; Motorcycles
                          </span>
                        </div>
                      </div>
                      {onOpenGarageModal && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenGarageModal();
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase"
                        >
                          Open Full Garage Terminal →
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your underground showroom features illuminated LED floor strips, glass display walls, and 8 physical bays directly accessible in 3D.
                    </p>
                  </div>
                </div>
              )
            ) : isDuplex ? (
              /* ============================================================== */
              /* SCENARIO B: VICTORIA ISLAND 2-BEDROOM WATERFRONT PENTHOUSE */
              /* ============================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-teal-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-teal-300 flex items-center gap-1.5">
                      <Tv size={15} /> Designer Living Room &amp; Balcony
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Lagoon View</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Floor-to-ceiling glass doors opening onto the lagoon balcony with private cocktail bar.
                  </p>
                  <button
                    onClick={() => {
                      audioEngine.playUpNepa();
                      onUpdateVitals((v) => ({ ...v, stress: 0, energy: Math.min(100, v.energy + 20) }));
                      onAddNotification('Balcony Chill 🌊', 'Enjoyed the fresh Lagos breeze on the lagoon balcony. Stress cleared!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs"
                  >
                    🌊 Relax on Lagoon Balcony (-45 Stress)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-teal-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-teal-300 flex items-center gap-1.5">
                      <BedDouble size={15} /> Master Bedroom Suite &amp; Guest Room
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">2 Bedrooms</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    King bed in master suite, walk-in wardrobe, plus second fully furnished guest bedroom.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioEngine.playUpNepa();
                        onUpdateVitals((v) => ({ ...v, energy: 100, health: 100, stress: Math.max(0, v.stress - 40) }));
                        onAddNotification('Well Rested 🛌', 'Slept soundly in Master Penthouse Suite!', 'success');
                      }}
                      className="py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs"
                    >
                      🛌 Master Bed Sleep
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCustomizer();
                      }}
                      className="py-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Shirt size={13} /> Wardrobe
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                      <Bath size={15} /> Marble Spa Bathroom with Tub
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Spa Bath</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Deep soaking marble tub and glass walk-in rainfall shower.
                  </p>
                  <button
                    onClick={() => {
                      audioEngine.playUpNepa();
                      onUpdateVitals((v) => ({ ...v, stress: 0, health: 100 }));
                      onAddNotification('Hot Bath 🛁', 'Took a warm bath in the soaking tub. Completely refreshed!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    🛁 Take Warm Bath (100% Health &amp; 0 Stress)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                      <Warehouse size={15} /> 4-Car Secure Gated Garage
                    </h4>
                    <span className="text-[10px] font-mono text-amber-400">4 Bays</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Secure private parking bay for up to 4 vehicles with automatic security roll-up door.
                  </p>
                  {onOpenGarageModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGarageModal();
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <Warehouse size={14} /> Open 4-Car Garage Bay
                    </button>
                  )}
                </div>
              </div>
            ) : isFlat ? (
              /* ============================================================== */
              /* SCENARIO C: YABA TECH 1-BEDROOM MODERN FLAT */
              /* ============================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-indigo-300 flex items-center gap-1.5">
                      <Laptop size={15} /> Remote Tech Workstation &amp; Fiber Desk
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-400">1Gbps Fiber</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Dual monitor battlestation to ship smart contract PRs and fintech microservices.
                  </p>
                  <button
                    onClick={() => {
                      if (!hasHomePower) {
                        onAddNotification('No Power!', 'Need Solar or NEPA to run PC workstation!', 'warning');
                        return;
                      }
                      audioEngine.playCashEarn();
                      const pay = 75000;
                      onUpdatePlayer((p) => ({ ...p, bankBalance: p.bankBalance + pay }));
                      onUpdateVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 5) }));
                      onAddNotification('PR Merged! 💻', `Shipped backend code — +${formatNaira(pay)} deposited to Bank!`, 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    💻 Ship Code Contract (+₦75k to Bank)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                      <BedDouble size={15} /> Bedroom &amp; Living Room
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">1 Bedroom</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Queen mattress, smart TV, and wardrobe closet to change into fresh drip.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioEngine.playUpNepa();
                        onUpdateVitals((v) => ({ ...v, energy: 100, stress: Math.max(0, v.stress - 35) }));
                        onAddNotification('Rested 🛌', '100% Stamina & -35 Stress!', 'success');
                      }}
                      className="py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs"
                    >
                      🛌 Sleep in Bed
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCustomizer();
                      }}
                      className="py-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Shirt size={13} /> Wardrobe
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-yellow-300 flex items-center gap-1.5">
                      <Utensils size={15} /> Kitchenette &amp; Dining
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Microwave &amp; Fridge</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Cook home meals or heat up takeaway from Amala Shitta.
                  </p>
                  <button
                    onClick={() => {
                      if (!chargeMoney(2000)) return;
                      audioEngine.playEatFood();
                      onUpdateVitals((v) => ({ ...v, hunger: 100, thirst: 100, energy: Math.min(100, v.energy + 25) }));
                      onAddNotification('Kitchen Meal 🍛', 'Cooked Smoky Jollof & Dodo at home!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs"
                  >
                    🍛 Cook Meal (₦2,000)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                      <Warehouse size={15} /> 2-Car Private Gated Garage
                    </h4>
                    <span className="text-[10px] font-mono text-amber-400">2 Bays</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Gated driveway holding 2 vehicles safely behind your electric gate.
                  </p>
                  {onOpenGarageModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGarageModal();
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <Warehouse size={14} /> Open 2-Car Garage ({parkedCount}/2)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* SCENARIO D: FACE-ME-I-FACE-YOU / SINGLE ROOM MAINLAND BUDGET */
              /* ============================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                      <BedDouble size={15} /> Single Foam Bed &amp; Net
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Single Room</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Single foam mattress with mosquito net. Sleep to recover your stamina.
                  </p>
                  <button
                    onClick={() => {
                      audioEngine.playUpNepa();
                      onUpdateVitals((v) => ({ ...v, energy: Math.min(100, v.energy + 65), stress: Math.max(0, v.stress - 20) }));
                      onAddNotification('Rested in Room 🛌', 'Recovered stamina on foam bed.', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs"
                  >
                    🛌 Sleep on Bed (+65% Stamina)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-orange-300 flex items-center gap-1.5">
                      <Utensils size={15} /> Kerosene Stove Cooking Corner
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Corner Stove</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Small camping kerosene stove to boil Indomie noodles and boiled eggs.
                  </p>
                  <button
                    onClick={() => {
                      if (!chargeMoney(800)) return;
                      audioEngine.playEatFood();
                      onUpdateVitals((v) => ({ ...v, hunger: 100, thirst: 80, energy: Math.min(100, v.energy + 20) }));
                      onAddNotification('Cooked Indomie 🍜', 'Boiled 2 packs of spicy Indomie with egg!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                  >
                    🍜 Boil Indomie &amp; Egg (₦800)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                      <Bath size={15} /> Shared Compound Corridor &amp; Bathroom
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Shared Yard</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Shared compound bathroom corridor. Fetch water from the tap and take a bucket bath.
                  </p>
                  <button
                    onClick={() => {
                      audioEngine.playUpNepa();
                      onUpdateVitals((v) => ({ ...v, stress: Math.max(0, v.stress - 25), health: Math.min(100, v.health + 15) }));
                      onAddNotification('Cold Bucket Bath 🪣', 'Fetched cold water from yard tap and took bucket bath!', 'info');
                    }}
                    className="w-full py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs"
                  >
                    🪣 Take Cold Bucket Bath (-25 Stress)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                      <Warehouse size={15} /> Street Curb Parking Space
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">1 Vehicle</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Single roadside parking spot outside the compound for your Okada or car.
                  </p>
                  {onOpenGarageModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGarageModal();
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                    >
                      <Warehouse size={14} /> Open Street Spot ({parkedCount}/1)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. COMPUTER VILLAGE / BANEX TECH & PHONE MALL ====================
  if (buildingId === 'computervillage' || buildingId === 'istore') {
    const ownedPhones = player.ownedPhones || ['tecno-phantom-v2', 'iphone-15-pro'];
    const ownedLaptops = player.ownedLaptops || ['thinkpad-x1'];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl bg-[#090d16] border border-orange-500/40 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-orange-950/80 via-zinc-900 to-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300">
                <Smartphone size={22} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">
                  FLAGSHIP MOBILE & WORKSTATION SHOWROOM
                </span>
                <h2 className="text-base font-black text-white mt-0.5">
                  {currentCity === 'abuja'
                    ? 'Banex Plaza & Slot Flagship Store (Wuse II, Abuja)'
                    : 'Computer Village & Slot Flagship Store (Ikeja, Lagos)'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-teal-500 text-xs font-bold text-zinc-200 hover:text-black flex items-center gap-1.5"
            >
              <X size={14} /> Back to 3D Store
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 pb-2 bg-zinc-900/60 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setTechTab('phones');
                  setPhoneOsFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  techTab === 'phones' && phoneOsFilter === 'all'
                    ? 'bg-orange-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                📱 All Phones
              </button>
              <button
                onClick={() => {
                  setTechTab('phones');
                  setPhoneOsFilter('ios');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  techTab === 'phones' && phoneOsFilter === 'ios'
                    ? 'bg-sky-400 text-black'
                    : 'bg-zinc-800 text-sky-300 hover:text-white'
                }`}
              >
                 Apple iOS
              </button>
              <button
                onClick={() => {
                  setTechTab('phones');
                  setPhoneOsFilter('android');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  techTab === 'phones' && phoneOsFilter === 'android'
                    ? 'bg-emerald-400 text-black'
                    : 'bg-zinc-800 text-emerald-300 hover:text-white'
                }`}
              >
                🤖 Android OS
              </button>
              <button
                onClick={() => setTechTab('laptops')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  techTab === 'laptops'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                💻 Laptops & Dev Rigs
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenInventory();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-teal-300"
              >
                🧰 24/7 Gadgets
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-300">
              Active Phone: <strong className="text-orange-300">{equippedPhone.name}</strong> ({equippedPhone.os.toUpperCase()})
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {techTab === 'phones' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {PHONE_MODELS_CATALOG.filter(
                  (ph) => phoneOsFilter === 'all' || ph.os === phoneOsFilter
                ).map((phone) => {
                  const isOwned = ownedPhones.includes(phone.id);
                  const isEquipped = player.phoneModelId === phone.id;
                  return (
                    <div
                      key={phone.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        isEquipped
                          ? 'bg-orange-950/35 border-orange-400 shadow-lg'
                          : 'bg-zinc-900/90 border-white/10'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                              phone.os === 'ios'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            }`}
                          >
                            {phone.os === 'ios' ? ' Apple iOS' : '🤖 Android OS'} • {phone.releaseYear}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-300">
                            {isOwned ? 'OWNED' : formatNaira(phone.price)}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-white">{phone.name}</h4>
                        <p className="text-[11px] text-zinc-400 font-mono">{phone.osVersion}</p>

                        <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-1 text-[10px] text-zinc-300">
                          <div>⚙️ <strong>Chip:</strong> {phone.chipset}</div>
                          <div>📸 <strong>Camera:</strong> {phone.cameraSpec}</div>
                          <div>🔥 <strong>Perks:</strong> +{phone.credBonus} Street Cred • +{phone.batteryBonus}% Battery</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (isEquipped) return;
                          if (isOwned) {
                            audioEngine.playClick();
                            onUpdatePlayer((p) => ({ ...p, phoneModelId: phone.id }));
                            onAddNotification(
                              'SIM Card Swapped 📱',
                              `Activated ${phone.name} (${phone.osVersion})! Press [M] to see your new OS.`,
                              'info'
                            );
                            return;
                          }
                          if (!chargeMoney(phone.price)) return;
                          audioEngine.playCashEarn();
                          onUpdatePlayer((p) => ({
                            ...p,
                            phoneModelId: phone.id,
                            ownedPhones: [...(p.ownedPhones || []), phone.id],
                          }));
                          onUpdateVitals((v) => ({
                            ...v,
                            streetCred: Math.min(100, v.streetCred + phone.credBonus),
                          }));
                          onAddNotification(
                            'New Smartphone Unboxed! 📱✨',
                            `Purchased & activated ${phone.name}! Press [M] to experience ${phone.osVersion}.`,
                            'success'
                          );
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                          isEquipped
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                            : isOwned
                            ? 'bg-teal-500 hover:bg-teal-400 text-black'
                            : 'bg-orange-500 hover:bg-orange-400 text-black'
                        }`}
                      >
                        {isEquipped
                          ? '✓ Active Device in Hand'
                          : isOwned
                          ? 'Switch SIM to This Phone'
                          : `Buy & Activate (${formatNaira(phone.price)})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {techTab === 'laptops' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {LAPTOP_MODELS_CATALOG.map((lap) => {
                  const isOwned = ownedLaptops.includes(lap.id);
                  const isEquipped = player.laptopModelId === lap.id;
                  return (
                    <div
                      key={lap.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                        isEquipped
                          ? 'bg-indigo-950/40 border-indigo-400 shadow-lg'
                          : 'bg-zinc-900/90 border-white/10'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {lap.brand} • {lap.payMultiplier}x Salary Multiplier
                          </span>
                          <span className="text-xs font-mono font-black text-amber-300">
                            {isOwned ? 'OWNED' : formatNaira(lap.price)}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white">
                          {lap.icon} {lap.name}
                        </h4>
                        <p className="text-[11px] font-mono text-teal-300">
                          {lap.chip} • {lap.ram}
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed">{lap.description}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (isEquipped) return;
                          if (isOwned) {
                            audioEngine.playClick();
                            onUpdatePlayer((p) => ({ ...p, laptopModelId: lap.id }));
                            onAddNotification('Workstation Equipped 💻', `${lap.name} is now your primary rig.`, 'info');
                            return;
                          }
                          if (!chargeMoney(lap.price)) return;
                          audioEngine.playCashEarn();
                          onUpdatePlayer((p) => ({
                            ...p,
                            laptopModelId: lap.id,
                            ownedLaptops: [...(p.ownedLaptops || []), lap.id],
                            inventory: { ...p.inventory, laptop: true },
                          }));
                          onUpdateVitals((v) => ({
                            ...v,
                            streetCred: Math.min(100, v.streetCred + 15),
                          }));
                          onAddNotification(
                            'New Laptop Purchased! 💻🔥',
                            `Equipped ${lap.name} (${lap.payMultiplier}x Developer & Banker salary multiplier)!`,
                            'success'
                          );
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                          isEquipped
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                            : isOwned
                            ? 'bg-teal-500 hover:bg-teal-400 text-black'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isEquipped
                          ? '✓ Equipped Workstation'
                          : isOwned
                          ? 'Set as Active Laptop'
                          : `Buy Workstation (${formatNaira(lap.price)})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== 3. SHOPPING MALL (THE PALMS LEKKI / JABI LAKE MALL ABUJA) ====================
  if (buildingId === 'lekki') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl bg-[#090d16] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/80 via-zinc-900 to-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <ShoppingBag size={22} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  MEGA SHOPPING MALL & DYNASTY 8 REAL ESTATE
                </span>
                <h2 className="text-base font-black text-white mt-0.5">
                  {currentCity === 'abuja'
                    ? 'Jabi Lake Shopping Mall & Shoprite (Abuja FCT)'
                    : 'The Palms Shopping Mall & Shoprite (Lekki, Lagos)'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-teal-500 text-xs font-bold text-zinc-200 hover:text-black flex items-center gap-1.5"
            >
              <X size={14} /> Back to 3D Mall
            </button>
          </div>

          <div className="px-6 pt-3 pb-2 bg-zinc-900/60 border-b border-white/8 flex flex-wrap gap-2">
            {[
              { id: 'groceries' as const, label: '🛒 Shoprite Supermarket' },
              { id: 'solar' as const, label: '☀️ Solar, Inverter & Power' },
              { id: 'luxury' as const, label: '⌚ Luxury Watches & Drip' },
              { id: 'realestate' as const, label: '🏡 Dynasty 8 Houses' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMallTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  mallTab === t.id
                    ? 'bg-cyan-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5 overflow-y-auto space-y-3.5">
            {mallTab === 'groceries' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    name: 'Shoprite Rotisserie Chicken & Jollof Basket',
                    price: 8500,
                    desc: 'Restores 100% Hunger, +60 Thirst & +45 Stamina immediately.',
                    icon: '🍗',
                    hunger: 100,
                    thirst: 60,
                    energy: 45,
                  },
                  {
                    name: 'Crate of Cold Malt, Eva Water & Smoothie',
                    price: 5000,
                    desc: 'Hydrates 100% Thirst, +35 Stamina & relieves -20 Stress.',
                    icon: '🧃',
                    hunger: 25,
                    thirst: 100,
                    energy: 35,
                  },
                  {
                    name: 'Weekly Home Grocery Cart (Stock Fridge)',
                    price: 22000,
                    desc: 'Fills Hunger, Thirst & Energy to 100% and reduces Stress by 40.',
                    icon: '🛒',
                    hunger: 100,
                    thirst: 100,
                    energy: 100,
                  },
                  {
                    name: 'Imported Belgian Chocolates & Wine Gift Box',
                    price: 35000,
                    desc: 'Boosts Street Cred (+8) and melts away -50 Stress.',
                    icon: '🍷',
                    hunger: 40,
                    thirst: 60,
                    energy: 50,
                    cred: 8,
                  },
                ].map((g) => (
                  <div
                    key={g.name}
                    className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-white">
                          {g.icon} {g.name}
                        </h4>
                        <span className="font-mono text-xs font-black text-amber-300">
                          {formatNaira(g.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{g.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!chargeMoney(g.price)) return;
                        audioEngine.playEatFood();
                        onUpdateVitals((v) => ({
                          ...v,
                          hunger: Math.min(100, v.hunger + g.hunger),
                          thirst: Math.min(100, v.thirst + g.thirst),
                          energy: Math.min(100, v.energy + g.energy),
                          stress: Math.max(0, v.stress - 30),
                          streetCred: Math.min(100, v.streetCred + (g.cred || 2)),
                        }));
                        onAddNotification('Shoprite Checkout 🛍️', `Purchased ${g.name}!`, 'success');
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs"
                    >
                      Buy at Checkout ({formatNaira(g.price)})
                    </button>
                  </div>
                ))}
              </div>
            )}

            {mallTab === 'solar' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">
                      GENERATOR FUEL
                    </span>
                    <h4 className="text-sm font-black text-white mt-0.5">⛽ 50L Diesel / Petrol Drum</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Adds +50 Litres of fuel to your home generator tank and enables backup generator power.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!chargeMoney(32000)) return;
                      audioEngine.playCashEarn();
                      onUpdatePlayer((p) => ({
                        ...p,
                        inventory: {
                          ...p.inventory,
                          generator: true,
                          generatorFuelLitres: (p.inventory.generatorFuelLitres || 0) + 50,
                        },
                      }));
                      onAddNotification('Fuel Purchased ⛽', '+50L added to your Home Generator!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
                  >
                    Buy +50L Fuel (₦32,000)
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold">
                      HOME SOLAR INVERTER
                    </span>
                    <h4 className="text-sm font-black text-white mt-0.5">☀️ 5kVA Luminous Solar Array</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Powers your entire apartment 24/7 with rooftop solar panels. Never worry about NEPA blackouts again!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!chargeMoney(450000)) return;
                      audioEngine.playUpNepa();
                      onUpdatePlayer((p) => ({
                        ...p,
                        solarKw: Math.max(5, p.solarKw || 0),
                        inventory: { ...p.inventory, solarInverter: true },
                      }));
                      onAddNotification('5kVA Solar Installed! ☀️', 'Your house now runs on 24/7 solar power!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
                  >
                    {solarKw >= 5 ? '✓ Installed (Upgrade Available)' : 'Buy & Install (₦450,000)'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-teal-400/40 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-teal-300 uppercase font-bold">
                      ESTATE HYBRID SOLAR
                    </span>
                    <h4 className="text-sm font-black text-white mt-0.5">🔋 10kVA Tesla Powerwall Roof</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Dual Tesla Powerwall + 10kVA solar roof. Powers mansion AC, servers & EV chargers (+25 Street Cred).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!chargeMoney(1200000)) return;
                      audioEngine.playUpNepa();
                      onUpdatePlayer((p) => ({
                        ...p,
                        solarKw: 10,
                        inventory: { ...p.inventory, solarInverter: true },
                      }));
                      onUpdateVitals((v) => ({ ...v, streetCred: Math.min(100, v.streetCred + 25) }));
                      onAddNotification('10kVA Tesla Solar Installed! ⚡', 'Maximum off-grid estate power active!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-black font-black text-xs"
                  >
                    {solarKw >= 10 ? '✓ 10kVA Active' : 'Buy & Install (₦1,200,000)'}
                  </button>
                </div>
              </div>
            )}

            {mallTab === 'luxury' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    name: 'Creed Aventus & Designer Shades Pack',
                    price: 85000,
                    cred: 10,
                    stress: 25,
                    icon: '🕶️',
                  },
                  {
                    name: 'Rolex Oyster Perpetual Datejust 41',
                    price: 650000,
                    cred: 22,
                    stress: 40,
                    icon: '⌚',
                  },
                  {
                    name: 'Audemars Piguet Royal Oak Skeleton',
                    price: 2400000,
                    cred: 45,
                    stress: 70,
                    icon: '💎',
                  },
                ].map((lux) => (
                  <div
                    key={lux.name}
                    className="p-4 rounded-2xl bg-zinc-900 border border-purple-500/30 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <span className="text-2xl">{lux.icon}</span>
                      <h4 className="text-xs font-black text-white mt-1">{lux.name}</h4>
                      <p className="text-[11px] text-purple-300 font-mono mt-1">
                        +{lux.cred} Street Cred • -{lux.stress} Stress
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!chargeMoney(lux.price)) return;
                        audioEngine.playCashEarn();
                        onUpdateVitals((v) => ({
                          ...v,
                          streetCred: Math.min(100, v.streetCred + lux.cred),
                          stress: Math.max(0, v.stress - lux.stress),
                        }));
                        onAddNotification('Luxury Boutique 💎', `Purchased ${lux.name} (+${lux.cred} Cred)!`, 'success');
                      }}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs"
                    >
                      Purchase ({formatNaira(lux.price)})
                    </button>
                  </div>
                ))}
              </div>
            )}

            {mallTab === 'realestate' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REAL_ESTATE.map((prop) => {
                  const isCurrent = player.housing === prop.id;
                  return (
                    <div
                      key={prop.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-cyan-400'
                          : 'bg-zinc-900 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-white">{prop.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Comfort {prop.comfort}/100 • Req {prop.credReq} Cred
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-cyan-300">
                          {prop.deposit === 0 ? 'Starter' : formatNaira(prop.deposit)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (isCurrent) return;
                          if (!chargeMoney(prop.deposit)) return;
                          audioEngine.playCashEarn();
                          onUpdatePlayer((p) => ({
                            ...p,
                            housing: prop.id as typeof p.housing,
                            rentAmount: prop.rent,
                          }));
                          onAddNotification('Dynasty 8 Real Estate 🔑', `Moved into ${prop.name}!`, 'success');
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-black ${
                          isCurrent
                            ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                        }`}
                      >
                        {isCurrent ? '✓ Current Residence' : `Lease Property (${formatNaira(prop.deposit)})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== 4. BANK BRANCH INTERIOR (BANKER JOB, TELLER, VAULT) ====================
  if (buildingId === 'fleeca' || buildingId === 'gtbank' || buildingId === 'cbn') {
    const activeCase = BANK_CASES[bankCaseIdx % BANK_CASES.length];
    const bankerPay = Math.round(
      (buildingId === 'cbn' ? 95000 : buildingId === 'gtbank' ? 72000 : 55000) *
        equippedLaptop.payMultiplier
    );
    const vaultSpec =
      BANK_VAULTS_CATALOG.find((v) => v.id === buildingId) ?? BANK_VAULTS_CATALOG[0];
    const camsOff = !!vaultCamsDisabled?.[vaultSpec.id];
    const ownedItemIds = new Set((player.items || []).map((i) => i.id));
    const bankTitle = currentCity === 'abuja' ? vaultSpec.abujaName : vaultSpec.name;

    const handleBankDecision = (approve: boolean) => {
      const correct = approve ? !activeCase.isFraud : activeCase.isFraud;
      setBankCaseIdx((i) => i + 1);
      if (correct) {
        audioEngine.playCashEarn();
        onUpdatePlayer((p) => ({ ...p, bankBalance: p.bankBalance + bankerPay }));
        onUpdateVitals((v) => ({
          ...v,
          streetCred: Math.min(100, v.streetCred + 5),
        }));
        onAddNotification(
          'Bank Compliance Bonus! 🏦',
          `Correctly processed ${activeCase.client} — +${formatNaira(bankerPay)} credited to your Bank!`,
          'success'
        );
      } else {
        audioEngine.playDispatchAlert();
        onAddNotification(
          'Compliance Audit Error ⚠️',
          activeCase.isFraud
            ? 'That wire was a fraudulent shell account! Always check KYC status.'
            : 'You rejected a verified corporate client! Check CAC/CBN status carefully.',
          'warning'
        );
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-3xl bg-[#090d16] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <Building2 size={22} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  INSIDE BANKING HALL • CORPORATE & TELLER FLOOR
                </span>
                <h2 className="text-base font-black text-white mt-0.5">{bankTitle}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-teal-500 text-xs font-bold text-zinc-200 hover:text-black flex items-center gap-1.5"
            >
              <X size={14} /> Back to 3D Bank
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {/* Interactive Corporate Banker Work Desk */}
            <div className="p-4 rounded-2xl bg-zinc-900/95 border border-emerald-500/35 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    WORK AS A BANKER • LIVE WIRE & LOAN COMPLIANCE DESK
                  </span>
                  <h3 className="text-sm font-black text-white">
                    Corporate Treasury & Anti-Fraud Desk (+{formatNaira(bankerPay)} / Wire)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onStartMission('banker');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs"
                >
                  🚐 Start 3D Bullion Escort Shift
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{activeCase.client}</span>
                  <span className="font-mono font-black text-amber-300">
                    {formatNaira(activeCase.amount)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300">Purpose: {activeCase.purpose}</p>
                <p
                  className={`text-[10px] font-mono font-bold ${
                    activeCase.isFraud ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  KYC / CBN Audit: {activeCase.kycStatus}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleBankDecision(true)}
                  className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Approve Wire Clearing
                </button>
                <button
                  onClick={() => handleBankDecision(false)}
                  className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={14} /> Flag & Freeze Fraud
                </button>
              </div>
            </div>

            {/* Teller & Vault Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
                <h4 className="text-xs font-black uppercase text-teal-300">
                  Instant Teller Counter
                </h4>
                <div className="text-xs font-mono space-y-1 text-zinc-300">
                  <div>Pocket Cash: <strong className="text-amber-300">{formatNaira(player.cash)}</strong></div>
                  <div>Checking Balance: <strong className="text-emerald-400">{formatNaira(player.bankBalance)}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (player.cash <= 0) return;
                      const amt = player.cash;
                      audioEngine.playCashEarn();
                      onUpdatePlayer((p) => ({
                        ...p,
                        cash: 0,
                        bankBalance: p.bankBalance + amt,
                      }));
                      onAddNotification('Teller Deposit', `Deposited ${formatNaira(amt)} to Checking.`, 'success');
                    }}
                    className="py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs"
                  >
                    Deposit All Cash
                  </button>
                  <button
                    onClick={() => {
                      const amt = Math.min(player.bankBalance, 100000);
                      if (amt <= 0) return;
                      audioEngine.playCashEarn();
                      onUpdatePlayer((p) => ({
                        ...p,
                        cash: p.cash + amt,
                        bankBalance: p.bankBalance - amt,
                      }));
                      onAddNotification('Teller Withdrawal', `Withdrew ${formatNaira(amt)} cash.`, 'info');
                    }}
                    className="py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                  >
                    Withdraw ₦100k
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/35 border border-rose-500/40 flex flex-col justify-between gap-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase text-rose-300">
                      🔐 Tier {vaultSpec.tier} Vault Break-In
                    </h4>
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background: vaultSpec.color + '33', color: vaultSpec.color }}
                    >
                      {vaultSpec.securityLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">{vaultSpec.description}</p>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-black/50 border border-white/10">
                      <div className="text-zinc-500">LOOT</div>
                      <div className="font-black text-amber-300">
                        ₦{(vaultSpec.minLoot / 1_000_000).toFixed(1)}M–{(vaultSpec.maxLoot / 1_000_000).toFixed(0)}M
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/50 border border-white/10">
                      <div className="text-zinc-500">CCTV</div>
                      <div className={`font-black ${camsOff ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {camsOff ? 'LOOPED' : `${vaultSpec.camerasCount} LIVE`}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-black/50 border border-white/10">
                      <div className="text-zinc-500">GUARDS</div>
                      <div className="font-black text-white">{vaultSpec.guardsCount} ARMED</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 space-y-0.5">
                    <div>
                      {ownedItemIds.has('cctv_jammer') ? '✅' : '⬜'} CCTV Signal Jammer (instant camera loop)
                    </div>
                    <div>
                      {ownedItemIds.has('plasma_drill') ? '✅' : '⬜'} Plasma Vault Drill (+20% loot)
                    </div>
                    <div>
                      {ownedItemIds.has('c4_thermite') ? '✅' : '⬜'} C4 Thermite Charge
                      {vaultSpec.tier === 3 ? ' (REQUIRED for CBN)' : ' (+10% loot)'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={camsOff}
                    onClick={() => {
                      onClose();
                      onDisableCameras?.(vaultSpec.id);
                    }}
                    className={`py-2 rounded-xl font-black text-[11px] ${
                      camsOff
                        ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {camsOff ? '✓ Cameras Looped' : '📹 Disable CCTV Cameras'}
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onBreachVault) onBreachVault(vaultSpec.id);
                      else onOpenHeist();
                    }}
                    className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px]"
                  >
                    💣 Breach Tier {vaultSpec.tier} Vault
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 5. INTERNATIONAL AIRPORT TERMINAL (LOS ⇄ ABV) ====================
  if (buildingId === 'airport') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-3xl bg-[#090d16] border border-sky-500/40 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-gradient-to-r from-sky-950/80 via-zinc-900 to-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                <PlaneTakeoff size={22} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                  FEDERAL AIRPORTS AUTHORITY OF NIGERIA (FAAN)
                </span>
                <h2 className="text-base font-black text-white mt-0.5">
                  {currentCity === 'lagos'
                    ? 'Murtala Muhammed Int’l Airport (LOS — Ikeja, Lagos)'
                    : 'Nnamdi Azikiwe Int’l Airport (ABV — Airport Rd, Abuja)'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-teal-500 text-xs font-bold text-zinc-200 hover:text-black flex items-center gap-1.5"
            >
              <X size={14} /> Back to 3D Terminal
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            <div className="p-4 rounded-2xl bg-sky-950/35 border border-sky-500/35 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-sky-300 uppercase font-bold block">
                  LIVE DEPARTURE BOARD
                </span>
                <h3 className="text-sm font-black text-white">
                  {currentCity === 'lagos'
                    ? 'Lagos (LOS) ➔ Abuja Federal Capital Territory (ABV)'
                    : 'Abuja (ABV) ➔ City of Lagos (LOS)'}
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30">
                STATUS: BOARDING GATE A4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {FLIGHT_ROUTES_CATALOG.map((fl) => (
                <div
                  key={fl.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xl">{fl.icon}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        {fl.cabin}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white">{fl.airline}</h4>
                    <p className="text-[10px] font-mono text-zinc-400">
                      Flight {fl.code} • +{fl.credBonus} Cred • -{fl.stressRelief} Stress
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!chargeMoney(fl.price)) return;
                      audioEngine.playCashEarn();
                      onUpdateVitals((v) => ({
                        ...v,
                        energy: 100,
                        stress: Math.max(0, v.stress - fl.stressRelief),
                        streetCred: Math.min(100, v.streetCred + fl.credBonus),
                      }));
                      onClose();
                      onFlyToCity(otherCity, fl.airline);
                    }}
                    className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs transition-all"
                  >
                    Board Flight ({formatNaira(fl.price)})
                  </button>
                </div>
              ))}
            </div>

            {/* Private Jet Hangar — Buy & Fly Your Own Aircraft */}
            <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/35 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block">
                    EXECUTIVE HANGARS 01–03 • PRIVATE AVIATION
                  </span>
                  <h3 className="text-sm font-black text-white">Buy &amp; Fly Your Own Private Jet</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  Fly: W throttle • SPACE climb • C descend • SHIFT afterburner
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {AIRCRAFT_CATALOG.map((ac) => {
                  const owned = (player.ownedPlanes || []).includes(ac.id);
                  return (
                    <div
                      key={ac.id}
                      className="p-3 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div
                          className="h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: `linear-gradient(135deg, ${ac.color}, ${ac.accent})` }}
                        >
                          ✈️
                        </div>
                        <h4 className="text-xs font-black text-white">{ac.name}</h4>
                        <p className="text-[10px] font-mono text-zinc-400">
                          {ac.manufacturer} • {ac.seats} seats • {ac.cruiseKmh} km/h
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!owned) {
                            if (!chargeMoney(ac.price)) return;
                            audioEngine.playCashEarn();
                            onUpdatePlayer((p) => ({
                              ...p,
                              ownedPlanes: [...(p.ownedPlanes || []), ac.id],
                            }));
                            onAddNotification(
                              'Aircraft Purchased ✈️',
                              `${ac.name} registered to you — wheeling out of the hangar now!`,
                              'success'
                            );
                          }
                          onClose();
                          onStepOutside?.();
                          setTimeout(() => onSpawnVehicle?.(ac.id), 400);
                        }}
                        className={`w-full py-2 rounded-xl font-black text-xs ${
                          owned
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                            : 'bg-amber-500 hover:bg-amber-400 text-black'
                        }`}
                      >
                        {owned ? '🛫 Taxi to Runway & Fly' : `Buy (${formatNaira(ac.price)})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 6. NNPC MEGA STATION, NEPA/EKEDC & BENNY'S HUB ====================
  if (buildingId === 'gas') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-[#090d16] border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fuel size={22} className="text-amber-400" />
              <div>
                <h3 className="text-sm font-black uppercase">
                  {currentCity === 'abuja'
                    ? 'NNPC Towers Station, AEDC Power & Benny’s Bay (Abuja)'
                    : 'NNPC Mega Station, EKEDC Power & Benny’s Bay (Lagos)'}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Buy Fuel Jerrycans, Pay NEPA Electricity Bills, Install Solar, or Tune Your Vehicle
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenBennys();
              }}
              className="p-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-left space-y-1"
            >
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                <Wrench size={15} /> Benny’s Vehicle Tuning & Refuel Bay
              </div>
              <p className="text-[11px] text-zinc-300">
                Refuel vehicle tank, rebuild engine, respray 3D metallic paint, or install Stage 3 Twin-Turbo.
              </p>
            </button>

            <button
              onClick={() => {
                if (!chargeMoney(18000)) return;
                audioEngine.playCashEarn();
                onUpdatePlayer((p) => ({
                  ...p,
                  inventory: {
                    ...p.inventory,
                    generator: true,
                    generatorFuelLitres: (p.inventory.generatorFuelLitres || 0) + 25,
                  },
                }));
                onAddNotification('NNPC Fuel Counter ⛽', 'Bought 25L Fuel Jerrycan for your Generator!', 'success');
              }}
              className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-left space-y-1"
            >
              <div className="flex items-center gap-2 text-orange-300 font-black text-xs">
                <Fuel size={15} /> Buy 25L Generator Fuel Jerrycan (₦18,000)
              </div>
              <p className="text-[11px] text-zinc-400">
                Current Home Generator Tank: {genFuel}L.
              </p>
            </button>

            <button
              onClick={() => {
                if (!chargeMoney(12000)) return;
                audioEngine.playUpNepa();
                onUpdatePlayer((p) => ({
                  ...p,
                  nepaUnitsKwh: (p.nepaUnitsKwh ?? 65) + 50,
                  nepaBillArrears: 0,
                }));
                onAddNotification('NEPA / EKEDC Office ⚡', 'Paid electricity bill & loaded +50 kWh!', 'success');
              }}
              className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-left space-y-1"
            >
              <div className="flex items-center gap-2 text-teal-300 font-black text-xs">
                <Zap size={15} /> Pay NEPA Bill & Load +50 kWh (₦12,000)
              </div>
              <p className="text-[11px] text-zinc-400">
                Current Meter Balance: {nepaUnits} kWh.
              </p>
            </button>

            <button
              onClick={() => {
                if (!chargeMoney(450000)) return;
                audioEngine.playUpNepa();
                onUpdatePlayer((p) => ({
                  ...p,
                  solarKw: Math.max(5, p.solarKw || 0),
                  inventory: { ...p.inventory, solarInverter: true },
                }));
                onAddNotification('Solar Energy Desk ☀️', '5kVA Rooftop Solar installed at your house!', 'success');
              }}
              className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-left space-y-1"
            >
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                <Sun size={15} /> Buy 5kVA Home Solar Inverter (₦450,000)
              </div>
              <p className="text-[11px] text-zinc-400">
                Powers your house 24/7 even during city grid blackouts.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 7. POLICE COMMAND & SECURITY GUARD HQ (`mrpd`) ====================
  if (buildingId === 'mrpd') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-[#090d16] border border-blue-500/40 rounded-3xl overflow-hidden shadow-2xl text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-blue-400" />
              <div>
                <h3 className="text-sm font-black uppercase">
                  {currentCity === 'abuja'
                    ? 'Louis Edet Police HQ & Aso Villa Security Command'
                    : 'Lagos State Police RRS & Halogen Security Command'}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Clock in as a Police Officer, Chief Security Guard, or Clear Active Warrants
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => {
                onClose();
                onStartMission('police');
              }}
              className="p-4 rounded-2xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-400/40 text-left space-y-1.5"
            >
              <span className="text-xs font-black text-blue-300 block">
                🚓 Clock In: Police Patrol Officer (+₦45,000/Call)
              </span>
              <p className="text-[11px] text-zinc-300">
                Spawns a Police Interceptor cruiser. Respond Code-3 to armed robberies and street disturbances.
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartMission('security');
              }}
              className="p-4 rounded-2xl bg-teal-950/50 hover:bg-teal-900/60 border border-teal-400/40 text-left space-y-1.5"
            >
              <span className="text-xs font-black text-teal-300 block">
                🛡️ Clock In: Chief Security Guard (+₦38,000/Patrol)
              </span>
              <p className="text-[11px] text-zinc-300">
                Patrol high-security perimeters (Bank HQ, Airport, Estates) and inspect security checkpoints.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 8. TECH HUB CAMPUS (`yaba`) ====================
  if (buildingId === 'yaba') {
    const devFieldPay = Math.round(85000 * equippedLaptop.payMultiplier);
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-[#090d16] border border-indigo-500/40 rounded-3xl overflow-hidden shadow-2xl text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase size={22} className="text-indigo-400" />
              <div>
                <h3 className="text-sm font-black uppercase">
                  {currentCity === 'abuja'
                    ? 'Abuja Technology Village & Ventures Park (Maitama)'
                    : 'Yaba Silicon Tech Campus — Paystack & Andela Hub'}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Equipped Rig: {equippedLaptop.name} ({equippedLaptop.payMultiplier}x Salary Bonus)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => {
                onClose();
                onStartMission('developer');
              }}
              className="p-4 rounded-2xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-400/40 text-left space-y-1.5"
            >
              <span className="text-xs font-black text-indigo-300 block">
                💻 Start 3D Cloud & Server Engineer Shift (+{formatNaira(devFieldPay)}/Node)
              </span>
              <p className="text-[11px] text-zinc-300">
                Travel between city fiber nodes and client offices deploying cloud clusters. Multiplied by your Laptop tier!
              </p>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenTechMiniGame();
              }}
              className="p-4 rounded-2xl bg-teal-950/50 hover:bg-teal-900/60 border border-teal-400/40 text-left space-y-1.5"
            >
              <span className="text-xs font-black text-teal-300 block">
                🖥️ Launch Interactive Full-Stack IDE Sprint
              </span>
              <p className="text-[11px] text-zinc-300">
                Write APIs and ship features inside the co-working studio before the investor deadline.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
