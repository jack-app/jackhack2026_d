import { useState, useEffect } from "react";
import dummy from "../assets/witch.png"

function Typewriter({ text, speed = 100, onComplete}) {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    if (typeof text !== "string") return;
    setDisplayText("");
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        onComplete && onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return (
    <p
  style={{
    color: "#fff",
    margin: "5px 0",
    textShadow: `
      0 0 5px #ffffff,
      0 0 10px #F72585,
      0 0 20px #ffffff
    `,
  }}>
  {displayText.split("").map((char, i) => (
      <span
        key={i}
        style={{
          opacity: 1,
          animation: "fadeIn 0.3s forwards",
          animationDelay: `${i * 0.05}s`,
        }}
      >
        {char}
      </span>
    ))}
</p>
  );
}
export default function WhitchNarrator({ lines }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' ,backgroundColor: '#0E1A20',}}>
      <div style={{ width: '100%' }}>
        <div style={{position: "relative", backgroundColor:'rgba(26, 48, 64, 0.6)' ,border: '2px solid #5DCAA5' 
        , width: '70%', padding: '20px', borderRadius: '10px', margin: '10px', color: '#FFFFFF', fontSize: '18px', fontFamily: 'Arial, sans-serif'
        }}>
       <Typewriter text={lines?.[currentIndex]} speed={100} onComplete={() =>
    setCurrentIndex((prev) =>
      prev < lines.length - 1 ? prev + 1 : prev
    )
  }/>
 <div
 style={{
      position: "absolute",
      bottom: "-12px", 
      left: "45%",
     transform: "translateX(-50%)",
     width: 0,
     height: 0,
     borderLeft: "12px solid transparent",
     borderRight: "12px solid transparent",
     borderTop: "12px solid #5DCAA5",  
    }}
  />
         </div>
         <img src={dummy} 
        style={{ width: "265px"}}/></div>
    </div>
   );
  }