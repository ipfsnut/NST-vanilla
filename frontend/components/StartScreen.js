import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTrialState } from '../redux/experimentSlice';
import { checkCameraAvailability } from './CameraCapture';
import CameraSelector from './CameraSelector';

const StartScreen = () => {
  const dispatch = useDispatch();
  const deviceStatus = useSelector(state => state.capture.deviceStatus);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  useEffect(() => {
    checkCameraAvailability(dispatch);
  }, [dispatch]);

  const handleKeyPress = (event) => {
    console.log('Key pressed:', event.key);
    if (event.key === 'f' || event.key === 'j') {
      console.log('Dispatching initialization');
      dispatch(updateTrialState({
        phase: 'initializing',
        transitionType: 'user-start'
      }));
    }
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
      
      <CameraSelector 
        onCameraSelect={setSelectedCameraId}
        selectedCameraId={selectedCameraId}
      />
      
      <div className="start-instruction">
        Press 'f' or 'j' to begin
      </div>
    </div>
  );
};

export default StartScreen;