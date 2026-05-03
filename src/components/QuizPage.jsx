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
  correctBranch,
  onBranchComplete,
  questionIndex,
  totalQuestions,
  narrationLines,
  batteryDead,
  onBatteryDeadComplete,
  timeLeft,
  onTimeChange,
  onTimeoutFail,
}) {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#0E1A20' }}>

      {/* 上段：問題エリア */}
      <div style={{ flexShrink: 0 ,backgroundColor:'#1A3040', marginBottom:'10px'}}>
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
          onTimeChange={onTimeChange}
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
            correctBranch={correctBranch}
            onBranchComplete={onBranchComplete}
            onUseHint={onUseHint}
            timeLeft={timeLeft}
            hintText={currentData.hint}
            batteryDead={batteryDead}
            onBatteryDeadComplete={onBatteryDeadComplete}
            onTimeoutFail={onTimeoutFail}
          />
        </div>

        <div style={{ width: '16%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BatteryMeter ref={batteryRef} onBatteryChange={onBatteryChange} />
        </div>

      </div>
    </div>
  );
}
