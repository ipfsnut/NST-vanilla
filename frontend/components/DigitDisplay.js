import React from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = () => {
  const { currentDigit, phase } = useSelector(state => state.experiment);
  const { isCapturing } = useSelector(state => state.capture);

  return (
    <div className={`digit-display ${isCapturing ? 'capture-flash' : ''}`}>
      <div className="digit">{currentDigit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
      {phase === 'awaiting-response' && (
        <div className="response-indicator">Awaiting Response...</div>
      )}
    </div>
  );
};

export default DigitDisplay;
