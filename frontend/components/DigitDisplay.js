import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = ({ digit }) => {
  const { phase } = useSelector(state => state.experiment);
  
  // Only show digit during PRESENTING_DIGIT phase
  const shouldShowDigit = phase === 'PRESENTING_DIGIT';
  
  return (
    <div className="digit-display">
      {shouldShowDigit && (
        <span className="digit">{digit}</span>
      )}
    </div>
  );
};
DigitDisplay.displayName = 'DigitDisplay';

export default DigitDisplay;