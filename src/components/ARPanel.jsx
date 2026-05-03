import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ARScene from './AR';

export default function ARPanel({ currentData, onAnswer, pendingBranch, correctBranch, onBranchComplete, onUseHint, timeLeft, hintText, batteryDead, onBatteryDeadComplete, onTimeoutFail }) {
  const navigate = useNavigate();
  const latestVotesRef = useRef({ left: 0, right: 0 });
  const handleVotesChange = useCallback((v) => {
    latestVotesRef.current = v;
  }, []);

  // timeLeft が 0 になったら votes 多数決で方向を決め onAnswer を呼ぶ
  useEffect(() => {
    if (timeLeft === 0) {
      const { left, right } = latestVotesRef.current;
      if (left === right) {
        // どちらにも傾いていない場合はその場で爆発して不正解扱いにする
        onTimeoutFail?.();
      } else {
        const goLeft = left > right;
        onAnswer(goLeft ? currentData.choices[0] : currentData.choices[1], navigate);
      }
    }
  }, [timeLeft]);

  const handleBatteryDeadComplete = useCallback(() => {
    onBatteryDeadComplete?.(navigate);
  }, [navigate, onBatteryDeadComplete]);

  return (
    <ARScene
      pendingBranch={pendingBranch}
      onBranchComplete={onBranchComplete}
      onHandRaised={onUseHint}
      onVotesChange={handleVotesChange}
      hintText={hintText}
      correctBranch={correctBranch}
      batteryDead={batteryDead}
      onBatteryDeadComplete={handleBatteryDeadComplete}
    />
  );
}
