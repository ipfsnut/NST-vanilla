import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeExperiment, setCurrentDigit, setPhase } from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';
import StartScreen from './StartScreen';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

const DIGITS_PER_TRIAL = 15;

const ExperimentController = () => {
  const dispatch = useDispatch();
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [trialResponses, setTrialResponses] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCaptureEnabled, setCaptureEnabled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { experimentId, currentTrial, currentDigit, isActive, phase } = useSelector(state => state.experiment);

  useEffect(() => {
    const initializeSession = async () => {
      if (phase === 'running' && !experimentId) {
        setIsTransitioning(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        console.log('Start response data:', data);  // Add this line here
        
        dispatch(initializeExperiment({
          experimentId: data.experimentId,
          currentDigit: data.currentDigit,
          trials: data.trials,
          sequence: data.sequence,
          config: data.config
        }));

        dispatch(setCurrentDigit({
          digit: data.currentDigit,
          trialNumber: 1
        }));

        setTimeout(() => setIsTransitioning(false), 500);
      }
    };

    initializeSession();
  }, [phase, experimentId]);

  const handleResponse = async (response, digit) => {
    const responseData = {
      experimentId,
      response: response === 'f' ? 'odd' : 'even',
      trialNumber: currentTrial
    };

    try {
      const result = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
      });
      
      const data = await result.json();
      if (data.isCorrect) {
        if (data.trialComplete) {
          if (data.isLastTrial) {
            setIsComplete(true);
            dispatch(setPhase('complete'));
          } else {
            await startNextTrial();
          }
        } else {
          const nextDigit = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}?experimentId=${experimentId}`
          );
          const digitData = await nextDigit.json();
          
          setCurrentDigitIndex(prev => prev + 1);
          dispatch(setCurrentDigit({
            digit: digitData.digit,
            trialNumber: digitData.metadata.trialNumber
          }));
        }
      }
    } catch (error) {
      console.error('Response processing error:', error);
    }
  };

  const startNextTrial = async () => {
    setIsTransitioning(true);
    const trialState = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRIAL_STATE}?experimentId=${experimentId}`
    );
    const data = await trialState.json();
    
    setCurrentDigitIndex(0);
    setTrialResponses([]);
    
    dispatch(setCurrentDigit({
      digit: data.digit,
      trialNumber: data.trialNumber
    }));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <div className={`experiment-wrapper ${isTransitioning ? 'fade' : ''}`}>
      {phase === 'start' && <StartScreen />}
      {phase === 'running' && !isComplete && (
        <>
          <DigitDisplay
            digit={currentDigit}
            isTransitioning={currentDigitIndex !== 0}
          />
          {experimentId && (
            <>
              <ResponseHandler
                experimentId={experimentId}
                onResponse={handleResponse}
                trialNumber={currentTrial}
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