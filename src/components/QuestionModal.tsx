import React, { useState } from 'react';
import { Question } from '../types';
import { CheckCircle2, XCircle, ArrowRight, Award, HelpCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface QuestionModalProps {
  question: Question;
  questionNumber: number;
  totalQuestionsInRound: number;
  onAnswerSubmit: (selectedOption: 'A' | 'B' | 'C' | 'D', isCorrect: boolean) => void;
  onResumeRacing: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  questionNumber,
  totalQuestionsInRound,
  onAnswerSubmit,
  onResumeRacing,
}) => {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelectOption = (label: 'A' | 'B' | 'C' | 'D') => {
    if (hasSubmitted) return;
    setSelectedOption(label);
    setHasSubmitted(true);

    const isCorrect = label === question.correctAnswer;
    if (isCorrect) {
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
    }
    onAnswerSubmit(label, isCorrect);
  };

  const handleContinue = () => {
    soundManager.playButtonClick();
    onResumeRacing();
  };

  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white relative">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-racing px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider">
              {question.round === 1 ? 'Pusingan 1' : 'Cabaran Bonus'} • Soalan {questionNumber} / {totalQuestionsInRound}
            </span>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-800/60 rounded-full">
            Kata Adjektif {question.category}
          </div>
        </div>

        {/* Question Prompt */}
        <div className="mb-6">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Lengkapkan ayat di bawah dengan kata adjektif yang paling tepat:</span>
          </div>
          <p className="text-base sm:text-xl font-medium leading-relaxed text-slate-100 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            "{question.sentence}"
          </p>
        </div>

        {/* Options List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {question.options.map((opt) => {
            const isThisSelected = selectedOption === opt.label;
            const isThisCorrect = opt.label === question.correctAnswer;

            let buttonStyle = 'bg-slate-950/80 border-slate-800 hover:border-amber-400/80 hover:bg-slate-800/80 text-slate-200';
            let badgeStyle = 'bg-slate-800 text-slate-300';

            if (hasSubmitted) {
              if (isThisCorrect) {
                buttonStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500';
                badgeStyle = 'bg-emerald-500 text-slate-950';
              } else if (isThisSelected && !isThisCorrect) {
                buttonStyle = 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.3)] ring-1 ring-red-500';
                badgeStyle = 'bg-red-500 text-white';
              } else {
                buttonStyle = 'bg-slate-950/40 border-slate-800/50 text-slate-500 opacity-60';
                badgeStyle = 'bg-slate-900 text-slate-600';
              }
            }

            return (
              <button
                key={opt.label}
                type="button"
                disabled={hasSubmitted}
                onClick={() => handleSelectOption(opt.label)}
                className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border text-left font-medium transition duration-150 cursor-pointer ${buttonStyle}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-racing font-bold text-sm shrink-0 ${badgeStyle}`}>
                  {opt.label}
                </span>
                <span className="text-base sm:text-lg flex-1">{opt.text}</span>
                {hasSubmitted && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {hasSubmitted && isThisSelected && !isThisCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback & Explanation Section */}
        {hasSubmitted && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isCorrect
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/60 text-red-200'
              }`}
            >
              {isCorrect ? (
                <Award className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-racing font-bold text-base sm:text-lg">
                  {isCorrect ? 'TAHNIAH! JAWAPAN TEPAT (+10 MARKAH)' : 'KURANG TEPAT (0 MARKAH)'}
                </div>
                <div className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  <strong className="text-amber-400">Penerangan:</strong> {question.explanation}
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-racing font-extrabold text-base sm:text-lg rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-98"
            >
              <span>TERUSKAN PERLUMBAAN</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
