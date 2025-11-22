// ユーザー関連の型
export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  nickname: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// 問題関連の型
export type Operation = 'add' | 'subtract';

export interface Question {
  operation: Operation;
  firstNumber: number;
  secondNumber: number;
  correctAnswer: number;
  hasCarry: boolean;
  hasBorrow: boolean;
}

export interface QuestionResult {
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
  responseTimeMs: number;
  comboAtAnswer: number;
}

// 学習モード関連の型
export type LearningMode = 'free' | 'weakness';

export interface FreeModeSettings {
  operation: Operation;
  firstNumberMin: number;
  firstNumberMax: number;
  secondNumberMin: number;
  secondNumberMax: number;
  allowCarry: boolean;
  allowBorrow: boolean;
}

export interface WeaknessPattern {
  type: 'operation' | 'carry' | 'borrow' | 'specific_number';
  operation?: Operation;
  hasCarry?: boolean;
  hasBorrow?: boolean;
  specificNumber?: number;
  isAddend?: boolean; // true: 加数/被減数, false: 被加数/減数
  correctRate: number;
  avgResponseTimeMs: number;
  questionCount: number;
}

// セッション関連の型
export interface LearningSession {
  id: string;
  userId: string;
  mode: LearningMode;
  startedAt: string;
  endedAt: string | null;
  totalScore: number;
  maxCombo: number;
}

// ゲーミフィケーション関連の型
export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
  timeElapsed: number;
}

export interface Achievement {
  id: string;
  type: string;
  value: string;
  earnedAt: string;
  title: string;
  description: string;
  icon: string;
}

// 分析関連の型
export interface WeaknessAnalysis {
  patterns: WeaknessPattern[];
  suggestedPractice: WeaknessPattern | null;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  studentCount: number;
  avgCorrectRate: number;
  avgResponseTimeMs: number;
  weakestProblems: {
    question: Question;
    correctRate: number;
    attemptCount: number;
  }[];
  weaknessByPattern: {
    pattern: string;
    correctRate: number;
    avgResponseTimeMs: number;
  }[];
}
