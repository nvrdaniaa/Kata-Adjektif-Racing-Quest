import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface TouchControlsProps {
  onForwardDown: () => void;
  onForwardUp: () => void;
  onBackwardDown: () => void;
  onBackwardUp: () => void;
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onForwardDown,
  onForwardUp,
  onBackwardDown,
  onBackwardUp,
  onLeftDown,
  onLeftUp,
  onRightDown,
  onRightUp,
}) => {
  return (
    <div className="absolute bottom-16 sm:bottom-20 inset-x-0 px-4 sm:px-8 flex justify-between pointer-events-none z-30 select-none">
      {/* Steering Cluster (Left) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onMouseDown={onLeftDown}
          onMouseUp={onLeftUp}
          onTouchStart={(e) => {
            e.preventDefault();
            onLeftDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onLeftUp();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/80 active:bg-amber-500/30 border-2 border-slate-700 active:border-amber-400 text-white flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition cursor-pointer"
        >
          <ArrowLeft className="w-7 h-7 text-amber-400" />
        </button>

        <button
          type="button"
          onMouseDown={onRightDown}
          onMouseUp={onRightUp}
          onTouchStart={(e) => {
            e.preventDefault();
            onRightDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onRightUp();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/80 active:bg-amber-500/30 border-2 border-slate-700 active:border-amber-400 text-white flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition cursor-pointer"
        >
          <ArrowRight className="w-7 h-7 text-amber-400" />
        </button>
      </div>

      {/* Pedals Cluster (Right) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onMouseDown={onBackwardDown}
          onMouseUp={onBackwardUp}
          onTouchStart={(e) => {
            e.preventDefault();
            onBackwardDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onBackwardUp();
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/80 active:bg-red-500/30 border-2 border-slate-700 active:border-red-400 text-white flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition cursor-pointer"
        >
          <ArrowDown className="w-6 h-6 text-red-400" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Brek</span>
        </button>

        <button
          type="button"
          onMouseDown={onForwardDown}
          onMouseUp={onForwardUp}
          onTouchStart={(e) => {
            e.preventDefault();
            onForwardDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onForwardUp();
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/90 active:bg-yellow-400 border-2 border-amber-300 text-slate-950 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition cursor-pointer"
        >
          <ArrowUp className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">Pecut</span>
        </button>
      </div>
    </div>
  );
};
