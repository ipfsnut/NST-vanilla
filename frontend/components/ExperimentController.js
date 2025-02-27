import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateTrialState,
  setTrials,
  setComplete,
  setCaptureConfig  // Import the new action
} from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';

import StartScreen from './StartScreen';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

const ExperimentController = () => {
  const dispatch = useDispatch();
  const {
    experimentId,
    trialState,
    trials,
    isComplete,
    responses,
    captureConfig
  } = useSelector(state => state.experiment);

  const shouldTriggerCapture = (digitIndex) => {
    // Only consider it disabled if explicitly set to false
    if (captureConfig?.enabled === false) {
      console.log('  Capture explicitly disabled');
      return false;
    }
    
    const { firstCapture, interval } = captureConfig;
    const adjustedIndex = digitIndex + 1;
    
    const condition1 = adjustedIndex === firstCapture;
    const condition2 = adjustedIndex > firstCapture && (adjustedIndex - firstCapture) % interval === 0;
    
    console.log('  First condition (index === firstCapture):', condition1);
    console.log('  Second condition (modulo check):', condition2);
    console.log('  Should capture:', condition1 || condition2);
    
    return condition1 || condition2;
  };

  // Add error handler
  const handleResponseError = (error) => {
    dispatch(updateTrialState({ 
      phase: 'error',
      error: error.message 
    }));
  };

  // Core state management and logging
  useEffect(() => {
    console.log('Phase change detected:', trialState.phase);
    if (trialState.phase === 'complete') {
      fetch(`${API_CONFIG.BASE_URL}/session/${experimentId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState: 'COMPLETE' })
      })
      .then(response => response.json())
      .then(data => console.log('State transition complete:', data));
    }
  }, [trialState, experimentId]);

  useEffect(() => {
    // Add explicit logging to see if this effect is running
    console.log('CAPTURE TRIGGER CHECK:');
    console.log('  Phase:', trialState.phase);
    console.log('  DigitIndex:', trialState.digitIndex);
    
    if (trialState.phase === 'running') {
      const shouldCapture = shouldTriggerCapture(trialState.digitIndex);
      console.log('  Final capture decision:', shouldCapture);
      
      if (shouldCapture) {
        console.log('  *** TRIGGERING CAPTURE ***');
        dispatch(updateTrialState({
          phase: 'capture',
          captureSync: true
        }));
      }
    }
  }, [trialState.phase, trialState.digitIndex, captureConfig, dispatch]);

  useEffect(() => {
    const initializeSession = async () => {
      if (trialState.phase === 'initializing' && !experimentId) {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experimentType: 'nst' })
          });
          
          const experimentData = await response.json();
          console.log('Session data received:', experimentData);
          
          // Update the capture config with server values
          if (experimentData.captureConfig) {
            console.log('Server provided captureConfig:', experimentData.captureConfig);
            dispatch(setCaptureConfig(experimentData.captureConfig));
          }
          
          dispatch(setTrials(experimentData.trials));
          dispatch(updateTrialState({
            experimentId: experimentData.experimentId,
            ...experimentData.trialState,
            phase: 'running'
          }));
        } catch (error) {
          console.error('Initialization error:', error);
          dispatch(updateTrialState({ phase: 'error' }));
        }
      }
    };

    if (trialState.phase === 'initializing' && !experimentId) {
      initializeSession();
    }
  }, [trialState.phase, experimentId, dispatch]);

  // Phase transition effect
  useEffect(() => {
    if (trialState.phase === 'trial-start') {
      dispatch(updateTrialState({ phase: 'running' }));
    }
  }, [trialState.phase, dispatch]);

  return (
    <div className="experiment-wrapper">
      {experimentId && (
        <CameraCapture
          experimentId={experimentId}
          shouldCapture={
            trialState.phase === 'running' &&
            !responses.captureState?.isProcessing &&
            shouldTriggerCapture(trialState.digitIndex)
          }
        />
      
      )}
      {trialState.phase === 'start' && <StartScreen />}
      {(trialState.phase === 'running' || trialState.phase === 'awaiting-response') && !isComplete && (
        <>
          <DigitDisplay />
          {experimentId && trials.length > 0 && (
            <ResponseHandler
              experimentId={experimentId}
              onError={handleResponseError}
            />
          )}
        </>
      )}
      {trialState.phase === 'complete' && (
        <ResultsView
          experimentId={experimentId}
          onExportComplete={() => dispatch(setComplete(true))}
        />
      )}
      {trialState.phase === 'error' && (
        <div className="error-message">
          An error occurred. Please restart the experiment.
        </div>
      )}
    </div>
  );
};

export default ExperimentController;