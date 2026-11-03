'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, DollarSign, HeartHandshake, Skull } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';

interface PedInteractionModalProps {
  pedName: string | null;
  onClose: () => void;
  playerCash: number;
  streetCred: number;
  onOutcome: (fx: {
    cashDelta?: number;
    credDelta?: number;
    stressDelta?: number;
    healthDelta?: number;
    crime?: string;
    message: string;
  }) => void;
}

const STREET_GREETINGS = [
  '“How far boss! This Eko heat no be here oh, wetin dey sup?”',
  '“Yo! Have you heard the new Afrobeats track playing at Quilox tonight?”',
  '“Careful around Broad Street oh, Eko PD interceptors have been patrolling heavy today.”',
  '“Omo, if you have a fast car, the Midnight Street Circuit is paying ₦150k per run!”',
  '“I’m heading to Amala Shitta for lunch. Nothing beats hot Amala and Ewedu!”',
];

export const PedInteractionModal: React.FC<PedInteractionModalProps> = ({
  pedName,
  onClose,
  playerCash,
  streetCred,
  onOutcome,
}) => {
  const [reply, setReply] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>(STREET_GREETINGS[0]);

  useEffect(() => {
    if (pedName) {
      setReply(null);
      setGreeting(STREET_GREETINGS[Math.floor(Math.random() * STREET_GREETINGS.length)]);
    }
  }, [pedName]);

  if (!pedName) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#090d16] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 block">
              CITIZEN INTERACTION
            </span>
            <h3 className="text-sm font-black text-white">{pedName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 italic text-zinc-200 leading-relaxed">
            {reply || greeting}
          </div>

          {!reply ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  audioEngine.playClick();
                  const tip = Math.random() > 0.5 ? 3000 : 0;
                  const msg = tip
                    ? '“Respect! Take this ₦3,000 for cold drink, stay blessed!” (+3 Cred, -10 Stress)'
                    : '“Real recognize real! Keep grinding out here in Eko.” (+3 Cred, -10 Stress)';
                  setReply(msg);
                  onOutcome({
                    cashDelta: tip,
                    credDelta: 3,
                    stressDelta: -10,
                    message: `Chatted with ${pedName}`,
                  });
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-teal-950/60 border border-white/10 hover:border-teal-400 text-left flex items-center gap-3 transition-all"
              >
                <MessageCircle size={16} className="text-teal-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Chat & Ask for Street Intel</span>
                  <span className="text-[10px] text-zinc-400">Friendly conversation (+Cred, -Stress)</span>
                </div>
              </button>

              <button
                onClick={() => {
                  audioEngine.playCashEarn();
                  const payout = 8000 + Math.round(streetCred * 180);
                  setReply(
                    `“Yo this is fire!! Let me buy a VIP copy right now — just transferred ₦${payout.toLocaleString()} to you!”`
                  );
                  onOutcome({
                    cashDelta: payout,
                    credDelta: 4,
                    message: `Sold mixtape/merch to ${pedName} for ₦${payout.toLocaleString()}!`,
                  });
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-emerald-950/60 border border-white/10 hover:border-emerald-400 text-left flex items-center gap-3 transition-all"
              >
                <DollarSign size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    Pitch Your Mixtape / Street Merch
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Scales with Street Cred (Est. +₦{(8000 + Math.round(streetCred * 180)).toLocaleString()})
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  if (playerCash < 2000) {
                    setReply('“Ah boss, your pocket dry oh! No wahala, next time.”');
                    return;
                  }
                  audioEngine.playUpNepa();
                  setReply(
                    '“Omo thank you so much!! May your bank account never run dry in this city!” (+8 Cred, -18 Stress)'
                  );
                  onOutcome({
                    cashDelta: -2000,
                    credDelta: 8,
                    stressDelta: -18,
                    message: `Blessed ${pedName} with ₦2,000 (+8 Street Cred)!`,
                  });
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-amber-950/60 border border-white/10 hover:border-amber-400 text-left flex items-center gap-3 transition-all"
              >
                <HeartHandshake size={16} className="text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    Show Love (Give ₦2,000 Cash)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Boosts reputation across the neighborhood (+8 Cred)
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  const success = Math.random() < 0.65;
                  if (success) {
                    const loot = 15000 + Math.floor(Math.random() * 25000);
                    audioEngine.playCashEarn();
                    setReply(
                      `“Hey!! Wait—my wallet!!” You slipped away with ₦${loot.toLocaleString()} cash!`
                    );
                    onOutcome({
                      cashDelta: loot,
                      credDelta: 2,
                      stressDelta: 8,
                      crime: Math.random() < 0.45 ? 'Street robbery reported' : undefined,
                      message: `Pickpocketed ₦${loot.toLocaleString()} from ${pedName}!`,
                    });
                  } else {
                    audioEngine.playDispatchAlert();
                    setReply(
                      '“THIEF!! 911 HELP!!” They fought back and alerted Eko PD Dispatch!'
                    );
                    onOutcome({
                      healthDelta: -12,
                      stressDelta: 12,
                      crime: `Attempted mugging on ${pedName}`,
                      message: `${pedName} fought back and called 911!`,
                    });
                  }
                }}
                className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-rose-950/70 border border-rose-500/30 hover:border-rose-500 text-left flex items-center gap-3 transition-all"
              >
                <Skull size={16} className="text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold text-rose-300 block">
                    Pickpocket / Mug Citizen (Risky)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    65% chance for ₦15k–₦40k cash • Risk of 911 Police dispatch
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-black text-xs"
            >
              Continue Walking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
