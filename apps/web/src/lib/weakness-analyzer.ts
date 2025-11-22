import type { WeaknessPattern, WeaknessAnalysis, Operation } from '../types';
import type { Database } from '../types/database';

type QuestionLog = Database['public']['Tables']['question_logs']['Row'];

/**
 * 苦手判定の閾値
 */
const THRESHOLDS = {
  WEAK_CORRECT_RATE: 0.7, // 正答率70%未満を「苦手」とする
  SLOW_RESPONSE_MULTIPLIER: 1.5, // 全体平均の1.5倍以上を「遅い」とする
  MIN_QUESTION_COUNT: 5, // 最低5問以上のデータが必要
  RECENT_MISTAKE_THRESHOLD: 3, // 直近10問中3問以上間違えたら「今つまずいている」
};

/**
 * 操作ごとの苦手パターンを分析
 */
function analyzeByOperation(logs: QuestionLog[]): WeaknessPattern[] {
  const patterns: WeaknessPattern[] = [];
  const operations: Operation[] = ['add', 'subtract'];

  for (const operation of operations) {
    const operationLogs = logs.filter((log) => log.operation === operation);
    if (operationLogs.length < THRESHOLDS.MIN_QUESTION_COUNT) continue;

    const correctCount = operationLogs.filter((log) => log.is_correct).length;
    const correctRate = correctCount / operationLogs.length;
    const avgResponseTime =
      operationLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
      operationLogs.length;

    if (correctRate < THRESHOLDS.WEAK_CORRECT_RATE) {
      patterns.push({
        type: 'operation',
        operation,
        correctRate,
        avgResponseTimeMs: avgResponseTime,
        questionCount: operationLogs.length,
      });
    }
  }

  return patterns;
}

/**
 * 繰り上がり/繰り下がりごとの苦手パターンを分析
 */
function analyzeByCarryBorrow(logs: QuestionLog[]): WeaknessPattern[] {
  const patterns: WeaknessPattern[] = [];

  // 繰り上がりの分析
  const carryLogs = logs.filter((log) => log.has_carry);
  if (carryLogs.length >= THRESHOLDS.MIN_QUESTION_COUNT) {
    const correctCount = carryLogs.filter((log) => log.is_correct).length;
    const correctRate = correctCount / carryLogs.length;
    const avgResponseTime =
      carryLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
      carryLogs.length;

    if (correctRate < THRESHOLDS.WEAK_CORRECT_RATE) {
      patterns.push({
        type: 'carry',
        operation: 'add',
        hasCarry: true,
        correctRate,
        avgResponseTimeMs: avgResponseTime,
        questionCount: carryLogs.length,
      });
    }
  }

  // 繰り下がりの分析
  const borrowLogs = logs.filter((log) => log.has_borrow);
  if (borrowLogs.length >= THRESHOLDS.MIN_QUESTION_COUNT) {
    const correctCount = borrowLogs.filter((log) => log.is_correct).length;
    const correctRate = correctCount / borrowLogs.length;
    const avgResponseTime =
      borrowLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
      borrowLogs.length;

    if (correctRate < THRESHOLDS.WEAK_CORRECT_RATE) {
      patterns.push({
        type: 'borrow',
        operation: 'subtract',
        hasBorrow: true,
        correctRate,
        avgResponseTimeMs: avgResponseTime,
        questionCount: borrowLogs.length,
      });
    }
  }

  return patterns;
}

/**
 * 特定の数字ごとの苦手パターンを分析
 */
function analyzeBySpecificNumber(logs: QuestionLog[]): WeaknessPattern[] {
  const patterns: WeaknessPattern[] = [];
  const operations: Operation[] = ['add', 'subtract'];

  for (const operation of operations) {
    const operationLogs = logs.filter((log) => log.operation === operation);

    // 加数/減数（second_number）ごとに分析
    const numberStats = new Map<
      number,
      { correct: number; total: number; totalTime: number }
    >();

    for (const log of operationLogs) {
      const num = log.second_number;
      const stats = numberStats.get(num) || { correct: 0, total: 0, totalTime: 0 };
      stats.total++;
      stats.totalTime += log.response_time_ms;
      if (log.is_correct) stats.correct++;
      numberStats.set(num, stats);
    }

    // 苦手な数字を抽出
    for (const [num, stats] of numberStats.entries()) {
      if (stats.total < THRESHOLDS.MIN_QUESTION_COUNT) continue;

      const correctRate = stats.correct / stats.total;
      const avgResponseTime = stats.totalTime / stats.total;

      if (correctRate < THRESHOLDS.WEAK_CORRECT_RATE) {
        patterns.push({
          type: 'specific_number',
          operation,
          specificNumber: num,
          isAddend: false, // second_numberなので加数/減数
          correctRate,
          avgResponseTimeMs: avgResponseTime,
          questionCount: stats.total,
        });
      }
    }
  }

  return patterns;
}

