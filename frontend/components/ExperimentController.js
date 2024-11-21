import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTrialState } from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';
import StartScreen from './StartScreen';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

const ExperimentController = () => {
  // Core state management
  const dispatch = useDispatch();
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [trialResponses, setTrialResponses] = useState([]);
  const [trials, setTrials] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCaptureEnabled, setCaptureEnabled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  // Redux state extraction
  const { experimentId, currentTrial, currentDigit, isActive, phase } = useSelector(state => state.experiment);

  const shouldCaptureImage = (count) => {
    const capturePoints = [0, 2, 5, 8, 11, 14];
    return capturePoints.includes(count);
  };

  // Initialization Effect
  useEffect(() => {
      // Phase 1: 'start' -> 'initializing'
      // Phase 2: 'initializing' -> create experiment -> 'running'
      // Key point: experimentId generated here but may not sync with backend
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
              transitionType: 'experiment-init'
            }));
          } catch (error) {
            console.error('Initialization error:', error);
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
  // Response Handler
  const handleResponse = async (response, digit) => {
      // Creates responseData with potentially stale experimentId
      // Sends response to backend
      // Updates state based on response
      // Problem area: experimentId consistency
    console.log('HandleResponse called with:', { response, digit });
    setResponseCount(prev => {
      const newCount = prev + 1;
      if (shouldCaptureImage(newCount)) {
        setCaptureEnabled(true);
      }
      return newCount;
    });
    const responseData = {
      experimentId,
      response: response === 'f' ? 'odd' : 'even',
      trialNumber: currentTrial,
      digit: currentDigit
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
          console.log('Next state from backend:', data.nextState);
          console.log('State update:', {
            current: currentDigit,
            next: data.nextState.digit,
            trial: data.nextState.trialNumber,
            index: data.nextState.digitIndex
          });
          dispatch(updateTrialState({
            experimentId,
            currentDigit: data.nextState.digit,
            trialNumber: data.nextState.trialNumber,
            digitIndex: data.nextState.digitIndex,
            phase: 'awaiting-response',
            transitionType: 'digit-update'
          }));
        }
      }
    } catch (error) {
      console.error('Response processing error:', error);
    }
  };

  // Trial Progression
const startNextTrial = async () => {
    // Fetches next trial state
    // Updates local state
    // Problem area: trial state sync with backend
    console.log('Starting next trial');
    setIsTransitioning(true);
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
  transitionType: 'trial-init'
}));
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


  // Render Logic
  // Conditional rendering based on phase
  // Components receive potentially mismatched experimentId
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
                onCaptureReady={setCaptureEnabled}
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
    </div>
  );
};

export default ExperimentController;