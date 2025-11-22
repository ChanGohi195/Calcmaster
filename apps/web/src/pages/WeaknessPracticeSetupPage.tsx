import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { analyzeWeakness, generateSuggestionMessage } from '../lib/weakness-analyzer';
import type { WeaknessPattern } from '../types';
import type { Database } from '../types/database';

type QuestionLog = Database['public']['Tables']['question_logs']['Row'];

export default function WeaknessPracticeSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<WeaknessPattern[]>([]);
  const [suggestedPattern, setSuggestedPattern] = useState<WeaknessPattern | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<WeaknessPattern | null>(null);

  useEffect(() => {
    loadWeaknessData();
  }, [user]);

  const loadWeaknessData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 最近の学習ログを取得（直近100問）
      const { data: logs, error } = await supabase
        .from('question_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('answered_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading logs:', error);
        setLoading(false);
        return;
      }

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      // 苦手パターンを分析
      const analysis = analyzeWeakness(logs as QuestionLog[]);
      setPatterns(analysis.patterns);
      setSuggestedPattern(analysis.suggestedPractice);

      // デフォルトでサジェストを選択
      if (analysis.suggestedPractice) {
        setSelectedPattern(analysis.suggestedPractice);
      }
    } catch (err) {
      console.error('Error analyzing weakness:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    if (!selectedPattern) return;

    // 選択されたパターンを保存
    localStorage.setItem('weaknessPattern', JSON.stringify(selectedPattern));
    navigate('/practice/weakness/play');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>ぶんせきちゅう...</p>
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <header style={styles.header}>
            <button onClick={() => navigate('/')} style={styles.backButton}>
              ← もどる
            </button>
            <h1 style={styles.title}>苦手集中</h1>
          </header>

          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📊</div>
            <h2 style={styles.emptyTitle}>まだデータがたりないよ</h2>
            <p style={styles.emptyText}>
              フリー練習モードでもんだいをといて、
              <br />
              データをためてね！
            </p>
            <button
              onClick={() => navigate('/practice/free')}
              style={styles.practiceButton}
            >
              フリー練習をする
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← もどる
          </button>
          <h1 style={styles.title}>苦手集中</h1>
        </header>

        {suggestedPattern && (
          <div style={styles.suggestionCard}>
            <div style={styles.suggestionHeader}>
              <span style={styles.suggestionIcon}>💡</span>
              <h2 style={styles.suggestionTitle}>おすすめ</h2>
            </div>
            <p style={styles.suggestionText}>
              {generateSuggestionMessage(suggestedPattern)}
            </p>
            <button
              onClick={() => setSelectedPattern(suggestedPattern)}
              style={{
                ...styles.suggestionButton,
                ...(selectedPattern === suggestedPattern
                  ? styles.suggestionButtonSelected
                  : {}),
              }}
            >
              {selectedPattern === suggestedPattern ? '✓ えらんだ' : 'これをれんしゅう'}
            </button>
          </div>
        )}

        <div style={styles.patternsSection}>
          <h2 style={styles.sectionTitle}>にがてなパターン</h2>
          <div style={styles.patternsList}>
            {patterns.map((pattern, index) => (
              <PatternCard
                key={index}
                pattern={pattern}
                isSelected={selectedPattern === pattern}
                onSelect={() => setSelectedPattern(pattern)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleStartPractice}
          disabled={!selectedPattern}
          style={{
            ...styles.startButton,
            ...(selectedPattern ? {} : styles.startButtonDisabled),
          }}
        >
          れんしゅうスタート！
        </button>
      </div>
    </div>
  );
}

interface PatternCardProps {
  pattern: WeaknessPattern;
  isSelected: boolean;
  onSelect: () => void;
}

function PatternCard({ pattern, isSelected, onSelect }: PatternCardProps) {
  const getPatternTitle = (p: WeaknessPattern): string => {
    switch (p.type) {
      case 'operation':
        return p.operation === 'add' ? 'たし算' : 'ひき算';
      case 'carry':
        return 'くり上がりのあるたし算';
      case 'borrow':
        return 'くり下がりのあるひき算';
      case 'specific_number':
        if (p.operation === 'add') {
          return `${p.specificNumber}をたす`;
        } else {
          return `${p.specificNumber}をひく`;
        }
      default:
        return 'その他';
    }
  };

  const getPatternIcon = (p: WeaknessPattern): string => {
    switch (p.type) {
      case 'operation':
        return p.operation === 'add' ? '➕' : '➖';
      case 'carry':
        return '⬆️';
      case 'borrow':
        return '⬇️';
      case 'specific_number':
        return '🔢';
      default:
        return '📝';
    }
  };

  const correctRatePercent = Math.round(pattern.correctRate * 100);
  const avgTimeSeconds = (pattern.avgResponseTimeMs / 1000).toFixed(1);

  return (
    <button
      onClick={onSelect}
      style={{
        ...styles.patternCard,
        ...(isSelected ? styles.patternCardSelected : {}),
      }}
    >
      <div style={styles.patternIcon}>{getPatternIcon(pattern)}</div>
      <div style={styles.patternContent}>
        <h3 style={styles.patternTitle}>{getPatternTitle(pattern)}</h3>
        <div style={styles.patternStats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>せいかいりつ</span>
            <span
              style={{
                ...styles.statValue,
                color: correctRatePercent < 50 ? '#e74c3c' : '#f39c12',
              }}
            >
              {correctRatePercent}%
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>へいきんじかん</span>
            <span style={styles.statValue}>{avgTimeSeconds}びょう</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>もんだいすう</span>
            <span style={styles.statValue}>{pattern.questionCount}もん</span>
          </div>
        </div>
      </div>
      {isSelected && <div style={styles.checkmark}>✓</div>}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    padding: '20px',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '15px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  loadingText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.8',
    marginBottom: '30px',
  },
  practiceButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
  },
  suggestionCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '3px solid #ffd700',
  },
  suggestionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  suggestionIcon: {
    fontSize: '32px',
  },
  suggestionTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  suggestionText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.6',
  },
  suggestionButton: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea',
    backgroundColor: 'white',
    border: '2px solid #667eea',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  suggestionButtonSelected: {
    color: 'white',
    backgroundColor: '#667eea',
  },
  patternsSection: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  patternsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  patternCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    border: '2px solid #e0e0e0',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left',
    position: 'relative',
  },
  patternCardSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  patternIcon: {
    fontSize: '36px',
    minWidth: '50px',
    textAlign: 'center',
  },
  patternContent: {
    flex: 1,
  },
  patternTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  patternStats: {
    display: 'flex',
    gap: '20px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '3px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  checkmark: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '24px',
    color: '#2196f3',
  },
  startButton: {
    width: '100%',
    padding: '20px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#4caf50',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};
