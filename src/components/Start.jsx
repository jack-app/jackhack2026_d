import { useNavigate } from 'react-router-dom';

export default function Start({ handleStart}) {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>ゲームタイトル</h1>
      
      {/* <div style={{ marginBottom: "20px" }}>
        <p>難易度を選択してください：</p>
        <button 
          onClick={() => setDifficulty('easy')}
          style={{ backgroundColor: difficulty === 'easy' ? 'lightgreen' : 'white' }}
        >
          Easy (ミスしても耐える)
        </button>
        <button 
          onClick={() => setDifficulty('hard')}
          style={{ backgroundColor: difficulty === 'hard' ? 'orange' : 'white' }}
        >
          Hard (正解で回復 / ミスで即終了)
        </button>
      </div> */}

      <button 
        onClick={() => {handleStart(); navigate('/quiz');}} 
        style={{ fontSize: "2rem", padding: "10px 50px" }}
      >
        出発！
      </button>
    </div>
  );
}