import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface WeakProblem {
  firstNumber: number;
  secondNumber: number;
  operation: 'add' | 'subtract';
  correctRate: number;
  attemptCount: number;
}

interface PatternStats {
  pattern: string;
  correctRate: number;
  avgResponseTimeMs: number;
  questionCount: number;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [overallStats, setOverallStats] = useState({
    totalQuestions: 0,
    avgCorrectRate: 0,
    avgResponseTimeMs: 0,
  });
  const [weakProblems, setWeakProblems] = useState<WeakProblem[]>([]);
  const [patternStats, setPatternStats] = useState<PatternStats[]>([]);

  useEffect(() => {
    if (user?.role !== 'teacher') {
      navigate('/');
      return;
    }

    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      // 全ユーザーの学習ログを取得（本来はクラス単位で絞り込む）
      const { data: logs, error } = await supabase
        .from('question_logs')
        .select('*')
        .order('answered_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error loading logs:', error);
        setLoading(false);
        return;
      }

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      const logsData = logs as any[];

      // ユーザー数を取得
      const uniqueUsers = new Set(logsData.map((log) => log.user_id));
      setTotalStudents(uniqueUsers.size);

      // 全体統計を計算
      const totalQuestions = logsData.length;
      const correctCount = logsData.filter((log) => log.is_correct).length;
      const avgCorrectRate = correctCount / totalQuestions;
      const avgResponseTimeMs =
        logsData.reduce((sum, log) => sum + log.response_time_ms, 0) / totalQuestions;

      setOverallStats({
        totalQuestions,
        avgCorrectRate,
        avgResponseTimeMs,
      });

      // 苦手問題トップ10を抽出
      const problemMap = new Map<
        string,
        { correct: number; total: number; problem: WeakProblem }
      >();

      for (const log of logsData) {
        const key = `${log.operation}_${log.first_number}_${log.second_number}`;
        const stats = problemMap.get(key) || {
          correct: 0,
          total: 0,
          problem: {
            firstNumber: log.first_number,
            secondNumber: log.second_number,
            operation: log.operation as 'add' | 'subtract',
            correctRate: 0,
            attemptCount: 0,
          },
        };

        stats.total++;
        if (log.is_correct) stats.correct++;

        problemMap.set(key, stats);
      }

      const weakProblemsList: WeakProblem[] = [];
      for (const [, stats] of problemMap.entries()) {
        if (stats.total >= 5) {
          // 最低5回以上出題された問題のみ
          weakProblemsList.push({
            ...stats.problem,
            correctRate: stats.correct / stats.total,
            attemptCount: stats.total,
          });
        }
      }

      // 正答率の低い順にソート
      weakProblemsList.sort((a, b) => a.correctRate - b.correctRate);
      setWeakProblems(weakProblemsList.slice(0, 10));

      // パターンごとの統計
      const patterns: PatternStats[] = [];

      // 操作別
      for (const operation of ['add', 'subtract'] as const) {
        const operationLogs = logsData.filter((log) => log.operation === operation);
        if (operationLogs.length > 0) {
          const correctCount = operationLogs.filter((log) => log.is_correct).length;
          const avgTime =
            operationLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
            operationLogs.length;

          patterns.push({
            pattern: operation === 'add' ? 'たし算' : 'ひき算',
            correctRate: correctCount / operationLogs.length,
            avgResponseTimeMs: avgTime,
            questionCount: operationLogs.length,
          });
        }
      }

      // 繰り上がり
      const carryLogs = logsData.filter((log) => log.has_carry);
      if (carryLogs.length > 0) {
        const correctCount = carryLogs.filter((log) => log.is_correct).length;
        const avgTime =
          carryLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
          carryLogs.length;

        patterns.push({
          pattern: '繰り上がり',
          correctRate: correctCount / carryLogs.length,
          avgResponseTimeMs: avgTime,
          questionCount: carryLogs.length,
        });
      }

      // 繰り下がり
      const borrowLogs = logsData.filter((log) => log.has_borrow);
      if (borrowLogs.length > 0) {
        const correctCount = borrowLogs.filter((log) => log.is_correct).length;
        const avgTime =
          borrowLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
          borrowLogs.length;

        patterns.push({
          pattern: '繰り下がり',
          correctRate: correctCount / borrowLogs.length,
          avgResponseTimeMs: avgTime,
          questionCount: borrowLogs.length,
        });
      }

      setPatternStats(patterns);
    } catch (err) {
      console.error('Error analyzing data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>分析中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← ホーム
          </button>
          <h1 style={styles.title}>クラス分析ダッシュボード</h1>
        </div>
      </header>

      <main style={styles.main}>
        {/* 全体統計 */}
        <div style={styles.statsGrid}>
          <StatCard
            title="生徒数"
            value={totalStudents.toString()}
            icon="👥"
            color="#667eea"
          />
          <StatCard
            title="総問題数"
            value={overallStats.totalQuestions.toString()}
            icon="📝"
            color="#f093fb"
          />
          <StatCard
            title="平均正答率"
            value={`${Math.round(overallStats.avgCorrectRate * 100)}%`}
            icon="✅"
            color="#4caf50"
          />
          <StatCard
            title="平均回答時間"
            value={`${(overallStats.avgResponseTimeMs / 1000).toFixed(1)}秒`}
            icon="⏱️"
            color="#ff9800"
          />
        </div>

        {/* 苦手問題トップ10 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>苦手問題トップ10</h2>
          <div style={styles.weakProblemsContainer}>
            {weakProblems.map((problem, index) => (
              <WeakProblemCard key={index} rank={index + 1} problem={problem} />
            ))}
          </div>
        </div>

        {/* パターン別分析 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>パターン別分析</h2>
          <div style={styles.patternsList}>
            {patternStats.map((stat, index) => (
              <PatternStatsCard key={index} stats={stat} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: color }}>{icon}</div>
      <div style={styles.statContent}>
        <p style={styles.statTitle}>{title}</p>
        <p style={{ ...styles.statValue, color }}>{value}</p>
      </div>
    </div>
  );
}

interface WeakProblemCardProps {
  rank: number;
  problem: WeakProblem;
}

function WeakProblemCard({ rank, problem }: WeakProblemCardProps) {
  const correctRatePercent = Math.round(problem.correctRate * 100);
  const operatorSymbol = problem.operation === 'add' ? '+' : '-';

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#e74c3c';
    if (rank <= 3) return '#f39c12';
    return '#95a5a6';
  };

  return (
    <div style={styles.weakProblemCard}>
      <div
        style={{
          ...styles.rankBadge,
          backgroundColor: getRankColor(rank),
        }}
      >
        {rank}
      </div>
      <div style={styles.problemDisplay}>
        <span style={styles.problemNumber}>{problem.firstNumber}</span>
        <span style={styles.problemOperator}>{operatorSymbol}</span>
        <span style={styles.problemNumber}>{problem.secondNumber}</span>
      </div>
      <div style={styles.problemStats}>
        <div style={styles.problemStat}>
          <span style={styles.problemStatLabel}>正答率</span>
          <span
            style={{
              ...styles.problemStatValue,
              color: correctRatePercent < 50 ? '#e74c3c' : '#f39c12',
            }}
          >
            {correctRatePercent}%
          </span>
        </div>
        <div style={styles.problemStat}>
          <span style={styles.problemStatLabel}>出題数</span>
          <span style={styles.problemStatValue}>{problem.attemptCount}回</span>
        </div>
      </div>
    </div>
  );
}

interface PatternStatsCardProps {
  stats: PatternStats;
}

function PatternStatsCard({ stats }: PatternStatsCardProps) {
  const correctRatePercent = Math.round(stats.correctRate * 100);
  const avgTimeSeconds = (stats.avgResponseTimeMs / 1000).toFixed(1);

  return (
    <div style={styles.patternCard}>
      <h3 style={styles.patternName}>{stats.pattern}</h3>
      <div style={styles.patternStatsGrid}>
        <div style={styles.patternStatItem}>
          <span style={styles.patternStatLabel}>正答率</span>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${correctRatePercent}%`,
                backgroundColor:
                  correctRatePercent >= 70
                    ? '#4caf50'
                    : correctRatePercent >= 50
                    ? '#f39c12'
                    : '#e74c3c',
              }}
            />
          </div>
          <span style={styles.patternStatValue}>{correctRatePercent}%</span>
        </div>
        <div style={styles.patternStatItem}>
          <span style={styles.patternStatLabel}>平均回答時間</span>
          <span style={styles.patternStatValue}>{avgTimeSeconds}秒</span>
        </div>
        <div style={styles.patternStatItem}>
          <span style={styles.patternStatLabel}>問題数</span>
          <span style={styles.patternStatValue}>{stats.questionCount}問</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px',
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
    color: '#667eea',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  statIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 5px 0',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  weakProblemsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
  },
  weakProblemCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  problemDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  problemNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
  },
  problemOperator: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  problemStats: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0',
  },
  problemStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  problemStatLabel: {
    fontSize: '11px',
    color: '#999',
    marginBottom: '3px',
  },
  problemStatValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  patternsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  patternCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  patternName: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  patternStatsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  patternStatItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  patternStatLabel: {
    fontSize: '13px',
    color: '#666',
  },
  patternStatValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
};
