export default function BatteryMeter({ battery }) {
  // 初心者の仕事：batteryの数値を使って、ゲージが伸び縮みするデザインを作る
  return (
    <div style={{ 
      backgroundColor: "lightgray",
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "20%",
      height: "50%",
      padding: "20px",
      // boxSizing: "border-box"
    }}>
      <div style={{ border: "1px solid black", width: "100%" }}>
        <div style={{ 
          width: `${battery}%`, 
          backgroundColor: "green" ,
          height: "100px" 

        }}>
          {battery}%
        </div>
      </div>
    </div>
  );
}