import React from 'react';

const DigitDisplay = ({ digit }) => {
  return (
    <div className="digit-display">
      <div className="digit">{digit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
    </div>
  );
};

export default DigitDisplay;