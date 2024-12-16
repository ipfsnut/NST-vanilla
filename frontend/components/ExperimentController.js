import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTrialState,
  setTrials,
  processResponseQueue,
  setComplete
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
    responses
  } = useSelector(state => state.experiment);

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
  // Capture timing
useEffect(() => {
  // Update the capture trigger to check position within trial
  const shouldTriggerCapture = (digitIndex) => {
    return (digitIndex + 1) % 3 === 0;
  };

  if (trialState.phase === 'running' && 
      trialState.digitIndex > 0 && 
      shouldTriggerCapture(trialState.digitIndex)) {
    console.log('Triggering capture at digit:', trialState.digitIndex);
    dispatch(processResponseQueue());
  }
}, [trialState.phase, trialState.digitIndex]);

  // Session initialization
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
            trialState.digitIndex % 3 === 0
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