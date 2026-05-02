import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';

const BatteryMeter = forwardRef(function BatteryMeter({ onBatteryChange }, ref) {
  const [battery, setBattery] = useState(100);

  useImperativeHandle(ref, () => ({
    increase: (n) => {
      // TODO: battery を n 増やす（上限 100）
    },
    decrease: (n) => {
      // TODO: battery を n 減らす（下限 0）
    },
    reset: () => {
      // TODO: battery を 100 に戻す
    },
    get: () => {
      // TODO: 現在の battery 値を返す
    },
  }));

  useEffect(() => {
    onBatteryChange?.(battery);
  }, [battery]);

  // TODO: バッテリーバーのスタイルを実装する
  const color = '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
      <p>バッテリー</p>
      <div style={{ width: 32, flex: 1, maxHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: `${battery}%`, background: color }} />
      </div>
      <p>{battery}%</p>
    </div>
  );
});

export default BatteryMeter;
