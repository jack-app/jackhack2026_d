import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import Start from './components/Start';
import QuizPage from './components/QuizPage';
import Finish from './components/Finish';
import WhitchNarrator from './components/WhitchNarrator';
import Selector from './components/Selector';

const QUESTIONS = [
  { id: 1, text: "電気抵抗の単位は？", choices: ["Ω", "V"], currentDirection: "left", hint: "ギリシャ文字です", difficulty: "easy" },
  { id: 2, text: "水の化学式は？", choices: ["H2O", "CO2"], currentDirection: "left", hint: "水素と酸素でできています", difficulty: "easy" },
  { id: 3, text: "光の速さに最も近いのは？", choices: ["30万m/s", "30万km/s"], currentDirection: "right", hint: "非常に速いです", difficulty: "easy" },
  { id: 4, text: "円周率 π の近似値は？", choices: ["2.71", "3.14"], currentDirection: "right", hint: "円の直径と周の比です", difficulty: "easy" },
  { id: 5, text: "Reactで状態を管理するのは？", choices: ["useState", "useEffect"], currentDirection: "left", hint: "名前の通りです", difficulty: "hard" },
];

const NARRATIONS = {
  start: [
    'ようこそ、魔女の森へ。',
    '難易度を選んで「出発！」を押してください。'
  ],
  quiz: [
    '問題に答えて、バッテリーを守ってね。',
    '間違えるとゲームオーバーになるよ。'
  ],
  finish: {
    success: [
      'やったね！ 全問正解だよ！',
      'また挑戦してね。'
    ],
    failed: [
      '残念、魔女の力がきれた。',
      'もう一度挑戦してみよう。'
    ]
  }
};

function App() {
  // battery は BatteryMeter が所有する state の読み取り用シャドウ
  // 書き込みは batteryRef.current.increase / decrease / reset を使う
  const [battery, setBattery] = useState(100);
  const batteryRef = useRef(null);
  const [batteryDead, setBatteryDead] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [status, setStatus] = useState('playing');
  const [scene, setScene] = useState('start');
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [isDifficultySelected, setIsDifficultySelected] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [pendingBranch, setPendingBranch] = useState(null);
  const [correctBranch, setCorrectBranch] = useState(null);
  const [timeLeft, setTimeLeft]=useState(10);
  const nextActionRef = useRef(null);

  const filteredQuestions = QUESTIONS.filter(q => q.difficulty === difficulty);
  const selectionPoints = [0];

  const handleStart = () => {
    setScene('quiz');
    if (selectionPoints.includes(0)) {
      setShowSelector(true);
      setIsDifficultySelected(false);
    }
  };

  const resetGame = () => {
    batteryRef.current?.reset();
    setBattery(100); // /finish 画面では BatteryMeter がアンマウントされ batteryRef が null のため直接リセット
    setCurrentIndex(0);
    setIsHintVisible(false);
    setScene('start');
    setShowSelector(false);
    setIsDifficultySelected(false);
    setPendingBranch(null);
    setCorrectBranch(null);
    setBatteryDead(false);
    setTimeLeft(10);
    nextActionRef.current = null;
  };

  // battery が 0 以下になったら即座に失敗扱いにする
  // isDifficultySelected が true のとき（ゲームが進行中）だけ発火させる
  // → resetGame 後は isDifficultySelected=false なので再発火しない
  useEffect(() => {
    if (battery <= 0 && isDifficultySelected && scene !== 'finish' && !batteryDead) {
      setBatteryDead(true);
      setStatus('failed');
    }
  }, [battery, isDifficultySelected, scene, batteryDead]);

  // 爆発アニメーション完了後に /finish へ遷移するコールバック
  const handleBatteryDeadComplete = (navigate) => {
    setScene('finish');
    setBatteryDead(false);
    navigate('/finish');
  };

  const currentNarration = scene === 'finish'
    ? (status === 'success' ? NARRATIONS.finish.success : NARRATIONS.finish.failed)
    : NARRATIONS[scene];

  const useHint = () => {
    if (isHintVisible) return;
    batteryRef.current?.decrease(30);
    setIsHintVisible(true);
  };

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setIsDifficultySelected(true);
    setShowSelector(false);
  };
const handleBranchComplete = () => {
    batteryRef.current?.decrease(5); // トロッコ1周分のエネルギー消費
    
    const action = nextActionRef.current;
    if (!action) return;

    if (action.isCorrect) {
      batteryRef.current?.increase(difficulty === 'hard' ? 10 : 5);
      if (currentIndex < filteredQuestions.length - 1) {
        // 次の問題へ進む
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsHintVisible(false);
        setTimeLeft(10);
        if (selectionPoints.includes(nextIndex)) {
          setShowSelector(true);
          setIsDifficultySelected(false);
        }
        setPendingBranch(null);
        setCorrectBranch(null);
      } else {
        // 最後の問題をクリアして Finish へ！
        setStatus('success');
        setScene('finish');
        console.log("正解！ Finishに遷移します。");
        action.navigate('/finish'); 
      
      
        // window.location.href = '/finish';
      }
    } else {
      // 間違えて Finish へ！
      setStatus('failed');
      setScene('finish');
      console.log("不正解。 Finishに遷移します。");
      action.navigate('/finish');

      // window.location.href = '/finish';
    }

    nextActionRef.current = null; // メモを使い終わったら空にする
  };

  // 2. 予約（メモ）する側
  const handleAnswer = (choice, navigate) => {
    const branchDir = choice === filteredQuestions[currentIndex].choices[0] ? 'left' : 'right';
    const isCorrect = branchDir === filteredQuestions[currentIndex].currentDirection;
    
    setPendingBranch(branchDir);
    setCorrectBranch(filteredQuestions[currentIndex].currentDirection);

    // 💡 ここが超重要！ 関数(fn)を保存するのをやめて、結果だけをメモする！
    nextActionRef.current = {
      isCorrect: isCorrect,
      navigate: navigate
    };
  };
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Start handleStart={handleStart} narrationLines={currentNarration} />
        } />
        <Route path="/quiz" element={
          <>
            {!isDifficultySelected ? (
              <Selector
                onSelect={selectDifficulty}
                currentDifficulty={difficulty}
              />
            ): scene === 'finish' ? (
              <div style={{ 
                width: '100vw', 
                height: '100vh', 
                backgroundColor: '#0E1A20' // QuizPage や AR と同じ暗い色にする
              }} />
            ) : 
            (
              <QuizPage
                battery={battery}
                batteryRef={batteryRef}
                onBatteryChange={setBattery}
                currentData={filteredQuestions[currentIndex]}
                onAnswer={handleAnswer}
                onUseHint={useHint}
                isHintVisible={isHintVisible}
                pendingBranch={pendingBranch}
                correctBranch={correctBranch}
                onBranchComplete={handleBranchComplete}
                questionIndex={currentIndex + 1}
                totalQuestions={filteredQuestions.length}
                narrationLines={currentNarration}
                batteryDead={batteryDead}
                onBatteryDeadComplete={handleBatteryDeadComplete}
                timeLeft={timeLeft}
                onTimeChange={setTimeLeft}
              />
            )}
          </>
        } />
        <Route path="/finish" element={
          <>
            <Finish
              status={status}
              onRetry={resetGame}
              score={currentIndex + 1}
              battery={battery}
              currentIndex={currentIndex + 1}
              totalQuestions={QUESTIONS.length}
            />
            <WhitchNarrator lines={currentNarration} />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;
