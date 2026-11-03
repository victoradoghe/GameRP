'use client';

import React, { useState } from 'react';
import { InventoryItem } from '@/lib/types';

interface RadialWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  equippedItemId: string | null;
  onUseItem: (item: InventoryItem) => void;
  onEquipItem: (itemId: string | null) => void;
  onRemoveItem: (itemId: string, qty: number) => void;
  onOpenPhone: () => void;
}

interface WheelSegment {
  slotIndex: number;
  label: string;
  icon: string;
  item: InventoryItem | null;
  isUnarmed?: boolean;
  isPhone?: boolean;
}

export const RadialWheelModal: React.FC<RadialWheelModalProps> = ({
  isOpen,
  onClose,
  inventory,
  equippedItemId,
  onUseItem,
  onEquipItem,
  onRemoveItem,
  onOpenPhone,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  if (!isOpen) return null;

  // Build 8 circular GTA VI radial segments
  const segments: WheelSegment[] = Array.from({ length: 8 }, (_, idx) => {
    if (idx === 0) {
      return {
        slotIndex: 0,
        label: 'Unarmed / Holster',
        icon: '✊',
        item: null,
        isUnarmed: true,
      };
    }
    if (idx === 1) {
      const phoneItem = inventory.find((i) => i.category === 'tech' && i.id.includes('phone')) ?? null;
      return {
        slotIndex: 1,
        label: phoneItem ? phoneItem.name : 'Smartphone',
        icon: phoneItem ? phoneItem.icon : '📱',
        item: phoneItem,
        isPhone: true,
      };
    }
    const nonPhoneItems = inventory.filter((i) => !(i.category === 'tech' && i.id.includes('phone')));
    const matched = nonPhoneItems[idx - 2] ?? null;
    return {
      slotIndex: idx,
      label: matched ? matched.name : 'Empty Slot',
      icon: matched ? matched.icon : '➕',
      item: matched,
    };
  });

  const activeSeg = segments[selectedSlot] ?? segments[0];

  // SVG Radial Wheel Geometry (8 wedges around center 210, 210)
  const cx = 210;
  const cy = 210;
  const outerR = 186;
  const innerR = 76;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const createWedgePath = (index: number, total: number) => {
    const anglePer = 360 / total;
    const gap = 2.2;
    const startAngle = index * anglePer - anglePer / 2 + gap / 2;
    const endAngle = (index + 1) * anglePer - anglePer / 2 - gap / 2;

    const p1 = polarToCartesian(cx, cy, outerR, endAngle);
    const p2 = polarToCartesian(cx, cy, outerR, startAngle);
    const p3 = polarToCartesian(cx, cy, innerR, startAngle);
    const p4 = polarToCartesian(cx, cy, innerR, endAngle);

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${outerR} ${outerR} 0 0 0 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${innerR} ${innerR} 0 0 1 ${p4.x} ${p4.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col lg:flex-row items-center gap-8 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-900/95 border border-amber-500/40 shadow-xl whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
            GTA VI TACTICAL RADIAL WHEEL • EQUIP, USE OR REMOVE ITEMS
          </span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            [TAB] / [ESC]
          </span>
        </div>

        {/* Circular 8-Segment SVG Radial Wheel */}
        <div className="relative w-[420px] h-[420px] flex items-center justify-center">
          <svg width={420} height={420} className="overflow-visible drop-shadow-[0_0_35px_rgba(0,0,0,0.9)]">
            <defs>
              <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#090d16" stopOpacity="0.0" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={outerR + 12} fill="url(#wheelGlow)" />

            {segments.map((seg, idx) => {
              const isSelected = selectedSlot === idx;
              const isEquipped =
                (seg.isUnarmed && !equippedItemId) ||
                (seg.item && equippedItemId === seg.item.id);
              const midAngle = idx * 45;
              const iconPos = polarToCartesian(cx, cy, (outerR + innerR) / 2, midAngle);

              return (
                <g
                  key={seg.slotIndex}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setSelectedSlot(idx)}
                  onClick={() => {
                    setSelectedSlot(idx);
                    if (seg.isUnarmed) {
                      onEquipItem(null);
                    } else if (seg.isPhone) {
                      onOpenPhone();
                      onClose();
                    } else if (seg.item) {
                      onEquipItem(seg.item.id);
                    }
                  }}
                >
                  <path
                    d={createWedgePath(idx, 8)}
                    fill={
                      isSelected
                        ? 'rgba(245, 158, 11, 0.28)'
                        : isEquipped
                        ? 'rgba(16, 185, 129, 0.22)'
                        : seg.item || seg.isUnarmed || seg.isPhone
                        ? 'rgba(24, 24, 27, 0.92)'
                        : 'rgba(15, 15, 20, 0.65)'
                    }
                    stroke={
                      isSelected
                        ? '#fbbf24'
                        : isEquipped
                        ? '#34d399'
                        : seg.item
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(255,255,255,0.07)'
                    }
                    strokeWidth={isSelected ? 2.8 : 1.4}
                  />
                  {/* Icon & Quantity inside Wedge */}
                  <text
                    x={iconPos.x}
                    y={iconPos.y - 6}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={26}
                  >
                    {seg.icon}
                  </text>
                  <text
                    x={iconPos.x}
                    y={iconPos.y + 18}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? '#fde68a' : '#e4e4e7'}
                    fontSize={9.5}
                    fontWeight="bold"
                  >
                    {seg.label.length > 13 ? `${seg.label.slice(0, 12)}…` : seg.label}
                  </text>
                  {seg.item && seg.item.quantity > 1 && (
                    <text
                      x={iconPos.x + 24}
                      y={iconPos.y - 22}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize={10}
                      fontWeight="900"
                    >
                      x{seg.item.quantity}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center Hub */}
            <circle
              cx={cx}
              cy={cy}
              r={innerR - 6}
              fill="rgba(9, 13, 22, 0.96)"
              stroke="rgba(251, 191, 36, 0.45)"
              strokeWidth={2}
            />
          </svg>

          {/* Center Hub Info Overlay */}
          <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center w-32">
            <span className="text-3xl mb-0.5">{activeSeg.icon}</span>
            <span className="text-[11px] font-black text-white leading-tight line-clamp-1">
              {activeSeg.label}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 mt-0.5">
              {activeSeg.item
                ? `${activeSeg.item.category.toUpperCase()} • x${activeSeg.item.quantity}`
                : activeSeg.isUnarmed
                ? 'HOLSTERED'
                : 'READY'}
            </span>
          </div>
        </div>

        {/* Right Side: Selected Item Action & Remove/Drop Panel (Plus Full Overflow Bag) */}
        <div className="w-80 rounded-2xl bg-zinc-950/95 border border-white/15 p-5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center justify-center text-2xl">
                {activeSeg.icon}
              </div>
              <div>
                <div className="text-sm font-black text-white">{activeSeg.label}</div>
                <div className="text-[11px] text-zinc-400">
                  {activeSeg.item
                    ? activeSeg.item.description
                    : activeSeg.isUnarmed
                    ? 'Conceal all tools and walk clean past police patrols.'
                    : activeSeg.isPhone
                    ? 'Open your iOS / Android device.'
                    : 'Select an item slot from the wheel.'}
                </div>
              </div>
            </div>
          </div>

          {activeSeg.item ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center bg-zinc-900/90 rounded-xl p-2.5 border border-white/5">
                <div>
                  <div className="text-[9px] uppercase text-zinc-500 font-bold">Quantity</div>
                  <div className="text-xs font-black text-white">x{activeSeg.item.quantity}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-zinc-500 font-bold">Weight</div>
                  <div className="text-xs font-black text-amber-300">
                    {(activeSeg.item.weight * activeSeg.item.quantity).toFixed(1)} kg
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-zinc-500 font-bold">Condition</div>
                  <div className="text-xs font-black text-emerald-400">{activeSeg.item.durability}%</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {(activeSeg.item.category === 'medical' ||
                  activeSeg.item.category === 'food' ||
                  activeSeg.item.category === 'tool' ||
                  activeSeg.item.category === 'tech') && (
                  <button
                    onClick={() => {
                      onUseItem(activeSeg.item!);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    ⚡ Use / Consume Item
                  </button>
                )}

                <button
                  onClick={() => {
                    onEquipItem(
                      equippedItemId === activeSeg.item!.id ? null : activeSeg.item!.id
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {equippedItemId === activeSeg.item.id ? '✓ Equipped in Hand (Holster)' : '🎯 Equip in Hand'}
                </button>

                {/* GTA VI REMOVE / JETTISON ITEM CONTROLS */}
                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <button
                    onClick={() => onRemoveItem(activeSeg.item!.id, 1)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    🗑️ Remove 1
                  </button>
                  {activeSeg.item.quantity > 1 && (
                    <button
                      onClick={() => onRemoveItem(activeSeg.item!.id, activeSeg.item!.quantity)}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      🗑️ Drop All (x{activeSeg.item.quantity})
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : activeSeg.isPhone ? (
            <button
              onClick={() => {
                onOpenPhone();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
            >
              📱 Launch Smartphone
            </button>
          ) : (
            <div className="text-xs text-zinc-400 py-3 text-center">
              Click any wedge on the radial wheel to inspect, equip, or remove items from your pockets.
            </div>
          )}

          {/* Quick list of all pocket items if player has > 6 items */}
          <div className="border-t border-white/10 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex justify-between">
              <span>All Pocket Items ({inventory.length})</span>
              <span>Click to Remove</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {inventory.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between bg-zinc-900/80 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{it.icon}</span>
                    <span className="font-bold text-zinc-200 truncate">{it.name}</span>
                    <span className="text-[10px] font-mono text-amber-400">x{it.quantity}</span>
                  </div>
                  <button
                    onClick={() => onRemoveItem(it.id, 1)}
                    className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Close Wheel [TAB]
          </button>
        </div>
      </div>
    </div>
  );
};
