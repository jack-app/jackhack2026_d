import { useNavigate } from 'react-router-dom';

export default function QuizBoard({
  questionIndex,
  totalQuestions,
  currentData,
  isHintVisible,
  onAnswer,
  onUseHint,
  battery,
  pendingBranch,
  timeLeft,
  onTimeChange,
}) {
  const navigate = useNavigate();

  // TODO: timeLeft のカウントダウンを実装する（毎秒 onTimeChange(timeLeft - 1) を呼ぶ）
  // TODO: currentData が変わったら onTimeChange(10) でタイマーを 10 にリセットする
  // TODO: pendingBranch が truthy のときはカウントダウンを止める
  // TODO: タイマー（timeLeft）の表示スタイルを実装する（残り3秒以下で強調など）
  // TODO: 選択肢ボタンのホバー・押下スタイルを実装する
  // TODO: ヒントボタンの disabled スタイルを実装する
  // TODO: 問題文・ヒントテキストのスタイルを実装する

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{questionIndex}/{totalQuestions}</span>

        <div style={{ flex: 1 }}>
          <p style={{ margin: 0 }}>{currentData.text}</p>
          {isHintVisible && <p style={{ margin: 0 }}>{currentData.hint}</p>}
        </div>

        <span>{timeLeft}</span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          style={{ flex: 1 }}
          onClick={() => onAnswer(currentData.choices[0], navigate)}
          disabled={!!pendingBranch}
        >
          ← {currentData.choices[0]}
        </button>

        <button
          onClick={onUseHint}
          disabled={battery < 10 || !!pendingBranch}
        >
          ヒント (−10)
        </button>

        <button
          style={{ flex: 1 }}
          onClick={() => onAnswer(currentData.choices[1], navigate)}
          disabled={!!pendingBranch}
        >
          → {currentData.choices[1]}
        </button>
      </div>

    </div>
  );
}
