import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateTrialState,
  setTrials,
  setComplete 
} from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';

import StartScreen from './StartScreen';
import ExperimentView from './ExperimentView';
import ResultsView from './ResultsView';

const ExperimentController = () => {
  const dispatch = useDispatch();
  const {
    experimentId,
    trialState: { phase },
    trials,
    isComplete
  } = useSelector(state => state.experiment);

  // Core state management and logging
  useEffect(() => {
    console.log('Phase change detected:', phase);
    if (phase === 'complete') {
      fetch(`${API_CONFIG.BASE_URL}/session/${experimentId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState: 'COMPLETE' })
      })
      .then(response => response.json())
      .then(data => console.log('State transition complete:', data));
    }
  }, [phase, experimentId]);

  // Initialize session when needed
  useEffect(() => {
    if (phase === 'initializing' && !experimentId) {
      initializeSession();
    }
  }, [phase, experimentId]);

  const initializeSession = async () => {
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
        phase: 'PRESENTING_DIGIT'
      }));
    } catch (error) {
      dispatch(updateTrialState({ phase: 'error' }));
    }
  };

  console.log('ExperimentController state:', {
    phase,
    isComplete,
    experimentId,
    trialsLength: trials?.length
  });

  return (
    <div className="experiment-wrapper">
      {phase === 'start' && <StartScreen />}
      {phase === 'initializing' && (
        <div className="loading-screen">
          Initializing experiment...
        </div>
      )}
      {(['PRESENTING_DIGIT', 'AWAIT_RESPONSE'].includes(phase)) && !isComplete && (
        <ExperimentView />
      )}
      {phase === 'COMPLETE' && (
        <ResultsView
          experimentId={experimentId}
          onExportComplete={() => dispatch(setComplete(true))}
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
