'use client';

import React, { useState } from 'react';
import { X, Sparkles, User, ShieldCheck, Check } from 'lucide-react';
import { PlayerStats, SocialClass } from '@/lib/types';
import { INITIAL_NEPO_PLAYER, INITIAL_LAPO_PLAYER } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface CharacterCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onSave: (newPlayer: PlayerStats) => void;
}

const OUTFIT_COLORS = [
  { name: 'Danfo Yellow', hex: '#FACC15' },
  { name: 'Lagos Emerald', hex: '#10B981' },
  { name: 'Silicon Blue', hex: '#3B82F6' },
  { name: 'Quilox Purple', hex: '#A855F7' },
  { name: 'Sunset Orange', hex: '#F97316' },
  { name: 'Midnight Charcoal', hex: '#27272A' },
];

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  isOpen,
  onClose,
  player,
  onSave,
}) => {
  const [selectedOrigin, setSelectedOrigin] = useState<SocialClass>(player.origin);
  const [name, setName] = useState(player.name);
  const [color, setColor] = useState(player.outfit.color);
  const [style, setStyle] = useState(player.outfit.style);
  const [hat, setHat] = useState(player.outfit.hat);

  if (!isOpen) return null;

  const handleSelectOrigin = (origin: SocialClass) => {
    setSelectedOrigin(origin);
    if (origin === 'nepo') {
      setName(INITIAL_NEPO_PLAYER.name);
      setColor(INITIAL_NEPO_PLAYER.outfit.color);
      setStyle('drip');
      setHat('sunglasses');
    } else {
      setName(INITIAL_LAPO_PLAYER.name);
      setColor(INITIAL_LAPO_PLAYER.outfit.color);
      setStyle('street');
      setHat('cap');
    }
  };

  const handleSave = () => {
    audioEngine.playCashEarn();
    const base = selectedOrigin === 'nepo' ? { ...INITIAL_NEPO_PLAYER } : { ...INITIAL_LAPO_PLAYER };
    const updated: PlayerStats = {
      ...base,
      name,
      outfit: {
        style,
        color,
        hat,
      },
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-danfo-yellow rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="bg-danfo-yellow text-black px-6 py-4 flex justify-between items-center font-black">
          <div className="flex items-center gap-2">
            <User size={22} />
            <h3 className="text-base tracking-wider uppercase">Character Creation & Wardrobe</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20 text-black">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Social Origin Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400">1. Choose Your Lagos Origin</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSelectOrigin('nepo')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedOrigin === 'nepo'
                    ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-300">NEPO BABY</span>
                  {selectedOrigin === 'nepo' && <Check size={14} className="text-blue-400" />}
                </div>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Start with ₦4,500,000 cash, Lekki duplex, inverter & high social status.
                </p>
              </button>

              <button
                onClick={() => handleSelectOrigin('lapo')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedOrigin === 'lapo'
                    ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-300">LAPO HUSTLER</span>
                  {selectedOrigin === 'lapo' && <Check size={14} className="text-emerald-400" />}
                </div>
                <p className="text-[11px] text-zinc-300 mt-1">
                  Start with ₦3,500, a microfinance loan, squatter room & hunger to succeed.
                </p>
              </button>
            </div>
          </div>

          {/* Character Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">2. Avatar Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-danfo-yellow"
            />
          </div>

          {/* Outfit Palette */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400">3. 3D Avatar Fabric Color</label>
            <div className="flex flex-wrap gap-2.5">
              {OUTFIT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    color === c.hex ? 'ring-4 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && <Check size={14} className="text-black" />}
                </button>
              ))}
            </div>
          </div>

          {/* Style & Fashion */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400">4. Fashion Vibe</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'drip', name: 'Alte Street Drip' },
                { id: 'senator', name: 'White Senator Wear' },
                { id: 'agbada', name: 'Celebrity Agbada' },
                { id: 'techbro', name: 'Tech Bro Hoodie' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id as typeof style)}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                    style === s.id
                      ? 'bg-zinc-800 border-danfo-yellow text-danfo-yellow'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accessories */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400">5. Headgear / Accessories</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'sunglasses', name: 'Dark Shades 🕶️' },
                { id: 'cap', name: 'Fila / Cap 🧢' },
                { id: 'none', name: 'Natural Hair 🧑' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHat(h.id as typeof hat)}
                  className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                    hat === h.id
                      ? 'bg-zinc-800 border-danfo-yellow text-danfo-yellow'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleSave}
            className="w-full bg-danfo-yellow hover:bg-yellow-400 text-black font-black py-3 rounded-2xl text-sm active:scale-95 transition-all shadow-lg"
          >
            Spawn Into Lagos World
          </button>
        </div>

      </div>
    </div>
  );
};
