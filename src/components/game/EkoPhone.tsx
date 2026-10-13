'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Wallet,
  Briefcase,
  MessageCircle,
  ShoppingBag,
  Home,
  Zap,
  X,
  Send,
  PlusCircle,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Fuel,
} from 'lucide-react';
import { PlayerStats, Vitals, TweetItem } from '@/lib/types';
import { JOBS_DATABASE, FOOD_MENU, REAL_ESTATE, INITIAL_TWEETS } from '@/lib/gameState';
import { audioEngine } from '@/lib/audioEngine';

interface EkoPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  vitals: Vitals;
  isNepaActive: boolean;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onUpdateVitals: (updater: (prev: Vitals) => Vitals) => void;
  onStartMiniGame: (gameId: 'danfo' | 'techbro' | 'afrobeats') => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'alert') => void;
}

type PhoneApp = 'home' | 'bank' | 'jobs' | 'twitter' | 'food' | 'realestate' | 'power';

export const EkoPhone: React.FC<EkoPhoneProps> = ({
  isOpen,
  onClose,
  player,
  vitals,
  isNepaActive,
  onUpdatePlayer,
  onUpdateVitals,
  onStartMiniGame,
  onAddNotification,
}) => {
  const [activeApp, setActiveApp] = useState<PhoneApp>('home');
  const [tweets, setTweets] = useState<TweetItem[]>(INITIAL_TWEETS);
  const [newTweetText, setNewTweetText] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [loanInput, setLoanInput] = useState('');

  if (!isOpen) return null;

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG');
  };

  // Banking Actions
  const handleDeposit = () => {
    const val = parseInt(transferAmount);
    if (!val || val <= 0) return;
    if (player.cash < val) {
      alert('Insufficient cash in hand!');
      return;
    }
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash - val,
      bankBalance: prev.bankBalance + val,
    }));
    setTransferAmount('');
    onAddNotification('Deposit Successful', `Deposited ${formatNaira(val)} into Kuda Bank.`, 'success');
  };

  const handleWithdraw = () => {
    const val = parseInt(transferAmount);
    if (!val || val <= 0) return;
    if (player.bankBalance < val) {
      alert('Insufficient bank balance!');
      return;
    }
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash + val,
      bankBalance: prev.bankBalance - val,
    }));
    setTransferAmount('');
    onAddNotification('Cash Withdrawn', `Withdrew ${formatNaira(val)} from ATM.`, 'info');
  };

  const handleTakeLoan = () => {
    const val = parseInt(loanInput);
    if (!val || val <= 0) return;
    if (val > 100000) {
      alert('LAPO max microloan is ₦100,000 for safety!');
      return;
    }
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash + val,
      loanBalance: prev.loanBalance + Math.round(val * 1.15), // 15% interest
    }));
    setLoanInput('');
    onAddNotification('LAPO Loan Approved', `Received ${formatNaira(val)}. Remember interest is 15%!`, 'warning');
  };

  const handleRepayLoan = () => {
    if (player.loanBalance <= 0) return;
    const payment = Math.min(player.cash, player.loanBalance);
    if (payment <= 0) {
      alert('You have no cash to pay!');
      return;
    }
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash - payment,
      loanBalance: prev.loanBalance - payment,
    }));
    onAddNotification('Loan Repayment', `Paid ${formatNaira(payment)} toward your LAPO debt.`, 'success');
  };

  // Fuel & Power
  const handleBuyFuel = (litres: number) => {
    const cost = litres * 1150; // ₦1,150 per litre
    if (player.cash < cost) {
      alert('You cannot afford this fuel! Check ATM or work a shift.');
      return;
    }
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash - cost,
      inventory: {
        ...prev.inventory,
        generatorFuelLitres: prev.inventory.generatorFuelLitres + litres,
      },
    }));
    onAddNotification('Fuel Purchased', `Bought ${litres}L of PMS fuel at filling station.`, 'success');
  };

  // Job Work
  const handleWorkJob = (job: typeof JOBS_DATABASE[0]) => {
    if (vitals.energy < job.energyCost) {
      alert('You are too exhausted! Eat some Amala or sleep to regain energy.');
      return;
    }
    if (vitals.streetCred < job.reqCred) {
      alert(`You need ${job.reqCred} Street Cred to qualify for this role!`);
      return;
    }

    // Launch dedicated mini-games for special jobs
    if (job.id === 'danfo_conductor') {
      onClose();
      onStartMiniGame('danfo');
      return;
    }
    if (job.id === 'tech_bro_dev') {
      onClose();
      onStartMiniGame('techbro');
      return;
    }
    if (job.id === 'afrobeats_producer') {
      onClose();
      onStartMiniGame('afrobeats');
      return;
    }

    // Standard work shift
    audioEngine.playCashEarn();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash + job.salaryPerShift,
      job: job.title,
    }));
    onUpdateVitals((prev) => ({
      ...prev,
      energy: Math.max(0, prev.energy - job.energyCost),
      stress: Math.min(100, prev.stress + job.stressGain),
      streetCred: Math.min(100, prev.streetCred + 4),
    }));
    onAddNotification('Shift Completed', `Earned ${formatNaira(job.salaryPerShift)} working as ${job.title}!`, 'success');
  };

  // Food Order
  const handleOrderFood = (item: typeof FOOD_MENU[0]) => {
    if (player.cash < item.price) {
      alert('Insufficient funds to chop this delicacy!');
      return;
    }
    audioEngine.playEatFood();
    onUpdatePlayer((prev) => ({
      ...prev,
      cash: prev.cash - item.price,
    }));
    onUpdateVitals((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + item.hungerRestore),
      energy: Math.min(100, prev.energy + item.energyRestore),
      stress: Math.max(0, prev.stress - item.stressRelief),
    }));
    onAddNotification('Belle Sweet!', `Enjoyed ${item.name}. Vitals restored!`, 'success');
  };

  // Post Tweet
  const handlePostTweet = () => {
    if (!newTweetText.trim()) return;
    audioEngine.playClick();
    const newTweet: TweetItem = {
      id: 't-' + Date.now(),
      author: player.name,
      handle: '@' + player.name.toLowerCase().replace(/\s+/g, '_'),
      avatarColor: player.origin === 'nepo' ? '#3B82F6' : '#EAB308',
      verified: player.origin === 'nepo',
      content: newTweetText,
      likes: Math.floor(Math.random() * 80) + 12,
      retweets: Math.floor(Math.random() * 25) + 3,
      timeAgo: 'Just now',
    };
    setTweets([newTweet, ...tweets]);
    setNewTweetText('');
    onUpdateVitals((prev) => ({
      ...prev,
      streetCred: Math.min(100, prev.streetCred + 2),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Smartphone Chassis */}
      <div className="relative w-full max-w-[380px] h-[720px] max-h-[92vh] bg-zinc-950 rounded-[48px] border-[6px] border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Phone Speaker Notch & Camera Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
          <div className="w-12 h-1 bg-zinc-800 rounded-full" />
        </div>

        {/* Status Bar */}
        <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[11px] font-semibold text-zinc-400 select-none z-20">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-2">
            <span>5G (MTN NG)</span>
            <div className="w-5 h-2.5 border border-zinc-400 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
          title="Close Phone"
        >
          <X size={16} />
        </button>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">
          
          {/* HOME SCREEN */}
          {activeApp === 'home' && (
            <div className="space-y-4 pt-4">
              {/* Profile Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 shadow-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border border-white/20"
                    style={{ backgroundColor: player.outfit.color }}
                  >
                    🇳🇬
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-1.5">
                      {player.name}
                      {player.origin === 'nepo' && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">NEPO</span>}
                      {player.origin === 'lapo' && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">LAPO</span>}
                    </h3>
                    <p className="text-xs text-zinc-400">{player.tagline}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-700/40 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Cash in Pocket:</span>
                    <p className="font-bold text-danfo-yellow text-sm">{formatNaira(player.cash)}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Bank Balance:</span>
                    <p className="font-bold text-emerald-400 text-sm">{formatNaira(player.bankBalance)}</p>
                  </div>
                </div>
              </div>

              {/* Grid of Apps */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => { audioEngine.playClick(); setActiveApp('bank'); }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Wallet size={24} />
                  </div>
                  <span className="text-xs font-medium">Kuda Bank</span>
                </button>

                <button
                  onClick={() => { audioEngine.playClick(); setActiveApp('jobs'); }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Briefcase size={24} />
                  </div>
                  <span className="text-xs font-medium">Hustle HQ</span>
                </button>

                <button
                  onClick={() => { audioEngine.playClick(); setActiveApp('twitter'); }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <MessageCircle size={24} />
                  </div>
                  <span className="text-xs font-medium">Lagos X</span>
                </button>

                <button
                  onClick={() => { audioEngine.playClick(); setActiveApp('food'); }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <ShoppingBag size={24} />
                  </div>
                  <span className="text-xs font-medium">ChopChop</span>
                </button>

                <button
                  onClick={() => { audioEngine.playClick(); setActiveApp('realestate'); }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Home size={24} />
                  </div>
                  <span className="text-xs font-medium">Lagos Haven</span>
                </button>

                <button
                  onClick={() => { audioEngine.playClick(); setActiveApp('power'); }}
                  className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-yellow-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-yellow-600/20 text-yellow-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Zap size={24} />
                  </div>
                  <span className="text-xs font-medium">NEPA & Gen</span>
                </button>
              </div>

              {/* Live Lagos Ticker */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5">
                <span className="text-lg">📢</span>
                <p className="text-xs text-zinc-300">
                  {isNepaActive ? '⚡ NEPA is currently ON in your district!' : '⚠️ NEPA blackout active! Generators running.'}
                </p>
              </div>
            </div>
          )}

          {/* BANK APP */}
          {activeApp === 'bank' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveApp('home')}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Apps
                </button>
                <h3 className="font-bold text-sm text-emerald-400">Kuda Microfinance Bank</h3>
                <div className="w-8" />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-xs text-emerald-300">Total Savings</span>
                <p className="text-2xl font-black text-white mt-1">{formatNaira(player.bankBalance)}</p>
                <p className="text-[11px] text-emerald-400/80 mt-1">Cash in Hand: {formatNaira(player.cash)}</p>
              </div>

              {/* Deposit / Withdraw */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-zinc-400">Transfer & Cash Flow</h4>
                <input
                  type="number"
                  placeholder="Amount in ₦"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeposit}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
                  >
                    Deposit Cash
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
                  >
                    Withdraw ATM
                  </button>
                </div>
              </div>

              {/* LAPO Micro-Loans */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/20 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold uppercase text-amber-400">LAPO Micro-Loan</h4>
                  <span className="text-[11px] text-zinc-400">15% Interest</span>
                </div>
                {player.loanBalance > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Debt Outstanding:</span>
                      <span className="font-bold text-rose-400">{formatNaira(player.loanBalance)}</span>
                    </div>
                    <button
                      onClick={handleRepayLoan}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      Repay Debt from Cash
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Loan amount (max ₦100,000)"
                      value={loanInput}
                      onChange={(e) => setLoanInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleTakeLoan}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      Apply for Instant Loan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* JOBS APP */}
          {activeApp === 'jobs' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveApp('home')}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Apps
                </button>
                <h3 className="font-bold text-sm text-blue-400">Hustle HQ Job Board</h3>
                <div className="w-8" />
              </div>

              <div className="space-y-3">
                {JOBS_DATABASE.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/40 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-white">{job.title}</h4>
                        <p className="text-[11px] text-zinc-400">{job.company} • {job.district}</p>
                      </div>
                      <span className="font-black text-xs text-emerald-400">
                        +{formatNaira(job.salaryPerShift)}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300">{job.description}</p>

                    <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                      <span>⚡ Cost: -{job.energyCost} Energy</span>
                      <span>⭐ Req Cred: {job.reqCred}</span>
                    </div>

                    <button
                      onClick={() => handleWorkJob(job)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      {job.id === 'danfo_conductor' || job.id === 'tech_bro_dev' || job.id === 'afrobeats_producer'
                        ? 'Play Mini-Game Shift'
                        : 'Work Shift Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TWITTER APP */}
          {activeApp === 'twitter' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveApp('home')}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Apps
                </button>
                <h3 className="font-bold text-sm text-sky-400">Lagos X (Twitter)</h3>
                <div className="w-8" />
              </div>

              {/* Compose Tweet */}
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <textarea
                  rows={2}
                  placeholder="Wetin dey happen for your area? 🐦"
                  value={newTweetText}
                  onChange={(e) => setNewTweetText(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-zinc-500 resize-none focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handlePostTweet}
                    className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-3 py-1 rounded-full text-xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Send size={12} /> Tweet
                  </button>
                </div>
              </div>

              {/* Tweet Timeline */}
              <div className="space-y-2.5">
                {tweets.map((tweet) => (
                  <div
                    key={tweet.id}
                    className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: tweet.avatarColor }}
                        >
                          {tweet.author[0]}
                        </div>
                        <span className="font-bold text-xs text-white">{tweet.author}</span>
                        {tweet.verified && <span className="text-[10px] text-sky-400">✓</span>}
                        <span className="text-[10px] text-zinc-500">{tweet.handle}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{tweet.timeAgo}</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{tweet.content}</p>
                    <div className="flex gap-4 text-[10px] text-zinc-400 pt-1">
                      <span>❤️ {tweet.likes.toLocaleString()}</span>
                      <span>🔄 {tweet.retweets.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOD APP */}
          {activeApp === 'food' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveApp('home')}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Apps
                </button>
                <h3 className="font-bold text-sm text-amber-400">ChopChop Express Delivery</h3>
                <div className="w-8" />
              </div>

              <div className="space-y-2.5">
                {FOOD_MENU.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-white">{item.name}</h4>
                      <span className="font-black text-xs text-danfo-yellow">{formatNaira(item.price)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{item.desc}</p>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>🍗 +{item.hungerRestore} Hunger</span>
                      <span>⚡ +{item.energyRestore} Energy</span>
                      <span>🧘 -{item.stressRelief} Stress</span>
                    </div>
                    <button
                      onClick={() => handleOrderFood(item)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-1.5 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      Chop This Plate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REAL ESTATE */}
          {activeApp === 'realestate' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveApp('home')}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Apps
                </button>
                <h3 className="font-bold text-sm text-purple-400">Lagos Haven Estates</h3>
                <div className="w-8" />
              </div>

              <div className="space-y-2.5">
                {REAL_ESTATE.map((prop) => {
                  const isCurrent = player.housing === prop.id;
                  return (
                    <div
                      key={prop.id}
                      className={`p-3 rounded-2xl bg-zinc-900 border transition-all space-y-2 ${
                        isCurrent ? 'border-purple-500 shadow-md shadow-purple-500/20' : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-white">{prop.name}</h4>
                          <span className="text-[10px] text-zinc-400">Comfort: {prop.comfort}/100</span>
                        </div>
                        <span className="font-bold text-xs text-purple-300">
                          {prop.rent === 0 ? 'Free' : formatNaira(prop.rent) + '/mo'}
                        </span>
                      </div>

                      {isCurrent ? (
                        <div className="bg-purple-900/30 border border-purple-500/40 text-purple-200 text-center py-1 rounded-xl text-xs font-semibold">
                          Current Residence
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (player.cash < prop.deposit) {
                              alert(`You need ${formatNaira(prop.deposit)} for agency and rent deposit!`);
                              return;
                            }
                            if (vitals.streetCred < prop.credReq) {
                              alert(`The landlord requires at least ${prop.credReq} Street Cred!`);
                              return;
                            }
                            audioEngine.playCashEarn();
                            onUpdatePlayer((prev) => ({
                              ...prev,
                              cash: prev.cash - prop.deposit,
                              housing: prop.id as typeof prev.housing,
                              rentAmount: prop.rent,
                            }));
                            onAddNotification('New Apartment!', `Moved into ${prop.name}! Comfort boosted.`, 'success');
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded-xl text-xs active:scale-95 transition-all"
                        >
                          Rent (Deposit: {formatNaira(prop.deposit)})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* POWER & NEPA APP */}
          {activeApp === 'power' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveApp('home')}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  ← Apps
                </button>
                <h3 className="font-bold text-sm text-yellow-400">Power & NEPA Monitor</h3>
                <div className="w-8" />
              </div>

              <div
                className={`p-4 rounded-2xl border text-center space-y-1 ${
                  isNepaActive
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <span className="text-3xl">{isNepaActive ? '⚡' : '🕯️'}</span>
                <h4 className="font-bold text-sm">
                  {isNepaActive ? 'National Grid: ONLINE (Up NEPA!)' : 'National Grid: BLACKOUT'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {isNepaActive
                    ? 'All electronic devices running on main power.'
                    : 'Switch on generator or solar inverter to keep working.'}
                </p>
              </div>

              {/* Generator Info */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300">"I Pass My Neighbor" Gen:</span>
                  <span className="font-bold text-yellow-400">
                    {player.inventory.generator ? 'Owned ✅' : 'Not Owned ❌'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Fuel Level:</span>
                  <span className="font-bold text-amber-300">
                    {player.inventory.generatorFuelLitres} Litres
                  </span>
                </div>

                {!player.inventory.generator && (
                  <button
                    onClick={() => {
                      if (player.cash < 85000) {
                        alert('A brand new Tiger generator costs ₦85,000!');
                        return;
                      }
                      audioEngine.playCashEarn();
                      onUpdatePlayer((prev) => ({
                        ...prev,
                        cash: prev.cash - 85000,
                        inventory: { ...prev.inventory, generator: true, generatorFuelLitres: 10 },
                      }));
                      onAddNotification('Generator Acquired!', 'Bought a reliable Tiger gen with 10L fuel.', 'success');
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-xl text-xs active:scale-95 transition-all"
                  >
                    Buy Generator (₦85,000)
                  </button>
                )}

                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <h5 className="text-[11px] font-semibold text-zinc-400">Buy Petrol at NNPC Station</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleBuyFuel(5)}
                      className="bg-zinc-800 hover:bg-zinc-700 py-1.5 rounded-xl text-xs font-semibold"
                    >
                      5L (₦5,750)
                    </button>
                    <button
                      onClick={() => handleBuyFuel(20)}
                      className="bg-zinc-800 hover:bg-zinc-700 py-1.5 rounded-xl text-xs font-semibold"
                    >
                      20L Keg (₦23,000)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Home Bar Indicator */}
        <div className="py-2.5 flex justify-center bg-zinc-950">
          <button
            onClick={() => setActiveApp('home')}
            className="w-32 h-1 bg-zinc-600 rounded-full hover:bg-white active:scale-95 transition-all"
          />
        </div>

      </div>
    </div>
  );
};
