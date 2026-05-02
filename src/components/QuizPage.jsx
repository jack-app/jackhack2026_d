import { useNavigate } from 'react-router-dom';
import BatteryMeter from './BatteryMeter';
import QuizBoard from './QuizBoard';
import HintSystem from './HintSystem';



export default function QuizPage({ battery, currentData, onAnswer, onUseHint, isHintVisible }) {
  const navigate = useNavigate();

  return (
    <div>
      <BatteryMeter battery={battery} />
      <QuizBoard 
        data={currentData} 
        onAnswer={(choice) => onAnswer(choice, navigate)} 
      />
      <HintSystem
        battery={battery} 
        onUseHint={onUseHint} 
        isHintVisible={isHintVisible} 
        hintText={currentData.hint}
      />
      
    </div>
  );
}