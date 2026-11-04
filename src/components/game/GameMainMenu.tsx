'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  UserPlus,
  Settings,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  Shield,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  HardDrive,
  CheckCircle2,
  Tv,
  ChevronRight,
  Radio,
  FileText,
  Users,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { PlayerStats, Vitals, GraphicsSettings, AutoSaveData } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

interface GameMainMenuProps {
  isOpen: boolean;
  player: PlayerStats;
  vitals: Vitals;
  lastSavedAt: number | null;
  hasSavedGame: boolean;
  graphicsSettings: GraphicsSettings;
  isAudioMuted: boolean;
  masterVolume: number;
  onResumeGame: () => void;
  onOpenCharacterCreator: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onResetGame: () => void;
  onToggleAudioMute: () => void;
  onChangeMasterVolume?: (vol: number) => void;
}

export const GameMainMenu: React.FC<GameMainMenuProps> = ({
  isOpen,
  player,
  vitals,
  lastSavedAt,
  hasSavedGame,
  graphicsSettings,
  isAudioMuted,
  masterVolume,
  onResumeGame,
  onOpenCharacterCreator,
  onOpenSettings,
  onOpenHelp,
  onResetGame,
  onToggleAudioMute,
  onChangeMasterVolume,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'load_slots' | 'about'>('menu');
  const [confirmReset, setConfirmReset] = useState(false);
  const [systemTime, setSystemTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setSystemTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const formattedSavedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Never (New Session)';

  const genderLabel =
    player.gender === 'female'
      ? 'Female ♀'
      : player.gender === 'male'
      ? 'Male ♂'
      : player.gender === 'nonbinary' || player.gender === 'non-binary'
      ? 'Non-Binary ⚧'
      : 'Citizen';

  const ageLabel = player.age ? `${player.age} Years Old` : '26 Years Old';

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 text-white flex flex-col justify-between p-4 sm:p-8 md:p-12 select-none backdrop-blur-xl overflow-y-auto animate-fade-in font-sans">
      {/* Animated Lagos Noir / Neon Atmosphere Backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-amber-500/25 border border-amber-300/40">
            ★V
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.25em] text-white">
                NoPixel <span className="text-amber-400">Lagos &amp; Abuja</span>
              </h1>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase">
                RP V2.4
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono tracking-wider mt-0.5 flex items-center gap-2">
              <span>Next-Gen 3D Open World Roleplay</span>
              <span>•</span>
              <span className="text-amber-400/90">Eko Atlantic &amp; FCT Simulation</span>
            </p>
          </div>
        </div>

        {/* Server & Audio Status Badges */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              EKO-01 (64/64)
            </span>
            <span className="text-zinc-600">|</span>
            <span>PING: 14ms</span>
            <span className="text-zinc-600">|</span>
            <span>{systemTime || '12:00:00'}</span>
          </div>

          <button
            onClick={onToggleAudioMute}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-mono font-bold ${
              isAudioMuted
                ? 'bg-red-950/40 border-red-700/50 text-red-300 hover:bg-red-900/50'
                : 'bg-zinc-900/80 border-zinc-700 hover:border-amber-400 text-zinc-300'
            }`}
            title={isAudioMuted ? 'Unmute Game Audio' : 'Mute Game Audio'}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">{isAudioMuted ? 'Muted' : `${masterVolume}%`}</span>
          </button>
        </div>
      </header>

      {/* Main Center Content Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8 max-w-7xl w-full mx-auto items-center">
        {/* Navigation Buttons (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-amber-400/90 font-bold mb-2">
            <span>• Citizen Main Operations</span>
            <span className="text-zinc-500 font-normal">Select an option to begin</span>
          </div>

          {/* Primary Action: Resume Game */}
          <button
            onClick={() => {
              audioEngine.playVehicleIgnition();
              onResumeGame();
            }}
            className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black uppercase tracking-wider text-base sm:text-lg flex items-center justify-between transition-all transform hover:scale-[1.01] shadow-2xl shadow-amber-500/25 group border border-amber-300/60"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-black/20 flex items-center justify-center font-mono text-base font-black shadow-inner">
                <Play size={22} fill="currentColor" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span>Enter City / Continue Story</span>
                  {hasSavedGame && (
                    <span className="text-[10px] bg-black/20 text-black px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                      Saved Progress
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-black/80 normal-case mt-0.5">
                  Spawn with {player.name} in {player.activeCity === 'abuja' ? 'Abuja Central' : 'Lagos Island Marina'}
                </div>
              </div>
            </div>
            <span className="text-2xl group-hover:translate-x-1.5 transition-transform shrink-0 font-bold">
              →
            </span>
          </button>

          {/* Character Creation Studio Button */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onOpenCharacterCreator();
            }}
            className="w-full text-left p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/95 border border-zinc-700/80 hover:border-teal-400/70 text-white font-bold uppercase tracking-wider text-sm sm:text-base flex items-center justify-between transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-white group-hover:text-teal-300 transition-colors">
                  <span>Character Creation Studio</span>
                  <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 rounded font-mono">
                    3D Anatomical Rig
                  </span>
                </div>
                <div className="text-xs font-normal text-zinc-400 normal-case mt-0.5">
                  Customize gender, age (18-75), Melanin skin tones, hairstyles, Agbada &amp; Senator attire
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Auto-Save & Save Slots Button */}
          <button
            onClick={() => {
              audioEngine.playClick();
              setActiveTab((prev) => (prev === 'load_slots' ? 'menu' : 'load_slots'));
            }}
            className="w-full text-left p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/95 border border-zinc-700/80 hover:border-emerald-400/70 text-white font-bold uppercase tracking-wider text-sm sm:text-base flex items-center justify-between transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HardDrive size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-white group-hover:text-emerald-300 transition-colors">
                  <span>Auto-Save &amp; Game State Slots</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono">
                    Cloud &amp; Local
                  </span>
                </div>
                <div className="text-xs font-normal text-zinc-400 normal-case mt-0.5">
                  Auto-saves every 25s &amp; key events • Last saved: {formattedSavedTime}
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Settings & Resolution Scaler */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onOpenSettings();
            }}
            className="w-full text-left p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/95 border border-zinc-700/80 hover:border-amber-400/70 text-white font-bold uppercase tracking-wider text-sm sm:text-base flex items-center justify-between transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Settings size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-white group-hover:text-amber-300 transition-colors">
                  <span>Settings &amp; Resolution Scaler</span>
                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
                    GTA IV/V
                  </span>
                </div>
                <div className="text-xs font-normal text-zinc-400 normal-case mt-0.5">
                  Resolution Scale ({Math.round((graphicsSettings.resolutionScale || 1) * 100)}%), graphics, audio, keybinds
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Roleplay Guide & Controls */}
          <button
            onClick={() => {
              audioEngine.playClick();
              onOpenHelp();
            }}
            className="w-full text-left p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/95 border border-zinc-700/80 hover:border-cyan-400/70 text-white font-bold uppercase tracking-wider text-sm sm:text-base flex items-center justify-between transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-white group-hover:text-cyan-300 transition-colors">
                  <span>Roleplay Handbook &amp; Controls</span>
                </div>
                <div className="text-xs font-normal text-zinc-400 normal-case mt-0.5">
                  Flight simulator, mobile apps (Twatter, Fleeca Bank), jobs, police &amp; heist rules
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Reset Progress / Start Fresh Citizen */}
          <div className="pt-2">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full text-left p-3 rounded-xl bg-red-950/30 hover:bg-red-900/30 border border-red-800/40 hover:border-red-600/60 text-red-300 font-semibold uppercase tracking-wider text-xs flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-900/30 flex items-center justify-center text-red-400">
                    <RotateCcw size={14} />
                  </div>
                  <div>
                    <span>Reset Character / Start Fresh Citizen</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-red-400">Clear Save</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-600/70 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2 text-red-200 text-xs font-bold">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>Are you sure? All character stats and progress will be reset.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      audioEngine.playVehicleIgnition();
                      onResetGame();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Dossier & Auto-Save Status Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Holographic Resident ID Card */}
          <div className="bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold">
                  Federal Republic of Nigeria
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded">
                VALID CITIZEN
              </span>
            </div>

            {/* Profile Avatar & Names */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-teal-500/20 border-2 border-amber-400/60 flex items-center justify-center text-3xl shadow-inner shrink-0">
                {player.gender === 'female' ? '👩🏾' : '👨🏾'}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-black text-white truncate">{player.name}</h3>
                <div className="text-xs font-mono text-amber-300 uppercase tracking-wide flex items-center gap-2 mt-0.5">
                  <span>{player.job || 'Freelance Hustler'}</span>
                  <span>•</span>
                  <span>{genderLabel}</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Age: {ageLabel} • ID: #{player.id || 'NIG-7734'}
                </div>
              </div>
            </div>

            {/* Financial & World Telemetry */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                  <span>Cash On Hand</span>
                  <span>💵</span>
                </div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  ₦{player.cash.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                  <span>Fleeca Bank</span>
                  <span>🏦</span>
                </div>
                <div className="text-base font-black text-cyan-400 font-mono mt-0.5">
                  ₦{player.bankBalance.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                  <span>Street Credibility</span>
                  <span>🔥</span>
                </div>
                <div className="text-base font-black text-purple-400 font-mono mt-0.5">
                  {vitals.streetCred} / 100
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
                <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                  <span>Current Territory</span>
                  <span>📍</span>
                </div>
                <div className="text-sm font-black text-amber-400 font-mono mt-0.5 uppercase truncate">
                  {player.activeCity === 'abuja' ? 'Abuja Central' : 'Lagos Marina'}
                </div>
              </div>
            </div>

            {/* Auto-Save Status Banner */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div className="text-[11px] font-mono text-emerald-300">
                <span className="font-bold">Auto-Save Protection:</span> Active. Automatically saves all
                finances, vehicle purchases, inventory &amp; appearance every 25 seconds.
              </div>
            </div>
          </div>

          {/* Quick Feature Highlights Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-400" />
              <span>Version 2.4 New Features</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-zinc-400 list-disc list-inside">
              <li>
                <span className="text-zinc-200">High-Fidelity 3D Melanin Models:</span> Realistic anatomical proportions, traditional Agbada and Senator attire.
              </li>
              <li>
                <span className="text-zinc-200">Aviation &amp; Airplanes:</span> Fly jets, helicopters, and view dynamic air traffic above Eko sky.
              </li>
              <li>
                <span className="text-zinc-200">Modern EkoPhone:</span> Twatter with live loading screen, P2P money transfers, crypto, and music.
              </li>
              <li>
                <span className="text-zinc-200">Resolution Scaler:</span> 50% to 150% dynamic rendering scale in Settings.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Bottom Footer Info */}
      <footer className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800/80 pt-4 text-xs font-mono text-zinc-500 gap-2 shrink-0">
        <div>Grand Theft Auto IV / V System UI • Powered by Three.js WebGL2 Engine</div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>Resolution: {Math.round((graphicsSettings.resolutionScale || 1) * 100)}%</span>
          <span>•</span>
          <span>Audio: {isAudioMuted ? 'Muted' : `${masterVolume}%`}</span>
          <span>•</span>
          <span>Keybinds: [ESC] Menu • [P] Phone • [TAB] Inventory</span>
        </div>
      </footer>
    </div>
  );
};
