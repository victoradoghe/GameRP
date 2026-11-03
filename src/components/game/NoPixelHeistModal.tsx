'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, CheckCircle2, Flame, X } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';

interface NoPixelHeistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cashReward: number, cryptoReward: number) => void;
  onFail: () => void;
}

export const NoPixelHeistModal: React.FC<NoPixelHeistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFail,
}) => {
  const [phase, setPhase] = useState<'ready' | 'memorize' | 'input' | 'won' | 'lost'>('ready');
  const [targetNodes, setTargetNodes] = useState<number[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(12);

  const startHack = () => {
    audioEngine.playHackBeep(true);
    // Pick 6 unique nodes in a 16-tile (4x4) security matrix
    const nodes = new Set<number>();
    while (nodes.size < 6) {
      nodes.add(Math.floor(Math.random() * 16));
    }
    setTargetNodes(Array.from(nodes));
    setSelectedNodes([]);
    setMistakes(0);
    setTimeLeft(12);
    setPhase('memorize');

    setTimeout(() => {
      setPhase('input');
    }, 2400);
  };

  useEffect(() => {
    if (!isOpen) {
      setPhase('ready');
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'input') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('lost');
          audioEngine.playHackBeep(false);
          onFail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, onFail]);

  if (!isOpen) return null;

  const handleTileClick = (idx: number) => {
    if (phase !== 'input') return;
    if (selectedNodes.includes(idx)) return;

    const nextSelected = [...selectedNodes, idx];
    setSelectedNodes(nextSelected);

    if (targetNodes.includes(idx)) {
      audioEngine.playHackBeep(true);
      const correctCount = nextSelected.filter((n) => targetNodes.includes(n)).length;
      if (correctCount === targetNodes.length) {
        setPhase('won');
        audioEngine.playCashEarn();
      }
    } else {
      audioEngine.playHackBeep(false);
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= 3) {
        setPhase('lost');
        onFail();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-zinc-950 border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden text-white">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-emerald-400" />
            <span className="text-xs font-mono font-black tracking-wider text-emerald-400">
              FLEECA_VAULT_THERMITE_v4.0.exe
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-center">
          {phase === 'ready' && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <Flame size={32} />
              </div>
              <h3 className="text-lg font-black text-white">
                Breach Fleeca Reserve Vault
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Memorize the <strong className="text-emerald-400">6 glowing security nodes</strong> when they flash, then reconstruct the pattern to melt the vault door lock!
              </p>
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-around text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">EST. PAYOUT</span>
                  <span className="text-emerald-400 font-bold">₦1,250,000</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">CRYPTO BONUS</span>
                  <span className="text-purple-400 font-bold">+25 QBit</span>
                </div>
              </div>
              <button
                onClick={startHack}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
              >
                INITIATE THERMITE BYPASS
              </button>
            </div>
          )}

          {(phase === 'memorize' || phase === 'input') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-mono bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
                <span className={phase === 'memorize' ? 'text-amber-400 animate-pulse font-bold' : 'text-emerald-400 font-bold'}>
                  {phase === 'memorize' ? '👁️ MEMORIZE PATTERN...' : '⚡ CLICK 6 NODES!'}
                </span>
                <span className="text-rose-400">
                  ERR: {mistakes}/3 • ⏱️ {timeLeft}s
                </span>
              </div>

              {/* 4x4 NoPixel Security Matrix Grid */}
              <div className="grid grid-cols-4 gap-2.5 max-w-[280px] mx-auto">
                {Array.from({ length: 16 }, (_, idx) => {
                  const isTarget = targetNodes.includes(idx);
                  const isClicked = selectedNodes.includes(idx);

                  let tileStyle = 'bg-zinc-900 border-zinc-700 hover:border-emerald-400';
                  if (phase === 'memorize' && isTarget) {
                    tileStyle =
                      'bg-emerald-400 border-white shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-105';
                  } else if (phase === 'input' && isClicked) {
                    tileStyle = isTarget
                      ? 'bg-emerald-500 border-emerald-300 text-black'
                      : 'bg-rose-600 border-rose-400 text-white';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTileClick(idx)}
                      className={`h-14 rounded-xl border-2 font-mono text-xs font-bold transition-all ${tileStyle}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {phase === 'won' && (
            <div className="space-y-4 py-2">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-emerald-400">
                VAULT DOOR BREACHED!
              </h3>
              <p className="text-xs text-zinc-300">
                Thermite melted the locking mechanism! You grabbed the cash duffels and encrypted QBit drives!
              </p>
              <button
                onClick={() => {
                  onSuccess(1250000, 25);
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm"
              >
                COLLECT ₦1,250,000 + 25 QBIT
              </button>
            </div>
          )}

          {phase === 'lost' && (
            <div className="space-y-4 py-2">
              <ShieldAlert size={48} className="text-rose-500 mx-auto animate-pulse" />
              <h3 className="text-xl font-black text-rose-400">
                SECURITY LOCKDOWN TRIGGERED!
              </h3>
              <p className="text-xs text-zinc-300">
                Silent alarm tripped! Eko PD Interceptor units have been dispatched to your location!
              </p>
              <div className="flex gap-2">
              
                <button
                  onClick={startHack}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold"
                >
                  Retry Hack
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold"
                >
                  Escape Now!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
