export default function HintSystem({ battery, onUseHint, isHintVisible, hintText }) {
  // TODO：isHintVisibleがtrueになった時のアニメーションを作る(Buttonを無しにする)
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