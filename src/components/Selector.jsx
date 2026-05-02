function Selector({ onSelect, currentDifficulty }) {
  return (
    <div className="selector-overlay">
      <div className="selector-card">
        <h2>難易度選択して</h2>
        <p>現在の難易度: <strong>{currentDifficulty}</strong></p>
        <div className="button-group">
          <button onClick={() => onSelect('easy')}>Easy (初級)</button>
          <button onClick={() => onSelect('hard') }>Hard (上級)</button>
        </div>
      </div>
    </div>
  );
}

export default Selector;