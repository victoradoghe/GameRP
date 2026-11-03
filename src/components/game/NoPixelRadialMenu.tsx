'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Package,
  Car,
  ShieldPlus,
  Camera,
  Siren,
  X,
  Shirt,
  Smile,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { Emote } from '@/lib/types';
import { SPAWN_POINTS, VEHICLES_CATALOG } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface NoPixelRadialMenuProps {
  isOpen: boolean;
  currentEmote: Emote;
  onClose: () => void;
  onSelectEmote: (emote: Emote) => void;
  onOpenPhone: () => void;
  onOpenInventory: () => void;
  onOpenCustomizer: () => void;
  onOpenHelp: () => void;
  onSpawnVehicle: (id: string) => void;
  onTeleport: (x: number, z: number, label: string) => void;
  onQuickHealArmor: () => void;
  onCycleCamera: () => void;
  onTriggerRandomEvent: () => void;
}

type WheelTab = 'main' | 'emotes' | 'vehicles' | 'travel';

const EMOTE_LIST: { id: Emote; label: string; emoji: string }[] = [
  { id: 'wave', label: 'Wave', emoji: '👋' },
  { id: 'dance', label: 'Dance', emoji: '🕺' },
  { id: 'handsup', label: 'Hands Up', emoji: '🙌' },
  { id: 'sit', label: 'Sit Down', emoji: '🧘' },
  { id: 'pushups', label: 'Push-Ups', emoji: '💪' },
  { id: 'salute', label: 'Salute', emoji: '🫡' },
  { id: 'facepalm', label: 'Facepalm', emoji: '🤦' },
  { id: 'none', label: 'Stop Emote', emoji: '⏹️' },
];

