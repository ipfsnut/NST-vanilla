import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTrialState } from '../redux/experimentSlice';

const StartScreen = () => {
  const dispatch = useDispatch();

  const handleStart = () => {
    dispatch(updateTrialState({
      phase: 'initializing',
      transitionType: 'user-start'
    }));
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      handleStart();
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  return (
    <div className="start-screen">
      <h1>Number Sequence Task</h1>
      <p>Press 'f' for odd numbers</p>
      <p>Press 'j' for even numbers</p>
      <div className="start-instruction">
        Press any key to begin
      </div>
    </div>
  );
};

export default StartScreen;