import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';

const BatteryMeter = forwardRef(function BatteryMeter({ onBatteryChange }, ref) {
  let [battery, setBattery] = useState(100);
  let [isRecovering, setIsRecovering] = useState(false);

  const increase = (n) => {
    const current = get();
    if (current == 100) {
      return;
    } else {
      setBattery(Math.min(current + n, 100));
      console.log("i");
      setIsRecovering(true);
      setTimeout(() => {
        setIsRecovering(false);
      }, 400);
    }
    // TODO: ここに回復時の演出などの追加機能を実装できます
  };

  const decrease = (n) => {
    setBattery(prev => Math.max(prev - n, 0));
    console.log("d");
    // TODO: ここにダメージ時の演出などの追加機能を実装できます
  };

    const reset = () => setBattery(100);

  const get = () => battery;

  useImperativeHandle(ref, () => ({
    increase,
    decrease,
    reset,
    get
  }), [battery]);

  useEffect(() => {
    onBatteryChange?.(battery);
  }, [battery]);

  // TODO: バッテリーバーのスタイルを実装する
  const themeColor = '#5DCAA5';
  const batteryLevelColor = battery <= 20  ? '#F44336' /*20以下*/ : battery <= 50 ? '#ffea00' /* 50以下 */ : '#17ff1b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'center', gap: 8, containerType:"inline-size", width: '100%', height: '100%', backgroundColor:"#0E1A20" }}>
      <p style={{ color:`${themeColor}`, fontFamily:"Noto Sans JP", fontWeight:"bold", fontSize:"1.3rem", userSelect:'none', margin:'0.5rem 0' }}>Battery</p>
      <div className="whole_battery" style={{  position: 'relative', width: '36%', aspectRatio: "1/3", margin:'10% 0 5% 0', zIndex:'1' }}>
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
        <div className="battery_container" style={{
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
        <div className="recovery_effect_wrapper" style={{
          position:'absolute',
          top:'0',
          left:'0',
          height:'100%',
          width:'100%',
          opacity: isRecovering ? 1 : 0,
          transition:'opacity 0.3s'
        }} >
          <SingleRecoveryEffect translate={['380%', '-200%']}/>
          <SingleRecoveryEffect translate={['-150%', '-100%']}/>
          <SingleRecoveryEffect translate={['440%', '0%']}/>
          <SingleRecoveryEffect translate={['-240%', '300%']}/>
          <SingleRecoveryEffect translate={['390%', '500%']}/>
          <SingleRecoveryEffect translate={['-100%', '500%']}/>
        </div> 
      </div>
      <p style={{ color: `${batteryLevelColor}`, fontFamily:"Noto Sans JP", fontWeight:"bold", fontSize:"1.6rem", userSelect:'none' }}>{battery}%</p>
    </div>
  );
});

function SingleRecoveryEffect({ translate }) {
  return (
    <>
      <p style={{color:'#17ff1b',
        fontFamily:'Noto Sans JP',
        fontWeight:'bolder',
        fontSize:'1.6rem',
        margin:'0',
        height:'10%',
        width:'30%',
        textAlign:'center',
        verticalAlign:'center',
        userSelect:'none',
        transform:`translate(${translate[0]}, ${translate[1]})`,
      }}>+</p>
    </>
  );
};

export default BatteryMeter;
