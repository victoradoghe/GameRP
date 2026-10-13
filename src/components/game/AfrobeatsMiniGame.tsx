'use client';

import React, { useState } from 'react';
import { X, Music, Radio, Disc3, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '@/lib/audioEngine';

interface AfrobeatsMiniGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (royalties: number, fansGained: number) => void;
}

export const AfrobeatsMiniGame: React.FC<AfrobeatsMiniGameProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [trackTitle, setTrackTitle] = useState('Lagos Vibes & Palmwine');
  const [activeLayers, setActiveLayers] = useState<{ [key: string]: boolean }>({
    kick: true,
    shaker: false,
    chords: false,
    vocals: false,
  });
  const [hypeLevel, setHypeLevel] = useState(25);
  const [isReleased, setIsReleased] = useState(false);
  const [isPlayingGroove, setIsPlayingGroove] = useState(false);

  if (!isOpen) return null;

  const toggleLayer = (layer: 'kick' | 'shaker' | 'chords' | 'vocals') => {
    audioEngine.playDrumBeat(layer === 'kick' ? 'kick' : layer === 'shaker' ? 'shaker' : 'snare');
    setActiveLayers((prev) => {
      const next = !prev[layer];
      const count = Object.values({ ...prev, [layer]: next }).filter(Boolean).length;
      setHypeLevel(count * 25);
      return { ...prev, [layer]: next };
    });
  };

  const handlePlayAdLib = (tag: string) => {
    audioEngine.playCashEarn();
    setHypeLevel((prev) => Math.min(100, prev + 10));
  };

  const handleToggleMusic = () => {
    const isNowPlaying = audioEngine.toggleAfrobeatsGroove();
    setIsPlayingGroove(isNowPlaying);
  };

  const handleReleaseTrack = () => {
    audioEngine.stopAfrobeatsGroove();
    setIsPlayingGroove(false);
    confetti({ particleCount: 100, spread: 80 });
    audioEngine.playUpNepa();
    setIsReleased(true);
  };

  const handleFinish = () => {
    const royalties = 140000 + hypeLevel * 400;
    const fans = 2500 + hypeLevel * 50;
    onComplete(royalties, fans);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-950 border-2 border-purple-500 rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Music className="text-purple-300" size={24} />
            <div>
              <h3 className="font-bold text-sm">Starboy Sound Studio (VI)</h3>
              <p className="text-[11px] text-purple-200">Afrobeats Hitmaker Engine</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioEngine.stopAfrobeatsGroove();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Workspace */}
        <div className="p-6 space-y-5">
          {/* Track Naming */}
          <div>
            <label className="text-xs text-zinc-400 font-semibold uppercase">Single Title</label>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Soundboard Instrument Triggers */}
          <div className="space-y-2">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Stem Mixer & Beat Layers</span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => toggleLayer('kick')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeLayers.kick
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <h5 className="font-bold text-xs">🥁 Log Drum & Kick</h5>
                  <p className="text-[10px]">Amapiano deep syncopation</p>
                </div>
                <span>{activeLayers.kick ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => toggleLayer('shaker')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeLayers.shaker
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <h5 className="font-bold text-xs">🪘 Shekere & Hi-Hat</h5>
                  <p className="text-[10px]">16-step African rhythm</p>
                </div>
                <span>{activeLayers.shaker ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => toggleLayer('chords')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeLayers.chords
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <h5 className="font-bold text-xs">🎹 Marimba & Horns</h5>
                  <p className="text-[10px]">F-minor brass chords</p>
                </div>
                <span>{activeLayers.chords ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => toggleLayer('vocals')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  activeLayers.vocals
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <h5 className="font-bold text-xs">🎙️ Auto-Tune Harmonies</h5>
                  <p className="text-[10px]">Catchy choruses</p>
                </div>
                <span>{activeLayers.vocals ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Vocal Tag Ad-libs */}
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-400 font-semibold uppercase">Drop Vocal Tags (Ad-Libs)</span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlayAdLib('shekpe')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95"
              >
                "Shekpe!" 🗣️
              </button>
              <button
                onClick={() => handlePlayAdLib('anotherbanger')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95"
              >
                "It's another banger!" 💥
              </button>
              <button
                onClick={() => handlePlayAdLib('mad')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95"
              >
                "Oya shake am!" 💃
              </button>
            </div>
          </div>

          {/* Live Audio Monitor Button */}
          <div className="flex justify-between items-center p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2">
              <Volume2 className={isPlayingGroove ? 'text-purple-400 animate-pulse' : 'text-zinc-500'} size={20} />
              <span className="text-xs font-semibold">
                {isPlayingGroove ? 'Studio Monitors Live (Synthesizing)' : 'Monitors Muted'}
              </span>
            </div>
            <button
              onClick={handleToggleMusic}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded-xl text-xs active:scale-95 transition-all"
            >
              {isPlayingGroove ? 'Stop Beat' : '▶ Play Beat Loop'}
            </button>
          </div>

          {/* Hit Potential Meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Viral Hit Potential: {hypeLevel}%</span>
              <span>Lagos Billboard Hot 100</span>
            </div>
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${hypeLevel}%` }}
              />
            </div>
          </div>

          {/* Master & Release Button */}
          <button
            onClick={handleReleaseTrack}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-3 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-purple-600/30"
          >
            <Disc3 size={18} /> Release Single on Spotify & Apple Music
          </button>
        </div>

        {/* Single Release Overlay */}
        {isReleased && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
            <span className="text-5xl mb-2">🔥</span>
            <h3 className="text-2xl font-black text-purple-400">"{trackTitle}" IS NUMBER 1!</h3>
            <p className="text-sm text-zinc-300 mt-1 max-w-sm">
              Your song is blowing up on TikTok! Quilox DJs are blasting it every weekend.
            </p>

            <div className="my-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 w-full max-w-xs space-y-1">
              <span className="text-xs text-zinc-400">Streaming Royalties:</span>
              <p className="text-3xl font-black text-emerald-400">₦{(140000 + hypeLevel * 400).toLocaleString()}</p>
              <p className="text-xs text-purple-300 pt-1">+ {(2500 + hypeLevel * 50).toLocaleString()} New Fans</p>
            </div>

            <button
              onClick={handleFinish}
              className="bg-purple-500 hover:bg-purple-400 text-white font-black px-6 py-2.5 rounded-2xl text-sm active:scale-95 transition-all shadow-lg"
            >
              Collect Royalties & Exit Studio
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
