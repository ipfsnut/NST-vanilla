import React from 'react';
import DigitDisplay from './DigitDisplay';

const ExperimentView = ({ currentDigit }) => {
  return (
    <div className="experiment-container">
      <DigitDisplay digit={currentDigit} />
    </div>
  );
};

export default ExperimentView;