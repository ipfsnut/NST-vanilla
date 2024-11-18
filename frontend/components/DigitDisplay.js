import React from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = () => {
  const { currentDigit, isTransitioning } = useSelector(state => state.experiment);

  return (
    <div className={`digit-display ${isTransitioning ? 'fade' : ''}`}>
      <div className="digit">{currentDigit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
    </div>
  );
};

export default DigitDisplay;