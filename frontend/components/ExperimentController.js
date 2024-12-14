import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTrialState,
  setTrials,
  setTransitioning,
  setCaptureRequested,
  setComplete
} from '../redux/experimentSlice';
import { incrementResponseCount } from '../redux/captureSlice';
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
    currentTrial,
    currentDigit,
    phase,
    digitIndex,
    trials,
    isComplete,
    isTransitioning,
    captureRequested
  } = useSelector(state => state.experiment);
  const { responseCount } = useSelector(state => state.capture);

  const shouldCaptureImage = useCallback((count) => {
    const capturePoints = [0, 2, 5, 8, 11, 14];
    return capturePoints.includes(count) && !captureRequested;
  }, [captureRequested]);

  // Debug logging
  useEffect(() => {
    console.log('Experiment state:', {
      phase,
      experimentId,
      currentTrial,
      currentDigit,
      trialsCount: trials.length
    });
  }, [phase, experimentId, currentTrial, currentDigit, trials]);

  // Capture check
  useEffect(() => {
    console.log('Capture check:', {
      responseCount,
      captureRequested,
      shouldCapture: shouldCaptureImage(responseCount)
    });
    
    if (shouldCaptureImage(responseCount)) {
      dispatch(setCaptureRequested(true));
    }
  }, [responseCount, captureRequested, dispatch, shouldCaptureImage]);

  // Session initialization
  useEffect(() => {
    const initializeSession = async () => {
      if (phase === 'initializing' && !experimentId) {
        dispatch(setTransitioning(true));
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experimentType: 'nst' })
          });
          
          const experimentData = await response.json();
          console.log('Session initialized:', experimentData);
          
          dispatch(setTrials(experimentData.trials));
          dispatch(updateTrialState({
            experimentId: experimentData.experimentId,
            currentDigit: experimentData.currentDigit,
            currentTrial: 0,
            phase: 'running'
          }));
        } catch (error) {
          console.error('Initialization error:', error);
          dispatch(updateTrialState({ phase: 'error' }));
        }
        setTimeout(() => dispatch(setTransitioning(false)), 500);
      }
    };

    if (phase === 'start') {
      dispatch(updateTrialState({ phase: 'initializing' }));
    } else if (phase === 'initializing') {
      initializeSession();
    }
  }, [phase, experimentId, dispatch]);

  const startNextTrial = useCallback(async () => {
    console.log('Starting next trial:', { currentTrial, trialsCount: trials.length });
    dispatch(setTransitioning(true));
    
    try {
      const trialState = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRIAL_STATE}?experimentId=${experimentId}`
      );
      const data = await trialState.json();
      
      dispatch(updateTrialState({
        currentDigit: data.currentDigit,
        currentTrial: data.trialState.trialNumber,
        digitIndex: 0,
        phase: 'trial-start'
      }));
    } catch (error) {
      console.error('Trial state error:', error);
      dispatch(updateTrialState({ phase: 'error' }));
    }
    setTimeout(() => dispatch(setTransitioning(false)), 500);
  }, [currentTrial, trials.length, experimentId, dispatch]);

  // Trial phase transition
  useEffect(() => {
    if (phase === 'trial-start') {
      dispatch(updateTrialState({ phase: 'running' }));
    }
  }, [phase, dispatch]);

  return (
    <div className={`experiment-wrapper ${isTransitioning ? 'fade' : ''}`}>
      {phase === 'start' && <StartScreen />}
      
      {(phase === 'running' || phase === 'awaiting-response') && !isComplete && (
        <>
          <DigitDisplay />
          {experimentId && trials.length > 0 && (
            <>
              <ResponseHandler
                experimentId={experimentId}
                currentDigit={currentDigit}
                onResponseComplete={startNextTrial}
              />
              <CameraCapture
                experimentId={experimentId}
                shouldCapture={shouldCaptureImage(responseCount)}
              />
            </>
          )}
        </>
      )}
      
      {phase === 'complete' && (
        <ResultsView
          experimentId={experimentId}
          onExportComplete={() => {
            console.log('Export completed');
            dispatch(setComplete(true));
          }}
        />
      )}
      
      {phase === 'error' && (
        <div className="error-message">
          An error occurred. Please restart the experiment.
        </div>
      )}
    </div>
  );
};

export default ExperimentController;
