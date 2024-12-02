import React from 'react';
import { useSelector } from 'react-redux';
import DigitDisplay from './DigitDisplay';

const ExperimentView = () => {
  const { phase } = useSelector(state => state.experiment);
  const { isCapturing } = useSelector(state => state.capture);

  return (
    <div className={`experiment-container ${isCapturing ? 'capture-active' : ''}`}>
      <DigitDisplay />
      {phase === 'running' && (
        <div className="experiment-status">
          {isCapturing && <div className="capture-indicator">Recording...</div>}
        </div>
      )}
    </div>
  );
};

export default ExperimentView;
