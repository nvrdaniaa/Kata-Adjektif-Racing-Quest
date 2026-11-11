export type AdjectiveCategory =
  | 'Sifatan / Keadaan'
  | 'Warna'
  | 'Ukuran'
  | 'Perasaan'
  | 'Jarak'
  | 'Waktu'
  | 'Bentuk'
  | 'Cara'
  | 'Pancaindera';

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: number;
  round: 1 | 2;
  sentence: string;
  category: AdjectiveCategory;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export type CarColorId = 'red' | 'blue' | 'yellow' | 'green';

export interface CarConfig {
  id: CarColorId;
  name: string;
  themeColor: string;
  hexColor: number;
  secondaryHex: number;
  glowColor: string;
  description: string;
  topSpeed: number;
  acceleration: number;
}

export type GameScreen =
  | 'TITLE'
  | 'PLAYING_ROUND_1'
  | 'ROUND_1_RESULTS'
  | 'PLAYING_ROUND_2'
  | 'FINAL_RESULTS';

export interface PlayerAnswerRecord {
  questionId: number;
  category: AdjectiveCategory;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  round: 1 | 2;
}

export interface CategoryAnalysisItem {
  category: AdjectiveCategory;
  total: number;
  correct: number;
  percentage: number;
}

export type AchievementTier =
  | 'PELUMBA LEGENDA'
  | 'PELUMBA JUARA'
  | 'PELUMBA BERPOTENSI'
  | 'PELUMBA BAHARU';

export interface BestLapRecord {
  timeMs: number;
  formattedTime: string;
  date: string;
  playerName: string;
  carName?: string;
  round?: 1 | 2;
  previousRecordMs?: number;
}

export interface FinalGameStats {
  playerName: string;
  carConfig: CarConfig;
  round1Score: number;
  round2Score: number;
  totalScore: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  masteryPercentage: number;
  achievementTier: AchievementTier;
  categoryAnalysis: CategoryAnalysisItem[];
  completionDate: string;
  bestLapTime?: string;
  isNewBestLap?: boolean;
  round1LapTime?: string;
  round2LapTime?: string;
}

