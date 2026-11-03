'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Package,
  Compass,
  Star,
  Users,
  Send,
  X,
  Navigation,
  Map,
  Home,
  Plane,
  DoorOpen,
} from 'lucide-react';
import {
  PlayerStats,
  Vitals,
  WorldRealtimeState,
  InventoryItem,
  ActiveMission,
  MapTarget,
  ChatLine,
  Emote,
  Weather,
} from '@/lib/types';
import { NoPixelRadar } from './NoPixelRadar';
import { NoPixelVehicleHUD } from './NoPixelVehicleHUD';

interface GameHUDProps {
  player: PlayerStats;
  vitals: Vitals;
  worldState: WorldRealtimeState;
  wantedStars: number;
  timeOfDay: number;
  weather: Weather;
  emote: Emote;
  activeMission: ActiveMission | null;
  missionTarget: MapTarget | null;
  waypoint: MapTarget | null;
  isPhoneOpen: boolean;
  isChatOpen: boolean;
  chatLines: ChatLine[];
  voiceMode: 'whisper' | 'normal' | 'shout';
  isRadioOn: boolean;
  isAudioMuted: boolean;
  isPlayingMusic: boolean;
  onlineCount: number;
  onOpenChat: () => void;
  onCloseChat: () => void;
  onSubmitChat: (raw: string) => void;
  onCycleVoiceMode: () => void;
  onToggleRadio: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenPhone: () => void;
  onOpenInventory: () => void;
  onOpenRadial: () => void;
  onOpenMap: () => void;
  onOpenScoreboard: () => void;
  onOpenHelp: () => void;
  onOpenHome?: () => void;
  onOpenAirport?: () => void;
  onExitBuilding?: () => void;
  onStopMission: () => void;
  onCancelEmote: () => void;
  onUseHotbarItem: (item: InventoryItem) => void;
  onSetWaypoint: (target: MapTarget | null) => void;
  onInteractPromptClick: () => void;
  onVehicleAction: (action: 'enter_exit' | 'seatbelt' | 'lights' | 'siren') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  vitals,
  worldState,
  wantedStars,
  timeOfDay,
  weather,
  emote,
  activeMission,
  missionTarget,
  waypoint,
  isPhoneOpen,
  isChatOpen,
  chatLines,
  voiceMode,
  isRadioOn,
  isAudioMuted,
  isPlayingMusic,
  onlineCount,
  onOpenChat,
  onCloseChat,
  onSubmitChat,
  onCycleVoiceMode,
  onToggleRadio,
  onToggleMute,
  onToggleMusic,
  onOpenPhone,
  onOpenInventory,
  onOpenRadial,
  onOpenMap,
  onOpenScoreboard,
  onOpenHelp,
  onOpenHome,
  onOpenAirport,
  onExitBuilding,
  onStopMission,
  onCancelEmote,
  onUseHotbarItem,
  onSetWaypoint,
  onInteractPromptClick,
  onVehicleAction,
}) => {
  const [chatDraft, setChatDraft] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => chatInputRef.current?.focus(), 20);
    }
  }, [isChatOpen]);

  const formatNaira = (val: number) => '₦' + val.toLocaleString('en-NG');
  const formatClock = (tod: number) => {
    const h = Math.floor(tod) % 24;
    const m = Math.floor((tod - Math.floor(tod)) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const weatherBadge: Record<Weather, string> = {
    clear: '☀️ Clear',
    cloudy: '⛅ Cloudy',
    rain: '🌧️ Rain',
    fog: '🌫️ Fog',
  };

  const hotbarSlots = Array.from({ length: 5 }, (_, idx) => (player.items || [])[idx] || null);
  const recentChat = chatLines.slice(-6);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-4 select-none font-sans">
      {/* ==================== TOP ROW ==================== */}
      <div className="flex items-start justify-between gap-4 w-full">
        {/* TOP-LEFT: Clean NoPixel RP / OOC Chat Feed */}
        <div className="w-[310px] sm:w-[350px] flex flex-col gap-1.5">
          <div
            onClick={() => {
              if (!isChatOpen) onOpenChat();
            }}
            className={`pointer-events-auto rounded-2xl px-3 py-2 transition-all cursor-text ${
              isChatOpen
                ? 'bg-[#090d16]/92 backdrop-blur-xl border border-teal-500/40 shadow-2xl'
                : 'bg-[#090d16]/45 hover:bg-[#090d16]/75 backdrop-blur-xs border border-white/5'
            }`}
          >
            <div className="space-y-1 text-[11px] leading-snug max-h-32 overflow-hidden">
              {recentChat.map((line) => (
                <div key={line.id} className="drop-shadow-sm break-words">
                  {line.kind === 'me' ? (
                    <span className="text-purple-300 italic">
                      * {line.author} {line.text}
                    </span>
                  ) : line.kind === 'do' ? (
                    <span className="text-amber-300 italic">
                      * {line.text} ({line.author})
                    </span>
                  ) : line.kind === 'system' ? (
                    <span className="text-teal-300 font-semibold">[SYSTEM] {line.text}</span>
                  ) : (
                    <>
                      <span className="text-sky-400 font-bold">[OOC] {line.author}: </span>
                      <span className="text-zinc-100">{line.text}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {isChatOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatDraft.trim()) onSubmitChat(chatDraft);
                  setChatDraft('');
                  onCloseChat();
                }}
                className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Escape') {
                      setChatDraft('');
                      onCloseChat();
                    }
                  }}
                  placeholder="/me waves, /e dance, /weather rain, or OOC..."
                  className="flex-1 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-400"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-teal-500 text-black hover:bg-teal-400"
                >
                  <Send size={12} />
                </button>
              </form>
            ) : (
              <div className="mt-1 text-[9px] font-mono text-zinc-400/80">
                Press <span className="text-teal-300 font-bold">[T]</span> to chat •{' '}
                <span className="text-purple-300">/me</span> •{' '}
                <span className="text-amber-300">/e dance</span>
              </div>
            )}
          </div>
        </div>

        {/* TOP-CENTER: 3D Building Interior Banner, Active Mission Objective Pill OR Active Emote Pill */}
        <div className="flex flex-col items-center gap-1.5 max-w-lg">
          {worldState.insideBuilding && (
            <div className="pointer-events-auto bg-[#090d16]/92 backdrop-blur-xl border border-teal-400/55 rounded-2xl px-4 py-2 shadow-[0_12px_40px_rgba(20,184,166,0.25)] flex items-center gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-teal-300">
                    3D INTERIOR • WALK &amp; PRESS [E] AT STATIONS
                  </span>
                </div>
                <p className="text-xs font-extrabold text-white truncate max-w-[240px] sm:max-w-[300px]">
                  {worldState.insideTitle || 'Building Interior'}
                </p>
              </div>
              {onExitBuilding && (
                <button
                  onClick={onExitBuilding}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center gap-1.5 shrink-0 transition-colors shadow-lg"
                  title="Exit 3D Building Interior to City Street [Backspace]"
                >
                  <DoorOpen size={14} />
                  <span>Step Outside</span>
                </button>
              )}
            </div>
          )}

          {activeMission && (
            <div className="pointer-events-auto bg-[#090d16]/90 backdrop-blur-xl border border-amber-400/45 rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Navigation size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
                    {activeMission.title}
                  </span>
                  {worldState.missionDistance !== null && (
                    <span className="text-[10px] font-mono text-teal-300">
                      {Math.round(worldState.missionDistance)}m
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate max-w-[260px]">
                  {activeMission.objective}
                </p>
              </div>
              <button
                onClick={onStopMission}
                className="p-1 rounded-lg bg-zinc-800/90 hover:bg-rose-600 text-zinc-400 hover:text-white transition-colors"
                title="End Shift"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {emote !== 'none' && (
            <button
              onClick={onCancelEmote}
              className="pointer-events-auto bg-[#090d16]/85 border border-teal-400/40 rounded-full px-3 py-1 text-[11px] font-mono text-teal-200 flex items-center gap-1.5 hover:bg-zinc-900"
            >
              <span>Emote: /e {emote}</span>
              <span className="text-zinc-400">• Move or click to stop</span>
            </button>
          )}
        </div>

        {/* TOP-RIGHT: Minimal NoPixel V Server Header, Cash/Bank & Quick Icons */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          {/* Server Watermark + Clock + Economy */}
          <div className="bg-[#090d16]/88 backdrop-blur-xl border border-white/12 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-3 text-xs text-white">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-mono font-black tracking-wider text-teal-300 text-[11px]">
                {player.activeCity === 'abuja' ? 'ABUJA RP' : 'LAGOS RP'}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">#{player.stateId}</span>
            </div>

            <div className="h-3.5 w-[1px] bg-white/10" />

            <div className="font-mono text-[11px] text-zinc-300 hidden sm:flex items-center gap-1.5">
              <span>{formatClock(timeOfDay)}</span>
              <span className="text-zinc-600">•</span>
              <span>{weatherBadge[weather]}</span>
              {(player.solarKw ?? 0) > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-300 font-bold" title="Rooftop Solar Inverter Active">
                    ☀️ {player.solarKw}kVA
                  </span>
                </>
              )}
            </div>

            <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2.5 font-mono text-[11px]">
              <span className="text-amber-300 font-black" title="Pocket Cash">
                {formatNaira(player.cash)}
              </span>
              <span className="text-emerald-400 font-bold hidden sm:inline" title="Fleeca Bank">
                {formatNaira(player.bankBalance)}
              </span>
            </div>
          </div>

          {/* Wanted Pursuit Bar (Only visible when wantedStars > 0) */}
          {wantedStars > 0 && (
            <div className="bg-rose-950/92 border border-rose-500 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-[0_0_24px_rgba(244,63,94,0.5)] animate-pulse">
              <span className="text-[10px] font-mono font-black text-rose-300 tracking-wider mr-1">
                10-80 PURSUIT
              </span>
              {Array.from({ length: 5 }, (_, idx) => (
                <Star
                  key={idx}
                  size={13}
                  className={
                    idx < wantedStars ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                  }
                />
              ))}
            </div>
          )}

          {/* Subtle Action Bar */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenRadial}
              className="px-2.5 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Action & Emote Wheel [F1]"
            >
              <Compass size={13} className="text-teal-400" />
              <span className="font-mono text-[10px] text-zinc-400">[F1]</span>
            </button>

            <button
              onClick={onOpenPhone}
              className="px-2.5 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Open Smartphone [M]"
            >
              <Smartphone size={13} className="text-emerald-400" />
              <span className="font-mono text-[10px] text-zinc-400">[M]</span>
            </button>

            <button
              onClick={onOpenInventory}
              className="px-2.5 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Open Pockets & 24/7 Shop [TAB]"
            >
              <Package size={13} className="text-sky-400" />
              <span className="font-mono text-[10px] text-zinc-400">[TAB]</span>
            </button>

            {onOpenHome && (
              <button
                onClick={onOpenHome}
                className="px-2.5 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="Enter Your House / Solar & Laptop Hub"
              >
                <Home size={13} />
                <span className="font-mono text-[10px] hidden sm:inline">Home</span>
              </button>
            )}

            {onOpenAirport && (
              <button
                onClick={onOpenAirport}
                className="px-2.5 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                title="FAAN International Airport Terminal (LOS ⇄ ABV)"
              >
                <Plane size={13} />
                <span className="font-mono text-[10px] hidden sm:inline">Airport</span>
              </button>
            )}

            <button
              onClick={onOpenMap}
              className="px-2.5 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Open Full City Map [N]"
            >
              <Map size={13} className="text-amber-400" />
              <span className="font-mono text-[10px] text-zinc-400">[N]</span>
            </button>

            <button
              onClick={onOpenScoreboard}
              className="px-2 py-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
              title="Server Roster & Fast Spawn [U]"
            >
              <Users size={13} className="text-purple-400" />
              <span>{onlineCount}</span>
            </button>

            <button
              onClick={onToggleMusic}
              className={`p-1.5 rounded-xl border transition-colors ${
                isPlayingMusic
                  ? 'bg-teal-500/20 border-teal-400/50 text-teal-300'
                  : 'bg-[#090d16]/85 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Toggle City Radio Beats"
            >
              <Music size={13} />
            </button>

            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors"
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isAudioMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} />}
            </button>

            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded-xl bg-[#090d16]/85 hover:bg-zinc-800 border border-white/10 text-amber-300 transition-colors"
              title="Controls & RP Guide"
            >
              <HelpCircle size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== CENTER-RIGHT: NOPIXEL INTERACTION PROMPT ==================== */}
      {(worldState.nearInteractable || (!worldState.vehicle.isDriving && worldState.nearVehicle)) && (
        <div className="self-end my-auto mr-2 flex flex-col gap-2 items-end">
          {worldState.nearInteractable && (
            <button
              onClick={onInteractPromptClick}
              className="pointer-events-auto bg-[#090d16]/92 hover:bg-zinc-900 backdrop-blur-xl border-l-4 border-teal-400 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
            >
              <span className="w-7 h-7 rounded-lg bg-teal-500 text-black font-mono font-black text-xs flex items-center justify-center shadow">
                E
              </span>
              <div>
                <span className="text-xs font-extrabold text-white block leading-tight">
                  {worldState.nearInteractable.actionLabel}
                </span>
                <span className="text-[10px] text-teal-300 font-medium">
                  {worldState.nearInteractable.name}
                </span>
              </div>
            </button>
          )}

          {!worldState.vehicle.isDriving && worldState.nearVehicle && (
            <button
              onClick={() => onVehicleAction('enter_exit')}
              className="pointer-events-auto bg-[#090d16]/92 hover:bg-zinc-900 backdrop-blur-xl border-l-4 border-emerald-400 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
            >
              <span className="w-7 h-7 rounded-lg bg-emerald-400 text-black font-mono font-black text-xs flex items-center justify-center shadow">
                F
              </span>
              <div>
                <span className="text-xs font-extrabold text-white block leading-tight">
                  Drive Vehicle
                </span>
                <span className="text-[10px] text-emerald-300 font-medium">
                  {worldState.nearVehicle.name}
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ==================== BOTTOM ROW ==================== */}
      <div className="flex items-end justify-between gap-3 w-full">
        {/* BOTTOM-LEFT: NoPixel Radar + Minimal Square Vitals */}
        <NoPixelRadar
          vitals={vitals}
          worldState={worldState}
          missionTarget={missionTarget}
          waypoint={waypoint}
          voiceMode={voiceMode}
          isRadioOn={isRadioOn}
          activeCity={player.activeCity || 'lagos'}
          onCycleVoiceMode={onCycleVoiceMode}
          onToggleRadio={onToggleRadio}
          onSetWaypoint={onSetWaypoint}
          onOpenMap={onOpenMap}
        />

        {/* BOTTOM-CENTER: Sleek 5-Slot NoPixel Hotbar [1-5] */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 bg-[#090d16]/82 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
          {hotbarSlots.map((item, idx) => (
            <button
              key={idx}
              onClick={() => item && onUseHotbarItem(item)}
              className={`relative w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-all group ${
                item
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 border-white/12 hover:border-teal-400/60'
                  : 'bg-black/40 border-white/5 cursor-default'
              }`}
              title={item ? `[${idx + 1}] Use ${item.name}` : `Slot ${idx + 1} Empty`}
            >
              <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-zinc-500">
                {idx + 1}
              </span>
              {item && (
                <>
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-zinc-400">
                      x{item.quantity}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* BOTTOM-RIGHT: NoPixel Digital Speedometer (Hidden while Phone is open so they never overlap) */}
        <div className="min-w-[1px]">
          {!isPhoneOpen && (
            <NoPixelVehicleHUD
              telemetry={worldState.vehicle}
              onToggleSeatbelt={() => onVehicleAction('seatbelt')}
              onToggleLights={() => onVehicleAction('lights')}
              onToggleSiren={() => onVehicleAction('siren')}
              onExitVehicle={() => onVehicleAction('enter_exit')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
