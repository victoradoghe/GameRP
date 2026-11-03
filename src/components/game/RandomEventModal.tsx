'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { RandomLifeEvent } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

interface RandomEventModalProps {
  event: RandomLifeEvent | null;
  onClose: () => void;
  onSelectChoice: (choice: RandomLifeEvent['choices'][0]) => void;
}

export const RandomEventModal: React.FC<RandomEventModalProps> = ({
  event,
  onClose,
  onSelectChoice,
}) => {
  const [resolvedOutcome, setResolvedOutcome] = useState<string | null>(null);

  if (!event) return null;

  const handlePick = (c: RandomLifeEvent['choices'][0]) => {
    audioEngine.playClick();
    setResolvedOutcome(c.outcomeText);
    onSelectChoice(c);
  };

  const handleDismiss = () => {
    setResolvedOutcome(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-zinc-950 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden text-white">
        {/* Top Banner */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/20 to-zinc-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              LIVE RP ENCOUNTER // {event.category.toUpperCase()}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center text-3xl shrink-0">
              {event.icon}
            </div>
            <h3 className="text-base font-extrabold text-white leading-snug">
              {event.title}
            </h3>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3.5 rounded-2xl border border-white/10">
            {event.description}
          </p>

          {!resolvedOutcome ? (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                Choose Your Roleplay Action:
              </span>
              {event.choices.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePick(c)}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-700 hover:border-amber-300 text-xs font-bold text-left transition-all active:scale-98"
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed">
                <strong className="block text-emerald-400 mb-1 uppercase text-[10px]">
                  Outcome:
                </strong>
                {resolvedOutcome}
              </div>
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
              >
                CONTINUE ROLEPLAY
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
