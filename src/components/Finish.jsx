import { useNavigate } from "react-router-dom";
import WhitchNarrator from './WhitchNarrator';

export default function Finish({ status, battery, currentIndex, totalQuestions, onRetry, currentNarration }) {
  const navigate = useNavigate();
  const isWon = status === 'success';
  const handleRetry = () => {
    onRetry();
    navigate('/'); //スタートへ戻る
  }
  
  return (
    <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#0E1A20", position: 'relative', height: "100vh",display: "flex",
    justifyContent: "center", alignItems: "center",flexDirection:'column'}}>
      <h2 style={{color: "#FFFFFF", fontSize: "96px", zIndex: 1, position: 'relative'}}>{isWon ? "ゲームクリア" : "ゲームオーバー"}</h2>
      <p style={{color: isWon ? "#5DCAA5" : "#88877F", fontSize: "32px"}}>{isWon ? "トロッコは無事目的地に到着した" : "トロッコは爆発した"}</p>
      
      <div style={{
              position: 'absolute',
              top: '-10%',
              left: '7%',
              width: '18%',
              height: '100%',
              zIndex:0
            }}>
              <WhitchNarrator lines={currentNarration} />
            </div>
    
      <p style={{color: isWon ? "#5DCAA5" : "#E23636", fontSize: "64px"}}>{isWon ? `バッテリー残量: ${battery}%` : `Q${currentIndex}で失敗`}</p>
      
      <button 
        onClick={handleRetry} 
        style={{ 
          borderRadius: "20px",
          backgroundColor: isWon ? "#5DCAA5" : "#E23636",
          padding: "10px 20px", 
          fontSize: "40px", 
          cursor: "pointer", 
          margin: "20px 40px",
          fontWeight: "bold",
          fontsize: '40px'
        }}
      >
        もう一度プレイする
      </button>
    </div>
  );
}