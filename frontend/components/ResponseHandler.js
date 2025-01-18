import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueResponse } from '../redux/experimentSlice';
import { withResponseErrorHandling } from './ResponseErrorBoundary';
import { API_CONFIG } from '../config/api';

const ResponseHandler = ({ experimentId, onBlockComplete }) => {
  const dispatch = useDispatch();
  const { phase, currentDigit, digitIndex, trialNumber } = useSelector(
    state => state.experiment.trialState
  );

  const handleKeyPress = async (event) => {
    if (event.key !== 'f' && event.key !== 'j' || phase !== 'running') return;

    console.log('Response Handler: Queueing response for digit:', currentDigit);
    
    const isOdd = currentDigit % 2 === 1;
    const response = {
      experimentId,
      response: event.key,
      responseType: event.key === 'f' ? 'odd' : 'even',
      digit: currentDigit,
      isCorrect: (event.key === 'f' && isOdd) || (event.key === 'j' && !isOdd),
      timestamp: Date.now(),
      position: digitIndex,
      trialNumber
    };

    // Dispatch the response to Redux
    dispatch(queueResponse(response));

    // Send response to backend
    try {
      const result = await fetch(`${API_CONFIG.BASE_URL}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId,
          responses: [response]
        })
      });
      
      const data = await result.json();
      
      // Handle block completion
      if (data.blockComplete) {
        onBlockComplete(data.breakDuration);
      }
    } catch (error) {
      console.error('Response submission error:', error);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentDigit, experimentId, phase, digitIndex, trialNumber]);

  return null;
};

export default withResponseErrorHandling(ResponseHandler);
