import React from 'react';
import { Volume2, VolumeX, Pause, Play, Gift, Award, Gauge, Timer, Trophy } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { BestLapRecord } from '../types';
import { formatLapTime } from '../utils/lapTimeManager';

interface GameHUDProps {
  playerName: string;
  round: 1 | 2;
  currentScore: number;
  maxScorePossible: number;
  collectedGifts: number;
  totalGiftsInRound: number;
  answeredQuestions: number;
  speedKmH: number;
  lapProgress: number;
  currentLapTimeMs: number;
  bestLapRecord: BestLapRecord | null;
  isPaused: boolean;
  onTogglePause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerName,
  round,
  currentScore,
  maxScorePossible,
  collectedGifts,
  totalGiftsInRound,
  answeredQuestions,
  speedKmH,
  lapProgress,
  currentLapTimeMs,
  bestLapRecord,
  isPaused,
  onTogglePause,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* Top Bar Status Clusters */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Player Profile & Round Info */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-racing text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-[200px]">
              {playerName || 'Pelumba'}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {round === 1 ? 'Pusingan 1' : 'Cabaran Bonus'}
            </span>
          </div>

          {/* Mini Track Progress Bar */}
          <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl w-48 sm:w-56 shadow-lg">
            <div className="flex justify-between text-[10px] font-semibold text-slate-300 mb-1">
              <span>LITAR PERLUMBAAN</span>
              <span className="font-racing tabular-nums text-amber-400">{Math.round(lapProgress * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, lapProgress * 100))}%` }}
              />
            </div>
          </div>

          {/* Active Lap Timer & Best Record Display */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl w-48 sm:w-56 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Masa Pusingan</span>
                <span className="font-racing text-xs sm:text-sm font-black text-amber-300 tabular-nums leading-none">
                  {formatLapTime(currentLapTimeMs)}
                </span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                <Trophy className="w-2.5 h-2.5 text-yellow-500" />
                <span>Terbaik</span>
              </span>
              <span className="font-racing text-[11px] sm:text-xs font-bold text-slate-200 tabular-nums leading-none">
                {bestLapRecord ? bestLapRecord.formattedTime : '--:--.--'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Score & Gifts Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Score Counter */}
          <div className="bg-slate-900/90 border border-amber-500/50 px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Markah</span>
              <span className="font-racing text-base sm:text-xl font-black text-amber-400 tabular-nums leading-none">
                {currentScore} <span className="text-xs text-slate-400 font-normal">/ {maxScorePossible}</span>
              </span>
            </div>
          </div>

          {/* Collectible Gifts */}
          <div className="bg-slate-900/90 border border-blue-500/40 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <Gift className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hadiah</span>
              <span className="font-racing text-base sm:text-xl font-black text-blue-400 tabular-nums leading-none">
                {collectedGifts} <span className="text-xs text-slate-400 font-normal">/ {totalGiftsInRound}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls Cluster (Pause, Sound) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onTogglePause();
            }}
            className="p-2 sm:px-3 sm:py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title={isPaused ? 'Sambung Permainan' : 'Jeda Permainan'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isPaused ? 'Sambung' : 'Jeda'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 sm:px-3 sm:py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title={isMuted ? 'Buka Bunyi' : 'Bisu'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </div>

      {/* Pause Screen Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-40">
          <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="font-racing text-3xl font-black text-amber-400 tracking-wider mb-2">
              PERMAINAN DIJEDA
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              Ambil nafas dan bersedia untuk mengawal jentera lumba anda semula!
            </p>
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onTogglePause();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-racing font-extrabold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>SAMBUNG PERLUMBAAN</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Perimeter: Speedometer & Keyboard Hint */}
      <div className="flex items-end justify-between gap-3">
        {/* Left: Speedometer Gauge */}
        <div className="bg-slate-900/85 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kelajuan</div>
            <div className="font-racing text-2xl font-black text-white tabular-nums leading-none">
              {speedKmH}{' '}
              <span className="text-xs font-semibold text-amber-400 uppercase">km/j</span>
            </div>
          </div>
        </div>

        {/* Center: Control Hints */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/70 border border-slate-800/80 px-4 py-1.5 rounded-full text-xs text-slate-300 font-medium">
          <span className="font-racing text-amber-400 font-bold">Kekunci:</span>
          <span>W / ↑ Pecut</span>
          <span>•</span>
          <span>A/D / ←/→ Belok</span>
          <span>•</span>
          <span>S / ↓ Brek</span>
        </div>

        {/* Right: Question progress counter */}
        <div className="bg-slate-900/85 border border-slate-800 px-3.5 py-2.5 rounded-2xl shadow-xl text-right pointer-events-auto">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Soalan Selesai</div>
          <div className="font-racing text-lg font-black text-emerald-400 tabular-nums">
            {answeredQuestions} <span className="text-xs text-slate-400 font-normal">/ {round === 1 ? 10 : 15}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
