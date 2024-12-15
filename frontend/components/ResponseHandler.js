import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueResponse, updateTrialState } from '../redux/experimentSlice';

const ResponseHandler = ({ experimentId }) => {
  const dispatch = useDispatch();
  const { phase } = useSelector(state => state.experiment.trialState);
  const { currentDigit } = useSelector(state => state.experiment.trialState);
  const { queue } = useSelector(state => state.experiment.responses);

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
    console.log('Response validation:', validation);

    dispatch(queueResponse({
      experimentId,
      response: event.key,
      responseType: validation.responseType,
      digit: currentDigit,
      isCorrect: validation.isCorrect,
      timestamp: Date.now()
    }));

    if (queue.length >= 10 || validation.isCorrect) {
      dispatch(updateTrialState({ phase: 'trial-start' }));
    }
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentDigit, experimentId, phase, queue.length]);

  return null;
};

export default ResponseHandler;