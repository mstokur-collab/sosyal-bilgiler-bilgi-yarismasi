
export type ScreenId = 
  | 'start' 
  | 'player-name' 
  | 'grade-select' 
  | 'learning-area-select'
  | 'kazanim-select'
  | 'competition-mode' 
  | 'difficulty-select' 
  | 'game-mode' 
  | 'game' 
  | 'end' 
  | 'high-scores' 
  | 'teacher-panel';

export type Difficulty = 'kolay' | 'orta' | 'zor';
export type CompetitionMode = 'bireysel' | 'grup';
export type QuestionType = 'quiz' | 'fill-in' | 'matching';

export interface BaseQuestion {
  id: number;
  grade: number;
  topic: string;
  difficulty: Difficulty;
  imageUrl?: string;
  kazanımId?: string;
}

export interface QuizQuestion extends BaseQuestion {
  type: 'quiz';
  question: string;
  options: string[];
  answer: string;
}

export interface FillInQuestion extends BaseQuestion {
  type: 'fill-in';
  sentence: string;
  answer: string;
  distractors: string[];
}

export interface MatchingPair {
  term: string;
  definition: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  question?: string;
  pairs: MatchingPair[];
}

export type Question = QuizQuestion | FillInQuestion | MatchingQuestion;

export interface GameSettings {
  grade?: number;
  topic?: string; // This is the learning area
  // FIX: Changed property name to 'kazanımId' for consistency across types.
  kazanımId?: string;
  competitionMode?: CompetitionMode;
  difficulty?: Difficulty;
  gameMode?: QuestionType;
}

export interface HighScore {
  name: string;
  score: number;
  date: string;
  settings: GameSettings;
}