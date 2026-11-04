'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Save,
  LogOut,
  Monitor,
  Cpu,
  Volume2,
  VolumeX,
  Gamepad2,
  Activity,
  User,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  HelpCircle,
  Shirt,
  RotateCcw,
  AlertTriangle,
  Check,
  Music,
  Radio,
  Camera,
  Sun,
  Eye,
} from 'lucide-react';
import { GraphicsSettings, PlayerStats, Vitals, CityId } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

export type SettingsTab = 'game' | 'stats' | 'display' | 'graphics' | 'audio' | 'controls' | 'account';
type CameraMode = 'chase' | 'isometric' | 'hood';

export interface GameSettingsMenuProps {
  isOpen: boolean;
  /** When true the menu is opened from the title screen (no in-game actions). */
  fromTitleScreen?: boolean;
  onResume: () => void;
  player: PlayerStats;
  vitals: Vitals;
  timeOfDay: number;
  wantedStars: number;
  sessionStartedAt: number;
  lastSavedAt: number | null;

  graphicsSettings: GraphicsSettings;
  onChangeGraphics: (g: GraphicsSettings) => void;
  showFps: boolean;
  onToggleShowFps: () => void;
  hudVisible: boolean;
  onToggleHud: () => void;

  isAudioMuted: boolean;
  onToggleMute: () => void;
  masterVolume: number;
  onChangeMasterVolume: (v: number) => void;
  musicVolume: number;
  onChangeMusicVolume: (v: number) => void;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  isRadioOn: boolean;
  onToggleRadio: () => void;

  cameraMode: CameraMode;
  onChangeCameraMode: (m: CameraMode) => void;

  onSaveGame: () => void;
  onLogout: () => void;
  onResetCharacter: () => void;
  onOpenMap?: () => void;
  onOpenHelp?: () => void;
  onOpenCustomizer?: () => void;
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'game', label: 'Game', icon: <Gamepad2 size={14} /> },
  { id: 'stats', label: 'Stats', icon: <Activity size={14} /> },
  { id: 'display', label: 'Display', icon: <Monitor size={14} /> },
  { id: 'graphics', label: 'Graphics', icon: <Cpu size={14} /> },
  { id: 'audio', label: 'Audio', icon: <Volume2 size={14} /> },
  { id: 'controls', label: 'Controls', icon: <Gamepad2 size={14} /> },
  { id: 'account', label: 'Account', icon: <User size={14} /> },
];

const RESOLUTION_PRESETS: { scale: number; label: string; hint: string }[] = [
  { scale: 0.5, label: '50%', hint: 'Performance' },
  { scale: 0.75, label: '75%', hint: 'Balanced' },
  { scale: 1.0, label: '100%', hint: 'Native' },
  { scale: 1.25, label: '125%', hint: 'High' },
  { scale: 1.5, label: '150%', hint: 'Supersample' },
];

const QUALITY_PRESETS: {
  id: string;
  label: string;
  values: Pick<GraphicsSettings, 'resolutionScale' | 'bloomEnabled' | 'shadowsEnabled'>;
}[] = [
  { id: 'low', label: 'Low', values: { resolutionScale: 0.6, bloomEnabled: false, shadowsEnabled: false } },
  { id: 'medium', label: 'Medium', values: { resolutionScale: 0.85, bloomEnabled: true, shadowsEnabled: false } },
  { id: 'high', label: 'High', values: { resolutionScale: 1.0, bloomEnabled: true, shadowsEnabled: true } },
  { id: 'ultra', label: 'Ultra', values: { resolutionScale: 1.25, bloomEnabled: true, shadowsEnabled: true } },
];

const KEYBINDS: [string, string][] = [
  ['W A S D', 'Move / Drive'],
  ['SHIFT', 'Sprint / Boost / Afterburner'],
  ['SPACE', 'Jump / Handbrake / Climb (plane)'],
  ['C', 'Descend (plane)'],
  ['F', 'Enter / Exit Vehicle'],
  ['E', 'Interact'],
  ['B', 'Seatbelt / Helmet'],
  ['H', 'Headlights'],
  ['Q', 'Police Siren'],
  ['V', 'Cycle Camera'],
  ['M / P', 'Phone'],
  ['N', 'City Map'],
  ['I', 'Inventory'],
  ['TAB', 'Item Wheel'],
  ['F1', 'Radial Menu'],
  ['T', 'Chat'],
  ['U', 'Players Online'],
  ['1 - 5', 'Hotbar Items'],
  ['ALT', 'Free Cursor'],
  ['ESC', 'Pause Menu / Settings'],
];

