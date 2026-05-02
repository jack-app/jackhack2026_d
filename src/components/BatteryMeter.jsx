export default function BatteryMeter({ battery }) {
  const color = battery > 50 ? '#22c55e' : battery > 20 ? '#eab308' : '#ef4444';

  return (
    <div style={styles.root}>
      <p style={styles.label}>バッテリー</p>
      <div style={styles.track}>
        <div style={{ ...styles.fill, height: `${battery}%`, background: color }} />
      </div>
      <p style={styles.value}>{battery}%</p>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  label: {
    margin: 0,
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  track: {
    width: 32,
    flex: 1,
    maxHeight: 200,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: 4,
    transition: 'height 0.4s ease, background 0.4s ease',
  },
  value: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
};
