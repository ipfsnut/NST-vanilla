import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = memo(() => {
  const { currentDigit } = useSelector(state => state.experiment.trialState);
  const { isCapturing } = useSelector(state => state.capture);

  console.log('Rendering digit:', JSON.stringify({
    currentDigit,
    isCapturing,
    timestamp: Date.now()
  }, null, 2));

  return (
    <div className={`digit-display ${isCapturing ? 'capture-flash' : ''}`}>
      <div className="digit">{currentDigit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
    </div>
  );
});
DigitDisplay.displayName = 'DigitDisplay';

export default DigitDisplay;