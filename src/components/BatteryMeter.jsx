import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';

const BatteryMeter = forwardRef(function BatteryMeter({ onBatteryChange }, ref) {
  let [battery, setBattery] = useState(100);
  let currentBattery = 0;
  useImperativeHandle(ref, () => ({

    increase: (n) => {
      setBattery(Math.min(battery + n, 100));
      // TODO: battery を n 増やす（上限 100）
    },
    decrease: (n) => {
      setBattery(Math.max(battery - n, 0));
      // TODO: battery を n 減らす（下限 0）
    },
    reset: () => {
      setBattery(100);
      // TODO: battery を 100 に戻す
    },
    get: () => {
      return battery;
      // TODO: 現在の battery 値を返す
    },
  }),[battery]);

  useEffect(() => {
    onBatteryChange?.(battery);
  }, [battery]);

  // TODO: バッテリーバーのスタイルを実装する
  const color = '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, containerType:"inline-size", width: '100%', height: '100%', backgroundColor:"#0E1A20"}}>
      <p>バッテリー</p>
      <div className="whole_battery" style={{ position: 'relative', display: 'flex', width: '40%', aspectRatio:"1/3", height:"auto", border: '4cqw solid #5DCAA5', borderRadius: '10cqw', alignItems: 'flex-end', boxSizing: 'border-box'}}>
        <div className="battery_tip" style={{ position: 'absolute', top: '-8%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '8%', backgroundColor: '#5DCAA5', borderRadius: '20% 20% 0 0' }}/>
        <div className="inner_battery" style={{ width: '100%', height: `${battery}%`, backgroundColor: '#ddd',opacity:"100%" , borderRadius: '6cqw', transition: 'height 0.3s ease, background-color 0.3s ease' }} />
      </div> 
      <p style={{  color:"#fff", fontFamily:"" }}>{battery}%</p>
    </div>
  );
});

export default BatteryMeter;
