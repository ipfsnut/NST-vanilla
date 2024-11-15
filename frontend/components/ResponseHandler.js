import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentDigit, advanceDigit, nextTrial } from '../redux/experimentSlice';
import { setCapturing } from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';

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
          response,
          digitIndex
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
      
      if (result.responseValid) {
        dispatch(setCapturing(true));
        dispatch(advanceDigit());
        
        const nextDigit = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}`);
        const digitData = await nextDigit.json();
        
        if (digitData.isLastDigit) {
          dispatch(nextTrial());
        }
        
        dispatch(setCurrentDigit({
          digit: digitData.digit,
          trialNumber: digitData.trialNumber
        }));
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [experimentId, currentTrial, digitIndex]);

  return null;
};

export default ResponseHandler;