const formatNaira = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
const formatClock = (tod: number) => {
  const h = Math.floor(tod) % 24;
  const m = Math.floor((tod - Math.floor(tod)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const formatDuration = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(sec).padStart(2, '0')}s`;
};
const cityLabel = (c?: CityId) => (c === 'abuja' ? 'Abuja FCT' : 'Lagos');

/* ---------- Small reusable GTA-style rows ---------- */

const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors">
    <div className="min-w-0">
      <div className="text-[13px] font-bold uppercase tracking-wide text-white">{label}</div>
      {desc && <div className="text-[11px] text-zinc-400 mt-0.5">{desc}</div>}
    </div>
    <div className="shrink-0 flex items-center gap-2">{children}</div>
  </div>
);

const Toggle: React.FC<{ on: boolean; onClick: () => void }> = ({ on, onClick }) => (
  <button
    onClick={() => {
      audioEngine.playClick();
      onClick();
    }}
    className={`w-24 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider border transition-all ${
      on ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/15 hover:text-white'
    }`}
  >
    {on ? 'On' : 'Off'}
  </button>
);

const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}> = ({ value, min, max, step, onChange, display }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3 w-64">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-white cursor-pointer"
        style={{
          background: `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
          height: 4,
          borderRadius: 4,
        }}
      />
      <span className="w-14 text-right font-mono text-[12px] font-bold text-white">{display}</span>
    </div>
  );
};

/* ---------- FPS counter overlay (exported for page) ---------- */

export const FpsCounter: React.FC = () => {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const color = fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-300' : 'text-rose-400';
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[70] pointer-events-none px-2 py-0.5 rounded bg-black/70 border border-white/10 font-mono text-[11px] font-bold">
      <span className={color}>{fps}</span> <span className="text-zinc-400">FPS</span>
    </div>
  );
};

/* ---------- Main Menu ---------- */

