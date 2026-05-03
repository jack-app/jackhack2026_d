import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
useEffect(()=>{
  onTimeChange(10);
  },[currentData,onTimeChange]);
useEffect(()=>{
  if (pendingBranch)return;
  if (timeLeft<=0)return;

  const interval = setInterval(()=>{
    onTimeChange(prev=>prev-1);
  },1000);

  return()=>clearInterval(interval);
  }, [timeLeft, pendingBranch, onTimeChange]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
        style={{display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    border: "2px solid #5DCAA5",
    borderRadius: "50%",
    fontWeight: "bold",
    color:'#E8F4F0'}}>{questionIndex}/{totalQuestions}</span>

        <div style={{ flex: 1 ,marginRight:"60px"}}>
          <p style={{ margin: 0 , fontSize: "30px",color:'#E8F4F0'}}>{currentData.text}</p>
          {/* {isHintVisible && <p style={{ margin: 0,color:'#E8F4F0' }}>{currentData.hint}</p>} */}
          <p style={{margin:0, color:'#E8F4F0', border:"2px dashed #5DCAA5", padding:'6px', display:'inline-block',
            borderRadius:'15px' }}>ヒントは手を挙げたら表示されます。</p>
        </div>
        <>
          <style>{`
            @keyframes pop {
              0% { transform: scale(0.8); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
          `}</style>
          <span key={timeLeft}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "82px",
              height: "82px",
              border: "5px solid yellow",
              borderRadius: "50%",
              fontWeight: "bold",
              color: "#E8F4F0",
              fontSize: "40px",
              animation: timeLeft <= 3 ? "pop 0.3s ease" : "none",
            }}
          >{timeLeft}</span>
        </>
      </div>
      {/* <div style={{color:'#E8F4F0', textAlign:'center'}}>ヒント</div> */}
      <div style={{ 
        display: 'flex',
        gap: 50,
        justifyContent:'space-between',
        padding:'0 100px',
        boxSizing:'border-box' }}>
        <div
          style={{ flex: 1 ,border: "2px solid #5DCAA5",
                padding: "20px",
                background: "transparent",borderRadius: "10px",
                display: 'flex', justifyContent: 'center', alignItems: 'center'}}
          onClick={() => onAnswer(currentData.choices[0], navigate)}
          disabled={!!pendingBranch}
        >
          <span style={{color:'#E8F4F0',fontSize:'2rem'}}>← {currentData.choices[0]}</span>
        </div>

        <div
          style={{ flex: 1, border: "2px solid #5DCAA5",
      padding: "20px",
      background: "transparent" ,borderRadius: "10px",
      display: 'flex', justifyContent: 'center', alignItems: 'center'}}
          onClick={() => onAnswer(currentData.choices[1], navigate)}
          disabled={!!pendingBranch}
        >
         <span style={{color:'#E8F4F0',fontSize:'2rem'}}>→ {currentData.choices[1]}</span>
        </div>
      </div>

    </div>
  );
}
