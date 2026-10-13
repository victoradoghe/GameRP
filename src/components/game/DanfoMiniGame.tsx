'use client';

import React, { useState, useEffect } from 'react';
import { X, Award, AlertCircle, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '@/lib/audioEngine';

interface DanfoMiniGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (earnings: number, credGained: number) => void;
}

interface Passenger {
  id: number;
  name: string;
  destination: string;
  fare: number;
  paid: boolean;
  x: number; // percentage
}

export const DanfoMiniGame: React.FC<DanfoMiniGameProps> = ({ isOpen, onClose, onComplete }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [agberoActive, setAgberoActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [announcement, setAnnouncement] = useState('Oshodi straight! Enter with your change!');

  useEffect(() => {
    if (!isOpen) return;

    // Reset game
    setScore(0);
    setTimeLeft(25);
    setIsGameOver(false);
    setPassengers([
      { id: 1, name: 'Mama Nkechi', destination: 'Obalende', fare: 500, paid: false, x: 20 },
      { id: 2, name: 'Student Boy', destination: 'CMS', fare: 400, paid: false, x: 50 },
      { id: 3, name: 'Corporate Guy', destination: 'Costain', fare: 600, paid: false, x: 75 },
    ]);

    audioEngine.playDanfoHorn();

    // Game timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Random passenger spawner & Agbero tax collector
    const spawner = setInterval(() => {
      // Spawn passenger
      setPassengers((prev) => {
        if (prev.length < 5) {
          const names = ['Alhaji', 'Sister Blessing', 'Tech Bro', 'Nurse Funke', 'Trader Emeka'];
          const dests = ['Oshodi', 'Yaba', 'Obalende', 'Marina'];
          const fares = [500, 600, 700, 800];
          const newPass: Passenger = {
            id: Date.now() + Math.random(),
            name: names[Math.floor(Math.random() * names.length)],
            destination: dests[Math.floor(Math.random() * dests.length)],
            fare: fares[Math.floor(Math.random() * fares.length)],
            paid: false,
            x: Math.floor(Math.random() * 70) + 15,
          };
          return [...prev, newPass];
        }
        return prev;
      });

      // 30% chance Agbero appears
      if (Math.random() > 0.65) {
        setAgberoActive(true);
        setTimeout(() => setAgberoActive(false), 3200);
      }
    }, 2200);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [isOpen]);

  const handleCollectFare = (id: number, fare: number) => {
    audioEngine.playCashEarn();
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, paid: true } : p))
    );
    setScore((prev) => prev + fare);

    const cheers = [
      'Wole pelu change e!',
      'Hold your ₦500 exact!',
      'No ₦1,000 note o!',
      'Obalende straight!',
    ];
    setAnnouncement(cheers[Math.floor(Math.random() * cheers.length)]);

    // Remove paid passenger after short delay
    setTimeout(() => {
      setPassengers((prev) => prev.filter((p) => p.id !== id));
    }, 400);
  };

  const handlePayAgbero = () => {
    audioEngine.playBlackout();
    setScore((prev) => Math.max(0, prev - 1000));
    setAgberoActive(false);
    setAnnouncement('Settled Agbero park dues (-₦1,000)!');
  };

  const handleFinish = () => {
    confetti({ particleCount: 75, spread: 60 });
    onComplete(score, Math.floor(score / 500));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-950 border-4 border-danfo-yellow rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Header / Route Board */}
        <div className="bg-danfo-yellow text-black px-6 py-3 flex justify-between items-center font-black">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚐</span>
            <span className="text-lg tracking-wider">OSHODI - OBALENDE ROUTE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/10 hover:bg-black/20 text-black"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dashboard Bar */}
        <div className="px-6 py-3 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-sm">
          <div>
            <span className="text-zinc-400 text-xs">Fares Collected:</span>
            <p className="font-extrabold text-danfo-yellow text-xl">₦{score.toLocaleString()}</p>
          </div>

          <div className="text-center">
            <span className="text-zinc-400 text-xs">Conductor Cry:</span>
            <p className="font-bold text-xs text-white">{announcement}</p>
          </div>

          <div className="text-right">
            <span className="text-zinc-400 text-xs">Shift Time:</span>
            <p className={`font-black text-xl ${timeLeft < 6 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {timeLeft}s
            </p>
          </div>
        </div>

        {/* Danfo Interior Gameplay Canvas */}
        <div className="relative h-72 bg-gradient-to-b from-amber-950/30 to-zinc-900 p-4 flex flex-col justify-end overflow-hidden">
          
          {/* Moving Road stripes */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-col justify-around">
            <div className="h-2 bg-yellow-400 w-full animate-pulse" />
            <div className="h-2 bg-yellow-400 w-full animate-pulse" />
          </div>

          {/* Agbero Hazard Warning Banner */}
          {agberoActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg animate-bounce z-20">
              <ShieldAlert size={24} />
              <div>
                <strong className="text-sm font-bold">AGBERO TAX DEMAND!</strong>
                <p className="text-xs">Pay ₦1,000 ticket dues quick!</p>
              </div>
              <button
                onClick={handlePayAgbero}
                className="bg-black text-white px-3 py-1 rounded-xl text-xs font-bold hover:bg-zinc-800"
              >
                Settle ₦1k
              </button>
            </div>
          )}

          {/* Passengers Inside Danfo */}
          <div className="relative z-10 flex justify-around items-end h-48 pb-2">
            {passengers.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center group transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-transform ${
                    p.paid
                      ? 'bg-emerald-600/40 border-emerald-400 scale-90'
                      : 'bg-zinc-800 border-danfo-yellow hover:scale-105 cursor-pointer shadow-lg'
                  }`}
                  onClick={() => !p.paid && handleCollectFare(p.id, p.fare)}
                >
                  {p.paid ? '✅' : '🧍'}
                </div>
                <span className="text-[11px] font-bold mt-1 text-zinc-200">{p.name}</span>
                <span className="text-[10px] text-zinc-400">{p.destination}</span>
                {!p.paid && (
                  <button
                    onClick={() => handleCollectFare(p.id, p.fare)}
                    className="mt-1 bg-danfo-yellow text-black font-extrabold px-2 py-0.5 rounded-full text-[10px] hover:bg-yellow-400 active:scale-95 transition-all shadow"
                  >
                    Take ₦{p.fare}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Honk Horn Button */}
          <div className="absolute bottom-3 left-4 z-20">
            <button
              onClick={() => audioEngine.playDanfoHorn()}
              className="bg-black/80 border border-danfo-yellow text-danfo-yellow font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1 hover:bg-black active:scale-95 shadow"
            >
              📢 Honk Horn
            </button>
          </div>
        </div>

        {/* Game Over Summary Modal Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <span className="text-5xl mb-2">🎉</span>
            <h3 className="text-2xl font-black text-danfo-yellow">SHIFT COMPLETED!</h3>
            <p className="text-sm text-zinc-300 mt-1 max-w-sm">
              You worked the hectic Oshodi route and successfully dodged road drama.
            </p>

            <div className="my-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 w-full max-w-xs space-y-1">
              <span className="text-xs text-zinc-400">Total Fares Pocketed:</span>
              <p className="text-3xl font-black text-emerald-400">₦{score.toLocaleString()}</p>
              <p className="text-xs text-amber-300 pt-1">+ {Math.floor(score / 500)} Street Cred</p>
            </div>

            <button
              onClick={handleFinish}
              className="bg-danfo-yellow hover:bg-yellow-400 text-black font-black px-6 py-2.5 rounded-2xl text-sm active:scale-95 transition-all shadow-lg"
            >
              Collect Cash & Return
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
