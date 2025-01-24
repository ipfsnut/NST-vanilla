import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTrialState } from '../redux/experimentSlice';
import { checkCameraAvailability } from './CameraCapture';

const StartScreen = () => {
  const dispatch = useDispatch();
  const deviceStatus = useSelector(state => state.capture.deviceStatus);

  useEffect(() => {
    checkCameraAvailability(dispatch);
  }, [dispatch]);

  const handleStart = async () => {
    console.log('Initializing experiment');
    const response = await initializeExperiment();
    
    // Set trials first
    dispatch(setTrials(response.trials));
    
    // Update trial state to match our new state model
    dispatch(updateTrialState({
      phase: 'PRESENTING_DIGIT',
      experimentId: response.experimentId,
      currentDigit: response.trialState.currentDigit,
      trialNumber: response.trialState.trialNumber
    }));
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  return (
    <div className="start-screen">
      <h1>Number Switching Task</h1>
      <p>Press 'f' for odd numbers</p>
      <p>Press 'j' for even numbers</p>
      {deviceStatus === 'ready' && (
        <div className="camera-status">Camera Ready ✓</div>
      )}
      <div className="start-instruction">
        Press 'f' or 'j' to begin
      </div>
    </div>
  );
};

export default StartScreen;
