'use client';

import React from 'react';
import { X, Gamepad2, Smartphone, Car, MessageSquare, Briefcase } from 'lucide-react';

interface HelpTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpTutorialModal: React.FC<HelpTutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#090d16] border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">
                NoPixel V // Eko City — Controls & RP Guide
              </h3>
              <p className="text-[10px] text-zinc-400">
                Click anywhere on the 3D city to lock mouse camera • Press [ESC] or [ALT] for cursor
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
        <div className="p-5 space-y-3.5 max-h-[76vh] overflow-y-auto text-xs text-zinc-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono bg-zinc-900/90 p-3.5 rounded-2xl border border-white/10">
            <div><strong className="text-teal-400">[MOUSE]</strong> 3D Look / Zoom</div>
            <div><strong className="text-teal-400">[W/A/S/D]</strong> Move / Drive</div>
            <div><strong className="text-teal-400">[SHIFT]</strong> Sprint</div>
            <div><strong className="text-teal-400">[SPACE]</strong> Jump / Drift</div>
            <div><strong className="text-teal-400">[E]</strong> Talk / Tuning / ATM</div>
            <div><strong className="text-teal-400">[F]</strong> Enter/Exit Car</div>
            <div><strong className="text-teal-400">[M]</strong> Smartphone</div>
            <div><strong className="text-teal-400">[N]</strong> Full City Map</div>
            <div><strong className="text-teal-400">[F1]</strong> Action & Emotes</div>
            <div><strong className="text-teal-400">[TAB]</strong> Pockets & Shop</div>
            <div><strong className="text-teal-400">[T / U]</strong> Chat / Roster</div>
            <div><strong className="text-teal-400">[V / B]</strong> Camera / Belt</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/8 space-y-1">
            <h4 className="font-bold text-xs text-teal-300 flex items-center gap-2">
              <Briefcase size={15} /> 1. Unlimited 3D City Jobs, Street Racing & Heists
            </h4>
            <p className="text-[11px] leading-relaxed">
              Open your phone with <strong>[M] → Job Center</strong> to clock into real 3D world loops: <strong>ChopChop Delivery</strong>, <strong>Downtown Cab Driver</strong>, <strong>Benny&apos;s Roadside Mechanic</strong>, <strong>Eko PD Patrol</strong>, <strong>Pillbox EMS Paramedic</strong>, <strong>Midnight Street Circuit Racing</strong>, or the <strong>Fleeca Bank Vault Heist</strong>! Press <strong>[N]</strong> anytime to open the full interactive satellite city map.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/8 space-y-1">
            <h4 className="font-bold text-xs text-emerald-300 flex items-center gap-2">
              <Smartphone size={15} /> 2. Live Corner-Docked Phone, Voice Calls, SMS & QBit Crypto
            </h4>
            <p className="text-[11px] leading-relaxed">
              Press <strong>[M]</strong> and watch your 3D character pull out their smartphone while the city keeps moving around you! Make live voice calls, dial <strong>911</strong> on the keypad, text NPCs, order Valet cars, trade <strong>QBit Crypto</strong> at Fleeca Bank, or change weather &amp; time in <strong>Settings</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/8 space-y-1">
            <h4 className="font-bold text-xs text-purple-300 flex items-center gap-2">
              <MessageSquare size={15} /> 3. Talk to 3D Pedestrians, Roleplay Chat & Emotes
            </h4>
            <p className="text-[11px] leading-relaxed">
              Walk up to any sidewalk citizen and press <strong>[E]</strong> to chat for intel, pitch your mixtape, give charity, or pickpocket! Press <strong>[T]</strong> for RP chat (<code>/me</code>, <code>/do</code>, <code>/e dance</code>) or open the <strong>[F1] Wheel</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/8 space-y-1">
            <h4 className="font-bold text-xs text-amber-300 flex items-center gap-2">
              <Car size={15} /> 4. Benny’s Motorworks Tuning, Dashcam [V] & Police Chases
            </h4>
            <p className="text-[11px] leading-relaxed">
              Drive into <strong>Ron Petrol &amp; Benny&apos;s Bay</strong> and press <strong>[E]</strong> to refuel, rebuild your engine, respray 3D metallic paint, and install <strong>Stage 3 Twin-Turbo</strong> upgrades! Press <strong>[V]</strong> to switch between 3rd-Person Chase, Hood Dashcam, and Isometric views.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-2.5 rounded-2xl text-xs transition-all shadow-lg"
          >
            Jump Into NoPixel V
          </button>
        </div>
      </div>
    </div>
  );
};
