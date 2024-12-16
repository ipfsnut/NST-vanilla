import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueResponse, updateTrialState } from '../redux/experimentSlice';
import { withResponseErrorHandling } from './ResponseErrorBoundary';

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { phase, currentDigit, digitIndex, trialNumber } = useSelector(state => state.experiment.trialState);

  const validateResponse = (key, digit) => {
    const isOdd = digit % 2 === 1;
    const validation = {
      isCorrect: (key === 'f' && isOdd) || (key === 'j' && !isOdd),
      responseType: key === 'f' ? 'odd' : 'even'
    };
    console.log('Response validation:', {
      key,
      digit,
      isOdd,
      validation
    });
    return validation;
  };

  const handleKeyPress = async (event) => {
    if (event.key !== 'f' && event.key !== 'j' || phase !== 'running') return;

    const validation = validateResponse(event.key, currentDigit);
    
    // Single response per digit position
    const response = {
      experimentId,
      response: event.key,
      responseType: validation.responseType,
      digit: currentDigit,
      isCorrect: validation.isCorrect,
      timestamp: Date.now(),
      position: digitIndex,
      trialNumber
    };

    dispatch(queueResponse(response));
    dispatch(updateTrialState({ phase: 'trial-start' }));
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentDigit, experimentId, phase, digitIndex, trialNumber]);

  return null;
};

export default withResponseErrorHandling(ResponseHandler);