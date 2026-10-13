'use client';

import React, { useState, useEffect } from 'react';
import { LagosWorld3D } from '@/components/game/LagosWorld3D';
import { GameHUD } from '@/components/game/GameHUD';
import { EkoPhone } from '@/components/game/EkoPhone';
import { CharacterCustomizer } from '@/components/game/CharacterCustomizer';
import { HelpTutorialModal } from '@/components/game/HelpTutorialModal';
import { DanfoMiniGame } from '@/components/game/DanfoMiniGame';
import { TechBroMiniGame } from '@/components/game/TechBroMiniGame';
import { AfrobeatsMiniGame } from '@/components/game/AfrobeatsMiniGame';
import { AmalaModal } from '@/components/game/AmalaModal';
import { QuiloxModal } from '@/components/game/QuiloxModal';
import {
  PlayerStats,
  Vitals,
  LagosDistrict,
  NotificationItem,
} from '@/lib/types';
import {
  INITIAL_NEPO_PLAYER,
  INITIAL_LAPO_PLAYER,
  INITIAL_VITALS,
} from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

export default function LagosLifeGamePage() {
  // Player & Game State
  const [player, setPlayer] = useState<PlayerStats>(INITIAL_LAPO_PLAYER);
  const [vitals, setVitals] = useState<Vitals>(INITIAL_VITALS);
  const [currentDistrict, setCurrentDistrict] = useState<LagosDistrict>('shitta');
  const [timeHour, setTimeHour] = useState<number>(14); // 2:00 PM
  const [isNepaActive, setIsNepaActive] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals Visibility
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDanfoOpen, setIsDanfoOpen] = useState<boolean>(false);
  const [isTechBroOpen, setIsTechBroOpen] = useState<boolean>(false);
  const [isAfrobeatsOpen, setIsAfrobeatsOpen] = useState<boolean>(false);
  const [isAmalaOpen, setIsAmalaOpen] = useState<boolean>(false);
  const [isQuiloxOpen, setIsQuiloxOpen] = useState<boolean>(false);

  // Load saved state on initial client mount
  useEffect(() => {
    try {
      const savedPlayer = localStorage.getItem('lagos_life_3d_player');
      const savedVitals = localStorage.getItem('lagos_life_3d_vitals');
      if (savedPlayer) setPlayer(JSON.parse(savedPlayer));
      if (savedVitals) setVitals(JSON.parse(savedVitals));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      localStorage.setItem('lagos_life_3d_player', JSON.stringify(player));
      localStorage.setItem('lagos_life_3d_vitals', JSON.stringify(vitals));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  }, [player, vitals]);

  // Game Clock, Vitals Decay & NEPA Outage Simulator
  useEffect(() => {
    const clockInterval = setInterval(() => {
      // 1. Advance Game Time
      setTimeHour((prev) => (prev + 1) % 24);

      // 2. Slow natural decay of vitals
      setVitals((prev) => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 1),
        energy: Math.max(0, prev.energy - 0.5),
      }));

      // 3. Random NEPA Grid Simulator (every ~60 seconds chance of surge/blackout)
      if (Math.random() > 0.8) {
        setIsNepaActive((currentNepa) => {
          const nextNepa = !currentNepa;
          if (!nextNepa) {
            audioEngine.playBlackout();
            addNotification(
              'NEPA Blackout!',
              'National grid collapsed! Switch on your generator or inverter.',
              'warning'
            );
          } else {
            audioEngine.playUpNepa();
            addNotification(
              'Up NEPA! ⚡',
              'Power restored! All neighbors shouting "UP NEPA!" in unison.',
              'success'
            );
          }
          return nextNepa;
        });
      }
    }, 25000);

    return () => clearInterval(clockInterval);
  }, []);

  const isNightTime = timeHour >= 19 || timeHour < 6;

  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'alert' = 'info'
  ) => {
    const newNotice: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications((prev) => [newNotice, ...prev.slice(0, 3)]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotice.id));
    }, 5000);
  };

  // Interact with 3D landmark triggers
  const handleInteract = (locationId: string) => {
    audioEngine.playClick();
    if (locationId === 'shitta') {
      setIsAmalaOpen(true);
    } else if (locationId === 'quilox') {
      setIsQuiloxOpen(true);
    } else if (locationId === 'yaba') {
      setIsTechBroOpen(true);
    } else if (locationId === 'computervillage') {
      setIsPhoneOpen(true);
    } else if (locationId === 'lekki') {
      setIsPhoneOpen(true);
    } else if (locationId === 'lagoon') {
      setIsDanfoOpen(true);
    } else {
      setIsPhoneOpen(true);
    }
  };

  // Audio toggles
  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    audioEngine.isMuted = nextMuted;
    setIsAudioMuted(nextMuted);
    if (nextMuted && isPlayingMusic) {
      audioEngine.stopAfrobeatsGroove();
      setIsPlayingMusic(false);
    }
  };

  const handleToggleMusic = () => {
    if (isAudioMuted) {
      audioEngine.isMuted = false;
      setIsAudioMuted(false);
    }
    const playing = audioEngine.toggleAfrobeatsGroove();
    setIsPlayingMusic(playing);
  };

  // Mini-Game Starters
  const handleStartMiniGame = (gameId: 'danfo' | 'techbro' | 'afrobeats') => {
    if (gameId === 'danfo') setIsDanfoOpen(true);
    if (gameId === 'techbro') setIsTechBroOpen(true);
    if (gameId === 'afrobeats') setIsAfrobeatsOpen(true);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#090D16]">
      
      {/* 3D WebGL World Simulation Canvas */}
      <LagosWorld3D
        currentDistrict={currentDistrict}
        onDistrictSelect={setCurrentDistrict}
        onInteract={handleInteract}
        playerOutfitColor={player.outfit.color}
        isNepaActive={isNepaActive}
        isNightTime={isNightTime}
        timeHour={timeHour}
      />

      {/* Floating Game HUD (Vitals, Fast-Travel, Audio, Time) */}
      <GameHUD
        player={player}
        vitals={vitals}
        timeHour={timeHour}
        isNightTime={isNightTime}
        isNepaActive={isNepaActive}
        currentDistrict={currentDistrict}
        isAudioMuted={isAudioMuted}
        isPlayingMusic={isPlayingMusic}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onOpenPhone={() => { audioEngine.playClick(); setIsPhoneOpen(true); }}
        onOpenCustomizer={() => { audioEngine.playClick(); setIsCustomizerOpen(true); }}
        onOpenHelp={() => { audioEngine.playClick(); setIsHelpOpen(true); }}
        onSelectDistrict={setCurrentDistrict}
      />

      {/* Floating Notifications Toaster */}
      <div className="absolute top-24 right-5 z-40 flex flex-col gap-2 pointer-events-none max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-3 rounded-2xl shadow-2xl border backdrop-blur-md text-xs animate-fade-in flex flex-col gap-0.5 ${
              n.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                : n.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                : n.type === 'alert'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
                : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-200'
            }`}
          >
            <div className="flex justify-between items-center font-bold">
              <span>{n.title}</span>
              <span className="text-[10px] text-zinc-400 font-normal">{n.timestamp}</span>
            </div>
            <p className="text-[11px] leading-snug">{n.message}</p>
          </div>
        ))}
      </div>

      {/* EkoPhone (Smartphone OS) */}
      <EkoPhone
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        player={player}
        vitals={vitals}
        isNepaActive={isNepaActive}
        onUpdatePlayer={setPlayer}
        onUpdateVitals={setVitals}
        onStartMiniGame={handleStartMiniGame}
        onAddNotification={addNotification}
      />

      {/* Character Customizer & Origin Switcher */}
      <CharacterCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        player={player}
        onSave={(updated) => {
          setPlayer(updated);
          addNotification('Wardrobe Updated', 'Avatar appearance changed!', 'success');
        }}
      />

      {/* Help & Tutorial */}
      <HelpTutorialModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Danfo Conductor Arcade Mini-Game */}
      <DanfoMiniGame
        isOpen={isDanfoOpen}
        onClose={() => setIsDanfoOpen(false)}
        onComplete={(earnings, cred) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash + earnings }));
          setVitals((prev) => ({
            ...prev,
            energy: Math.max(0, prev.energy - 25),
            streetCred: Math.min(100, prev.streetCred + cred),
          }));
          addNotification(
            'Danfo Shift Finished!',
            `Pocketed ₦${earnings.toLocaleString()} and gained ${cred} Street Cred!`,
            'success'
          );
        }}
      />

      {/* Tech Bro Sprint Mini-Game */}
      <TechBroMiniGame
        isOpen={isTechBroOpen}
        onClose={() => setIsTechBroOpen(false)}
        hasGenerator={player.inventory.generator}
        generatorFuelLitres={player.inventory.generatorFuelLitres}
        onComplete={(salary, cred) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash + salary }));
          setVitals((prev) => ({
            ...prev,
            energy: Math.max(0, prev.energy - 30),
            streetCred: Math.min(100, prev.streetCred + cred),
          }));
          addNotification(
            'Fintech Deploy Succeeded!',
            `Earned ₦${salary.toLocaleString()} wire payout!`,
            'success'
          );
        }}
      />

      {/* Afrobeats Hit Maker Studio Mini-Game */}
      <AfrobeatsMiniGame
        isOpen={isAfrobeatsOpen}
        onClose={() => setIsAfrobeatsOpen(false)}
        onComplete={(royalties, fans) => {
          setPlayer((prev) => ({
            ...prev,
            cash: prev.cash + royalties,
            musicTracksReleased: prev.musicTracksReleased + 1,
            fansCount: prev.fansCount + fans,
          }));
          setVitals((prev) => ({
            ...prev,
            streetCred: Math.min(100, prev.streetCred + 25),
          }));
          addNotification(
            'Afrobeats Chart Topper!',
            `Track released! Earned ₦${royalties.toLocaleString()} in royalties.`,
            'success'
          );
        }}
      />

      {/* Amala Shitta Canteen Modal */}
      <AmalaModal
        isOpen={isAmalaOpen}
        onClose={() => setIsAmalaOpen(false)}
        playerCash={player.cash}
        onEatPlate={(cost, hungerRest, energyRest, stressDown) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash - cost }));
          setVitals((prev) => ({
            ...prev,
            hunger: Math.min(100, prev.hunger + hungerRest),
            energy: Math.min(100, prev.energy + energyRest),
            stress: Math.max(0, prev.stress - stressDown),
          }));
          addNotification(
            'Belleful! 🍲',
            `Ate hot Amala at Shitta. Vitals replenished!`,
            'success'
          );
        }}
      />

      {/* Club Quilox VIP Nightlife Modal */}
      <QuiloxModal
        isOpen={isQuiloxOpen}
        onClose={() => setIsQuiloxOpen(false)}
        playerCash={player.cash}
        streetCred={vitals.streetCred}
        onParty={(cost, cred, stressRelief) => {
          setPlayer((prev) => ({ ...prev, cash: prev.cash - cost }));
          setVitals((prev) => ({
            ...prev,
            streetCred: Math.min(100, prev.streetCred + cred),
            stress: Math.max(0, prev.stress - stressRelief),
          }));
          addNotification(
            'Quilox Big Boy Mode! 🍾',
            `Popped bottles! Gained +${cred} Street Cred!`,
            'success'
          );
        }}
      />

    </main>
  );
}
