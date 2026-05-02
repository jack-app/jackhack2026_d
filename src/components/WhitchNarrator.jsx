export default function WhitchNarrator({ lines }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%' }}>
        {lines.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
      <div>🧙</div>
    </div>
  );
}
