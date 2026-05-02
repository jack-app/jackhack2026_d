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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, containerType:"inline-size", width: '100%', height: '100%', backgroundColor:"#0E1A20", zIndex:'-2'}}>
      <p style={{ color:"#5DCAA5", fontFamily:"Noto Sans JP", fontWeight:"bold", fontSize:"1.3em" }}>Battery</p>
      <div className="battery_container" style={{ position: 'relative', width: '40%', aspectRatio: "1/3" }}>
        <div className="battery_tip" style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '45%', height: '5%', backgroundColor: '#5DCAA5', borderRadius: '3cqw 3cqw 0 0' }}/>
        <div className="whole_battery" style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', width: '100%', height:"100%", border: '4cqw solid #5DCAA5', borderRadius: '10cqw', boxSizing: 'border-box', zIndex:'auto', overflow:'hidden'}}>
          <div className="inner_battery" style={{ position:'absolute', width: '100%', height: `${battery}%`, backgroundColor: '#ddd',opacity:"100%" , borderRadius: '0 0 6cqw 6cqw', transition: 'height 0.3s ease, background-color 0.3s ease', zIndex: '-1' }} />
        </div>
      </div>
      <p style={{ color:"#5DCAA5", fontFamily:"Noto Sans JP", fontWeight:"bold", fontSize:"1.4rem" }}>{battery}%</p>
    </div>
  );
});

export default BatteryMeter;
