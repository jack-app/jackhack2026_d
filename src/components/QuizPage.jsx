import { useState } from 'react';
import BatteryMeter from './BatteryMeter';
import WhitchNarrator from './WhitchNarrator';
import ARPanel from './ARPanel';
import QuizBoard from './QuizBoard';

export default function QuizPage({
  battery,
  batteryRef,
  onBatteryChange,
  currentData,
  onAnswer,
  onUseHint,
  isHintVisible,
  pendingBranch,
  onBranchComplete,
  questionIndex,
  totalQuestions,
  narrationLines,
}) {
  // QuizBoard（タイマー管理）→ ARPanel（タイムアウト処理）の橋渡し
  const [timeLeft, setTimeLeft] = useState(10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#0E1A20' }}>

      {/* 上段：問題エリア */}
      <div style={{ flexShrink: 0 }}>
        <QuizBoard
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          currentData={currentData}
          isHintVisible={isHintVisible}
          onAnswer={onAnswer}
          onUseHint={onUseHint}
          battery={battery}
          pendingBranch={pendingBranch}
          timeLeft={timeLeft}
          onTimeChange={setTimeLeft}
        />
      </div>

      {/* 下段：3列レイアウト */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        <div style={{ width: '18%', flexShrink: 0, overflow: 'hidden' }}>
          <WhitchNarrator lines={narrationLines} />
        </div>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ARPanel
            currentData={currentData}
            onAnswer={onAnswer}
            pendingBranch={pendingBranch}
            onBranchComplete={onBranchComplete}
            onUseHint={onUseHint}
            timeLeft={timeLeft}
            hintText={currentData.hint}
          />
        </div>

        <div style={{ width: '16%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BatteryMeter ref={batteryRef} onBatteryChange={onBatteryChange} />
        </div>

      </div>
    </div>
  );
}
