import { backgroundBlurriness } from "three/tsl";
import dummy from "../assets/witch.png";
export default function WhitchNarrator({ lines }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' ,backgroundColor: '#0E1A20',}}>
      <div style={{ width: '100%' }}>
        {lines.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
        <img src={dummy} /></div>
      </div>
  );
}
