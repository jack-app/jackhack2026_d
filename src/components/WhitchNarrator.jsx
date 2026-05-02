export default function WhitchNarrator({ lines }) {
  return (
    <div style={styles.root}>
      <div style={styles.bubble}>
        {lines.map((text, index) => (
          <p key={index} style={styles.line}>{text}</p>
        ))}
      </div>
      <div style={styles.characterPlaceholder}>🧙</div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    gap: 8,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bubble: {
    background: 'rgba(30,40,60,0.9)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '10px 12px',
    width: '100%',
  },
  line: {
    margin: '4px 0',
    fontSize: 11,
    color: '#d1d5db',
    lineHeight: 1.5,
  },
  characterPlaceholder: {
    fontSize: 40,
  },
};