export const NoPixelRadialMenu: React.FC<NoPixelRadialMenuProps> = ({
  isOpen,
  currentEmote,
  onClose,
  onSelectEmote,
  onOpenPhone,
  onOpenInventory,
  onOpenCustomizer,
  onOpenHelp,
  onSpawnVehicle,
  onTeleport,
  onQuickHealArmor,
  onCycleCamera,
  onTriggerRandomEvent,
}) => {
  const [tab, setTab] = useState<WheelTab>('main');

  if (!isOpen) return null;

  const closeAndReset = () => {
    setTab('main');
    onClose();
  };

  const getSlices = () => {
    if (tab === 'emotes') {
      return EMOTE_LIST.map((em) => ({
        label: em.label,
        sub: currentEmote === em.id && em.id !== 'none' ? 'Active' : `/e ${em.id}`,
        icon: <span className="text-xl">{em.emoji}</span>,
        accent:
          currentEmote === em.id && em.id !== 'none'
            ? 'border-teal-400 bg-teal-500/20'
            : 'border-white/15',
        onClick: () => {
          onSelectEmote(em.id);
          closeAndReset();
        },
      }));
    }

    if (tab === 'vehicles') {
      return VEHICLES_CATALOG.map((v) => ({
        label: v.name.split(' ')[0] + ' ' + (v.name.split(' ')[1] || ''),
        sub: `${v.topSpeedKmh} KM/H`,
        icon: <Car size={20} style={{ color: v.color }} />,
        accent: 'border-white/15',
        onClick: () => {
          onSpawnVehicle(v.id);
          closeAndReset();
        },
      }));
    }

    if (tab === 'travel') {
      return SPAWN_POINTS.map((sp) => ({
        label: sp.label,
        sub: 'Fast Travel',
        icon: <span className="text-xl">{sp.icon}</span>,
        accent: 'border-white/15',
        onClick: () => {
          onTeleport(sp.x, sp.z, sp.label);
          closeAndReset();
        },
      }));
    }

    return [
      {
        label: 'Emotes',
        sub: '7 Animations',
        icon: <Smile size={20} className="text-amber-300" />,
        accent: 'border-amber-400/40',
        onClick: () => setTab('emotes'),
      },
      {
        label: 'Valet Spawn',
        sub: '5 Vehicles',
        icon: <Car size={20} className="text-pink-400" />,
        accent: 'border-pink-400/40',
        onClick: () => setTab('vehicles'),
      },
      {
        label: 'Fast Travel',
        sub: '5 Districts',
        icon: <MapPin size={20} className="text-purple-400" />,
        accent: 'border-purple-400/40',
        onClick: () => setTab('travel'),
      },
      {
        label: 'Phone',
        sub: 'Key [M]',
        icon: <Smartphone size={20} className="text-teal-400" />,
        accent: 'border-white/15',
        onClick: () => {
          closeAndReset();
          onOpenPhone();
        },
      },
      {
        label: 'Inventory',
        sub: 'Key [TAB]',
        icon: <Package size={20} className="text-sky-400" />,
        accent: 'border-white/15',
        onClick: () => {
          closeAndReset();
          onOpenInventory();
        },
      },
      {
        label: 'Wardrobe',
        sub: '3D Outfit',
        icon: <Shirt size={20} className="text-indigo-400" />,
        accent: 'border-white/15',
        onClick: () => {
          closeAndReset();
          onOpenCustomizer();
        },
      },
      {
        label: 'IFAK & Armor',
        sub: 'Patch Vitals',
        icon: <ShieldPlus size={20} className="text-emerald-400" />,
        accent: 'border-white/15',
        onClick: () => {
          closeAndReset();
          onQuickHealArmor();
        },
      },
      {
        label: 'City Event',
        sub: 'RP Encounter',
        icon: <Siren size={20} className="text-rose-400" />,
        accent: 'border-white/15',
        onClick: () => {
          closeAndReset();
          onTriggerRandomEvent();
        },
      },
    ];
  };

  const slices = getSlices();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs animate-fade-in select-none"
      onClick={closeAndReset}
    >
      <div
        className="relative w-[370px] h-[370px] sm:w-[430px] sm:h-[430px] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Outer Ring */}
        <div className="absolute w-[290px] h-[290px] rounded-full border border-teal-500/20 pointer-events-none" />

        {/* Center Hub */}
        <button
          onClick={() => {
            audioEngine.playClick();
            if (tab !== 'main') setTab('main');
            else closeAndReset();
          }}
          className="z-20 w-24 h-24 rounded-full bg-[#090d16]/95 border-2 border-teal-400/70 shadow-[0_0_40px_rgba(20,184,166,0.3)] flex flex-col items-center justify-center text-white hover:scale-105 transition-all"
        >
          <X size={18} className="text-teal-400 mb-0.5" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">
            {tab === 'main' ? 'NOPIXEL' : tab.toUpperCase()}
          </span>
          <span className="text-[9px] font-mono text-teal-400">
            {tab === 'main' ? 'CLOSE [F1]' : '← BACK'}
          </span>
        </button>

        {/* Radial Slices */}
        {slices.map((item, idx) => {
          const angle = (idx / slices.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 144;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button
              key={item.label}
              onClick={() => {
                audioEngine.playClick();
                item.onClick();
              }}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className={`absolute w-24 h-24 rounded-2xl bg-[#090d16]/92 hover:bg-zinc-800/95 border hover:border-teal-400 shadow-2xl flex flex-col items-center justify-center p-2 text-center group transition-all hover:scale-108 ${item.accent}`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-[11px] font-extrabold text-white leading-tight truncate w-full">
                {item.label}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 leading-tight truncate w-full">
                {item.sub}
              </span>
            </button>
          );
        })}

        {/* Bottom Aux Bar: Camera & Controls Help */}
        <div className="absolute -bottom-10 flex items-center gap-2">
          <button
            onClick={() => {
              audioEngine.playClick();
              onCycleCamera();
              closeAndReset();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#090d16]/90 border border-white/15 hover:border-teal-400 text-xs font-bold text-zinc-200 flex items-center gap-1.5"
          >
            <Camera size={13} className="text-teal-400" />
            <span>Toggle Camera [V]</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playClick();
              closeAndReset();
              onOpenHelp();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#090d16]/90 border border-white/15 hover:border-teal-400 text-xs font-bold text-zinc-200 flex items-center gap-1.5"
          >
            <HelpCircle size={13} className="text-amber-400" />
            <span>Controls Guide [H]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
