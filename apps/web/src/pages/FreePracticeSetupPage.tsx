import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FreeModeSettings } from '../types';

export default function FreePracticeSetupPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<FreeModeSettings>({
    operation: 'add',
    firstNumberMin: 1,
    firstNumberMax: 10,
    secondNumberMin: 1,
    secondNumberMax: 10,
    allowCarry: true,
    allowBorrow: true,
  });

  const handleStart = () => {
    // 設定を保存してプラクティスページに遷移
    localStorage.setItem('freeModeSettings', JSON.stringify(settings));
    navigate('/practice/free/play');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← もどる
          </button>
          <h1 style={styles.title}>フリー練習</h1>
        </header>

        <div style={styles.settingsCard}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>けいさんのしゅるい</h2>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => setSettings({ ...settings, operation: 'add' })}
                style={{
                  ...styles.optionButton,
                  ...(settings.operation === 'add' ? styles.optionButtonActive : {}),
                }}
              >
                たし算 ➕
              </button>
              <button
                onClick={() => setSettings({ ...settings, operation: 'subtract' })}
                style={{
                  ...styles.optionButton,
                  ...(settings.operation === 'subtract' ? styles.optionButtonActive : {}),
                }}
              >
                ひき算 ➖
              </button>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              さいしょのかず: {settings.firstNumberMin} 〜 {settings.firstNumberMax}
            </h2>
            <div style={styles.sliderContainer}>
              <span style={styles.sliderLabel}>さいしょう</span>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.firstNumberMin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    firstNumberMin: parseInt(e.target.value),
                    firstNumberMax: Math.max(
                      parseInt(e.target.value),
                      settings.firstNumberMax
                    ),
                  })
                }
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{settings.firstNumberMin}</span>
            </div>
            <div style={styles.sliderContainer}>
              <span style={styles.sliderLabel}>さいだい</span>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.firstNumberMax}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    firstNumberMax: parseInt(e.target.value),
                    firstNumberMin: Math.min(
                      settings.firstNumberMin,
                      parseInt(e.target.value)
                    ),
                  })
                }
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{settings.firstNumberMax}</span>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              つぎのかず: {settings.secondNumberMin} 〜 {settings.secondNumberMax}
            </h2>
            <div style={styles.sliderContainer}>
              <span style={styles.sliderLabel}>さいしょう</span>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.secondNumberMin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    secondNumberMin: parseInt(e.target.value),
                    secondNumberMax: Math.max(
                      parseInt(e.target.value),
                      settings.secondNumberMax
                    ),
                  })
                }
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{settings.secondNumberMin}</span>
            </div>
            <div style={styles.sliderContainer}>
              <span style={styles.sliderLabel}>さいだい</span>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.secondNumberMax}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    secondNumberMax: parseInt(e.target.value),
                    secondNumberMin: Math.min(
                      settings.secondNumberMin,
                      parseInt(e.target.value)
                    ),
                  })
                }
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{settings.secondNumberMax}</span>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>もんだいのパターン</h2>
            {settings.operation === 'add' && (
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings.allowCarry}
                  onChange={(e) =>
                    setSettings({ ...settings, allowCarry: e.target.checked })
                  }
                />
                <span style={styles.checkboxLabel}>
                  くり上がりのあるもんだい
                </span>
              </label>
            )}
            {settings.operation === 'subtract' && (
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings.allowBorrow}
                  onChange={(e) =>
                    setSettings({ ...settings, allowBorrow: e.target.checked })
                  }
                />
                <span style={styles.checkboxLabel}>
                  くり下がりのあるもんだい
                </span>
              </label>
            )}
          </div>

          <button onClick={handleStart} style={styles.startButton}>
            れんしゅうスタート！
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  content: {
    maxWidth: '600px',
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
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  optionButton: {
    flex: 1,
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    border: '2px solid #ddd',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  optionButtonActive: {
    backgroundColor: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  sliderLabel: {
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '70px',
  },
  slider: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
  },
  sliderValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    minWidth: '30px',
    textAlign: 'right',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '16px',
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
    marginTop: '10px',
  },
};
