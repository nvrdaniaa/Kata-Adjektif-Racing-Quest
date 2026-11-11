import React from 'react';
import { FinalGameStats } from '../types';
import { downloadCertificatePdf } from '../utils/pdfGenerator';
import { Download, X, Award, CheckCircle, ShieldCheck } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface CertificatePreviewModalProps {
  stats: FinalGameStats;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({ stats, onClose }) => {
  const handleDownload = () => {
    soundManager.playButtonClick();
    downloadCertificatePdf(stats);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-full flex flex-col items-center">
        {/* Top Controls Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2 text-white font-racing text-lg font-bold">
            <Award className="w-5 h-5 text-amber-400" />
            <span>PRATONTON SIJIL PENCAPAIAN DIGITAL</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-racing font-bold text-sm rounded-xl shadow-lg transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun PDF</span>
            </button>

            <button
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Rendering Box (A4 Landscape aspect ratio 297/210 ≈ 1.414) */}
        <div className="w-full bg-[#fefcf6] text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border-8 border-amber-600/80 relative overflow-hidden aspect-[1.414/1] max-h-[80vh] flex flex-col justify-between">
          {/* Inner Decorative Double Border */}
          <div className="absolute inset-2 border-2 border-amber-500/50 pointer-events-none rounded-lg" />
          <div className="absolute inset-3 border border-amber-400/30 pointer-events-none" />

          {/* Top Header */}
          <div className="text-center relative z-10">
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-wider uppercase">
              KEMENTERIAN PENDIDIKAN MALAYSIA • KURIKULUM STANDARD SEKOLAH RENDAH (KSSR)
            </div>
            <div className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase mt-0.5">
              BAHASA MELAYU TAHUN 5 • TATABAHASA (SP 5.1.3: KATA ADJEKTIF)
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-amber-800 tracking-wider mt-2 sm:mt-3 uppercase">
              SIJIL PENCAPAIAN
            </h1>

            <div className="text-xs sm:text-sm font-racing font-bold text-slate-800 tracking-widest uppercase mt-0.5">
              KATA ADJEKTIF RACING QUEST
            </div>

            <div className="w-32 h-0.5 bg-amber-600 mx-auto mt-2" />
          </div>

          {/* Recipient Section */}
          <div className="text-center my-auto py-2 relative z-10">
            <p className="text-xs sm:text-sm text-slate-600 italic">Dengan ini diperakui bahawa</p>
            <h2 className="font-serif text-xl sm:text-3xl font-black text-slate-950 uppercase tracking-wide my-1.5 sm:my-2 border-b-2 border-amber-500/60 inline-block px-6">
              {stats.playerName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
              telah berjaya menyelesaikan cabaran pembelajaran interaktif Bahasa Melayu Tahun 5 bagi topik <strong>Kata Adjektif</strong> dan menguasai kemahiran memahami serta menggunakan pelbagai kata adjektif mengikut konteks.
            </p>
          </div>

          {/* Metric Summary Badges */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 my-2 relative z-10">
            <div className="bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center shadow-xs">
              <div className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">JUMLAH MARKAH</div>
              <div className="font-racing text-sm sm:text-xl font-black text-slate-900 mt-0.5">
                {stats.totalScore} <span className="text-[10px] text-slate-500 font-normal">/ 150</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center shadow-xs">
              <div className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">PENGUASAAN</div>
              <div className="font-racing text-sm sm:text-xl font-black text-emerald-700 mt-0.5">
                {stats.masteryPercentage}%
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center shadow-xs">
              <div className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">KATEGORI</div>
              <div className="font-racing text-[10px] sm:text-sm font-black text-amber-700 mt-1 truncate">
                {stats.achievementTier}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-center shadow-xs">
              <div className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase">STATUS JAWAPAN</div>
              <div className="font-racing text-sm sm:text-xl font-black text-blue-700 mt-0.5">
                {stats.correctCount} <span className="text-[10px] text-slate-500 font-normal">/ 15</span>
              </div>
            </div>
          </div>

          {stats.bestLapTime && (
            <div className="text-center text-[10px] sm:text-xs text-amber-800 font-racing font-bold tracking-wider my-0.5 relative z-10">
              ⚡ REKOD MASA PUSINGAN LITAR: {stats.bestLapTime}
            </div>
          )}

          {/* Footer Signature & Seal */}
          <div className="flex items-end justify-between pt-2 border-t border-slate-200 relative z-10 text-[10px] sm:text-xs">
            <div className="text-left">
              <span className="font-bold text-slate-500 block uppercase text-[9px] sm:text-[10px]">TARIKH PENYELESAIAN</span>
              <span className="font-semibold text-slate-800">{stats.completionDate}</span>
            </div>

            {/* Emblem */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-600 bg-amber-100 flex items-center justify-center text-amber-800 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[8px] font-bold text-amber-800 mt-0.5">SP 5.1.3 LULUS</span>
            </div>

            <div className="text-right">
              <span className="font-bold text-slate-500 block uppercase text-[9px] sm:text-[10px]">GURU / PENDIDIK</span>
              <div className="w-32 border-b border-slate-400 mt-4 mb-0.5" />
              <span className="text-[9px] text-slate-400 italic">(Tandatangan & Cop)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
