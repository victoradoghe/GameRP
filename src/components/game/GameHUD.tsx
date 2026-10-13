'use client';

import React from 'react';
import {
  Smartphone,
  MapPin,
  User,
  Volume2,
  VolumeX,
  Music,
  Zap,
  HelpCircle,
  Heart,
  Battery,
  Flame,
  Award,
} from 'lucide-react';
import { PlayerStats, Vitals, LagosDistrict } from '@/lib/types';
import { DISTRICTS } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface GameHUDProps {
  player: PlayerStats;
  vitals: Vitals;
  timeHour: number;
  isNightTime: boolean;
  isNepaActive: boolean;
  currentDistrict: LagosDistrict;
  isAudioMuted: boolean;
  isPlayingMusic: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenPhone: () => void;
  onOpenCustomizer: () => void;
  onOpenHelp: () => void;
  onSelectDistrict: (district: LagosDistrict) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  vitals,
  timeHour,
  isNightTime,
  isNepaActive,
  currentDistrict,
  isAudioMuted,
  isPlayingMusic,
  onToggleMute,
  onToggleMusic,
  onOpenPhone,
  onOpenCustomizer,
  onOpenHelp,
  onSelectDistrict,
}) => {
  const formatNaira = (val: number) => {
    return '₦' + val.toLocaleString('en-NG');
  };

  const getDistrictName = () => {
    return DISTRICTS.find((d) => d.id === currentDistrict)?.name || 'Lagos Metropolis';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 w-full">
        
        {/* Left: District & Clock & NEPA status */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* District Pill */}
          <div className="bg-black/75 backdrop-blur-md border border-zinc-700/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg text-white">
            <span className="text-danfo-yellow font-extrabold text-sm">LAGOS LIFE 3D</span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs font-semibold text-zinc-300">{getDistrictName()}</span>
          </div>

          {/* Time & Weather Pill */}
          <div className="bg-black/75 backdrop-blur-md border border-zinc-700/80 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg text-white text-xs">
            <span>{isNightTime ? '🌙 22:30 WAT' : '☀️ 14:15 WAT'}</span>
            <span className="text-zinc-500">•</span>
            <span className={isNightTime ? 'text-purple-300' : 'text-amber-300 font-semibold'}>
              {isNightTime ? 'Neon Nightlife' : 'Harmattan Gold'}
            </span>
          </div>

          {/* NEPA Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold border shadow-lg ${
              isNepaActive
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
            }`}
          >
            <Zap size={14} />
            <span>{isNepaActive ? 'Up NEPA! ⚡' : 'Blackout 🕯️'}</span>
          </div>
        </div>

        {/* Right: Audio Controls & Player Profile Quick Actions */}
        <div className="pointer-events-auto flex items-center gap-2 self-end sm:self-auto">
          {/* Audio Synthesizer Beat Button */}
          <button
            onClick={onToggleMusic}
            className={`p-2 rounded-2xl backdrop-blur-md border transition-all shadow-lg flex items-center gap-1.5 text-xs font-bold ${
              isPlayingMusic
                ? 'bg-purple-600/90 border-purple-400 text-white animate-pulse'
                : 'bg-black/75 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Toggle Synthesized Afrobeats Groove"
          >
            <Music size={15} />
            <span className="hidden md:inline">{isPlayingMusic ? 'Beat ON' : 'Play Beat'}</span>
          </button>

          {/* Sound Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-2xl bg-black/75 backdrop-blur-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all shadow-lg"
            title="Mute Sound Effects"
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Wardrobe / Background */}
          <button
            onClick={onOpenCustomizer}
            className="p-2 rounded-2xl bg-black/75 backdrop-blur-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all shadow-lg flex items-center gap-1 text-xs"
            title="Character Creation & Wardrobe"
          >
            <User size={16} />
            <span className="hidden md:inline">Wardrobe</span>
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-2xl bg-black/75 backdrop-blur-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all shadow-lg"
            title="How to Play"
          >
            <HelpCircle size={16} />
          </button>

          {/* Open EkoPhone Main Button */}
          <button
            onClick={onOpenPhone}
            className="bg-danfo-yellow hover:bg-yellow-400 text-black font-extrabold px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs active:scale-95 transition-all"
          >
            <Smartphone size={16} />
            <span>EkoPhone</span>
          </button>
        </div>
      </div>

      {/* TOP SECOND ROW: VITALS & FINANCES BAR */}
      <div className="pointer-events-auto self-start bg-black/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-3 shadow-2xl flex flex-wrap items-center gap-4 text-white max-w-full">
        {/* Cash & Bank */}
        <div className="flex items-center gap-3 pr-3 border-r border-zinc-700/60">
          <div>
            <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Pocket Cash</span>
            <span className="text-sm font-extrabold text-danfo-yellow">{formatNaira(player.cash)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Kuda Bank</span>
            <span className="text-sm font-extrabold text-emerald-400">{formatNaira(player.bankBalance)}</span>
          </div>
        </div>

        {/* Vitals Meters */}
        <div className="flex items-center gap-4 text-xs">
          {/* Hunger */}
          <div className="flex items-center gap-1.5" title="Hunger Level (Chop Amala to restore)">
            <Heart size={14} className="text-rose-400" />
            <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${vitals.hunger}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-300">{vitals.hunger}%</span>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-1.5" title="Energy Level (Needed for jobs)">
            <Battery size={14} className="text-yellow-400" />
            <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${vitals.energy}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-300">{vitals.energy}%</span>
          </div>

          {/* Street Cred */}
          <div className="flex items-center gap-1.5" title="Street Credibility (Unlocks elite careers & VIP clubs)">
            <Award size={14} className="text-purple-400" />
            <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${vitals.streetCred}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-300">{vitals.streetCred}%</span>
          </div>

          {/* Stress */}
          <div className="flex items-center gap-1.5" title="Stress (Dance at Quilox or eat to reduce)">
            <Flame size={14} className="text-orange-400" />
            <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${vitals.stress}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-300">{vitals.stress}%</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: FAST TRAVEL DISTRICT DOCK */}
      <div className="pointer-events-auto self-center flex items-center gap-1.5 bg-black/85 backdrop-blur-md border border-zinc-800 p-1.5 rounded-full shadow-2xl max-w-full overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-zinc-400 px-3 uppercase tracking-wider hidden sm:inline">
          Fast Travel:
        </span>
        {DISTRICTS.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              audioEngine.playClick();
              onSelectDistrict(d.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              currentDistrict === d.id
                ? 'bg-danfo-yellow text-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {d.name.split(' ')[0]} {d.id === 'shitta' ? '🍲' : d.id === 'quilox' ? '🍾' : d.id === 'yaba' ? '💻' : '🌴'}
          </button>
        ))}
      </div>

    </div>
  );
};
