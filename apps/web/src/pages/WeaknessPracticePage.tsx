import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question, GameState, WeaknessPattern } from '../types';
import { generateWeaknessQuestion } from '../lib/question-generator';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function WeaknessPracticePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pattern, setPattern] = useState<WeaknessPattern | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    totalCount: 0,
    timeElapsed: 0,
  });
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
  }>({
    show: false,
    isCorrect: false,
  });
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  useEffect(() => {
    // パターンを読み込む
    const savedPattern = localStorage.getItem('weaknessPattern');
    if (!savedPattern) {
      navigate('/practice/weakness');
      return;
    }

    const parsedPattern = JSON.parse(savedPattern) as WeaknessPattern;
    setPattern(parsedPattern);

    // セッションを作成
    createSession();

    // タイマー開始
    const timer = setInterval(() => {
      setGameState((prev) => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pattern) {
      generateNextQuestion();
    }
  }, [pattern]);

  const generateNextQuestion = () => {
    if (!pattern) return;

    let question: Question;

    switch (pattern.type) {
      case 'operation':
        question = generateWeaknessQuestion(
          pattern.operation!,
          pattern.operation === 'add' ? false : false
        );
        break;

      case 'carry':
        question = generateWeaknessQuestion('add', true);
        break;

      case 'borrow':
        question = generateWeaknessQuestion('subtract', true);
        break;

      case 'specific_number':
        question = generateWeaknessQuestion(
          pattern.operation!,
          pattern.operation === 'add' ? pattern.hasCarry || false : pattern.hasBorrow || false,
          pattern.specificNumber,
          false // second number (加数/減数)
        );
        break;

      default:
        question = generateWeaknessQuestion('add', false);
    }

    setCurrentQuestion(question);
    setQuestionStartTime(Date.now());
  };

  const createSession = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        mode: 'weakness' as const,
      } as any)
      .select()
      .single();

    if (!error && data) {
      setSessionId((data as any).id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentQuestion || !sessionId || !user) return;

    const answer = parseInt(userAnswer);
    if (isNaN(answer)) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    const responseTime = Date.now() - questionStartTime;

    // フィードバック表示
    setFeedback({ show: true, isCorrect });

    // ゲーム状態更新
    const newCombo = isCorrect ? gameState.combo + 1 : 0;
    const comboBonus = newCombo > 1 ? newCombo * 10 : 0;
    const scoreGain = isCorrect ? 100 + comboBonus : 0;

    setGameState({
      score: gameState.score + scoreGain,
      combo: newCombo,
      maxCombo: Math.max(gameState.maxCombo, newCombo),
      correctCount: gameState.correctCount + (isCorrect ? 1 : 0),
      totalCount: gameState.totalCount + 1,
      timeElapsed: gameState.timeElapsed,
    });

    // ログを記録
    await supabase.from('question_logs').insert({
      session_id: sessionId,
      user_id: user.id,
      operation: currentQuestion.operation as 'add' | 'subtract',
      first_number: currentQuestion.firstNumber,
      second_number: currentQuestion.secondNumber,
      correct_answer: currentQuestion.correctAnswer,
      user_answer: answer,
      has_carry: currentQuestion.hasCarry,
      has_borrow: currentQuestion.hasBorrow,
      is_correct: isCorrect,
      response_time_ms: responseTime,
      combo_at_answer: gameState.combo,
    } as any);

    // 次の問題へ
    setTimeout(() => {
      setFeedback({ show: false, isCorrect: false });
      setUserAnswer('');
      generateNextQuestion();
    }, 1000);
  };

  const handleFinish = async () => {
    if (!sessionId) return;

    // セッション終了
    await (supabase
      .from('learning_sessions')
      .update as any)({
        ended_at: new Date().toISOString(),
        total_score: gameState.score,
        max_combo: gameState.maxCombo,
      })
      .eq('id', sessionId);

    navigate('/');
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const getPatternName = (): string => {
    if (!pattern) return '';

    switch (pattern.type) {
      case 'operation':
        return pattern.operation === 'add' ? 'たし算' : 'ひき算';
      case 'carry':
        return 'くり上がり';
      case 'borrow':
        return 'くり下がり';
      case 'specific_number':
        return pattern.operation === 'add'
          ? `${pattern.specificNumber}をたす`
          : `${pattern.specificNumber}をひく`;
      default:
        return '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.patternBadge}>
          <span style={styles.patternLabel}>れんしゅうちゅう:</span>
          <span style={styles.patternName}>{getPatternName()}</span>
        </div>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>スコア</span>
            <span style={styles.statValue}>{gameState.score}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>コンボ</span>
            <span style={{ ...styles.statValue, color: gameState.combo > 0 ? '#ff6b6b' : '#666' }}>
              {gameState.combo > 0 ? `🔥 ${gameState.combo}` : '-'}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>せいかい</span>
            <span style={styles.statValue}>
              {gameState.correctCount}/{gameState.totalCount}
            </span>
          </div>
        </div>
        <button onClick={handleFinish} style={styles.finishButton}>
          おわる
        </button>
      </div>

      <div style={styles.questionContainer}>
        <div style={styles.questionCard}>
          <div style={styles.question}>
            <span style={styles.number}>{currentQuestion.firstNumber}</span>
            <span style={styles.operator}>
              {currentQuestion.operation === 'add' ? '+' : '-'}
            </span>
            <span style={styles.number}>{currentQuestion.secondNumber}</span>
            <span style={styles.equals}>=</span>
          </div>

          <form onSubmit={handleSubmit} style={styles.answerForm}>
            <input
              type="number"
              inputMode="numeric"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              style={styles.answerInput}
              placeholder="?"
              autoFocus
              disabled={feedback.show}
            />
            <button
              type="submit"
              disabled={feedback.show || !userAnswer}
              style={{
                ...styles.submitButton,
                ...(feedback.show || !userAnswer ? styles.submitButtonDisabled : {}),
              }}
            >
              こたえる
            </button>
          </form>

          {feedback.show && (
            <div
              style={{
                ...styles.feedback,
                backgroundColor: feedback.isCorrect ? '#4caf50' : '#f44336',
              }}
            >
              {feedback.isCorrect ? '✅ せいかい！' : '❌ まちがい...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    backgroundColor: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    flexWrap: 'wrap',
    gap: '15px',
  },
  patternBadge: {
    backgroundColor: '#f093fb',
    padding: '10px 20px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  patternLabel: {
    fontSize: '14px',
    color: 'white',
    fontWeight: '600',
  },
  patternName: {
    fontSize: '16px',
    color: 'white',
    fontWeight: 'bold',
  },
  stats: {
    display: 'flex',
    gap: '30px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '3px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  finishButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  questionContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: '30px',
    padding: '60px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    minWidth: '500px',
  },
  question: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '40px',
  },
  number: {
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#333',
  },
  operator: {
    fontSize: '60px',
    fontWeight: 'bold',
    color: '#f093fb',
  },
  equals: {
    fontSize: '60px',
    fontWeight: 'bold',
    color: '#333',
  },
  answerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  answerInput: {
    padding: '20px',
    fontSize: '48px',
    textAlign: 'center',
    border: '3px solid #f093fb',
    borderRadius: '15px',
    outline: 'none',
  },
  submitButton: {
    padding: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4caf50',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  feedback: {
    marginTop: '20px',
    padding: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    borderRadius: '15px',
  },
};
