import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';

const BatteryMeter = forwardRef(function BatteryMeter({ onBatteryChange }, ref) {
  let [battery, setBattery] = useState(100);

  const increase = (n) => {
    setBattery(prev => Math.min(prev + n, 100));
    console.log("i");
    // TODO: ここに回復時の演出などの追加機能を実装できます
  };

  const decrease = (n) => {
    setBattery(prev => Math.max(prev - n, 0));
    console.log("d");
    // TODO: ここにダメージ時の演出などの追加機能を実装できます
  };

  const reset = () => setBattery(100);

  useImperativeHandle(ref, () => ({
    increase,
    decrease,
    reset,
    get: () => battery,
  }), [battery]);

  useEffect(() => {
    onBatteryChange?.(battery);
  }, [battery]);

  // TODO: バッテリーバーのスタイルを実装する
  const themeColor = '#5DCAA5';
  const batteryLevelColor = battery <= 20  ? '#F44336' /*20以下*/ : battery <= 50 ? '#ffea00' /* 50以下 */ : '#17ff1b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, containerType:"inline-size", width: '100%', height: '100%', backgroundColor:"#0E1A20", zIndex:'-2'}}>
      <button style={{ backgroundColor:'#ddd', height:'5%', aspectRatio:'1/1', zIndex:"100"}} onClick={() => console.log("a")}>+</button>
      <button style={{ backgroundColor:'#ddd', height:'5%', aspectRatio:'1/1' }} onClick={() => decrease(10)}>-</button>
      <p style={{ color:`${themeColor}`, fontFamily:"Noto Sans JP", fontWeight:"bold", fontSize:"1.3em" }}>Battery</p>
      <div className="battery_container" style={{ position: 'relative', width: '40%', aspectRatio: "1/3" }}>
        <div className="battery_tip" style={{
          position: 'absolute',
          top: '-5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '45%',
          height: '5%',
          backgroundColor: `${themeColor}`,
          borderRadius: '3cqw 3cqw 0 0'
        }}/>
        <div className="whole_battery" style={{
          position: 'relative',
          display: 'flex', 
          alignItems: 'flex-end', 
          width: '100%', height:"100%", 
          border: `4cqw solid ${themeColor}`, 
          borderRadius: '10cqw', 
          boxSizing: 'border-box', 
          zIndex:'auto', 
          overflow:'hidden'
        }}>
          <div className="inner_battery" style={{ 
            position:'absolute', 
            width: '100%', 
            height: `${battery}%`, 
            backgroundColor: `${batteryLevelColor}`,
            opacity:"100%" , 
            borderRadius: '0 0 6cqw 6cqw', 
            transition: 'height 0.3s ease, background-color 0.3s ease', 
            zIndex: '-1' 
            }}/>
        </div>
      </div>
      <p style={{ color: `${batteryLevelColor}`, fontFamily:"Noto Sans JP", fontWeight:"bold", fontSize:"1.4rem" }}>{battery}%</p>
    </div>
  );
});

export default BatteryMeter;