export const GameSettingsMenu: React.FC<GameSettingsMenuProps> = (props) => {
  const {
    isOpen,
    fromTitleScreen,
    onResume,
    player,
    vitals,
    timeOfDay,
    wantedStars,
    sessionStartedAt,
    lastSavedAt,
    graphicsSettings: gs,
    onChangeGraphics,
  } = props;

  const [tab, setTab] = useState<SettingsTab>(fromTitleScreen ? 'display' : 'game');
  const [confirm, setConfirm] = useState<null | 'logout' | 'reset'>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [viewport, setViewport] = useState({ w: 1920, h: 1080, dpr: 1 });

  const visibleTabs = useMemo(
    () => (fromTitleScreen ? TABS.filter((t) => !['game', 'stats', 'account'].includes(t.id)) : TABS),
    [fromTitleScreen]
  );

  useEffect(() => {
    if (!isOpen) return;
    setTab(fromTitleScreen ? 'display' : 'game');
    setConfirm(null);
  }, [isOpen, fromTitleScreen]);

  // Live clock for session timer, viewport & fullscreen state
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      setNow(Date.now());
      setViewport({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 });
      setIsFullscreen(!!document.fullscreenElement);
    };
    update();
    const id = setInterval(update, 1000);
    document.addEventListener('fullscreenchange', update);
    window.addEventListener('resize', update);
    return () => {
      clearInterval(id);
      document.removeEventListener('fullscreenchange', update);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  // Keyboard: Q/E or ←/→ switch tabs; ESC closes confirm dialog first
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirm) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setConfirm(null);
        return;
      }
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      const isRange = (document.activeElement as HTMLInputElement | null)?.type === 'range';
      if ((tag === 'INPUT' && !isRange) || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'q' || k === 'e' || (!isRange && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const idx = visibleTabs.findIndex((t) => t.id === tab);
        const dir = k === 'q' || e.key === 'ArrowLeft' ? -1 : 1;
        const next = visibleTabs[(idx + dir + visibleTabs.length) % visibleTabs.length];
        audioEngine.playClick();
        setTab(next.id);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, confirm, tab, visibleTabs]);

  if (!isOpen) return null;

  const setG = (patch: Partial<GraphicsSettings>) => onChangeGraphics({ ...gs, ...patch });
  const baseDpr = Math.min(viewport.dpr, 2);
  const effDpr = Math.max(0.35, Math.min(2.6, baseDpr * gs.resolutionScale));
  const renderW = Math.round(viewport.w * effDpr);
  const renderH = Math.round(viewport.h * effDpr);
  const activeQuality =
    QUALITY_PRESETS.find(
      (q) =>
        Math.abs(q.values.resolutionScale - gs.resolutionScale) < 0.001 &&
        q.values.bloomEnabled === gs.bloomEnabled &&
        q.values.shadowsEnabled === gs.shadowsEnabled
    )?.id ?? 'custom';

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* Fullscreen may be blocked by browser policy */
    }
  };

  const netWorth = player.cash + player.bankBalance + (player.cryptoBalance || 0) + (player.homeSafeCash || 0) - (player.loanBalance || 0);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col select-none text-white animate-fade-in">
      {/* Darkened, blurred game world behind */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/92 via-[#0b1220]/88 to-[#020617]/95 backdrop-blur-md" />

      <div className="relative flex flex-col h-full max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6 pb-4">
        {/* ===== Header: Title + Character / Time / Money (GTA style) ===== */}
        <div className="flex items-end justify-between gap-4 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-400">
              {fromTitleScreen ? 'Lagos Life 3D' : 'Paused'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight italic leading-none">
              Settings
            </h1>
          </div>
          {!fromTitleScreen && (
            <div className="text-right leading-tight">
              <div className="text-lg sm:text-xl font-black uppercase tracking-wide">{player.name}</div>
              <div className="text-[12px] font-mono text-zinc-300">
                {cityLabel(player.activeCity)} · {formatClock(timeOfDay)}
              </div>
              <div className="text-[13px] font-mono font-bold">
                <span className="text-emerald-400">{formatNaira(player.cash)}</span>
                <span className="text-zinc-500"> · </span>
                <span className="text-sky-300">BANK {formatNaira(player.bankBalance)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ===== Tab Bar ===== */}
        <div className="flex items-center gap-1 border-y border-white/15 py-1.5 overflow-x-auto">
          <span className="hidden sm:inline px-1.5 py-0.5 mr-1 rounded bg-white/10 font-mono text-[10px] text-zinc-300">Q</span>
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                audioEngine.playClick();
                setTab(t.id);
              }}
              className={`px-3.5 py-1.5 rounded-sm text-[12px] font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === t.id ? 'bg-white text-black' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <span className="hidden sm:inline px-1.5 py-0.5 ml-1 rounded bg-white/10 font-mono text-[10px] text-zinc-300">E</span>
        </div>

        {/* ===== Body ===== */}
        <div className="flex-1 min-h-0 mt-3 rounded-md bg-black/45 border border-white/10 overflow-y-auto">
          {/* ---------- GAME ---------- */}
          {tab === 'game' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-4 border-b border-white/[0.06]">
                {[
                  { label: 'Resume', icon: <Play size={18} />, onClick: onResume, primary: true },
                  { label: 'Save Game', icon: <Save size={18} />, onClick: props.onSaveGame },
                  { label: 'City Map', icon: <MapIcon size={18} />, onClick: props.onOpenMap },
                  { label: 'Help & Tutorial', icon: <HelpCircle size={18} />, onClick: props.onOpenHelp },
                ].map((b) => (
                  <button
                    key={b.label}
                    disabled={!b.onClick}
                    onClick={() => {
                      audioEngine.playClick();
                      b.onClick?.();
                    }}
                    className={`py-4 rounded-md flex flex-col items-center gap-1.5 text-[12px] font-black uppercase tracking-wider border transition-all disabled:opacity-40 ${
                      b.primary
                        ? 'bg-white text-black border-white hover:bg-zinc-200'
                        : 'bg-white/5 border-white/15 hover:bg-white/15'
                    }`}
                  >
                    {b.icon}
                    {b.label}
                  </button>
                ))}
              </div>
              <Row label="Camera View" desc="Default camera perspective (also cycles with [V]).">
                {(['chase', 'hood', 'isometric'] as CameraMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      audioEngine.playClick();
                      props.onChangeCameraMode(m);
                    }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase border ${
                      props.cameraMode === m ? 'bg-white text-black border-white' : 'border-white/15 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Camera size={11} className="inline mr-1 -mt-0.5" />
                    {m === 'chase' ? '3rd Person' : m === 'hood' ? '1st Person' : 'Top-Down'}
                  </button>
                ))}
              </Row>
              <Row label="Show HUD" desc="Hide all on-screen HUD for cinematic screenshots.">
                <Toggle on={props.hudVisible} onClick={props.onToggleHud} />
              </Row>
              <Row label="Last Saved" desc="Progress also auto-saves continuously to this device.">
                <span className="font-mono text-[12px] text-zinc-300">
                  {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Auto-save active'}
                </span>
              </Row>
              {props.onOpenCustomizer && (
                <Row label="Character Appearance" desc="Change outfit, skin tone and accessories.">
                  <button
                    onClick={() => {
                      audioEngine.playClick();
                      props.onOpenCustomizer?.();
                    }}
                    className="px-4 py-1.5 rounded-md border border-white/20 hover:bg-white/10 text-[11px] font-black uppercase flex items-center gap-1.5"
                  >
                    <Shirt size={12} /> Edit
                  </button>
                </Row>
              )}
            </div>
          )}

          {/* ---------- STATS ---------- */}
          {tab === 'stats' && (
            <div className="grid md:grid-cols-2">
              {(
                [
                  ['Character', `${player.name} · State ID #${player.stateId}`],
                  ['Phone Number', player.phoneNumber],
                  ['Current City', cityLabel(player.activeCity)],
                  ['Session Play Time', formatDuration(now - sessionStartedAt)],
                  ['Cash on Hand', formatNaira(player.cash)],
                  ['Bank Balance', formatNaira(player.bankBalance)],
                  ['Crypto Wallet', formatNaira(player.cryptoBalance || 0)],
                  ['Home Safe', formatNaira(player.homeSafeCash || 0)],
                  ['Outstanding Loan', formatNaira(player.loanBalance || 0)],
                  ['Net Worth', formatNaira(netWorth)],
                  ['Job', player.job ? `${player.job}${player.isOnDuty ? ' (On Duty)' : ''}` : 'Unemployed'],
                  ['Residence', player.housing.replace(/-/g, ' ')],
                  ['Vehicles Owned', String((player.ownedVehicles || []).length)],
                  ['Aircraft Owned', String((player.ownedPlanes || []).length)],
                  ['Wanted Level', wantedStars > 0 ? '★'.repeat(wantedStars) : 'Clean'],
                  ['Street Cred', `${Math.round(vitals.streetCred)} / 100`],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06] md:odd:border-r">
                  <span className="text-[12px] font-bold uppercase tracking-wide text-zinc-400">{k}</span>
                  <span className="text-[13px] font-mono font-bold text-white text-right capitalize truncate">{v}</span>
                </div>
              ))}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-3 p-4">
                {(
                  [
                    ['Health', vitals.health, 'bg-emerald-500'],
                    ['Armor', vitals.armor, 'bg-sky-500'],
                    ['Hunger', vitals.hunger, 'bg-amber-500'],
                    ['Thirst', vitals.thirst, 'bg-cyan-400'],
                    ['Stress', vitals.stress, 'bg-rose-500'],
                  ] as [string, number, string][]
                ).map(([k, v, c]) => (
                  <div key={k}>
                    <div className="flex justify-between text-[11px] font-bold uppercase text-zinc-300 mb-1">
                      <span>{k}</span>
                      <span className="font-mono">{Math.round(v)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full ${c}`} style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- DISPLAY ---------- */}
          {tab === 'display' && (
            <div>
              <div className="px-4 py-4 border-b border-white/[0.06]">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-[13px] font-bold uppercase tracking-wide">Resolution</div>
                    <div className="text-[11px] text-zinc-400">
                      Lower for higher FPS, raise for sharper image (supersampling).
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-black">
                      {renderW} × {renderH}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      Render scale {Math.round(gs.resolutionScale * 100)}% · Window {viewport.w}×{viewport.h}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {RESOLUTION_PRESETS.map((r) => (
                    <button
                      key={r.scale}
                      onClick={() => {
                        audioEngine.playClick();
                        setG({ resolutionScale: r.scale });
                      }}
                      className={`py-2.5 rounded-md border text-center transition-all ${
                        Math.abs(gs.resolutionScale - r.scale) < 0.001
                          ? 'bg-white text-black border-white'
                          : 'border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-[14px] font-black">{r.label}</div>
                      <div className="text-[10px] font-bold uppercase opacity-70">{r.hint}</div>
                      <div className="text-[9px] font-mono opacity-60">
                        {Math.round(viewport.w * Math.max(0.35, Math.min(2.6, baseDpr * r.scale)))}p-w
                      </div>
                    </button>
                  ))}
                </div>
                <Slider
                  value={gs.resolutionScale}
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => setG({ resolutionScale: v })}
                  display={`${Math.round(gs.resolutionScale * 100)}%`}
                />
              </div>
              <Row label="Screen Mode" desc="Toggle browser fullscreen.">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    toggleFullscreen();
                  }}
                  className="w-36 py-1.5 rounded-md border border-white/20 hover:bg-white/10 text-[11px] font-black uppercase flex items-center justify-center gap-1.5"
                >
                  {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  {isFullscreen ? 'Fullscreen' : 'Windowed'}
                </button>
              </Row>
              <Row label="Brightness" desc="Scene exposure (indoor & outdoor).">
                <Sun size={14} className="text-zinc-400" />
                <Slider
                  value={gs.brightness ?? 1}
                  min={0.6}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => setG({ brightness: v })}
                  display={`${Math.round((gs.brightness ?? 1) * 100)}%`}
                />
              </Row>
              <Row label="Field of View" desc="Base camera FOV. Speed adds extra FOV while driving/flying.">
                <Eye size={14} className="text-zinc-400" />
                <Slider
                  value={gs.fov ?? 60}
                  min={50}
                  max={90}
                  step={1}
                  onChange={(v) => setG({ fov: v })}
                  display={`${Math.round(gs.fov ?? 60)}°`}
                />
              </Row>
              <Row label="FPS Counter" desc="Show frames-per-second at the bottom of the screen.">
                <Toggle on={props.showFps} onClick={props.onToggleShowFps} />
              </Row>
            </div>
          )}

          {/* ---------- GRAPHICS ---------- */}
          {tab === 'graphics' && (
            <div>
              <div className="px-4 py-4 border-b border-white/[0.06]">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[13px] font-bold uppercase tracking-wide">Quality Preset</div>
                  <span className="text-[11px] font-mono uppercase text-zinc-400">
                    Current: <span className="text-white font-bold">{activeQuality}</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {QUALITY_PRESETS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        audioEngine.playClick();
                        setG(q.values);
                      }}
                      className={`py-3 rounded-md border text-[12px] font-black uppercase tracking-wider transition-all ${
                        activeQuality === q.id ? 'bg-white text-black border-white' : 'border-white/15 hover:bg-white/10'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
              <Row label="HDR Bloom" desc="Neon glow on lights, signs and headlights.">
                <Toggle on={gs.bloomEnabled} onClick={() => setG({ bloomEnabled: !gs.bloomEnabled })} />
              </Row>
              <Row label="Shadows" desc="Real-time soft sun shadows. Disable for big FPS gains.">
                <Toggle on={gs.shadowsEnabled} onClick={() => setG({ shadowsEnabled: !gs.shadowsEnabled })} />
              </Row>
              <Row label="Render Scale" desc="Same as Display → Resolution.">
                <Slider
                  value={gs.resolutionScale}
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => setG({ resolutionScale: v })}
                  display={`${Math.round(gs.resolutionScale * 100)}%`}
                />
              </Row>
              <div className="px-4 py-3 text-[11px] text-zinc-400 flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                Settings apply instantly and are saved to this device.
              </div>
            </div>
          )}

          {/* ---------- AUDIO ---------- */}
          {tab === 'audio' && (
            <div>
              <Row label="Master Volume" desc="All game sound effects, engines, sirens and music.">
                <Volume2 size={14} className="text-zinc-400" />
                <Slider
                  value={props.masterVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={props.onChangeMasterVolume}
                  display={`${Math.round(props.masterVolume * 100)}`}
                />
              </Row>
              <Row label="Music Volume" desc="Afrobeats radio groove.">
                <Music size={14} className="text-zinc-400" />
                <Slider
                  value={props.musicVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={props.onChangeMusicVolume}
                  display={`${Math.round(props.musicVolume * 100)}`}
                />
              </Row>
              <Row label="Mute All Audio">
                {props.isAudioMuted ? <VolumeX size={14} className="text-rose-400" /> : null}
                <Toggle on={props.isAudioMuted} onClick={props.onToggleMute} />
              </Row>
              <Row label="Radio Music" desc="Play / stop the in-game Afrobeats station.">
                <Toggle on={props.isPlayingMusic} onClick={props.onToggleMusic} />
              </Row>
              <Row label="Voice Radio" desc="Proximity / police radio channel.">
                <Radio size={14} className="text-zinc-400" />
                <Toggle on={props.isRadioOn} onClick={props.onToggleRadio} />
              </Row>
            </div>
          )}

          {/* ---------- CONTROLS ---------- */}
          {tab === 'controls' && (
            <div>
              <Row label="Mouse Sensitivity" desc="Camera look speed.">
                <Slider
                  value={gs.mouseSensitivity ?? 1}
                  min={0.25}
                  max={2.5}
                  step={0.05}
                  onChange={(v) => setG({ mouseSensitivity: v })}
                  display={`${(gs.mouseSensitivity ?? 1).toFixed(2)}x`}
                />
              </Row>
              <Row label="Invert Y-Axis" desc="Invert vertical camera look.">
                <Toggle on={!!gs.invertY} onClick={() => setG({ invertY: !gs.invertY })} />
              </Row>
              <div className="px-4 pt-4 pb-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Keyboard Bindings
              </div>
              <div className="grid sm:grid-cols-2">
                {KEYBINDS.map(([key, action]) => (
                  <div key={key} className="flex justify-between items-center px-4 py-2 border-b border-white/[0.06] sm:odd:border-r">
                    <span className="text-[12px] text-zinc-200">{action}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 font-mono text-[11px] font-bold">
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- ACCOUNT ---------- */}
          {tab === 'account' && (
            <div>
              <div className="flex items-center gap-4 p-4 border-b border-white/[0.06]">
                <div
                  className="w-14 h-14 rounded-md flex items-center justify-center text-2xl font-black border border-white/20"
                  style={{ backgroundColor: player.outfit.color || '#14b8a6' }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-black uppercase">{player.name}</div>
                  <div className="text-[12px] font-mono text-zinc-400">
                    State ID #{player.stateId} · {player.phoneNumber}
                  </div>
                  <div className="text-[11px] text-zinc-500 italic">{player.tagline}</div>
                </div>
              </div>
              <Row label="Save Game" desc="Write your character, money and vitals to this device now.">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    props.onSaveGame();
                  }}
                  className="w-36 py-1.5 rounded-md bg-white text-black text-[11px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-zinc-200"
                >
                  <Save size={12} /> Save Now
                </button>
              </Row>
              <Row label="Log Out" desc="Saves your progress and returns to the title screen.">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    setConfirm('logout');
                  }}
                  className="w-36 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase flex items-center justify-center gap-1.5"
                >
                  <LogOut size={12} /> Log Out
                </button>
              </Row>
              <Row label="Reset Character" desc="Permanently wipe money, items, vehicles and property. Cannot be undone.">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    setConfirm('reset');
                  }}
                  className="w-36 py-1.5 rounded-md border border-rose-500/60 text-rose-300 hover:bg-rose-600/20 text-[11px] font-black uppercase flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </Row>
            </div>
          )}
        </div>

        {/* ===== Footer button hints ===== */}
        <div className="flex items-center justify-between pt-3 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-white text-black font-mono text-[10px]">ESC</span>
              {fromTitleScreen ? 'Back' : 'Resume'}
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-white/15 font-mono text-[10px]">Q / E</span>
              Switch Tab
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!fromTitleScreen && (
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setConfirm('logout');
                }}
                className="px-3 py-1.5 rounded-md border border-rose-500/50 text-rose-300 hover:bg-rose-600/20 flex items-center gap-1.5"
              >
                <LogOut size={12} /> Log Out
              </button>
            )}
            <button
              onClick={() => {
                audioEngine.playClick();
                onResume();
              }}
              className="px-4 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 flex items-center gap-1.5"
            >
              <Play size={12} /> {fromTitleScreen ? 'Back' : 'Resume'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Confirmation dialog ===== */}
      {confirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md bg-[#0b1220] border border-white/20 shadow-2xl overflow-hidden">
            <div className="px-5 py-3 bg-white text-black text-[13px] font-black uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} />
              {confirm === 'logout' ? 'Log Out?' : 'Reset Character?'}
            </div>
            <div className="p-5 text-[13px] text-zinc-200 leading-relaxed">
              {confirm === 'logout'
                ? 'Your progress will be saved and you will return to the title screen.'
                : 'This will permanently delete your money, inventory, vehicles, aircraft and property. This cannot be undone.'}
            </div>
            <div className="grid grid-cols-2 gap-2 px-5 pb-5">
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setConfirm(null);
                }}
                className="py-2 rounded-md border border-white/20 hover:bg-white/10 text-[12px] font-black uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  audioEngine.playClick();
                  const action = confirm;
                  setConfirm(null);
                  if (action === 'logout') props.onLogout();
                  else props.onResetCharacter();
                }}
                className="py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[12px] font-black uppercase flex items-center justify-center gap-1.5"
              >
                <Check size={13} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
