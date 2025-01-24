import React from 'react';
import { useSelector } from 'react-redux';
import '../styles/breaks.css';

export const ScoreDisplay = () => {
  const score = useSelector(state => state.experiment.score);
  
  return (
    <div className="score-display">
      <div className="total-score">
        <h2>Total Score</h2>
        <div className="score-value">
          {score.correct} / {score.total}
          <span className="percentage">
            ({Math.round((score.correct / score.total) * 100) || 0}%)
          </span>
        </div>
      </div>
      <div className="current-trial">
        <h3>Current Trial</h3>
        <div className="score-value">
          {score.currentTrial.correct} / {score.currentTrial.total}
        </div>
      </div>
    </div>
  );
};
