import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { FinalGameStats } from '../types';
import { downloadCertificatePdf } from '../utils/pdfGenerator';
import { CertificatePreviewModal } from './CertificatePreviewModal';
import { Trophy, Award, Eye, Download, RotateCcw, CheckCircle, XCircle, Sparkles, Star, Timer, Zap } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface FinalResultsModalProps {
  stats: FinalGameStats;
  onPlayAgain: () => void;
}

export const FinalResultsModal: React.FC<FinalResultsModalProps> = ({ stats, onPlayAgain }) => {
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);

  useEffect(() => {
    soundManager.playFanfare();

    // Trigger celebratory confetti fireworks
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#ffffff'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#ffffff'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleDownload = () => {
    soundManager.playButtonClick();
    downloadCertificatePdf(stats);
  };

  const getTrophyColor = (tier: string) => {
    switch (tier) {
      case 'PELUMBA LEGENDA':
        return 'from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-amber-500/30';
      case 'PELUMBA JUARA':
        return 'from-yellow-500 via-amber-400 to-yellow-600 text-slate-950 shadow-yellow-500/30';
      case 'PELUMBA BERPOTENSI':
        return 'from-slate-300 via-slate-200 to-slate-400 text-slate-950 shadow-slate-300/30';
      default:
        return 'from-amber-700 via-orange-600 to-amber-800 text-white shadow-amber-700/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-3xl w-full p-5 sm:p-8 text-white shadow-2xl relative my-auto">
        {/* Top Header Badge */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-400/20 border border-amber-400/50 rounded-full text-xs font-bold text-amber-300 uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KEPUTUSAN AKHIR PERLUMBAAN</span>
          </div>

          <h1 className="font-racing text-3xl sm:text-5xl font-black text-white tracking-wide uppercase">
            TAHNIAH, {stats.playerName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Anda telah melengkapkan kedua-dua pusingan dengan jayanya. Sijil digital anda telah sedia!
          </p>
        </div>

        {/* Hero Trophy & Tier Badge */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${getTrophyColor(
                stats.achievementTier
              )} flex items-center justify-center shadow-lg shrink-0`}
            >
              <Trophy className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori Pencapaian</div>
              <div className="font-racing text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">
                {stats.achievementTier}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {stats.masteryPercentage >= 80
                  ? '✨ Sasaran Penguasaan DSKP (>= 80%) Berjaya Dicapai!'
                  : 'Teruskan usaha untuk mencapai sasaran penguasaan 80%!'}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/40 px-5 py-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peratus Penguasaan</div>
            <div className="font-racing text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">
              {stats.masteryPercentage}%
            </div>
          </div>
        </div>

        {/* Detailed Scores Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pusingan 1</span>
            <span className="font-racing text-xl font-bold text-white tabular-nums">
              {stats.round1Score} <span className="text-xs text-slate-500">/ 100</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cabaran Bonus</span>
            <span className="font-racing text-xl font-bold text-white tabular-nums">
              {stats.round2Score} <span className="text-xs text-slate-500">/ 50</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/40 p-3 rounded-xl text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Jumlah Markah</span>
            <span className="font-racing text-xl font-black text-amber-400 tabular-nums">
              {stats.totalScore} <span className="text-xs text-slate-500">/ 150</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Betul / Salah</span>
            <span className="font-racing text-xl font-bold text-emerald-400 tabular-nums">
              {stats.correctCount}{' '}
              <span className="text-xs text-slate-500 font-normal">/ {stats.wrongCount} salah</span>
            </span>
          </div>
        </div>

        {/* Lap Times & Best Lap Record Banner */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                stats.isNewBestLap
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg'
                  : 'bg-slate-800 text-amber-400'
              }`}
            >
              <Timer className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Rekod Masa Pusingan Terpantas (Best Lap)
                </span>
                {stats.isNewBestLap && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                    🔥 Rekod Baharu Dicatat!
                  </span>
                )}
              </div>
              <div className="font-racing text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                {stats.bestLapTime || '--:--.--'}
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.isNewBestLap
                  ? 'Syabas! Anda telah memperbaiki catatan masa terpantas dalam sesi ini!'
                  : 'Rekod masa terbaik disimpan secara setempat dalam peranti anda.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end text-xs">
            {stats.round1LapTime && (
              <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Masa P1</div>
                <div className="font-racing text-sm font-bold text-slate-200 tabular-nums">
                  {stats.round1LapTime}
                </div>
              </div>
            )}
            {stats.round2LapTime && (
              <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Masa P2 (Bonus)</div>
                <div className="font-racing text-sm font-bold text-slate-200 tabular-nums">
                  {stats.round2LapTime}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown (Analisis Kata Adjektif) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="font-racing text-sm font-bold text-slate-200 uppercase tracking-wide">
                Analisis Penguasaan Mengikut Jenis Kata Adjektif
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Berdasarkan 15 Soalan Dijawab</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {stats.categoryAnalysis.map((item) => (
              <div
                key={item.category}
                className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200">{item.category}</div>
                  <div className="text-[10px] text-slate-400">
                    {item.correct}/{item.total} betul ({item.percentage}%)
                  </div>
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-racing font-bold text-xs ${
                    item.percentage === 100
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : item.percentage > 0
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Main Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setShowCertificatePreview(true);
            }}
            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-racing font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>LIHAT SIJIL</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl font-racing font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>MUAT TURUN SIJIL PDF</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onPlayAgain();
            }}
            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-racing font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>MAIN SEMULA</span>
          </button>
        </div>
      </div>

      {/* In-App Certificate Preview Modal */}
      {showCertificatePreview && (
        <CertificatePreviewModal stats={stats} onClose={() => setShowCertificatePreview(false)} />
      )}
    </div>
  );
};
