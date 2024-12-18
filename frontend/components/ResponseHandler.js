import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueResponse } from '../redux/experimentSlice';
import { withResponseErrorHandling } from './ResponseErrorBoundary';

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { phase, currentDigit, digitIndex, trialNumber } = useSelector(
    state => state.experiment.trialState
  );

  const handleKeyPress = (event) => {
    if (event.key !== 'f' && event.key !== 'j' || phase !== 'running') return;

    console.log('Response Handler: Queueing response for digit:', currentDigit);
  
    const isOdd = currentDigit % 2 === 1;
    dispatch(queueResponse({
      experimentId,
      response: event.key,
      responseType: event.key === 'f' ? 'odd' : 'even',
      digit: currentDigit,
      isCorrect: (event.key === 'f' && isOdd) || (event.key === 'j' && !isOdd),
      timestamp: Date.now(),
      position: digitIndex,
      trialNumber
    }));
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentDigit, experimentId, phase, digitIndex, trialNumber]);

  return null;
};

export default withResponseErrorHandling(ResponseHandler);