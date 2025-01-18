import React from 'react';
import styles from './styles/BreakScreen.module.css';

const BreakScreen = ({ timeRemaining }) => {
  return (
    <div className={styles.breakContainer}>
      <h2 className={styles.breakTitle}>Break Time</h2>
      <div className={styles.timeDisplay}>
        {timeRemaining} seconds remaining
      </div>
    </div>
  );
};

export default BreakScreen;
