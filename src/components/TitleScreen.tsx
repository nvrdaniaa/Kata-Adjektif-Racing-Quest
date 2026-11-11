import React, { useState } from 'react';
import { Play, BookOpen, HelpCircle, Trophy, Volume2, VolumeX, Sparkles, AlertCircle, Timer, RotateCcw } from 'lucide-react';
import { CAR_MODELS } from '../data/questions';
import { CarConfig, BestLapRecord } from '../types';
import { soundManager } from '../audio/soundManager';

interface TitleScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  selectedCar: CarConfig;
  onSelectCar: (car: CarConfig) => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  bestLapRecord: BestLapRecord | null;
  onClearBestLapRecord?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  playerName,
  onPlayerNameChange,
  selectedCar,
  onSelectCar,
  onStartGame,
  isMuted,
  onToggleMute,
  bestLapRecord,
  onClearBestLapRecord,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleStart = () => {
    if (!playerName.trim()) {
      setValidationError('Sila masukkan nama anda sebelum memulakan perlumbaan!');
      return;
    }
    setValidationError('');
    soundManager.playButtonClick();
    onStartGame();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white overflow-y-auto">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Bar with DSKP Tag & Sound Toggle */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium text-amber-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>KSSR BAHASA MELAYU TAHUN 5 • SP 5.1.3</span>
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Bisu' : 'Bunyi Hidup'}</span>
        </button>
      </div>

      {/* Hero Title Lockup */}
      <div className="w-full max-w-4xl text-center z-10 my-4 md:my-5">
        <div className="inline-block relative">
          <h1 className="font-racing text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-wider uppercase italic drop-shadow-[0_4px_16px_rgba(59,130,246,0.6)] bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-500 bg-clip-text text-transparent">
            KATA ADJEKTIF
          </h1>
          <div className="font-racing text-2xl sm:text-4xl md:text-5xl font-black tracking-widest text-blue-400 uppercase italic mt-1 drop-shadow-md">
            RACING QUEST
          </div>
        </div>

        <p className="mt-2 text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto font-normal">
          Pandu jentera lumba anda, kutip kotak misteri di litar, dan sahut cabaran tatabahasa Tahun 5 untuk menjana <span className="text-amber-400 font-semibold">Sijil Pencapaian Digital KSSR</span>!
        </p>
      </div>

      {/* Local Best Lap Time Showcase Banner */}
      <div className="w-full max-w-3xl z-10 mb-4">
        {bestLapRecord ? (
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/95 to-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-4 shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
                <Timer className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                    Rekod Pusingan Terpantas (Local Best Lap)
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    • Disimpan dalam storan peranti anda
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-racing text-2xl sm:text-3xl font-black text-amber-400 tracking-wider tabular-nums">
                    {bestLapRecord.formattedTime}
                  </span>
                  <span className="text-xs text-slate-300">
                    oleh <strong className="text-white font-semibold">{bestLapRecord.playerName}</strong>
                    {bestLapRecord.carName ? ` (${bestLapRecord.carName})` : ''}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Dicatat pada: {bestLapRecord.date}
                  <span className="text-amber-400/90 ml-2 font-medium">
                    (Cuba tewaskan rekod masa ini dalam sesi kali ini!)
                  </span>
                </div>
              </div>
            </div>

            {onClearBestLapRecord && (
              <div className="self-end sm:self-center shrink-0">
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 bg-slate-950/90 border border-red-500/60 p-1.5 rounded-xl shadow-lg">
                    <span className="text-[11px] text-red-300 px-1 font-semibold">Padam rekod?</span>
                    <button
                      onClick={() => {
                        soundManager.playButtonClick();
                        onClearBestLapRecord();
                        setShowClearConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer transition active:scale-95"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playButtonClick();
                        setShowClearConfirm(false);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer transition"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      setShowClearConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-red-950/50 hover:border-red-500/40 border border-slate-700 rounded-xl text-xs font-medium text-slate-400 hover:text-red-300 transition cursor-pointer"
                    title="Set semula rekod masa pusingan tempatan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Set Semula</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-dashed border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-slate-400 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <Timer className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-300 flex items-center gap-2">
                  <span>MASA PUSINGAN TERPANTAS (BEST LAP):</span>
                  <span className="font-racing text-amber-400 text-base font-black">--:--.--</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Belum ada rekod tercatat. Pandu dengan laju dan jawab kuiz untuk mencipta rekod pertama anda!
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Setup Card (Player Name & Car Choice) */}
      <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl backdrop-blur-md z-10 space-y-6">
        {/* Name Input (Mandatory) */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            NAMA PEMAIN <span className="text-red-400 font-bold">* (Wajib diisi untuk Sijil)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                onPlayerNameChange(e.target.value);
                if (e.target.value.trim()) setValidationError('');
              }}
              placeholder="Contoh: Muhammad Haziq / Nur Aina"
              maxLength={40}
              className={`w-full px-4 py-3 bg-slate-950 border ${
                validationError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700 focus:border-amber-400'
              } rounded-xl text-white font-medium placeholder-slate-500 outline-none transition text-base md:text-lg`}
            />
          </div>
          {validationError && (
            <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Car Selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              Pilih Jentera Lumba Anda:
            </span>
            <span className="text-xs text-amber-400 font-bold font-racing">{selectedCar.name}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CAR_MODELS.map((car) => {
              const isSelected = selectedCar.id === car.id;
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    onSelectCar(car);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30 shadow-lg'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded-lg mb-2 flex items-center justify-center font-racing text-xs font-black tracking-wider text-white shadow-inner"
                    style={{ backgroundColor: car.themeColor }}
                  >
                    GT RACER
                  </div>
                  <div className="font-racing text-sm font-bold text-white truncate">{car.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{car.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleStart}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-racing font-extrabold text-lg sm:text-xl rounded-xl shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-3 transition transform active:scale-98 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>MULA PERLUMBAAN</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-4 z-10 my-4">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            setShowInstructions(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Arahan Permainan</span>
        </button>

        <button
          onClick={() => {
            soundManager.playButtonClick();
            setShowObjectives(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Objektif Pembelajaran</span>
        </button>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
            <h2 className="font-racing text-2xl font-bold text-amber-400 flex items-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6" />
              <span>ARAHAN PERMAINAN</span>
            </h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p className="flex items-start gap-2">
                <span className="font-racing font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded text-xs">1</span>
                <span><strong>Kawal Kereta:</strong> Gunakan kekunci anak panah (Atas/Bawah/Kiri/Kanan) atau kekunci WASD. Pada skrin sentuh telefon/tablet, gunakan butang kawalan pada skrin.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-racing font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded text-xs">2</span>
                <span><strong>Kutip Hadiah:</strong> Pandu kereta lumba anda ke arah kotak hadiah bercahaya di sepanjang litar untuk membuka soalan tatabahasa.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-racing font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded text-xs">3</span>
                <span><strong>Jawab Soalan:</strong> Pilih jawapan A, B, C, atau D yang betul. Setiap jawapan betul memberikan <strong>+10 markah</strong>!</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-racing font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded text-xs">4</span>
                <span><strong>Dua Pusingan:</strong> Lengkapkan 10 soalan di Pusingan 1, kemudian mara ke 5 soalan Cabaran Bonus (Pusingan 2).</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-racing font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded text-xs">5</span>
                <span><strong>Jana Sijil:</strong> Setelah kesemua 15 soalan selesai, muat turun <strong>Sijil Pencapaian PDF Rasmi</strong> anda!</span>
              </p>
            </div>
            <button
              onClick={() => {
                soundManager.playButtonClick();
                setShowInstructions(false);
              }}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition cursor-pointer"
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}

      {/* Learning Objectives Modal */}
      {showObjectives && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative">
            <h2 className="font-racing text-2xl font-bold text-emerald-400 flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6" />
              <span>OBJEKTIF PEMBELAJARAN (DSKP)</span>
            </h2>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-amber-400 font-bold uppercase">Standard Kandungan (SK) 5.1</div>
                <div className="text-white font-medium mt-1">
                  Memahami dan menggunakan golongan kata mengikut konteks.
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-blue-400 font-bold uppercase">Standard Pembelajaran (SP) 5.1.3</div>
                <div className="text-white font-medium mt-1">
                  Memahami dan menggunakan pelbagai kata adjektif mengikut konteks.
                </div>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs text-emerald-400 font-bold uppercase">Objektif Pembelajaran:</div>
                <div className="text-slate-200 mt-1">
                  Pada akhir permainan ini, murid dapat mengenal pasti dan menggunakan pelbagai jenis kata adjektif (sifatan/keadaan, warna, ukuran, perasaan, jarak, waktu, bentuk, cara dan pancaindera) mengikut konteks dengan menjawab 15 soalan tatabahasa yang disediakan.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                soundManager.playButtonClick();
                setShowObjectives(false);
              }}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
