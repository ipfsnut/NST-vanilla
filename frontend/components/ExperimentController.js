import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTrialState,
  setTrials,
  queueResponse,
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

  const shouldCaptureImage = useCallback(() => {
    return trialState.trialNumber % 3 === 0;
  }, [trialState.trialNumber]);

  // Core state logging
  useEffect(() => {
    console.log('Experiment state update:', {
      phase: trialState.phase,
      experimentId,
      trialNumber: trialState.trialNumber,
      currentDigit: trialState.currentDigit,
      trialsCount: trials.length
    });
  }, [trialState, experimentId, trials]);

  // Simplified capture effect
  useEffect(() => {
    if (trialState.phase === 'running' && trialState.trialNumber % 3 === 0) {
      console.log('Capture check:', {
        trialNumber: trialState.trialNumber,
        phase: trialState.phase
      });
      dispatch(processResponseQueue());
    }
  }, [trialState.phase, trialState.trialNumber, dispatch]);

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
          console.log('Session initialized:', experimentData);
          
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

    if (trialState.phase === 'start') {
      dispatch(updateTrialState({ phase: 'initializing' }));
    } else if (trialState.phase === 'initializing') {
      initializeSession();
    }
  }, [trialState.phase, experimentId, dispatch]);

  // Simplified trial progression
  const startNextTrial = useCallback(async () => {
    console.log('Starting next trial:', { 
      currentTrial: trialState.trialNumber,
      totalTrials: trials.length 
    });
    
    try {
      const trialStateResponse = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRIAL_STATE}?experimentId=${experimentId}`
      );
      const data = await trialStateResponse.json();
      
      dispatch(updateTrialState({
        ...data.trialState,
        trialNumber: trialState.trialNumber + 1,
        phase: 'trial-start'
      }));
    } catch (error) {
      console.error('Trial state error:', error);
      dispatch(updateTrialState({ phase: 'error' }));
    }
  }, [trialState.trialNumber, trials.length, experimentId, dispatch]);

  // Clean phase transition
  useEffect(() => {
    if (trialState.phase === 'trial-start') {
      dispatch(updateTrialState({ phase: 'running' }));
    }
  }, [trialState.phase, dispatch]);

  return (
    <div className="experiment-wrapper">
      {trialState.phase === 'start' && <StartScreen />}
      
      {(trialState.phase === 'running' || trialState.phase === 'awaiting-response') && !isComplete && (
        <>
          <DigitDisplay />
          {experimentId && trials.length > 0 && (
            <>
              <ResponseHandler
                experimentId={experimentId}
                onResponseComplete={startNextTrial}
              />
              <CameraCapture
                experimentId={experimentId}
                shouldCapture={trialState.trialNumber % 3 === 0}
              />
            </>
          )}
        </>
      )}
      
      {trialState.phase === 'complete' && (
        <ResultsView
          experimentId={experimentId}
          onExportComplete={() => {
            console.log('Export completed');
            dispatch(setComplete(true));
          }}
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