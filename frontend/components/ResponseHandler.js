import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentDigit, advanceDigit, nextTrial } from '../redux/experimentSlice';
import { setCapturing } from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';

const INTER_TRIAL_DELAY = 1000; // Match backend config

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { currentTrial, digitIndex } = useSelector(state => state.experiment);

  const submitResponse = async (response) => {
    try {
      const result = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experimentId,
          response: response === 'f' ? 'odd' : 'even',
          trialNumber: currentTrial
        })
      });
      return await result.json();
    } catch (error) {
      console.error('Response submission failed:', error);
      throw error;
    }
  };

  const handleKeyPress = async (event) => {
    if (event.key === 'f' || event.key === 'j') {
      const response = event.key === 'f' ? 'odd' : 'even';
      const result = await submitResponse(response);
      
      if (result.isCorrect) {
        dispatch(setCapturing(true));
        dispatch(advanceDigit());
        
        await new Promise(resolve => setTimeout(resolve, INTER_TRIAL_DELAY));
        
        const nextDigit = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}?experimentId=${experimentId}`);
        const digitData = await nextDigit.json();
        
        dispatch(setCurrentDigit({
          digit: digitData.digit,
          trialNumber: digitData.metadata.trialNumber
        }));
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [experimentId, currentTrial, digitIndex, handleKeyPress]);

  return null;
};
export default ResponseHandler;