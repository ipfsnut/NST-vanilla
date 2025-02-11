import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  startBreak, 
  endBreak, 
  updateBreakProgress,
  updateTrialState 
} from '../redux/experimentSlice';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import { DigitBreakScreen } from './DigitBreakScreen';
import { TrialBreakScreen } from './TrialBreakScreen';
import { API_CONFIG } from '../config/api';


const ExperimentView = () => {
  const dispatch = useDispatch();
  const { phase, experimentId, breakState } = useSelector(state => state.experiment);
  const { isCapturing } = useSelector(state => state.capture);
  const [showDigit, setShowDigit] = useState(true);

  const handleResponseError = (error) => {
    dispatch(updateTrialState({ 
      phase: 'error',
      error: error.message 
    }));
  };

  const handleBreakPeriod = async (breakDuration, breakType) => {
    setShowDigit(false);
    
    // Start break in Redux state
    dispatch(startBreak({ 
      type: breakType, 
      duration: breakDuration 
    }));

    // Update progress during break
    const progressInterval = setInterval(() => {
      dispatch(updateBreakProgress());
    }, 100);

    // Enforce break duration
    await new Promise(resolve => setTimeout(resolve, breakDuration));
    
    clearInterval(progressInterval);

    // Get next trial state
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/trial-state?experimentId=${experimentId}`
    );
    const data = await response.json();
    
    dispatch(endBreak());
    dispatch(updateTrialState(data.trialState));
    setShowDigit(true);
  };

  // Monitor responses and trigger breaks
  useEffect(() => {
    if (phase === 'DIGIT_BREAK') {
      handleBreakPeriod(500, 'DIGIT_BREAK');
    } else if (phase === 'TRIAL_BREAK') {
      handleBreakPeriod(15000, 'TRIAL_BREAK');
    }
  }, [phase]);

  const TaskInstructions = () => (
    <div className="task-instructions">
      <p>Press 'f' for odd numbers</p>
      <p>Press 'j' for even numbers</p>
    </div>
  );

  const renderContent = () => {
    if (!showDigit || breakState.isBreak) {
      return breakState.breakType === 'TRIAL_BREAK' ?
        <TrialBreakScreen remainingTime={breakState.remainingTime} /> :
        <DigitBreakScreen />;
    }
  
    return (
      <>
        <TaskInstructions />
        <DigitDisplay />
        <ResponseHandler 
          experimentId={experimentId}
          onError={handleResponseError}
        />
        {isCapturing && <div className="capture-indicator">Recording...</div>}
      </>
    );
  };
  

  return (
    <div className={`experiment-container ${isCapturing ? 'capture-active' : ''}`}>
      {renderContent()}
    </div>
  );
};

export default ExperimentView;

