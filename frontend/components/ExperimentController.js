import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ExperimentView from './ExperimentView';
import ResponseHandler from './ResponseHandler';
import { API_CONFIG } from '../config/api';
import { initializeExperiment, setCurrentDigit } from '../redux/experimentSlice';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

const DIGITS_PER_TRIAL = 15;

const ExperimentController = () => {
  const dispatch = useDispatch();
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [trialResponses, setTrialResponses] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCaptureEnabled, setCaptureEnabled] = useState(false);
  const { experimentId, currentTrial, currentDigit, isActive } = useSelector(state => state.experiment);

  useEffect(() => {
    const initializeSession = async () => {
      if (!isActive) {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        dispatch(initializeExperiment({
          experimentId: data.experimentId,
          currentDigit: data.currentDigit,
          trials: data.trials,
          sequence: data.sequence
        }));
      }
    };

    initializeSession();
  }, [dispatch, isActive]);

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
  };

  return (
    <div className="experiment-wrapper">
      {!isComplete ? (
        <>
          <ExperimentView
            currentDigit={currentDigit}
            digitIndex={currentDigitIndex}
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
      ) : (
        <ResultsView
          experimentId={experimentId}
          onExportComplete={() => console.log('Export completed')}
        />
      )}
    </div>
  );
};

export default ExperimentController;