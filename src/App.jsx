import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import Start from './components/Start';
import QuizPage from './components/QuizPage';
import Finish from './components/Finish';
import WhitchNarrator from './components/WhitchNarrator';
import Selector from './components/Selector';

const QUESTIONS = [
  { id: 1, text: "電気抵抗の単位は？", choices: ["Ω", "V"], answer: "Ω", hint: "ギリシャ文字です", difficulty: "easy" },
  { id: 2, text: "Reactで状態を管理するのは？", choices: ["useState", "useEffect"], answer: "useState", hint: "名前の通りです", difficulty: "hard" },
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
  const [battery, setBattery] = useState(100);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy'); // 'easy' or 'hard'
  const [status, setStatus] = useState('playing'); // 'success' or 'failed'
  const [scene, setScene] = useState('start'); // 'start' | 'quiz' | 'finish'
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [isDifficultySelected, setIsDifficultySelected] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const filteredQuestions = QUESTIONS.filter(q => q.difficulty === difficulty);
  const selectionPoints = [0, 3, QUESTIONS.length - 1];
  
  const handleStart = () => {
    setScene('quiz');
    if (selectionPoints.includes(0)) {
      setShowSelector(true);
      setIsDifficultySelected(false);
    }
  }
  // --- ゲームのリセット ---
  const resetGame = () => {
    setBattery(100);
    setCurrentIndex(0);
    setIsHintVisible(false);
    setScene('start');
    setShowSelector(false);
    setIsDifficultySelected(false);
  };
  //魔女にどの文章を喋らすかのロジック
  const currentNarration = scene === 'finish'
  ? (status === 'success' ? NARRATIONS.finish.success : NARRATIONS.finish.failed)
  : NARRATIONS[scene];

  // --- 正誤判定ロジック（難易度による分岐） ---
  const useHint = () => {
  if (battery >= 10) {
    setBattery(prev => Math.max(0, prev - 10));
    setIsHintVisible(true);
  }
  };

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setIsDifficultySelected(true);
    setShowSelector(false);
  };

  const handleAnswer = (choice, navigate) => {
    const isCorrect = choice === filteredQuestions[currentIndex].answer;
    
    if (isCorrect) {
      if (difficulty === 'hard') {
        setBattery(prev => Math.min(100, prev + 20)); // Hardなら回復
      } else {
        setBattery(prev => Math.min(100, prev + 5));  // Easyは微増
      }
      // 次の問題へ進むか、クリア判定
      if (currentIndex < filteredQuestions.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(prev => prev + 1);
        setIsHintVisible(false); // 次の問題ではヒントを隠す

        if (selectionPoints.includes(nextIndex)){
          setShowSelector(true);
          setIsDifficultySelected(false);
        }
      } else {
        setStatus('success');
        setScene('finish');
        navigate('/finish');
      }
    } else {
      // 不正解時は即終了（共通ルール）
      setStatus('failed');
      setScene('finish');
      navigate('/finish');
    };

    // 次へ進む判定
    // if (currentIndex < QUESTIONS.length - 1) {
    //   setCurrentIndex(prev => prev + 1);
    // } else {
    //   if (isCorrect === false) {
    //     setStatus('failed');
    //     navigate('/finish');
    //     setScene('finish');
    //     return;
    //   }
    //   else {
    //   setStatus('success');
    //   navigate('/finish');
    //   setScene('finish');
    //   }
    // }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
            <Start handleStart={handleStart}/>
            <WhitchNarrator lines={currentNarration} />
          </>
           
        } />
        <Route path="/quiz" element={
          <>
            {/* 難易度が未選択なら選択ボタンを表示、選択済みならクイズを表示 */}
            { !isDifficultySelected ? (
              <Selector
              onSelect = {selectDifficulty}
              currentDifficulty={difficulty}
              />
            ) : (
              <QuizPage 
                battery={battery} 
                currentData={filteredQuestions[currentIndex]} 
                onAnswer={handleAnswer}
                setBattery={setBattery}
                onUseHint={useHint} 
                isHintVisible={isHintVisible}
              />
            )}
            <WhitchNarrator lines={currentNarration} />
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