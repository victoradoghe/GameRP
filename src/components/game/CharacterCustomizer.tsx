'use client';

import React, { useState, useEffect } from 'react';
import { X, Shirt, Check, RotateCcw } from 'lucide-react';
import { PlayerStats, SocialClass } from '@/lib/types';
import { INITIAL_NEPO_PLAYER, INITIAL_LAPO_PLAYER } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface CharacterCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onSave: (newPlayer: PlayerStats) => void;
}

const SHIRT_COLORS = [
  { name: 'NoPixel Teal', hex: '#14B8A6' },
  { name: 'Eko Emerald', hex: '#10B981' },
  { name: 'Silicon Blue', hex: '#3B82F6' },
  { name: 'Danfo Gold', hex: '#FACC15' },
  { name: 'Quilox Neon', hex: '#EC4899' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Crisp White', hex: '#F1F5F9' },
  { name: 'Stealth Black', hex: '#18181B' },
];

const SKIN_TONES = [
  { name: 'Deep Espresso', hex: '#4A2C18' },
  { name: 'Rich Mahogany', hex: '#6E3F24' },
  { name: 'Warm Bronze', hex: '#8D5524' },
  { name: 'Golden Caramel', hex: '#C68642' },
  { name: 'Warm Sand', hex: '#E0AC69' },
  { name: 'Fair Ivory', hex: '#F1C27D' },
];

const PANTS_COLORS = [
  { name: 'Dark Denim', hex: '#1E293B' },
  { name: 'Jet Cargo', hex: '#111827' },
  { name: 'Khaki Tan', hex: '#A16207' },
  { name: 'Slate Grey', hex: '#475569' },
  { name: 'Clean Cream', hex: '#E2E8F0' },
];

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  isOpen,
  onClose,
  player,
  onSave,
}) => {
  const [name, setName] = useState(player.name);
  const [color, setColor] = useState(player.outfit.color || '#10B981');
  const [skin, setSkin] = useState(player.outfit.skin || '#6E3F24');
  const [pants, setPants] = useState(player.outfit.pants || '#1E293B');
  const [style, setStyle] = useState(player.outfit.style);
  const [hat, setHat] = useState(player.outfit.hat);

  useEffect(() => {
    if (isOpen) {
      setName(player.name);
      setColor(player.outfit.color || '#10B981');
      setSkin(player.outfit.skin || '#6E3F24');
      setPants(player.outfit.pants || '#1E293B');
      setStyle(player.outfit.style);
      setHat(player.outfit.hat);
    }
  }, [isOpen, player]);

  if (!isOpen) return null;

  const handleApplyWardrobe = () => {
    audioEngine.playCashEarn();
    onSave({
      ...player,
      name: name.trim() || player.name,
      outfit: {
        style,
        color,
        hat,
        skin,
        pants,
      },
    });
    onClose();
  };

  const handleResetArchetype = (origin: SocialClass) => {
    audioEngine.playClick();
    const preset = origin === 'nepo' ? INITIAL_NEPO_PLAYER : INITIAL_LAPO_PLAYER;
    onSave({
      ...preset,
      outfit: {
        ...preset.outfit,
        skin,
        pants,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#090d16] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="bg-zinc-900/90 border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
              <Shirt size={17} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">
                Suburban Clothing & Identity
              </h3>
              <p className="text-[10px] text-zinc-400">
                Customize your articulated 3D citizen in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Citizen Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* Skin Tone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Skin Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {SKIN_TONES.map((s) => (
                <button
                  key={s.hex}
                  onClick={() => setSkin(s.hex)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${
                    skin === s.hex ? 'border-white scale-110' : 'border-transparent opacity-85'
                  }`}
                  style={{ backgroundColor: s.hex }}
                  title={s.name}
                >
                  {skin === s.hex && <Check size={13} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Top / Jacket Color */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Top / Jacket Color
            </label>
            <div className="flex flex-wrap gap-2">
              {SHIRT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${
                    color === c.hex ? 'border-white scale-110' : 'border-white/15 opacity-85'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && (
                    <Check
                      size={13}
                      className={c.hex === '#F1F5F9' || c.hex === '#FACC15' ? 'text-black' : 'text-white'}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pants / Jeans Color */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Trousers / Denim
            </label>
            <div className="flex flex-wrap gap-2">
              {PANTS_COLORS.map((p) => (
                <button
                  key={p.hex}
                  onClick={() => setPants(p.hex)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform ${
                    pants === p.hex ? 'border-teal-400 scale-110' : 'border-white/15 opacity-85'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                >
                  {pants === p.hex && (
                    <Check size={13} className={p.hex === '#E2E8F0' ? 'text-black' : 'text-white'} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Headgear */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Headgear & Eyewear
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'none', name: 'Natural Hair' },
                { id: 'cap', name: 'Street Cap' },
                { id: 'sunglasses', name: 'Dark Shades' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHat(h.id as typeof hat)}
                  className={`py-2 px-2.5 rounded-xl border font-bold transition-all ${
                    hat === h.id
                      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          {/* Style Tag */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Style Fit
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-[11px]">
              {[
                { id: 'street', name: 'Streetwear' },
                { id: 'drip', name: 'VIP Drip' },
                { id: 'techbro', name: 'Tech Hoodie' },
                { id: 'agbada', name: 'Agbada' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id as typeof style)}
                  className={`py-1.5 rounded-xl border font-semibold ${
                    style === s.id
                      ? 'bg-zinc-800 border-white/40 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleApplyWardrobe}
            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-2.5 rounded-2xl text-xs transition-all shadow-lg"
          >
            Save Outfit & Return to City
          </button>

          {/* Optional New Character Origin Switcher */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <RotateCcw size={11} /> Start Fresh Character Backstory (Resets Bank/Cash)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleResetArchetype('lapo')}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-emerald-950/50 border border-zinc-800 hover:border-emerald-500/40 text-left"
              >
                <span className="text-[11px] font-bold text-emerald-300 block">
                  Street Grinder
                </span>
                <span className="text-[10px] text-zinc-400">₦85k Cash • Work your way up</span>
              </button>
              <button
                onClick={() => handleResetArchetype('nepo')}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-sky-950/50 border border-zinc-800 hover:border-sky-500/40 text-left"
              >
                <span className="text-[11px] font-bold text-sky-300 block">
                  VI Trust-Fund Mogul
                </span>
                <span className="text-[10px] text-zinc-400">₦4.5M Cash • Duplex & G-Wagon</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