/**
 * 直近の間違いパターンを分析
 */
function analyzeRecentMistakes(logs: QuestionLog[]): WeaknessPattern[] {
  const patterns: WeaknessPattern[] = [];
  const recentLogs = logs.slice(-10); // 直近10問

  if (recentLogs.length < 10) return patterns;

  const mistakes = recentLogs.filter((log) => !log.is_correct);
  if (mistakes.length < THRESHOLDS.RECENT_MISTAKE_THRESHOLD) return patterns;

  // 直近の間違いから特徴を抽出
  const operations = new Map<Operation, number>();
  const carries = mistakes.filter((log) => log.has_carry).length;
  const borrows = mistakes.filter((log) => log.has_borrow).length;

  for (const mistake of mistakes) {
    operations.set(
      mistake.operation,
      (operations.get(mistake.operation) || 0) + 1
    );
  }

  // 最も多い操作を抽出
  let maxOperation: Operation = 'add';
  let maxCount = 0;
  for (const [op, count] of operations.entries()) {
    if (count > maxCount) {
      maxOperation = op;
      maxCount = count;
    }
  }

  // 直近で間違えているパターンを優先的に返す
  if (maxOperation === 'add' && carries >= 2) {
    patterns.push({
      type: 'carry',
      operation: 'add',
      hasCarry: true,
      correctRate: (recentLogs.length - mistakes.length) / recentLogs.length,
      avgResponseTimeMs:
        recentLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
        recentLogs.length,
      questionCount: recentLogs.length,
    });
  } else if (maxOperation === 'subtract' && borrows >= 2) {
    patterns.push({
      type: 'borrow',
      operation: 'subtract',
      hasBorrow: true,
      correctRate: (recentLogs.length - mistakes.length) / recentLogs.length,
      avgResponseTimeMs:
        recentLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
        recentLogs.length,
      questionCount: recentLogs.length,
    });
  }

  return patterns;
}

/**
 * 学習ログから苦手パターンを分析
 */
export function analyzeWeakness(logs: QuestionLog[]): WeaknessAnalysis {
  if (logs.length === 0) {
    return {
      patterns: [],
      suggestedPractice: null,
    };
  }

  // 各種パターンを分析
  const recentPatterns = analyzeRecentMistakes(logs);
  const operationPatterns = analyzeByOperation(logs);
  const carryBorrowPatterns = analyzeByCarryBorrow(logs);
  const numberPatterns = analyzeBySpecificNumber(logs);

  // すべてのパターンを統合
  const allPatterns = [
    ...recentPatterns,
    ...operationPatterns,
    ...carryBorrowPatterns,
    ...numberPatterns,
  ];

  // 正答率の低い順にソート
  allPatterns.sort((a, b) => a.correctRate - b.correctRate);

  // 最も優先度の高いパターンをサジェスト
  const suggestedPractice = allPatterns.length > 0 ? allPatterns[0] : null;

  return {
    patterns: allPatterns,
    suggestedPractice,
  };
}

/**
 * サジェストメッセージを生成
 */
export function generateSuggestionMessage(pattern: WeaknessPattern): string {
  const correctRatePercent = Math.round(pattern.correctRate * 100);

  switch (pattern.type) {
    case 'operation':
      return pattern.operation === 'add'
        ? `たし算が苦手みたいだね（正答率${correctRatePercent}%）。練習してみよう！`
        : `ひき算が苦手みたいだね（正答率${correctRatePercent}%）。練習してみよう！`;

    case 'carry':
      return `繰り上がりのあるたし算が苦手みたいだね（正答率${correctRatePercent}%）。練習してみよう！`;

    case 'borrow':
      return `繰り下がりのあるひき算が苦手みたいだね（正答率${correctRatePercent}%）。練習してみよう！`;

    case 'specific_number':
      if (pattern.operation === 'add') {
        return `${pattern.specificNumber}をたす問題が苦手みたいだね（正答率${correctRatePercent}%）。練習してみよう！`;
      } else {
        return `${pattern.specificNumber}をひく問題が苦手みたいだね（正答率${correctRatePercent}%）。練習してみよう！`;
      }

    default:
      return '苦手な問題を練習してみよう！';
  }
}
