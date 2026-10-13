'use client';

import React from 'react';
import { X, Gamepad2, Smartphone, Zap, MapPin } from 'lucide-react';

interface HelpTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpTutorialModal: React.FC<HelpTutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-danfo-yellow rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="bg-danfo-yellow text-black px-6 py-4 flex justify-between items-center font-black">
          <div className="flex items-center gap-2">
            <Gamepad2 size={24} />
            <h3 className="text-base tracking-wider">HOW TO SURVIVE & THRIVE IN LAGOS</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20 text-black">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-zinc-300">
          
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <h4 className="font-bold text-sm text-danfo-yellow flex items-center gap-2">
              <Gamepad2 size={16} /> 1. Movement & 3D Controls
            </h4>
            <p>
              Use <strong>W, A, S, D</strong> or the <strong>Arrow Keys</strong> on your keyboard, or click/tap anywhere on the ground to walk your 3D avatar. On mobile, use the on-screen virtual D-pad.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <MapPin size={16} /> 2. Entering Landmarks
            </h4>
            <p>
              Walk close to any location (or use the Fast Travel bar at the bottom) and press <strong>E</strong> or click the floating prompt to enter:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-1 pt-1">
              <li><strong>Amala Shitta:</strong> Fill up on hot Amala & goat meat to restore Hunger & Energy.</li>
              <li><strong>Club Quilox:</strong> Pop champagne bottles, dance to Afrobeats, and boost Street Cred.</li>
              <li><strong>Yaba Tech Corridor:</strong> Code fintech APIs and sprint for high salaries.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <h4 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
              <Zap size={16} /> 3. Surviving NEPA Outages
            </h4>
            <p>
              Power cuts occur randomly across Lagos. If NEPA cuts off, remote work stops and device batteries drain! Buy an <strong>"I-pass-my-neighbor" generator</strong> and petrol kegs in your EkoPhone to keep running.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <Smartphone size={16} /> 4. Your EkoPhone
            </h4>
            <p>
              Click the yellow <strong>EkoPhone</strong> button at the top right to access Kuda Bank transfers, apply for high-paying jobs, order ChopChop food, buy houses, or read the hilarious live Lagos Twitter feed.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-danfo-yellow hover:bg-yellow-400 text-black font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-lg"
          >
            I Dey Ready! (Let's Play)
          </button>
        </div>

      </div>
    </div>
  );
};
