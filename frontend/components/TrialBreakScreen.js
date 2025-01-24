import React from 'react';
import { useSelector } from 'react-redux';
import '../styles/breaks.css';

export const TrialBreakScreen = () => {
  const { breakState } = useSelector(state => state.experiment);
  
  return (
    <div className="break-screen trial-break">
      <div className="break-content">
        <h2>Break Time</h2>
        <div className="timer">
          {Math.ceil(breakState.remainingTime / 1000)}s
        </div>
      </div>
    </div>
  );
};