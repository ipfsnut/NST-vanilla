import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentDigit } from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { currentTrial, digitIndex } = useSelector(state => state.experiment);

  const submitResponse = async (response) => {
    console.log('Submitting response:', response);
    try {
      const result = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experimentId,
          response: response === 'f' ? 'odd' : 'even',
          trialNumber: currentTrial,
          timestamp: Date.now(),
          digitIndex
        })
      });
      
      const data = await result.json();
      console.log('Response data:', data);
      
      // Always get next digit, regardless of correctness
      const nextDigit = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}?experimentId=${experimentId}`);
      const digitData = await nextDigit.json();
      console.log('Next digit data:', digitData);
      
      dispatch(setCurrentDigit({
        digit: digitData.digit,
        trialNumber: digitData.metadata.trialNumber
      }));
      
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
  }, [experimentId, currentTrial, digitIndex]);

  return null;
};

export default ResponseHandler;