import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateTrialState,
  setTrials,
  setComplete 
} from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';

import StartScreen from './StartScreen';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';
import BreakScreen from './BreakScreen';


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

  // Move the function here, before using it in JSX
  const shouldTriggerCapture = (digitIndex) => {
    if (!captureConfig?.enabled) return false;
    const { firstCapture, interval } = captureConfig;
    
    const adjustedIndex = digitIndex + 1;
    
    return adjustedIndex === firstCapture || 
      (adjustedIndex > firstCapture && (adjustedIndex - firstCapture) % interval === 0);
  };

  const [showBreakScreen, setShowBreakScreen] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);  

  const handleBlockComplete = (breakDuration) => {
    setShowBreakScreen(true);
    setBreakTimeRemaining(breakDuration / 1000);
    
    const timer = setInterval(() => {
      setBreakTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowBreakScreen(false);
          dispatch(updateTrialState({ phase: 'running' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
    if (trialState.phase === 'running' && 
        shouldTriggerCapture(trialState.digitIndex)) {
      const handleCaptureTrigger = () => {
        console.log('Triggering capture at digit:', trialState.digitIndex + 1);
        // Just dispatch the capture event - middleware will handle the queue
        dispatch(updateTrialState({
          phase: 'capture',
          captureSync: true
        }));
      };
      handleCaptureTrigger();
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

  useEffect(() => {
    if (trialState.phase === 'BLOCK_COMPLETE') {
      handleBlockComplete(config.breakDuration);
    }
  }, [trialState.phase]);

  return (
    <div className="experiment-wrapper">
      {showBreakScreen ? (
        <BreakScreen timeRemaining={breakTimeRemaining} />
      ) : (
        <>
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
                  onBlockComplete={handleBlockComplete}
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
        </>
      )}
    </div>
  );
};

export default ExperimentController;

