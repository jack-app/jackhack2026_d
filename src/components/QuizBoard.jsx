export default function QuizBoard({ data, onAnswer }) {
  // 仕事：問題文とボタンをレイアウトする
  return (
    <div style={{ padding: "20px", backgroundColor: "brown" }}>
      <h2 style={ {textAlign: "center"} }>問題: {data.text}</h2>
      {data.choices.map(choice => (
        <button key={choice} onClick={() => onAnswer(choice)} style={{ margin: "30px", }}>
          {choice}
        </button>
      ))}
    </div>
  );
}