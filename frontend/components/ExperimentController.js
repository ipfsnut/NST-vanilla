import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTrialState,  // Updates trial phase and metadata
  setTrials,         // Sets full trial sequence from backend
  queueResponse,     // Adds response to processing queue
  processResponseQueue, // Triggers backend response submission
  setComplete        // Marks experiment as complete
} from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';
// UI Components
import StartScreen from './StartScreen';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

/**
 * ExperimentController
 * Core component managing NST experiment flow and state coordination with backend
 * 
 * State Flow:
 * 1. start -> initializing -> running (Session creation)
 * 2. running -> awaiting-response -> trial-start -> running (Trial cycle)
 * 3. running -> complete (Experiment end)
 */

const ExperimentController = () => {
  const dispatch = useDispatch();
  // Core state selectors
  const {
    experimentId,    // Unique session identifier from backend
    trialState,      // Current trial phase and metadata
    trials,          // Full sequence of trials
    isComplete,      // Experiment completion flag
    responses        // Response queue and processing state
  } = useSelector(state => state.experiment);

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

 /**
   * Capture Effect
   * Triggers image capture at specified trial intervals
   * Coordinates with backend /capture endpoint
   * Dependencies: trial phase, number, and capture processing state
   */
  useEffect(() => {
    if (trialState.phase === 'running' && 
        trialState.trialNumber > 0 && 
        trialState.trialNumber % 3 === 0 && 
        !responses.captureState?.isProcessing) {
      console.log('Capture check:', {
        trialNumber: trialState.trialNumber,
        phase: trialState.phase,
        shouldCapture: true
      });
      dispatch(processResponseQueue());
    }
  }, [trialState.phase, trialState.trialNumber]);

  /**
   * Session Initialization
   * Coordinates with backend /start endpoint
   * Flow: 
   * 1. Frontend signals 'initializing'
   * 2. Backend creates session, generates trials
   * 3. Frontend receives experimentId and initial state
   */  
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

  /**
   * Trial Progression Handler
   * Coordinates with backend /trial-state endpoint
   * Triggered after valid response collection
   * Updates digit display and trial metadata
   */
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

   /**
   * Phase Transition Effect
   * Manages clean transitions between trial states
   * Ensures proper phase sequencing: trial-start -> running
   */
   useEffect(() => {
    if (trialState.phase === 'trial-start') {
      dispatch(updateTrialState({ phase: 'running' }));
    }
  }, [trialState.phase, dispatch]);

  /**
   * Render Logic
   * Conditional rendering based on experiment phase
   * Components:
   * - StartScreen: Initial experiment setup
   * - DigitDisplay: Shows current trial digit
   * - ResponseHandler: Processes user input
   * - CameraCapture: Manages image capture at intervals
   * - ResultsView: Displays completion data
   */
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
                shouldCapture={!responses.captureState?.isProcessing && trialState.trialNumber % 3 === 0}
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