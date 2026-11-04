'use client';

import React, { useState, useEffect } from 'react';
import { Save, Check, RefreshCw, HardDrive } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: number | null;
  onManualSave?: () => void;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSavedAt,
  onManualSave,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (isSaving) {
      setVisible(true);
      setJustSaved(false);
    } else if (lastSavedAt) {
      setJustSaved(true);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setJustSaved(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSavedAt]);

  const formattedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[95] pointer-events-auto transition-all duration-500 transform ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
      } ${className}`}
    >
      <div
        onClick={onManualSave}
        title={onManualSave ? 'Click to trigger immediate manual save' : 'Automatic Game Saving Active'}
        className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-2xl transition-all cursor-pointer select-none ${
          isSaving
            ? 'bg-amber-950/80 border-amber-500/60 shadow-amber-500/20 text-amber-300'
            : justSaved
            ? 'bg-emerald-950/80 border-emerald-500/60 shadow-emerald-500/20 text-emerald-300'
            : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-300'
        }`}
      >
        {isSaving ? (
          <>
            <RefreshCw size={13} className="animate-spin text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                Auto-Saving...
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          </>
        ) : (
          <>
            <Check size={13} className="text-emerald-400 shrink-0 stroke-[3]" />
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="font-bold uppercase tracking-wider text-emerald-300">
                Auto-Saved
              </span>
              {formattedTime && (
                <span className="text-zinc-400 font-normal">[{formattedTime}]</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
