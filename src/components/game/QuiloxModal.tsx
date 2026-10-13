'use client';

import React, { useState } from 'react';
import { X, Sparkles, Wine, Music2, Star, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '@/lib/audioEngine';

interface QuiloxModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCash: number;
  streetCred: number;
  onParty: (cost: number, credGained: number, stressRelief: number) => void;
}

export const QuiloxModal: React.FC<QuiloxModalProps> = ({
  isOpen,
  onClose,
  playerCash,
  streetCred,
  onParty,
}) => {
  const [danceTaps, setDanceTaps] = useState(0);
  const [activeTab, setActiveTab] = useState<'lounge' | 'bottles' | 'dancefloor'>('lounge');

  if (!isOpen) return null;

  const handlePopBottle = (name: string, price: number, cred: number) => {
    if (playerCash < price) {
      alert('Bouncer says: "Oga, your card declined! Go to the regular section."');
      return;
    }
    audioEngine.playCashEarn();
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });
    onParty(price, cred, 50);
  };

  const handleDanceTap = () => {
    audioEngine.playDrumBeat('kick');
    setDanceTaps((prev) => {
      const next = prev + 1;
      if (next % 10 === 0) {
        confetti({ particleCount: 40, spread: 60 });
        onParty(0, 5, 20);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-purple-500 rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Banner with Neon Lighting */}
        <div className="bg-gradient-to-r from-purple-950 via-zinc-900 to-pink-950 px-6 py-4 flex justify-between items-center border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🍾</span>
            <div>
              <h3 className="font-extrabold text-base tracking-wider text-purple-300">CLUB QUILOX (VI)</h3>
              <p className="text-[11px] text-pink-300">Exclusive VIP Lounge & Nightlife</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 bg-zinc-900/80 border-b border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('lounge')}
            className={`py-2.5 font-bold transition-all ${
              activeTab === 'lounge' ? 'border-b-2 border-purple-400 text-purple-300' : 'text-zinc-400'
            }`}
          >
            VIP Lounge
          </button>
          <button
            onClick={() => setActiveTab('bottles')}
            className={`py-2.5 font-bold transition-all ${
              activeTab === 'bottles' ? 'border-b-2 border-purple-400 text-purple-300' : 'text-zinc-400'
            }`}
          >
            Order Bottles
          </button>
          <button
            onClick={() => setActiveTab('dancefloor')}
            className={`py-2.5 font-bold transition-all ${
              activeTab === 'dancefloor' ? 'border-b-2 border-purple-400 text-purple-300' : 'text-zinc-400'
            }`}
          >
            Dance Floor
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          
          {activeTab === 'lounge' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase">
                  <Star size={16} /> Lagos High Society
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  You are rubbing shoulders with music executives, tech founders, and diaspora returnees.
                  Popping expensive bottles triggers sparklers carried across the club and boosts your Street Cred instantly.
                </p>
                <div className="pt-2 flex justify-between text-xs text-zinc-400 border-t border-purple-500/20">
                  <span>Current Street Cred: <strong className="text-white">{streetCred}/100</strong></span>
                  <span>Cash: <strong className="text-danfo-yellow">₦{playerCash.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePopBottle('Cocktails', 25000, 8)}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 text-left transition-all space-y-1"
                >
                  <span className="text-base">🍸</span>
                  <h5 className="font-bold text-xs">Signature Cocktails</h5>
                  <p className="text-[10px] text-zinc-400">₦25,000 • +8 Cred</p>
                </button>

                <button
                  onClick={() => handlePopBottle('Shisha & Suya', 35000, 12)}
                  className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 text-left transition-all space-y-1"
                >
                  <span className="text-base">💨</span>
                  <h5 className="font-bold text-xs">Exotic Shisha & Beef Suya</h5>
                  <p className="text-[10px] text-zinc-400">₦35,000 • +12 Cred</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'bottles' && (
            <div className="space-y-3">
              {[
                { name: 'Moët & Chandon Brut', price: 95000, cred: 20, icon: '🥂' },
                { name: 'Dom Pérignon Luminous', price: 280000, cred: 45, icon: '✨' },
                { name: 'Ace of Spades (Armand de Brignac)', price: 650000, cred: 90, icon: '♠️' },
              ].map((b) => (
                <div
                  key={b.name}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{b.icon}</span>
                    <div>
                      <h5 className="font-bold text-xs text-white">{b.name}</h5>
                      <p className="text-[10px] text-purple-300">Sparkler procession + {b.cred} Cred</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePopBottle(b.name, b.price, b.cred)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition-all shadow"
                  >
                    Pop ₦{b.price.toLocaleString()}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dancefloor' && (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-3xl animate-bounce">💃🕺</span>
                <h4 className="font-bold text-sm text-pink-400">Afrobeats Shaku Shaku & Gbese!</h4>
                <p className="text-xs text-zinc-400">
                  Tap to the beat! Every 10 taps burns stress and earns free Street Cred.
                </p>
                <div className="pt-2 font-mono text-xs text-purple-300">
                  Dance Moves Made: <strong>{danceTaps}</strong>
                </div>
              </div>

              <button
                onClick={handleDanceTap}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-xl shadow-purple-600/30"
              >
                🔥 Gbese! (Tap To Dance)
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
