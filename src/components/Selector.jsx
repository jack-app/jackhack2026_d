export default function Selector({ onSelect, currentDifficulty }) {
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
        gap: 40,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            margin: '0 0 12px',
            fontSize: 14,
            color: '#5DCAA5',
            letterSpacing: '0.1em',
          }}>
            SELECT DIFFICULTY
          </p>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 900,
            color: '#E8F4F0',
            letterSpacing: '-0.01em',
          }}>
            難易度を選択
          </h2>
        </div>

        <div style={{
          display: 'flex',
          gap: 24,
        }}>
          {/* Easy カード */}
          <button
            onClick={() => onSelect('easy')}
            style={{
              width: 220,
              padding: '32px 24px',
              backgroundColor: currentDifficulty === 'easy' ? '#5DCAA5' : 'transparent',
              border: '2px solid #5DCAA5',
              borderRadius: 16,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => {
              if (currentDifficulty !== 'easy') e.currentTarget.style.backgroundColor = 'rgba(93,202,165,0.15)';
            }}
            onMouseLeave={e => {
              if (currentDifficulty !== 'easy') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <p style={{
              margin: '0 0 8px',
              fontSize: 28,
              fontWeight: 900,
              color: currentDifficulty === 'easy' ? '#0E1A20' : '#E8F4F0',
            }}>
              EASY
            </p>
          </button>

          {/* Hard カード */}
          <button
            onClick={() => onSelect('hard')}
            style={{
              width: 220,
              padding: '32px 24px',
              backgroundColor: currentDifficulty === 'hard' ? '#5DCAA5' : 'transparent',
              border: '2px solid #5DCAA5',
              borderRadius: 16,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => {
              if (currentDifficulty !== 'hard') e.currentTarget.style.backgroundColor = 'rgba(93,202,165,0.15)';
            }}
            onMouseLeave={e => {
              if (currentDifficulty !== 'hard') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <p style={{
              margin: '0 0 8px',
              fontSize: 28,
              fontWeight: 900,
              color: currentDifficulty === 'hard' ? '#0E1A20' : '#E8F4F0',
            }}>
              HARD
            </p>
          </button>
        </div>
      </div>

      {/* 下部レール */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 6,
        background: 'repeating-linear-gradient(to right, #5DCAA5 0px, #5DCAA5 60px, transparent 60px, transparent 80px)',
      }} />
    </div>
  );
}
