import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = memo(() => {
  const { currentDigit, phase } = useSelector(state => state.experiment);
  const { isCapturing } = useSelector(state => state.capture);

  console.log('Rendering digit:', {
    currentDigit,
    isCapturing,
    timestamp: Date.now()
  });

  return (
    <div className={`digit-display ${isCapturing ? 'capture-flash' : ''}`}>
      <div className="digit">{currentDigit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
      {phase === 'awaiting-response' && (
        <div className="response-indicator">Awaiting Response...</div>
      )}
    </div>
  );
});

DigitDisplay.displayName = 'DigitDisplay';

export default DigitDisplay;