import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTrialState } from '../redux/experimentSlice';
import { incrementResponseCount, resetResponseCount } from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';
import StartScreen from './StartScreen';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

const ExperimentController = () => {
  const dispatch = useDispatch();
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [trialResponses, setTrialResponses] = useState([]);
  const [trials, setTrials] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { experimentId, currentTrial, currentDigit, isActive, phase } = useSelector(state => state.experiment);
  const { responseCount, isReady: isCameraReady } = useSelector(state => state.capture);
  const [captureRequested, setCaptureRequested] = useState(false); 


  const shouldCaptureImage = (count) => {
    const capturePoints = [0, 2, 5, 8, 11, 14];
    if (capturePoints.includes(count) && !captureRequested) {
      setCaptureRequested(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const initializeSession = async () => {
      if (phase === 'initializing' && !experimentId) {
        setIsTransitioning(true);
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experimentType: 'nst' })
          });
          
          const experimentData = await response.json();
          console.log('Received experiment data:', experimentData);
          
          setTrials(experimentData.trials);
          dispatch(updateTrialState({
            experimentId: experimentData.experimentId,
            currentDigit: experimentData.currentDigit,
            currentTrial: 0,
            digitIndex: 0,
            phase: 'running',
            transitionType: 'experiment-init',
            captureSync: true
          }));
        } catch (error) {
          console.error('Initialization error:', error);
          dispatch(updateTrialState({
            phase: 'error',
            transitionType: 'init-error'
          }));
        }
        setTimeout(() => setIsTransitioning(false), 500);
      }
    };

    if (phase === 'start') {
      dispatch(updateTrialState({ phase: 'initializing' }));
    } else if (phase === 'initializing') {
      initializeSession();
    }
  }, [phase, experimentId, dispatch]);

  const handleResponse = async (response, digit) => {
    console.log('HandleResponse called with:', { response, digit });
    dispatch(incrementResponseCount());
    setCaptureRequested(false);
    
    const responseData = {
      experimentId,
      response: response === 'f' ? 'odd' : 'even',
      trialNumber: currentTrial,
      digit: currentDigit,
      requiresCapture: shouldCaptureImage(responseCount)
    };

    try {
      const result = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
      });
      const data = await result.json();
      console.log('Response processing result:', data);
      
      if (data.isCorrect) {
        if (data.trialComplete) {
          dispatch(resetResponseCount());
          dispatch(updateTrialState({
            phase: 'trial-complete',
            transitionType: 'trial-complete'
          }));
          
          setTimeout(async () => {
            if (data.isLastTrial) {
              setIsComplete(true);
              dispatch(updateTrialState({
                phase: 'complete',
                transitionType: 'experiment-complete'
              }));
            } else {
              await startNextTrial();
            }
          }, 3000);        
        } else {
          setCurrentDigitIndex(prev => prev + 1);
          dispatch(updateTrialState({
            experimentId,
            currentDigit: data.nextState.digit,
            trialNumber: data.nextState.trialNumber,
            digitIndex: data.nextState.digitIndex,
            phase: 'awaiting-response',
            transitionType: 'digit-update',
            captureSync: true
          }));
        }
      }
    } catch (error) {
      console.error('Response processing error:', error);
      dispatch(updateTrialState({
        phase: 'error',
        transitionType: 'response-error'
      }));
    }
  };

  const startNextTrial = async () => {
    console.log('Starting next trial');
    setIsTransitioning(true);
    try {
      const trialState = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRIAL_STATE}?experimentId=${experimentId}`
      );
      const data = await trialState.json();
      
      setCurrentDigitIndex(0);
      setTrialResponses([]);
      
      dispatch(updateTrialState({
        experimentId,
        digit: data.currentDigit,
        trialNumber: data.trialState.trialNumber,
        digitIndex: 0,
        phase: 'trial-start',
        transitionType: 'trial-init',
        captureSync: true
      }));
    } catch (error) {
      console.error('Trial state error:', error);
      dispatch(updateTrialState({
        phase: 'error',
        transitionType: 'trial-error'
      }));
    }
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    if (phase === 'trial-start') {
      dispatch(updateTrialState({
        phase: 'running',
        transitionType: 'trial-running'
      }));
    }
  }, [phase, dispatch]);

  console.log('ExperimentController render:', { phase, experimentId, currentDigit });

  return (
    <div className={`experiment-wrapper ${isTransitioning ? 'fade' : ''}`}>
      {phase === 'start' && <StartScreen />}
      {(phase === 'running' || phase === 'awaiting-response') && !isComplete && (
        <>
          <DigitDisplay
            digit={currentDigit}
            isTransitioning={currentDigitIndex !== 0}
          />
          {experimentId && (
            <>
              <ResponseHandler
                experimentId={experimentId}
                currentDigit={currentDigit}
                trialNumber={currentTrial}
                sequence={trials[currentTrial]?.sequence}
                digitIndex={currentDigitIndex}
                dispatch={dispatch}
                onResponse={handleResponse}
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
          onExportComplete={() => console.log('Export completed')}
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
