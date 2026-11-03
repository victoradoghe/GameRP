'use client';

import React from 'react';
import { X, Package, ShoppingCart, Shield, Sparkles } from 'lucide-react';
import { InventoryItem, PlayerStats } from '@/lib/types';
import { SHOP_CATALOG } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface NoPixelInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUseItem: (item: InventoryItem) => void;
  onBuyItem: (shopItem: InventoryItem) => void;
}

export const NoPixelInventoryModal: React.FC<NoPixelInventoryModalProps> = ({
  isOpen,
  onClose,
  player,
  onUseItem,
  onBuyItem,
}) => {
  if (!isOpen) return null;

  const items = player.items || [];
  const totalWeight = items.reduce((acc, it) => acc + it.weight * it.quantity, 0);
  const maxWeight = 85.0;
  const weightPct = Math.min(100, (totalWeight / maxWeight) * 100);

  const formatNaira = (val: number) => '₦' + val.toLocaleString('en-NG');

  // Pad inventory to 15 slots so it looks like the iconic NoPixel grid
  const paddedSlots = Array.from({ length: 15 }, (_, idx) => items[idx] || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-white">
                NoPixel V // Tactical Inventory & Stash
              </h2>
              <p className="text-[11px] text-zinc-400">
                Click any item in your pockets to Use / Equip it, or press Hotkeys [1 - 5] in-game.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase text-zinc-400 block">Pocket Cash</span>
              <span className="text-sm font-black text-danfo-yellow">
                {formatNaira(player.cash)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Two-Column NoPixel Grid Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          {/* LEFT: Player Pockets (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Shield size={14} /> Citizen Pockets (ID #{player.stateId || 1042})
              </span>
              <span className="text-xs font-mono text-zinc-300">
                {totalWeight.toFixed(1)} / {maxWeight.toFixed(1)} kg
              </span>
            </div>

            {/* Weight Bar */}
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${weightPct}%` }}
              />
            </div>

            {/* 5x3 Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
              {paddedSlots.map((item, idx) => {
                const isHotbar = idx < 5;
                if (!item) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="h-24 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col justify-between p-2 relative"
                    >
                      {isHotbar && (
                        <span className="text-[9px] font-mono font-bold text-zinc-600 bg-zinc-950 px-1.5 py-0.5 rounded self-start">
                          KEY {idx + 1}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-700 self-center my-auto font-mono">
                        EMPTY
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id + '-' + idx}
                    onClick={() => {
                      audioEngine.playClick();
                      onUseItem(item);
                    }}
                    className="h-24 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 hover:border-emerald-400 flex flex-col justify-between p-2 relative group text-left transition-all active:scale-95 shadow-lg"
                    title={`${item.name}: ${item.description}`}
                  >
                    {/* Top row: Hotkey & Quantity */}
                    <div className="flex items-center justify-between w-full">
                      {isHotbar ? (
                        <span className="text-[9px] font-mono font-black bg-emerald-500 text-black px-1.5 py-0.2 rounded">
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500">
                          {item.weight}kg
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold text-zinc-300">
                        x{item.quantity}
                      </span>
                    </div>

                    {/* Center Icon */}
                    <div className="text-2xl self-center my-0.5 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>

                    {/* Item Name + Durability Bar */}
                    <div className="w-full">
                      <p className="text-[10px] font-bold text-zinc-100 truncate leading-tight">
                        {item.name}
                      </p>
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${item.durability}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: 24/7 Supply & Blackmarket Stash (5 cols) */}
          <div className="lg:col-span-5 space-y-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShoppingCart size={14} /> 24/7 Tactical & Tech Supply
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" /> Instant Equip
              </span>
            </div>

            <div className="space-y-2">
              {SHOP_CATALOG.map((shopItem) => (
                <div
                  key={shopItem.id}
                  className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {shopItem.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{shopItem.name}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{shopItem.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      audioEngine.playClick();
                      onBuyItem(shopItem);
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] px-3 py-2 rounded-xl shrink-0 active:scale-95 transition-all"
                  >
                    {formatNaira(shopItem.price || 5000)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
