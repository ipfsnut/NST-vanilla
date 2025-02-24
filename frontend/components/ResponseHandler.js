import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueResponse, setDisplayBlank } from '../redux/experimentSlice';
import { withResponseErrorHandling } from './ResponseErrorBoundary';

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { phase, currentDigit, digitIndex, trialNumber } = useSelector(
    state => state.experiment.trialState
  );
  
  const handleKeyPress = (event) => {
    // Only respond to f and j keys in running phase
    if ((event.key !== 'f' && event.key !== 'j') || phase !== 'running') return;
    
    console.log('Response received for digit:', currentDigit);
    
    // 1. Immediately blank the display
    dispatch(setDisplayBlank(true));
    
    // Prepare the response data
    const isOdd = currentDigit % 2 === 1;
    const responseData = {
      experimentId,
      response: event.key,
      responseType: event.key === 'f' ? 'odd' : 'even',
      digit: currentDigit,
      isCorrect: (event.key === 'f' && isOdd) || (event.key === 'j' && !isOdd),
      timestamp: Date.now(),
      position: digitIndex,
      trialNumber
    };
    
    // 2. Queue response after delay to allow blank screen display
    setTimeout(() => {
      // Send the response
      dispatch(queueResponse(responseData));
      
      // 3. Show the next digit after response is queued
      dispatch(setDisplayBlank(false));
    }, 500);
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [currentDigit, experimentId, phase, digitIndex, trialNumber]);

  // This component doesn't render anything
  return null;
};

export default withResponseErrorHandling(ResponseHandler);