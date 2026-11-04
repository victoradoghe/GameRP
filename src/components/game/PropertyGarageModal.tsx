'use client';

import React, { useState } from 'react';
import {
  Car,
  Warehouse,
  Key,
  ArrowUpRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Zap,
  Gauge,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import { PlayerStats, OwnedVehicle, PropertySpec } from '@/lib/types';
import { REAL_ESTATE, VEHICLES_CATALOG } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface PropertyGarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  housing: PlayerStats['housing'];
  ownedVehicles: string[];
  garageVehicles?: string[];
  onDriveVehicle: (vehicleId: string) => void;
  onUpdateGarageVehicles: (newGarageVehicles: string[]) => void;
  onAddNotification: (
    title: string,
    msg: string,
    type?: 'info' | 'warning' | 'success' | 'alert'
  ) => void;
}

export const PropertyGarageModal: React.FC<PropertyGarageModalProps> = ({
  isOpen,
  onClose,
  housing,
  ownedVehicles,
  garageVehicles,
  onDriveVehicle,
  onUpdateGarageVehicles,
  onAddNotification,
}) => {
  const [selectedBay, setSelectedBay] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentProperty: PropertySpec =
    REAL_ESTATE.find((r) => r.id === housing) || REAL_ESTATE[1];

  const capacity = currentProperty.garageCapacity || 2;
  const isBillionaire = currentProperty.id === 'ikoyi-mansion';

  // Determine currently parked vehicles in the physical garage
  // If garageVehicles is not set or empty, default to first `capacity` owned vehicles
  const parkedIds: string[] = (
    garageVehicles && garageVehicles.length > 0
      ? garageVehicles
      : ownedVehicles.slice(0, capacity)
  ).slice(0, capacity);

  // Vehicles owned but currently stored in valet / overflow
  const valetIds: string[] = ownedVehicles.filter((id) => !parkedIds.includes(id));

  const handleParkVehicle = (vehicleId: string) => {
    if (parkedIds.length >= capacity) {
      onAddNotification(
        'Garage is Full!',
        `Your ${currentProperty.name} holds ${capacity} vehicles maximum. Move a car to Valet Storage first!`,
        'warning'
      );
      return;
    }
    const nextParked = [...parkedIds, vehicleId];
    onUpdateGarageVehicles(nextParked);
    audioEngine.playVehicleIgnition();
    const vObj = VEHICLES_CATALOG.find((v) => v.id === vehicleId);
    onAddNotification(
      'Vehicle Parked in Garage',
      `${vObj?.name || 'Vehicle'} is now parked in your 3D garage bay!`,
      'success'
    );
  };

  const handleUnparkVehicle = (vehicleId: string) => {
    const nextParked = parkedIds.filter((id) => id !== vehicleId);
    onUpdateGarageVehicles(nextParked);
    audioEngine.playClick();
    const vObj = VEHICLES_CATALOG.find((v) => v.id === vehicleId);
    onAddNotification(
      'Moved to Valet Storage',
      `${vObj?.name || 'Vehicle'} moved to off-site storage. Bay is now open!`,
      'info'
    );
  };

  const handleSwapVehicle = (removeId: string, addId: string) => {
    const nextParked = parkedIds.map((id) => (id === removeId ? addId : id));
    onUpdateGarageVehicles(nextParked);
    audioEngine.playVehicleIgnition();
    const vObj = VEHICLES_CATALOG.find((v) => v.id === addId);
    onAddNotification(
      'Vehicle Swapped',
      `${vObj?.name || 'Vehicle'} placed into garage bay!`,
      'success'
    );
    setSelectedBay(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl bg-[#090d16] border rounded-3xl overflow-hidden shadow-[0_25px_90px_rgba(0,0,0,0.95)] text-white flex flex-col max-h-[90vh] ${
          isBillionaire
            ? 'border-amber-500/50 shadow-amber-500/10'
            : 'border-teal-500/35 shadow-teal-500/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isBillionaire
              ? 'bg-gradient-to-r from-amber-950/80 via-zinc-900 to-zinc-900 border-amber-500/30'
              : 'bg-gradient-to-r from-teal-950/80 via-zinc-900 to-zinc-900 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-lg ${
                isBillionaire
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-teal-500/20 border-teal-400/40 text-teal-300'
              }`}
            >
              <Warehouse size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-black ${
                    isBillionaire
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {isBillionaire ? '★ BILLIONAIRE SHOWROOM GARAGE' : 'RESIDENTIAL PROPERTY GARAGE'}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {currentProperty.district}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
                <span>{currentProperty.name}</span>
                <span className="text-xs font-mono font-normal text-zinc-400">
                  [{parkedIds.length} / {capacity} Bays Occupied]
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-2.5 bg-black/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400 gap-2">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-amber-400" />
            <span>
              Vehicles parked in these bays are physically rendered in your 3D property driveway / showroom!
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">
              {capacity - parkedIds.length} Available Spot{capacity - parkedIds.length === 1 ? '' : 's'}
            </span>
            <span>•</span>
            <span className="text-zinc-400">{valetIds.length} Stored in Valet</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. PHYSICAL PARKING BAYS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <span>• Physical Parking Bays ({capacity} Total Slots)</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                Drive out immediately or manage bay assignments
              </span>
            </div>

            <div
              className={`grid gap-3.5 ${
                capacity <= 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : capacity <= 4
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
              }`}
            >
              {Array.from({ length: capacity }).map((_, index) => {
                const vehicleId = parkedIds[index];
                const vehicle = vehicleId
                  ? VEHICLES_CATALOG.find((v) => v.id === vehicleId)
                  : null;

                if (vehicle) {
                  return (
                    <div
                      key={`bay-${index}`}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 relative transition-all ${
                        isBillionaire
                          ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : 'bg-zinc-900/90 border-teal-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
                          BAY 0{index + 1}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                          PARKED IN 3D
                        </span>
                      </div>

                      <div className="my-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">
                            {vehicle.category === 'super'
                              ? '🏎️'
                              : vehicle.category === 'suv'
                              ? '🚙'
                              : vehicle.category === 'plane'
                              ? '✈️'
                              : '🚗'}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white truncate">
                              {vehicle.name}
                            </h4>
                            <div className="text-[10px] font-mono text-zinc-400">
                              Plate: {vehicle.plate} • {vehicle.topSpeedKmh} KM/H
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => {
                            audioEngine.playVehicleIgnition();
                            onDriveVehicle(vehicle.id);
                            onClose();
                          }}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Key size={13} fill="currentColor" />
                          <span>Drive Out [ENTER]</span>
                        </button>

                        <button
                          onClick={() => handleUnparkVehicle(vehicle.id)}
                          className="w-full py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-semibold text-[10px] transition-all"
                        >
                          Move to Valet Storage
                        </button>
                      </div>
                    </div>
                  );
                }

                // Empty Bay Slot
                return (
                  <div
                    key={`empty-bay-${index}`}
                    className="p-4 rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/40 flex flex-col items-center justify-center text-center gap-2 min-h-[160px] hover:border-amber-400/50 transition-all group"
                  >
                    <span className="text-[10px] font-mono font-bold text-zinc-500 bg-black/40 px-2 py-0.5 rounded">
                      BAY 0{index + 1} • EMPTY
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-400 group-hover:border-amber-400/40 transition-colors">
                      <Plus size={18} />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      Empty Parking Slot
                    </div>
                    {valetIds.length > 0 && (
                      <span className="text-[10px] font-mono text-amber-300/80">
                        Select a car below to park here
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. VALET & OVERFLOW VEHICLES (Vehicles not currently parked in garage) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 border-t border-zinc-800 pt-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span>• Valet &amp; Remote Vehicle Storage ({valetIds.length} Vehicles)</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                Owned vehicles kept in off-site safe storage
              </span>
            </div>

            {valetIds.length === 0 ? (
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs font-mono text-zinc-400">
                {parkedIds.length > 0
                  ? 'All your owned vehicles are currently parked in your physical garage!'
                  : 'You do not own any vehicles yet. Visit Bennys Customs, NNPC or buy an Okada/Car on your EkoPhone!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {valetIds.map((vId) => {
                  const vehicle = VEHICLES_CATALOG.find((v) => v.id === vId);
                  if (!vehicle) return null;
                  const canPark = parkedIds.length < capacity;

                  return (
                    <div
                      key={`valet-${vId}`}
                      className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">
                          {vehicle.category === 'super'
                            ? '🏎️'
                            : vehicle.category === 'plane'
                            ? '✈️'
                            : '🚙'}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">
                            {vehicle.name}
                          </h5>
                          <div className="text-[10px] font-mono text-zinc-400">
                            {vehicle.topSpeedKmh} KM/H • Plate {vehicle.plate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {canPark ? (
                          <button
                            onClick={() => handleParkVehicle(vehicle.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-black border border-teal-500/40 font-mono text-[11px] font-bold transition-all"
                          >
                            Park Here
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              // Direct drive from valet
                              audioEngine.playVehicleIgnition();
                              onDriveVehicle(vehicle.id);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 text-zinc-300 hover:text-black font-mono text-[11px] font-bold transition-all"
                            title="Summon vehicle via valet"
                          >
                            Drive
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Real Estate Upgrade Suggestion */}
          {currentProperty.id !== 'ikoyi-mansion' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Need More Garage Space?
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Upgrade to the <span className="font-bold text-amber-300">Banana Island Billionaire Mega Mansion</span> to unlock a private <span className="font-bold text-white">8-Car Showroom Garage</span> with neon lighting!
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-mono font-bold text-amber-400 block">
                  Capacity: 8 Hypercars
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Available at Dynasty 8</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between text-xs font-mono text-zinc-500">
          <div>Property Garage System • NoPixel V Roleplay</div>
          <div>Press [ESC] to Exit Garage</div>
        </div>
      </div>
    </div>
  );
};
