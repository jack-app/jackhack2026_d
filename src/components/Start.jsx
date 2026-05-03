import { useNavigate } from 'react-router-dom';

export default function Start({ handleStart }) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0E1A20',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        flex: 1,
        justifyContent: 'center',
      }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          color: '#5DCAA5',
          letterSpacing: '0.05em',
        }}>
          JackHack 2026 DanDa団
        </p>

        <h1 style={{
          margin: 0,
          fontSize: 'clamp(48px, 8vw, 80px)',
          fontWeight: 900,
          color: '#E8F4F0',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          右か、左か、<br />爆発か。
        </h1>

        <p style={{
          margin: 0,
          fontSize: 16,
          color: '#5DCAA5',
          letterSpacing: '0.1em',
        }}>
          多数決トロッコアドベンチャー
        </p>

        <button
          style={{
            marginTop: 16,
            padding: '20px 64px',
            fontSize: 22,
            fontWeight: 700,
            color: '#0E1A20',
            backgroundColor: '#5DCAA5',
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          onClick={() => { handleStart(); navigate('/quiz'); }}
        >
          ゲームスタート
        </button>
      </div>

      <div style={{
        width: '100%',
        height: 6,
        background: 'repeating-linear-gradient(to right, #5DCAA5 0px, #5DCAA5 60px, transparent 60px, transparent 80px)',
        flexShrink: 0,
      }} />
    </div>
  );
}
