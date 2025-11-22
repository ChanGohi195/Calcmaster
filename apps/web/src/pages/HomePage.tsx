import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>CalcMaster</h1>
        <div style={styles.userInfo}>
          <span style={styles.nickname}>{user?.nickname}さん</span>
          <button onClick={logout} style={styles.logoutButton}>
            ログアウト
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.modeGrid}>
          <ModeCard
            title="フリー練習"
            description="すきなもんだいを れんしゅうしよう"
            icon="✏️"
            color="#667eea"
            onClick={() => navigate('/practice/free')}
          />

          <ModeCard
            title="苦手集中"
            description="にがてなもんだいを れんしゅうしよう"
            icon="🎯"
            color="#f093fb"
            onClick={() => navigate('/practice/weakness')}
          />

          {user?.role === 'teacher' && (
            <ModeCard
              title="クラス分析"
              description="クラス全体の学習状況を確認"
              icon="📊"
              color="#4facfe"
              onClick={() => navigate('/analytics')}
            />
          )}
        </div>
      </main>
    </div>
  );
}

interface ModeCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}

function ModeCard({ title, description, icon, color, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      style={{ ...styles.modeCard, borderColor: color }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 10px 30px ${color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div style={styles.modeIcon}>{icon}</div>
      <h2 style={{ ...styles.modeTitle, color }}>{title}</h2>
      <p style={styles.modeDescription}>{description}</p>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#667eea',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  nickname: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  main: {
    padding: '60px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
  },
  modeCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '20px',
    border: '3px solid',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  modeIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  modeTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },
  modeDescription: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
    lineHeight: '1.5',
  },
};
