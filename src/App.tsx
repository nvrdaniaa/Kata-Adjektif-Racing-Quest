import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameScreen, CarConfig, Question, PlayerAnswerRecord, FinalGameStats, CategoryAnalysisItem, AchievementTier, BestLapRecord } from './types';
import { CAR_MODELS, QUESTIONS } from './data/questions';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { QuestionModal } from './components/QuestionModal';
import { Round1ClearModal } from './components/Round1ClearModal';
import { FinalResultsModal } from './components/FinalResultsModal';
import { TouchControls } from './components/TouchControls';
import { RacingWorld } from './three/racingWorld';
import { soundManager } from './audio/soundManager';
import {
  getStoredBestLap,
  saveBestLap,
  clearStoredBestLap,
  formatLapTime,
  isNewBestLap,
} from './utils/lapTimeManager';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedCar, setSelectedCar] = useState<CarConfig>(CAR_MODELS[0]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Best Lap Record from LocalStorage
  const [bestLapRecord, setBestLapRecord] = useState<BestLapRecord | null>(() => getStoredBestLap());

  // In-Game State
  const [round, setRound] = useState<1 | 2>(1);
  const [round1Score, setRound1Score] = useState<number>(0);
  const [round2Score, setRound2Score] = useState<number>(0);
  const [collectedGiftsInRound, setCollectedGiftsInRound] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [speedKmH, setSpeedKmH] = useState<number>(0);
  const [lapProgress, setLapProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Active driving lap time in milliseconds & records
  const [currentLapTimeMs, setCurrentLapTimeMs] = useState<number>(0);
  const [round1LapTimeMs, setRound1LapTimeMs] = useState<number>(0);
  const [round2LapTimeMs, setRound2LapTimeMs] = useState<number>(0);
  const [isNewBestLapRound1, setIsNewBestLapRound1] = useState<boolean>(false);
  const [isNewBestLapFinal, setIsNewBestLapFinal] = useState<boolean>(false);

  // Active Question Modal state
  const [activeQuestion, setActiveQuestion] = useState<{
    question: Question;
    index: number;
  } | null>(null);

  // Answer records for authentic analytics
  const [answerRecords, setAnswerRecords] = useState<PlayerAnswerRecord[]>([]);

  // Final Stats
  const [finalStats, setFinalStats] = useState<FinalGameStats | null>(null);

  // Three.js Mount reference
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const racingWorldRef = useRef<RacingWorld | null>(null);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Clear Best Lap Record helper
  const handleClearBestLapRecord = useCallback(() => {
    clearStoredBestLap();
    setBestLapRecord(null);
  }, []);

  // Compute final stats helper
  const computeFinalStats = useCallback(
    (
      records: PlayerAnswerRecord[],
      r1: number,
      r2: number,
      r1Time?: number,
      r2Time?: number,
      isNewBest?: boolean,
      bestRec?: BestLapRecord | null
    ): FinalGameStats => {
      const totalScore = r1 + r2;
      const masteryPercentage = Math.round((totalScore / 150) * 100);

      let achievementTier: AchievementTier = 'PELUMBA BAHARU';
      if (masteryPercentage >= 90) {
        achievementTier = 'PELUMBA LEGENDA';
      } else if (masteryPercentage >= 80) {
        achievementTier = 'PELUMBA JUARA';
      } else if (masteryPercentage >= 60) {
        achievementTier = 'PELUMBA BERPOTENSI';
      }

      const correctCount = records.filter((r) => r.isCorrect).length;
      const wrongCount = records.length - correctCount;

      // Group by category based on real questions answered
      const catMap = new Map<string, { total: number; correct: number }>();
      records.forEach((r) => {
        const cur = catMap.get(r.category) || { total: 0, correct: 0 };
        cur.total += 1;
        if (r.isCorrect) cur.correct += 1;
        catMap.set(r.category, cur);
      });

      const categoryAnalysis: CategoryAnalysisItem[] = [];
      catMap.forEach((val, key) => {
        categoryAnalysis.push({
          category: key as any,
          total: val.total,
          correct: val.correct,
          percentage: Math.round((val.correct / val.total) * 100),
        });
      });

      // Format date in Bahasa Melayu
      const now = new Date();
      const months = [
        'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
        'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
      ];
      const completionDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

      const bestTimeFormatted = bestRec
        ? bestRec.formattedTime
        : bestLapRecord
        ? bestLapRecord.formattedTime
        : r1Time && r1Time > 0
        ? formatLapTime(r1Time)
        : undefined;

      return {
        playerName: playerName.trim() || 'Pelumba Cilik',
        carConfig: selectedCar,
        round1Score: r1,
        round2Score: r2,
        totalScore,
        totalQuestions: 15,
        correctCount,
        wrongCount,
        masteryPercentage,
        achievementTier,
        categoryAnalysis,
        completionDate,
        bestLapTime: bestTimeFormatted,
        isNewBestLap: isNewBest ?? false,
        round1LapTime: r1Time && r1Time > 0 ? formatLapTime(r1Time) : undefined,
        round2LapTime: r2Time && r2Time > 0 ? formatLapTime(r2Time) : undefined,
      };
    },
    [playerName, selectedCar, bestLapRecord]
  );

  // Initialize or teardown 3D Racing World when screen changes
  useEffect(() => {
    if (screen === 'PLAYING_ROUND_1' || screen === 'PLAYING_ROUND_2') {
      if (!canvasMountRef.current) return;

      const currentRoundQuestions = QUESTIONS.filter((q) => q.round === (screen === 'PLAYING_ROUND_1' ? 1 : 2));

      // Cleanup existing world instance
      if (racingWorldRef.current) {
        racingWorldRef.current.destroy();
        racingWorldRef.current = null;
      }

      // Create new world
      const world = new RacingWorld(
        canvasMountRef.current,
        selectedCar,
        screen === 'PLAYING_ROUND_1' ? 1 : 2,
        currentRoundQuestions,
        {
          onGiftHit: (question, giftIndex) => {
            soundManager.playCollectGift();
            soundManager.stopEngine();
            soundManager.setQuizMode(true);
            setActiveQuestion({ question, index: giftIndex + 1 });
          },
          onSpeedUpdate: (speed) => {
            setSpeedKmH(speed);
            soundManager.updateEngineSpeed(speed / selectedCar.topSpeed);
          },
          onLapProgress: (prog) => {
            setLapProgress(prog);
          },
          onLapTimeUpdate: (timeMs) => {
            setCurrentLapTimeMs(timeMs);
          },
        }
      );

      racingWorldRef.current = world;
      soundManager.startEngine();

      return () => {
        soundManager.stopEngine();
        if (racingWorldRef.current) {
          racingWorldRef.current.destroy();
          racingWorldRef.current = null;
        }
      };
    } else {
      soundManager.stopEngine();
      if (racingWorldRef.current) {
        racingWorldRef.current.destroy();
        racingWorldRef.current = null;
      }
    }
  }, [screen, selectedCar]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeQuestion) return; // Do not drive while answering
      const w = racingWorldRef.current;
      if (!w) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        w.keys.forward = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        w.keys.backward = true;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        w.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        w.keys.right = true;
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        const nextPaused = !w.getPaused();
        w.setPaused(nextPaused);
        setIsPaused(nextPaused);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const w = racingWorldRef.current;
      if (!w) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        w.keys.forward = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        w.keys.backward = false;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        w.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        w.keys.right = false;
      }
    };

    const handleBlur = () => {
      const w = racingWorldRef.current;
      if (w) {
        w.keys.forward = false;
        w.keys.backward = false;
        w.keys.left = false;
        w.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeQuestion]);

  // Window helper for automated test suites
  useEffect(() => {
    (window as any).__TEST_COMPLETE_ROUND_1__ = (simulatedTimeMs: number = 38500) => {
      const records: PlayerAnswerRecord[] = QUESTIONS.slice(0, 10).map((q) => ({
        questionId: q.id,
        category: q.category,
        selectedOption: q.correctAnswer,
        isCorrect: true,
        round: 1,
      }));
      setAnswerRecords(records);
      setRound1Score(100);
      setCollectedGiftsInRound(10);
      setAnsweredCount(10);
      setRound1LapTimeMs(simulatedTimeMs);

      const isNew = isNewBestLap(simulatedTimeMs, bestLapRecord);
      if (isNew) {
        const now = new Date();
        const months = [
          'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
          'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        const newRec: BestLapRecord = {
          timeMs: simulatedTimeMs,
          formattedTime: formatLapTime(simulatedTimeMs),
          date: dateStr,
          playerName: playerName.trim() || 'Pelumba Cilik',
          carName: selectedCar.name,
          round: 1,
          previousRecordMs: bestLapRecord?.timeMs,
        };
        saveBestLap(newRec);
        setBestLapRecord(newRec);
        setIsNewBestLapRound1(true);
      } else {
        setIsNewBestLapRound1(false);
      }

      setScreen('ROUND_1_RESULTS');
    };

    (window as any).__TEST_COMPLETE_ALL_QUESTIONS__ = (
      correctScore: number = 140,
      simulatedR1Ms: number = 38500,
      simulatedR2Ms: number = 32400
    ) => {
      // 14 correct (140 marks), 1 wrong (10 marks off)
      const correctTarget = Math.min(15, Math.floor(correctScore / 10));
      const records: PlayerAnswerRecord[] = QUESTIONS.map((q, idx) => ({
        questionId: q.id,
        category: q.category,
        selectedOption: idx < correctTarget ? q.correctAnswer : ((q.correctAnswer === 'A' ? 'B' : 'A') as any),
        isCorrect: idx < correctTarget,
        round: q.round,
      }));

      const r1Score = records.filter((r) => r.round === 1 && r.isCorrect).length * 10;
      const r2Score = records.filter((r) => r.round === 2 && r.isCorrect).length * 10;
      setAnswerRecords(records);
      setRound1Score(r1Score);
      setRound2Score(r2Score);
      setCollectedGiftsInRound(5);
      setAnsweredCount(15);
      setRound1LapTimeMs(simulatedR1Ms);
      setRound2LapTimeMs(simulatedR2Ms);

      let finalBest = bestLapRecord;
      let isNew = isNewBestLap(simulatedR2Ms, finalBest);
      if (isNew) {
        const now = new Date();
        const months = [
          'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
          'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        const newRec: BestLapRecord = {
          timeMs: simulatedR2Ms,
          formattedTime: formatLapTime(simulatedR2Ms),
          date: dateStr,
          playerName: playerName.trim() || 'Pelumba Cilik',
          carName: selectedCar.name,
          round: 2,
          previousRecordMs: finalBest?.timeMs,
        };
        saveBestLap(newRec);
        setBestLapRecord(newRec);
        finalBest = newRec;
      }
      setIsNewBestLapFinal(isNew);

      const stats = computeFinalStats(
        records,
        r1Score,
        r2Score,
        simulatedR1Ms,
        simulatedR2Ms,
        isNew,
        finalBest
      );
      setFinalStats(stats);
      setScreen('FINAL_RESULTS');
    };

    return () => {
      delete (window as any).__TEST_COMPLETE_ROUND_1__;
      delete (window as any).__TEST_COMPLETE_ALL_QUESTIONS__;
    };
  }, [computeFinalStats, bestLapRecord, playerName, selectedCar]);

  // Start Game (from Title screen)
  const handleStartGame = () => {
    setRound(1);
    setRound1Score(0);
    setRound2Score(0);
    setCollectedGiftsInRound(0);
    setAnsweredCount(0);
    setAnswerRecords([]);
    setActiveQuestion(null);
    setIsPaused(false);
    setCurrentLapTimeMs(0);
    setRound1LapTimeMs(0);
    setRound2LapTimeMs(0);
    setIsNewBestLapRound1(false);
    setIsNewBestLapFinal(false);
    soundManager.startBgm();
    soundManager.setQuizMode(false);
    setScreen('PLAYING_ROUND_1');
  };

  // Answer Submission
  const handleAnswerSubmit = (selectedOption: 'A' | 'B' | 'C' | 'D', isCorrect: boolean) => {
    if (!activeQuestion) return;

    const newRecord: PlayerAnswerRecord = {
      questionId: activeQuestion.question.id,
      category: activeQuestion.question.category,
      selectedOption,
      isCorrect,
      round: activeQuestion.question.round,
    };

    const updatedRecords = [...answerRecords, newRecord];
    setAnswerRecords(updatedRecords);

    if (activeQuestion.question.round === 1) {
      if (isCorrect) {
        setRound1Score((prev) => prev + 10);
      }
    } else {
      if (isCorrect) {
        setRound2Score((prev) => prev + 10);
      }
    }
  };

  // Resume Racing after question modal
  const handleResumeRacing = () => {
    const nextCollected = collectedGiftsInRound + 1;
    const nextAnswered = answeredCount + 1;
    setCollectedGiftsInRound(nextCollected);
    setAnsweredCount(nextAnswered);
    setActiveQuestion(null);

    if (round === 1) {
      if (nextCollected >= 10) {
        // Round 1 Complete! Transition to interim results
        soundManager.stopEngine();
        soundManager.playFanfare();

        const r1Time = racingWorldRef.current ? racingWorldRef.current.getLapTimeMs() : currentLapTimeMs;
        setRound1LapTimeMs(r1Time);

        // Check if Round 1 is a new Best Lap
        if (isNewBestLap(r1Time, bestLapRecord)) {
          const now = new Date();
          const months = [
            'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
            'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
          ];
          const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
          const newRec: BestLapRecord = {
            timeMs: r1Time,
            formattedTime: formatLapTime(r1Time),
            date: dateStr,
            playerName: playerName.trim() || 'Pelumba Cilik',
            carName: selectedCar.name,
            round: 1,
            previousRecordMs: bestLapRecord?.timeMs,
          };
          saveBestLap(newRec);
          setBestLapRecord(newRec);
          setIsNewBestLapRound1(true);
        } else {
          setIsNewBestLapRound1(false);
        }

        setScreen('ROUND_1_RESULTS');
        return;
      }
    } else {
      if (nextCollected >= 5) {
        // Round 2 (Bonus) Complete! Transition to final results
        soundManager.stopEngine();

        const r2Time = racingWorldRef.current ? racingWorldRef.current.getLapTimeMs() : currentLapTimeMs;
        setRound2LapTimeMs(r2Time);

        let finalBest = bestLapRecord;
        let isNewRecord = isNewBestLapRound1;

        if (isNewBestLap(r2Time, finalBest)) {
          const now = new Date();
          const months = [
            'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
            'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
          ];
          const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
          const newRec: BestLapRecord = {
            timeMs: r2Time,
            formattedTime: formatLapTime(r2Time),
            date: dateStr,
            playerName: playerName.trim() || 'Pelumba Cilik',
            carName: selectedCar.name,
            round: 2,
            previousRecordMs: finalBest?.timeMs,
          };
          saveBestLap(newRec);
          setBestLapRecord(newRec);
          finalBest = newRec;
          isNewRecord = true;
        }

        setIsNewBestLapFinal(isNewRecord);

        const currentR1 = round1Score;
        const currentR2 = round2Score;
        const stats = computeFinalStats(
          answerRecords,
          currentR1,
          currentR2,
          round1LapTimeMs,
          r2Time,
          isNewRecord,
          finalBest
        );
        setFinalStats(stats);
        setScreen('FINAL_RESULTS');
        return;
      }
    }

    // Unpause world and restart engine
    if (racingWorldRef.current) {
      racingWorldRef.current.setPaused(false);
      soundManager.startEngine();
      soundManager.setQuizMode(false);
    }
  };

  // Proceed from Round 1 Interim Results to Round 2 (Bonus Challenge)
  const handleProceedToRound2 = () => {
    setRound(2);
    setCollectedGiftsInRound(0);
    setActiveQuestion(null);
    setIsPaused(false);
    setCurrentLapTimeMs(0);
    soundManager.startBgm();
    soundManager.setQuizMode(false);
    setScreen('PLAYING_ROUND_2');
  };

  // Play Again (Reset game session)
  const handlePlayAgain = () => {
    soundManager.stopBgm();
    setRound(1);
    setRound1Score(0);
    setRound2Score(0);
    setCollectedGiftsInRound(0);
    setAnsweredCount(0);
    setAnswerRecords([]);
    setActiveQuestion(null);
    setFinalStats(null);
    setIsPaused(false);
    setCurrentLapTimeMs(0);
    setRound1LapTimeMs(0);
    setRound2LapTimeMs(0);
    setIsNewBestLapRound1(false);
    setIsNewBestLapFinal(false);
    setBestLapRecord(getStoredBestLap());
    setScreen('TITLE');
  };

  const handleTogglePause = () => {
    if (racingWorldRef.current) {
      const p = !racingWorldRef.current.getPaused();
      racingWorldRef.current.setPaused(p);
      setIsPaused(p);
      if (p) {
        soundManager.stopEngine();
      } else {
        soundManager.startEngine();
      }
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Title Screen */}
      {screen === 'TITLE' && (
        <TitleScreen
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          selectedCar={selectedCar}
          onSelectCar={setSelectedCar}
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          bestLapRecord={bestLapRecord}
          onClearBestLapRecord={handleClearBestLapRecord}
        />
      )}

      {/* 2. 3D WebGL Canvas Viewport (Mounted in isolated container) */}
      {(screen === 'PLAYING_ROUND_1' || screen === 'PLAYING_ROUND_2') && (
        <>
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0 overflow-hidden" />

          {/* Low-Occlusion HUD Overlay */}
          <GameHUD
            playerName={playerName}
            round={round}
            currentScore={round === 1 ? round1Score : round1Score + round2Score}
            maxScorePossible={round === 1 ? 100 : 150}
            collectedGifts={collectedGiftsInRound}
            totalGiftsInRound={round === 1 ? 10 : 5}
            answeredQuestions={answeredCount}
            speedKmH={speedKmH}
            lapProgress={lapProgress}
            currentLapTimeMs={currentLapTimeMs}
            bestLapRecord={bestLapRecord}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          {/* On-Screen Touch Steering & Pedals */}
          {!isPaused && !activeQuestion && (
            <TouchControls
              onForwardDown={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.forward = true;
              }}
              onForwardUp={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.forward = false;
              }}
              onBackwardDown={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.backward = true;
              }}
              onBackwardUp={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.backward = false;
              }}
              onLeftDown={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.left = true;
              }}
              onLeftUp={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.left = false;
              }}
              onRightDown={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.right = true;
              }}
              onRightUp={() => {
                if (racingWorldRef.current) racingWorldRef.current.keys.right = false;
              }}
            />
          )}

          {/* Active Question Modal */}
          {activeQuestion && (
            <QuestionModal
              question={activeQuestion.question}
              questionNumber={activeQuestion.index}
              totalQuestionsInRound={round === 1 ? 10 : 5}
              onAnswerSubmit={handleAnswerSubmit}
              onResumeRacing={handleResumeRacing}
            />
          )}
        </>
      )}

      {/* 3. Round 1 Interim Results Modal */}
      {screen === 'ROUND_1_RESULTS' && (
        <Round1ClearModal
          playerName={playerName}
          round1Score={round1Score}
          correctCount={answerRecords.filter((r) => r.round === 1 && r.isCorrect).length}
          wrongCount={answerRecords.filter((r) => r.round === 1 && !r.isCorrect).length}
          round1LapTimeMs={round1LapTimeMs}
          bestLapRecord={bestLapRecord}
          isNewBestLap={isNewBestLapRound1}
          onProceedToRound2={handleProceedToRound2}
        />
      )}

      {/* 4. Final Results & Certificate Screen */}
      {screen === 'FINAL_RESULTS' && finalStats && (
        <FinalResultsModal stats={finalStats} onPlayAgain={handlePlayAgain} />
      )}
    </main>
  );
}
