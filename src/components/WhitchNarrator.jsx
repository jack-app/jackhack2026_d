import { backgroundBlurriness } from "three/tsl";
import dummy from "../assets/witch.png"
export default function WhitchNarrator({ lines }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' ,backgroundColor: '#0E1A20',}}>
      <div style={{ width: '100%' }}>
        <div style={{backgroundColor:'rgba(26, 48, 64, 0.6)' ,border: '2px solid #5DCAA5' 
        , width: '70%'
        , padding: '20px', borderRadius: '10px', margin: '5px', color: '#FFFF', fontSize: '18px', fontFamily: 'Arial, sans-serif'
        }}>
       {lines.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
         <img src={dummy} 
        style={{ width: "281px", height: "370px" }}/></div>
      </div>
  );
}
