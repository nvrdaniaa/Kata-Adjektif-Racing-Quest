import React from 'react';
import { Trophy, CheckCircle, XCircle, ArrowRight, Zap, Sparkles, Timer } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { BestLapRecord } from '../types';
import { formatLapTime } from '../utils/lapTimeManager';

interface Round1ClearModalProps {
  playerName: string;
  round1Score: number;
  correctCount: number;
  wrongCount: number;
  round1LapTimeMs: number;
  bestLapRecord: BestLapRecord | null;
  isNewBestLap: boolean;
  onProceedToRound2: () => void;
}

export const Round1ClearModal: React.FC<Round1ClearModalProps> = ({
  playerName,
  round1Score,
  correctCount,
  wrongCount,
  round1LapTimeMs,
  bestLapRecord,
  isNewBestLap,
  onProceedToRound2,
}) => {
  const percentage = Math.round((round1Score / 100) * 100);

  let motivationMessage = 'Permulaan yang hebat! Bersedia untuk pusingan seterusnya!';
  if (percentage >= 90) {
    motivationMessage = 'Luar biasa! Pemanduan mantap dan penguasaan kata adjektif yang sangat cemerlang!';
  } else if (percentage >= 70) {
    motivationMessage = 'Syabas! Anda semakin hampir menguasai sasaran pembelajaran KSSR Tahun 5!';
  } else {
    motivationMessage = 'Teruskan semangat juang anda! Cabaran Bonus menanti untuk meningkatkan markah anda!';
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-b from-slate-900 to-indigo-950 border-2 border-amber-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center text-white shadow-[0_20px_60px_rgba(245,158,11,0.25)] relative overflow-hidden">
        {/* Background glow ornament */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badge & Trophy */}
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg mb-4">
          <Trophy className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/15 border border-amber-400/40 rounded-full text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PUSINGAN 1 SELESAI</span>
        </div>

        <h2 className="font-racing text-2xl sm:text-3xl font-black text-white tracking-wide">
          TAHNIAH, {playerName.toUpperCase()}!
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
          {motivationMessage}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Markah P1</span>
            <span className="font-racing text-2xl font-black text-amber-400 tabular-nums">
              {round1Score}
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </span>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/50 p-3 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Betul</span>
            </span>
            <span className="font-racing text-2xl font-black text-emerald-400 tabular-nums">
              {correctCount}
              <span className="text-xs text-slate-500 font-normal"> / 10</span>
            </span>
          </div>

          <div className="bg-slate-900/90 border border-red-900/50 p-3 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>Salah</span>
            </span>
            <span className="font-racing text-2xl font-black text-red-400 tabular-nums">
              {wrongCount}
              <span className="text-xs text-slate-500 font-normal"> / 10</span>
            </span>
          </div>
        </div>

        {/* Lap Time & Record Performance Card */}
        <div
          className={`p-3.5 rounded-2xl mb-5 border text-left flex items-center justify-between ${
            isNewBestLap
              ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isNewBestLap ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Timer className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Masa Pusingan 1
                </span>
                {isNewBestLap && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    🔥 Rekod Baharu!
                  </span>
                )}
              </div>
              <div className="font-racing text-xl sm:text-2xl font-black text-amber-300 tabular-nums leading-none mt-0.5">
                {formatLapTime(round1LapTimeMs)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Rekod Terpantas
            </span>
            <span className="font-racing text-sm sm:text-base font-bold text-slate-200 tabular-nums">
              {bestLapRecord ? bestLapRecord.formattedTime : formatLapTime(round1LapTimeMs)}
            </span>
          </div>
        </div>

        {/* Bonus Challenge Teaser */}
        <div className="bg-slate-950/80 border border-indigo-900/60 p-3.5 rounded-2xl mb-6 text-left flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-racing text-sm font-bold text-indigo-300">CABARAN BONUS MENANTI:</div>
            <div className="text-xs text-slate-400 mt-0.5">
              5 hadiah bonus & 5 soalan baharu di litar malam. Raih sehingga <strong>+50 markah tambahan</strong>!
            </div>
          </div>
        </div>

        {/* Mandatory Action Button to proceed */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onProceedToRound2();
          }}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-racing font-extrabold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-98"
        >
          <span>TERUSKAN KE CABARAN BONUS</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
