'use client';

import React, { useState, useEffect } from 'react';
import { X, Laptop, Zap, Bug, Battery, CheckCircle, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '@/lib/audioEngine';

interface TechBroMiniGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (salary: number, credGained: number) => void;
  hasGenerator: boolean;
  generatorFuelLitres: number;
}

export const TechBroMiniGame: React.FC<TechBroMiniGameProps> = ({
  isOpen,
  onClose,
  onComplete,
  hasGenerator,
  generatorFuelLitres,
}) => {
  const [deployProgress, setDeployProgress] = useState(0);
  const [battery, setBattery] = useState(100);
  const [nepaBlackout, setNepaBlackout] = useState(false);
  const [generatorRunning, setGeneratorRunning] = useState(false);
  const [bugs, setBugs] = useState<{ id: number; title: string; x: number; y: number }[]>([]);
  const [codeLines, setCodeLines] = useState<string[]>([
    'const fintechApp = new PayLagoonEngine();',
    'await wallet.verifyNIN_BVN(user);',
    'deploying smart contract to Lagos node...',
  ]);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setDeployProgress(0);
    setBattery(100);
    setNepaBlackout(false);
    setGeneratorRunning(false);
    setIsGameOver(false);
    setBugs([]);

    // Battery / NEPA event loop
    const interval = setInterval(() => {
      // 25% chance NEPA cuts out
      if (Math.random() > 0.75 && !nepaBlackout) {
        setNepaBlackout(true);
        audioEngine.playBlackout();
      }

      // Battery drains if NEPA is off and generator not running
      setBattery((prev) => {
        if (nepaBlackout && !generatorRunning) {
          const next = prev - 4;
          if (next <= 0) {
            setIsGameOver(true);
            return 0;
          }
          return next;
        }
        return Math.min(100, prev + 1); // Charges back if power restored
      });

      // Occasional bug popup
      if (Math.random() > 0.6 && bugs.length < 3) {
        setBugs((prev) => [
          ...prev,
          {
            id: Date.now(),
            title: ['Memory Leak', 'Null Pointer', 'DB Timeout', 'CORS Error'][
              Math.floor(Math.random() * 4)
            ],
            x: Math.floor(Math.random() * 60) + 20,
            y: Math.floor(Math.random() * 60) + 20,
          },
        ]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen, nepaBlackout, generatorRunning]);

  const handleTypeCode = () => {
    if (deployProgress >= 100) return;
    audioEngine.playClick();

    const snippets = [
      'optimizeLagosPaymentGateways();',
      'redis.cache.set("exchange_rate_usd", 1650);',
      'if (network.isJammed) rerouteViaStarlink();',
      'cryptoWallet.transferTokens(amount);',
    ];

    setCodeLines((prev) => [...prev.slice(-4), snippets[Math.floor(Math.random() * snippets.length)]]);

    setDeployProgress((prev) => {
      const next = prev + 5;
      if (next >= 100) {
        setIsGameOver(true);
        confetti({ particleCount: 80, spread: 70 });
        audioEngine.playUpNepa();
        return 100;
      }
      return next;
    });
  };

  const handleFixBug = (id: number) => {
    audioEngine.playCashEarn();
    setBugs((prev) => prev.filter((b) => b.id !== id));
    setDeployProgress((prev) => Math.min(100, prev + 6));
  };

  const handleKickstartGen = () => {
    if (!hasGenerator) {
      alert('You do not own a generator! Buy one in EkoPhone to survive blackouts.');
      return;
    }
    if (generatorFuelLitres <= 0) {
      alert('Generator tank is bone dry! Buy fuel at NNPC filling station.');
      return;
    }
    audioEngine.playCashEarn();
    setGeneratorRunning(true);
    setNepaBlackout(false);
  };

  const handleFinish = () => {
    onComplete(95000, 15);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-2 border-blue-500 rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Laptop className="text-blue-400" size={20} />
            <span className="font-bold text-sm">Yaba Tech Co-Working Sprint</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
            <X size={18} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-zinc-900/50 flex justify-between items-center text-xs border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Battery
              size={18}
              className={battery < 25 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}
            />
            <span>MacBook Battery: <strong>{battery}%</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Zap
              size={18}
              className={nepaBlackout ? 'text-rose-500 animate-bounce' : 'text-yellow-400'}
            />
            <span>
              Power Status:{' '}
              <strong className={nepaBlackout ? 'text-rose-400' : 'text-emerald-400'}>
                {nepaBlackout ? 'NEPA BLACKOUT!' : generatorRunning ? 'Gen Running ⚡' : 'Grid Active'}
              </strong>
            </span>
          </div>
        </div>

        {/* IDE & Terminal Screen */}
        <div className="relative p-6 bg-zinc-950 h-72 flex flex-col justify-between overflow-hidden font-mono text-xs">
          
          {/* Blackout darkness overlay if NEPA off and no gen */}
          {nepaBlackout && !generatorRunning && (
            <div className="absolute inset-0 bg-black/85 z-20 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-4xl mb-2">🕯️</span>
              <h4 className="text-lg font-bold text-rose-400">NEPA JUST CUT LIGHT!</h4>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                Your laptop is draining fast! Pull the starter cord on your generator now.
              </p>
              <button
                onClick={handleKickstartGen}
                className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-2 active:scale-95 shadow-lg"
              >
                <Flame size={16} /> Pull Gen Cord ("I-pass-my-neighbor")
              </button>
            </div>
          )}

          {/* Code Stream */}
          <div className="space-y-1 text-emerald-400">
            <div className="text-zinc-500">// Lagos PayLagoon Deployment Terminal</div>
            {codeLines.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-zinc-600">{idx + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </div>

          {/* Floating Bugs */}
          {bugs.map((bug) => (
            <button
              key={bug.id}
              onClick={() => handleFixBug(bug.id)}
              className="absolute z-10 bg-rose-600/90 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-full text-[11px] shadow-lg flex items-center gap-1.5 animate-bounce"
              style={{ top: `${bug.y}%`, left: `${bug.x}%` }}
            >
              <Bug size={14} /> Fix {bug.title} (+6%)
            </button>
          ))}

          {/* Deploy Progress Bar */}
          <div className="pt-4 border-t border-zinc-800 space-y-1">
            <div className="flex justify-between text-xs text-zinc-400 font-sans">
              <span>Sprint Progress: {deployProgress}%</span>
              <span>Target: Production Launch</span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-200"
                style={{ width: `${deployProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Keyboard Sprint Button */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
          <p className="text-xs text-zinc-400">Tap below to write code & squash sprint tasks!</p>
          <button
            onClick={handleTypeCode}
            disabled={deployProgress >= 100 || (nepaBlackout && !generatorRunning)}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-xs active:scale-95 transition-all shadow"
          >
            ⌨️ Ship Code Chunk (+5%)
          </button>
        </div>

        {/* Victory Screen */}
        {isGameOver && deployProgress >= 100 && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <span className="text-5xl mb-2">🚀</span>
            <h3 className="text-2xl font-black text-emerald-400">PRODUCTION DEPLOY COMPLETE!</h3>
            <p className="text-sm text-zinc-300 mt-1 max-w-sm">
              Your API survived traffic, blackouts, and bugs. PayLagoon investors sent your salary!
            </p>

            <div className="my-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 w-full max-w-xs space-y-1">
              <span className="text-xs text-zinc-400">Salary Earned:</span>
              <p className="text-3xl font-black text-emerald-400">₦95,000</p>
              <p className="text-xs text-blue-300 pt-1">+ 15 Street Cred</p>
            </div>

            <button
              onClick={handleFinish}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-6 py-2.5 rounded-2xl text-sm active:scale-95 transition-all shadow-lg"
            >
              Collect Wire Transfer
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
