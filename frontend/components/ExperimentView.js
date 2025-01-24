import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  startBreak, 
  endBreak, 
  updateBreakProgress,
  updateTrialState 
} from '../redux/experimentSlice';
import DigitDisplay from './DigitDisplay';
import { DigitBreakScreen } from './DigitBreakScreen';
import { TrialBreakScreen } from './TrialBreakScreen';
import { API_CONFIG } from '../config/api';

const ExperimentView = () => {
  const { phase, experimentId, breakState } = useSelector(state => state.experiment);
  const { isCapturing } = useSelector(state => state.capture);
  const [showDigit, setShowDigit] = useState(true);
  const dispatch = useDispatch();

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

  const renderContent = () => {
    if (!showDigit || breakState.isBreak) {
      return breakState.breakType === 'TRIAL_BREAK' ? 
        <TrialBreakScreen remainingTime={breakState.remainingTime} /> :
        <DigitBreakScreen />;
    }

    return (
      <>
        <DigitDisplay />
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