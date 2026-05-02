import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ARScene from './AR';

export default function ARPanel({ currentData, onAnswer, pendingBranch, onBranchComplete, onUseHint, timeLeft, hintText }) {
  const navigate = useNavigate();
  const latestVotesRef = useRef({ left: 0, right: 0 });
  const [timeoutLabel, setTimeoutLabel] = useState(null);

  const handleVotesChange = useCallback((v) => {
    latestVotesRef.current = v;
  }, []);

  // timeLeft が 0 になったら votes 多数決で方向を決め onAnswer を呼ぶ
  useEffect(() => {
    if (timeLeft === 0) {
      const { left, right } = latestVotesRef.current;
      const goLeft = left >= right;
      setTimeoutLabel(goLeft ? '左' : '右');
      onAnswer(goLeft ? currentData.choices[0] : currentData.choices[1], navigate);
    }
  }, [timeLeft]);

  // pendingBranch が解消されたら timeoutLabel をクリア
  useEffect(() => {
    if (!pendingBranch) setTimeoutLabel(null);
  }, [pendingBranch]);

  return (
    <ARScene
      pendingBranch={pendingBranch}
      onBranchComplete={onBranchComplete}
      onHandRaised={onUseHint}
      onVotesChange={handleVotesChange}
      timeoutLabel={timeoutLabel}
      hintText={hintText}
    />
  );
}
