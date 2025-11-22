import type { Question, Operation, FreeModeSettings } from '../types';

/**
 * 指定範囲内のランダムな整数を生成
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 繰り上がりがあるかチェック
 */
function hasCarry(a: number, b: number): boolean {
  const onesA = a % 10;
  const onesB = b % 10;
  return onesA + onesB >= 10;
}

/**
 * 繰り下がりがあるかチェック
 */
function hasBorrow(a: number, b: number): boolean {
  const onesA = a % 10;
  const onesB = b % 10;
  return onesA < onesB;
}

/**
 * 足し算の問題を生成
 */
function generateAddition(
  firstMin: number,
  firstMax: number,
  secondMin: number,
  secondMax: number,
  allowCarry: boolean
): Question {
  let firstNumber: number;
  let secondNumber: number;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    firstNumber = getRandomInt(firstMin, firstMax);
    secondNumber = getRandomInt(secondMin, secondMax);
    attempts++;

    if (attempts >= maxAttempts) {
      // 試行回数が多すぎる場合は、条件を無視して生成
      break;
    }
  } while (hasCarry(firstNumber, secondNumber) !== allowCarry);

  const correctAnswer = firstNumber + secondNumber;
  const carry = hasCarry(firstNumber, secondNumber);

  return {
    operation: 'add',
    firstNumber,
    secondNumber,
    correctAnswer,
    hasCarry: carry,
    hasBorrow: false,
  };
}

/**
 * 引き算の問題を生成
 */
function generateSubtraction(
  firstMin: number,
  firstMax: number,
  secondMin: number,
  secondMax: number,
  allowBorrow: boolean
): Question {
  let firstNumber: number;
  let secondNumber: number;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    firstNumber = getRandomInt(firstMin, firstMax);
    secondNumber = getRandomInt(secondMin, Math.min(secondMax, firstNumber));
    attempts++;

    if (attempts >= maxAttempts) {
      // 試行回数が多すぎる場合は、条件を無視して生成
      break;
    }
  } while (hasBorrow(firstNumber, secondNumber) !== allowBorrow);

  const correctAnswer = firstNumber - secondNumber;
  const borrow = hasBorrow(firstNumber, secondNumber);

  return {
    operation: 'subtract',
    firstNumber,
    secondNumber,
    correctAnswer,
    hasCarry: false,
    hasBorrow: borrow,
  };
}

/**
 * 設定に基づいて問題を生成
 */
export function generateQuestion(settings: FreeModeSettings): Question {
  const {
    operation,
    firstNumberMin,
    firstNumberMax,
    secondNumberMin,
    secondNumberMax,
    allowCarry,
    allowBorrow,
  } = settings;

  if (operation === 'add') {
    return generateAddition(
      firstNumberMin,
      firstNumberMax,
      secondNumberMin,
      secondNumberMax,
      allowCarry
    );
  } else {
    return generateSubtraction(
      firstNumberMin,
      firstNumberMax,
      secondNumberMin,
      secondNumberMax,
      allowBorrow
    );
  }
}

/**
 * 複数の問題を一度に生成
 */
export function generateQuestions(
  settings: FreeModeSettings,
  count: number
): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(settings));
  }
  return questions;
}

/**
 * 特定のパターンに基づいて問題を生成（苦手集中モード用）
 */
export function generateWeaknessQuestion(
  operation: Operation,
  hasCarryOrBorrow: boolean,
  specificNumber?: number,
  isFirstNumber?: boolean
): Question {
  const min = 1;
  const max = 20;

  if (specificNumber !== undefined && isFirstNumber !== undefined) {
    // 特定の数字を含む問題を生成
    if (operation === 'add') {
      const otherNumber = isFirstNumber
        ? getRandomInt(min, max)
        : specificNumber;
      const firstNum = isFirstNumber ? specificNumber : otherNumber;
      const secondNum = isFirstNumber ? otherNumber : specificNumber;

      return {
        operation: 'add',
        firstNumber: firstNum,
        secondNumber: secondNum,
        correctAnswer: firstNum + secondNum,
        hasCarry: hasCarry(firstNum, secondNum),
        hasBorrow: false,
      };
    } else {
      // 引き算の場合
      let firstNum: number;
      let secondNum: number;

      if (isFirstNumber) {
        // 被減数が特定の数字
        firstNum = specificNumber;
        secondNum = getRandomInt(min, Math.min(max, specificNumber));
      } else {
        // 減数が特定の数字
        secondNum = specificNumber;
        firstNum = getRandomInt(specificNumber, max);
      }

      return {
        operation: 'subtract',
        firstNumber: firstNum,
        secondNumber: secondNum,
        correctAnswer: firstNum - secondNum,
        hasCarry: false,
        hasBorrow: hasBorrow(firstNum, secondNum),
      };
    }
  } else {
    // 繰り上がり/繰り下がりの有無に基づいて生成
    const settings: FreeModeSettings = {
      operation,
      firstNumberMin: min,
      firstNumberMax: max,
      secondNumberMin: min,
      secondNumberMax: max,
      allowCarry: hasCarryOrBorrow && operation === 'add',
      allowBorrow: hasCarryOrBorrow && operation === 'subtract',
    };

    return generateQuestion(settings);
  }
}
