import { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import Start from './components/Start';
import QuizPage from './components/QuizPage';
import Finish from './components/Finish';
import WhitchNarrator from './components/WhitchNarrator';
import Selector from './components/Selector';

const QUESTIONS = [
  { id: 1, text: "電気抵抗の単位は？", choices: ["Ω", "V"], currentDirection: "left", hint: "ギリシャ文字です", difficulty: "easy" },
  { id: 2, text: "Reactで状態を管理するのは？", choices: ["useState", "useEffect"], currentDirection: "left", hint: "名前の通りです", difficulty: "hard" },
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [status, setStatus] = useState('playing');
  const [scene, setScene] = useState('start');
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [isDifficultySelected, setIsDifficultySelected] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [pendingBranch, setPendingBranch] = useState(null);
  const [correctBranch, setCorrectBranch] = useState(null);
  const pendingNavigateRef = useRef(null);

  const filteredQuestions = QUESTIONS.filter(q => q.difficulty === difficulty);
  const selectionPoints = [0, 3, QUESTIONS.length - 1];

  const handleStart = () => {
    setScene('quiz');
    if (selectionPoints.includes(0)) {
      setShowSelector(true);
      setIsDifficultySelected(false);
    }
  };

  const resetGame = () => {
    batteryRef.current?.reset();
    setCurrentIndex(0);
    setIsHintVisible(false);
    setScene('start');
    setShowSelector(false);
    setIsDifficultySelected(false);
  };

  const currentNarration = scene === 'finish'
    ? (status === 'success' ? NARRATIONS.finish.success : NARRATIONS.finish.failed)
    : NARRATIONS[scene];

  const useHint = () => {
    if (isHintVisible) return;
    if (battery >= 10) batteryRef.current?.decrease(10);
    setIsHintVisible(true);
  };

  const selectDifficulty = (level) => {
    setDifficulty(level);
    setIsDifficultySelected(true);
    setShowSelector(false);
  };

  const handleBranchComplete = () => {
    batteryRef.current?.decrease(5); // トロッコ1周分のエネルギー消費
    const pending = pendingNavigateRef.current;
    if (pending) {
      pending.fn(pending.navigate);
      pendingNavigateRef.current = null;
    }
    setPendingBranch(null);
    setCorrectBranch(null);
  };

  const handleAnswer = (choice, navigate) => {
    const branchDir = choice === filteredQuestions[currentIndex].choices[0] ? 'left' : 'right';
    const isCorrect = branchDir === filteredQuestions[currentIndex].currentDirection;
    setPendingBranch(branchDir);
    setCorrectBranch(filteredQuestions[currentIndex].currentDirection);

    pendingNavigateRef.current = {
      navigate,
      fn: (nav) => {
        if (isCorrect) {
          batteryRef.current?.increase(difficulty === 'hard' ? 20 : 5);
          if (currentIndex < filteredQuestions.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(prev => prev + 1);
            setIsHintVisible(false);
            if (selectionPoints.includes(nextIndex)) {
              setShowSelector(true);
              setIsDifficultySelected(false);
            }
          } else {
            setStatus('success');
            setScene('finish');
            nav('/finish');
          }
        } else {
          setStatus('failed');
          setScene('finish');
          nav('/finish');
        }
      },
    };
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
            {!isDifficultySelected ? (
              <Selector
                onSelect={selectDifficulty}
                currentDifficulty={difficulty}
              />
            ) : (
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
