export default function HintSystem({ battery, onUseHint, isHintVisible, hintText }) {
  // 初心者の仕事：ボタンをカッコよくし、ヒントが出た時のアニメーションを作る
  return (
    <div style={{ margin: "20px 0" }}>
      <button onClick={onUseHint} disabled={battery < 10}>
        バッテリーを消費してヒントを見る
      </button>
      
      {isHintVisible && (
        <p style={{ color: "blue" }}>ヒント：{hintText}</p>
      )}
    </div>
  );
}