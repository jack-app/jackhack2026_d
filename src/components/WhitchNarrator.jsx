export default function WhitchNarrator({ lines }) {
  return (
    <div style={{ padding: '20px', backgroundColor: 'gray', borderRadius: '12px', marginBottom: '20px', position: 'fixed', bottom: '0', left: '0', height: '300px' }}>
      {lines.map((text, index) => (
        <p key={index} style={{ margin: '8px 0' }}>
          {text}
        </p>
      ))}
    </div>
  );
}