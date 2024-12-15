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

  // Core state logging
  useEffect(() => {
    console.log('Detailed experiment state:', {
      phase: trialState.phase,
      experimentId,
      trialNumber: trialState.trialNumber,
      currentDigit: trialState.currentDigit,
      trialsCount: trials.length,
      fullTrialState: trialState,
      fullTrials: trials
    });
    handleStateUpdate(trialState);
  }, [trialState, experimentId, trials]);
  
  const handleStateUpdate = (experimentState) => {
    if (experimentState.status === 'COMPLETE') {
      dispatch(experimentActions.setPhase('complete'));
      dispatch(experimentActions.setCompletionMetrics({
        totalResponses: experimentState.metrics.totalResponses,
        trialsCompleted: experimentState.metrics.trialsCompleted,
        completionTime: experimentState.completionTime
      }));
      
      // Trigger completion handlers
      onExperimentComplete(experimentState);
    }
  };
  // Capture timing
  useEffect(() => {
    if (trialState.phase === 'running' && 
        trialState.trialNumber > 0 && 
        trialState.trialNumber % 3 === 0 && 
        !responses.captureState?.isProcessing) {
      dispatch(processResponseQueue());
    }
  }, [trialState.phase, trialState.trialNumber]);
  // Session initialization
  useEffect(() => {
    console.log('Phase change detected:', trialState.phase);
    const initializeSession = async () => {
      console.log('Attempting initialization');
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

    // Only run initialization if we're in initializing phase and don't have an experimentId
    if (trialState.phase === 'initializing' && !experimentId) {
      initializeSession();
    }
  }, [trialState.phase, experimentId, dispatch]);  // Phase transition effect
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
              <ResponseHandler experimentId={experimentId} />
              <CameraCapture
                experimentId={experimentId}
                shouldCapture={!responses.captureState?.isProcessing && trialState.trialNumber % 3 === 0}
              />
            </>
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
