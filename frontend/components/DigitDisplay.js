import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = () => {
  const trialState = useSelector(state => state.experiment.trialState);
  console.log('DigitDisplay rendering:', trialState);

  const shouldShowDigit = trialState.phase === 'PRESENTING_DIGIT';
  
  return (
    <div className="digit-display">
      {shouldShowDigit && (
        <span className="digit">{trialState.currentDigit}</span>
      )}
    </div>
  );
};
DigitDisplay.displayName = 'DigitDisplay';

export default DigitDisplay;