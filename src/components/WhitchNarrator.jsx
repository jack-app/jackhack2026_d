import witchImg from '../assets/witch.png';

export default function WhitchNarrator({ lines }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
      padding: '0 8px 12px',
    }}>

      {/* 吹き出し */}
      <div style={{ position: 'relative', width: '100%', marginBottom: 8 }}>
        <div style={{
          backgroundColor: '#E8F4F0',
          borderRadius: 12,
          padding: '10px 14px',
          border: '2px solid #5DCAA5',
        }}>
          {lines.map((text, index) => (
            <p key={index} style={{
              margin: index === 0 ? 0 : '6px 0 0',
              fontSize: 13,
              color: '#0E1A20',
              fontWeight: 600,
              lineHeight: 1.5,
            }}>
              {text}
            </p>
          ))}
        </div>

        {/* 吹き出しのしっぽ */}
        <div style={{
          position: 'absolute',
          bottom: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '10px solid #5DCAA5',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #E8F4F0',
        }} />
      </div>

      {/* 魔女画像 */}
      <img
        src={witchImg}
        alt="魔女"
        style={{
          width: '90%',
          objectFit: 'contain',
          marginTop: 4,
        }}
      />
    </div>
  );
}
