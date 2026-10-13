'use client';

import React, { useState } from 'react';
import { X, Utensils, Heart, Zap, Smile } from 'lucide-react';
import { Vitals } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

interface AmalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCash: number;
  onEatPlate: (cost: number, hunger: number, energy: number, stressRelief: number) => void;
}

export const AmalaModal: React.FC<AmalaModalProps> = ({
  isOpen,
  onClose,
  playerCash,
  onEatPlate,
}) => {
  const [swallow, setSwallow] = useState<'amala' | 'pounded_yam' | 'eba'>('amala');
  const [soups, setSoups] = useState<string[]>(['ewedu', 'gbegiri']);
  const [meats, setMeats] = useState<string[]>(['goat_meat']);
  const [drink, setDrink] = useState<'maltina' | 'water' | 'chapman'>('maltina');

  if (!isOpen) return null;

  const swallowPrices = { amala: 1200, pounded_yam: 1500, eba: 800 };
  const meatPrices: { [key: string]: number } = {
    goat_meat: 1800,
    shaki: 1400,
    ponmo: 800,
    fish: 1500,
  };
  const drinkPrices = { maltina: 800, water: 300, chapman: 1800 };

  const totalCost =
    swallowPrices[swallow] +
    meats.reduce((sum, m) => sum + (meatPrices[m] || 0), 0) +
    drinkPrices[drink];

  const handleToggleMeat = (meat: string) => {
    setMeats((prev) =>
      prev.includes(meat) ? prev.filter((m) => m !== meat) : [...prev, meat]
    );
  };

  const handleOrder = () => {
    if (playerCash < totalCost) {
      alert('Mama Shitta says: "No credit today my pikin! Pay cash!"');
      return;
    }
    audioEngine.playEatFood();
    onEatPlate(totalCost, 75, 45, 35);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-amber-500 rounded-3xl overflow-hidden shadow-2xl text-white">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-700 to-yellow-600 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Utensils size={24} />
            <div>
              <h3 className="font-bold text-base">Amala Shitta Canteen (Surulere)</h3>
              <p className="text-xs text-amber-100">Hot Swallows, Soups & Assorted Meats</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20 text-white">
            <X size={18} />
          </button>
        </div>

        {/* Menu Options */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Swallow Selection */}
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase">1. Pick Your Swallow</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {[
                { id: 'amala', name: 'Black Amala', price: 1200 },
                { id: 'pounded_yam', name: 'Pounded Yam', price: 1500 },
                { id: 'eba', name: 'Yellow Eba', price: 800 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSwallow(item.id as typeof swallow)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    swallow === item.id
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <p className="font-bold">{item.name}</p>
                  <p className="text-[10px] text-zinc-400">₦{item.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Soup Combos */}
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase">2. Traditional Soups (Included)</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-center justify-between">
                <span>🍃 Ewedu & Gbegiri (Abula)</span>
                <span className="text-emerald-400 font-bold">✓ Free</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span>🍲 Rich Egusi & Bitterleaf</span>
                <span className="text-emerald-400 font-bold">✓ Free</span>
              </div>
            </div>
          </div>

          {/* Assorted Meats */}
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase">3. Assorted Obstacles (Meats)</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { id: 'goat_meat', name: 'Ogufe (Goat Meat)', price: 1800 },
                { id: 'shaki', name: 'Shaki (Towel Tripe)', price: 1400 },
                { id: 'ponmo', name: 'Soft Brown Ponmo', price: 800 },
                { id: 'fish', name: 'Fried Titus Fish', price: 1500 },
              ].map((item) => {
                const isSelected = meats.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleMeat(item.id)}
                    className={`p-2 rounded-xl border text-left text-xs transition-all flex justify-between items-center ${
                      isSelected
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="font-bold text-[11px]">₦{item.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drinks */}
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase">4. Ice Cold Drink</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {[
                { id: 'maltina', name: 'Cold Maltina', price: 800 },
                { id: 'chapman', name: 'Lagos Chapman', price: 1800 },
                { id: 'water', name: 'Pure Water / Eva', price: 300 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDrink(item.id as typeof drink)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all ${
                    drink === item.id
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <p className="font-bold">{item.name}</p>
                  <p className="text-[10px] text-zinc-400">₦{item.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Restored Vitals summary */}
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-around text-xs">
            <span className="text-emerald-400 flex items-center gap-1"><Heart size={14} /> +75 Hunger</span>
            <span className="text-yellow-400 flex items-center gap-1"><Zap size={14} /> +45 Energy</span>
            <span className="text-blue-400 flex items-center gap-1"><Smile size={14} /> -35 Stress</span>
          </div>

          {/* Order Action Button */}
          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
            <div>
              <span className="text-xs text-zinc-400">Bill Total:</span>
              <p className="font-black text-xl text-danfo-yellow">₦{totalCost.toLocaleString()}</p>
            </div>
            <button
              onClick={handleOrder}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-2.5 rounded-2xl text-xs active:scale-95 transition-all shadow-lg"
            >
              Chop Belleful (Eat Plate)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
