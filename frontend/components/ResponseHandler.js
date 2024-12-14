import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { API_CONFIG } from '../config/api';
import { addResponse, updateTrialState } from '../redux/experimentSlice';


const ResponseHandler = ({ experimentId, currentDigit, onResponseComplete }) => {
  const dispatch = useDispatch();
  const { phase } = useSelector(state => state.experiment);

  const validateResponse = (key, digit) => {
    const isOdd = digit % 2 === 1;
    return {
      isCorrect: (key === 'f' && isOdd) || (key === 'j' && !isOdd),
      responseType: key === 'f' ? 'odd' : 'even'
    };
  };

  const handleKeyPress = async (event) => {
    if (event.key !== 'f' && event.key !== 'j' || phase !== 'running') return;

    const validation = validateResponse(event.key, currentDigit);
    console.log('Response validation:', validation);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentId,
          response: event.key,
          responseType: validation.responseType,
          digit: currentDigit,
          isCorrect: validation.isCorrect,
          timestamp: Date.now()
        })
      });

      const data = await response.json();
      if (data.success) {
        dispatch(addResponse({
          key: event.key,
          digit: currentDigit,
          isCorrect: validation.isCorrect,
          timestamp: Date.now()
        }));
        onResponseComplete();
      }
    } catch (error) {
      console.error('Response processing error:', error);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentDigit, experimentId, phase, dispatch, onResponseComplete]);

  return null;
};

export default ResponseHandler;