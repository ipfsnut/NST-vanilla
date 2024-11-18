import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentDigit } from '../redux/experimentSlice';
import { setCapturing } from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { currentTrial, digitIndex, currentDigit } = useSelector(state => state.experiment);
  const [responseCount, setResponseCount] = useState(0);

  const shouldCaptureImage = (count) => {
    return count === 0 || count % 3 === 0;
  };

  const submitResponse = async (response) => {
    try {
      const isOdd = currentDigit % 2 !== 0;
      const userResponse = response === 'f' ? 'odd' : 'even';
      const isCorrect = (userResponse === 'odd' && isOdd) || (userResponse === 'even' && !isOdd);

      if (shouldCaptureImage(responseCount)) {
        dispatch(setCapturing(true));
        console.log(`Capturing image at response ${responseCount}`);
      }

      const result = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experimentId,
          response: userResponse,
          isCorrect,
          trialNumber: currentTrial,
          timestamp: Date.now(),
          digitIndex,
          requiresCapture: shouldCaptureImage(responseCount)
        })
      });

      const data = await result.json();
      console.log('Response data:', data);
      
      setResponseCount(prev => prev + 1);

      if (data.trialComplete) {
        console.log(`Trial ${currentTrial} complete, starting next trial`);
        setResponseCount(0); // Reset counter for next trial
        const trialState = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATE}?experimentId=${experimentId}`
        );
        const nextTrialData = await trialState.json();
        dispatch(setCurrentDigit({
          digit: nextTrialData.digit,
          trialNumber: nextTrialData.trialNumber
        }));
      } else {
        const nextDigit = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}?experimentId=${experimentId}`);
        const digitData = await nextDigit.json();
        dispatch(setCurrentDigit({
          digit: digitData.digit,
          trialNumber: digitData.metadata.trialNumber
        }));
      }
    } catch (error) {
      console.error('Response submission failed:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'f' || event.key === 'j') {
      submitResponse(event.key);
    }
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [experimentId, currentTrial, digitIndex, responseCount]);

  return null;
};

export default ResponseHandler;