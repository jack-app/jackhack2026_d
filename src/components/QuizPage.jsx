import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BatteryMeter from './BatteryMeter';
import WhitchNarrator from './WhitchNarrator';
import ARScene from './AR';

export default function QuizPage({
  battery,
  currentData,
  onAnswer,
  onUseHint,
  isHintVisible,
  pendingBranch,
  onBranchComplete,
  questionIndex,
  totalQuestions,
  narrationLines,
}) {
  const navigate = useNavigate();
  const latestVotesRef = useRef({ left: 0, right: 0 });
  const [timeLeft, setTimeLeft] = useState(10);
  const [timeoutLabel, setTimeoutLabel] = useState(null);

  const handleVotesChange = useCallback((v) => {
    latestVotesRef.current = v;
  }, []);

  // 問題が変わったらタイマーとタイムアウトラベルをリセット
  useEffect(() => {
    setTimeLeft(10);
    setTimeoutLabel(null);
  }, [currentData]);

  // pendingBranch が解消されたらタイムアウトラベルをクリア
  useEffect(() => {
    if (!pendingBranch) setTimeoutLabel(null);
  }, [pendingBranch]);

  // カウントダウン：0になったらその時点の票数多数決で分岐
  useEffect(() => {
    if (timeLeft <= 0) {
      const { left, right } = latestVotesRef.current;
      const goLeft = left >= right;
      const timedOutChoice = goLeft ? currentData.choices[0] : currentData.choices[1];
      setTimeoutLabel(goLeft ? '左' : '右');
      onAnswer(timedOutChoice, navigate);
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  return (
    <div style={styles.page}>

      {/* ── 上段：問題エリア ── */}
      <div style={styles.topSection}>
        <div style={styles.topBar}>
          <span style={styles.counter}>{questionIndex}/{totalQuestions}</span>

          <div style={styles.questionBox}>
            <p style={styles.questionText}>{currentData.text}</p>
            {isHintVisible && (
              <p style={styles.hintText}>ヒント：{currentData.hint}</p>
            )}
          </div>

          <span style={{ ...styles.timer, color: timeLeft <= 3 ? '#ef4444' : '#fbbf24' }}>
            {timeLeft}<br /><span style={styles.timerSec}>sec</span>
          </span>
        </div>

        <div style={styles.choiceRow}>
          <button
            style={{ ...styles.choiceBtn, borderColor: '#2dd4bf' }}
            onClick={() => onAnswer(currentData.choices[0], navigate)}
            disabled={!!pendingBranch}
          >
            ← {currentData.choices[0]}
          </button>

          <button
            style={styles.hintBtn}
            onClick={onUseHint}
            disabled={battery < 10 || !!pendingBranch}
          >
            ヒント (−10)
          </button>

          <button
            style={{ ...styles.choiceBtn, borderColor: '#2dd4bf' }}
            onClick={() => onAnswer(currentData.choices[1], navigate)}
            disabled={!!pendingBranch}
          >
            → {currentData.choices[1]}
          </button>
        </div>
      </div>

      {/* ── 下段：3列レイアウト ── */}
      <div style={styles.bottomSection}>

        {/* 左列：キャラクター */}
        <div style={styles.characterPanel}>
          <WhitchNarrator lines={narrationLines} />
        </div>

        {/* 中央：AR画面 */}
        <div style={styles.arPanel}>
          <ARScene
            pendingBranch={pendingBranch}
            onBranchComplete={onBranchComplete}
            onHandRaised={onUseHint}
            onVotesChange={handleVotesChange}
            timeoutLabel={timeoutLabel}
          />
        </div>

        {/* 右列：バッテリー */}
        <div style={styles.batteryPanel}>
          <BatteryMeter battery={battery} />
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0d1117',
    color: '#e2e8f0',
    fontFamily: 'monospace',
    overflow: 'hidden',
  },
  topSection: {
    flexShrink: 0,
    padding: '10px 14px 8px',
    background: '#111827',
    borderBottom: '2px solid #1e2d40',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  counter: {
    fontSize: 13,
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  questionBox: {
    flex: 1,
    border: '2px solid #ec4899',
    borderRadius: 8,
    padding: '8px 14px',
    background: 'rgba(236,72,153,0.06)',
    minWidth: 0,
  },
  questionText: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#f9fafb',
  },
  hintText: {
    margin: '4px 0 0',
    fontSize: 12,
    color: '#a78bfa',
  },
  timer: {
    fontSize: 22,
    fontWeight: 900,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    background: '#ef4444',
    borderRadius: '50%',
    width: 52,
    height: 52,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1.1,
  },
  timerSec: {
    fontSize: 10,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.8)',
  },
  choiceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  choiceBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'rgba(0,0,0,0.4)',
    border: '2px solid',
    borderRadius: 30,
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  hintBtn: {
    padding: '6px 14px',
    background: 'rgba(124,58,237,0.25)',
    border: '1px solid #7c3aed',
    borderRadius: 8,
    color: '#c4b5fd',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  bottomSection: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
  characterPanel: {
    width: '18%',
    flexShrink: 0,
    background: '#1a2535',
    borderRight: '1px solid #1e2d40',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  arPanel: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  batteryPanel: {
    width: '16%',
    flexShrink: 0,
    background: '#1a2535',
    borderLeft: '1px solid #1e2d40',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
};
