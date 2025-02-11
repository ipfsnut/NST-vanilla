import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueResponse } from '../redux/experimentSlice';
import { withResponseErrorHandling } from './ResponseErrorBoundary';
import { submitResponse } from '../services/api';
import { validateKeyPress, createResponsePayload } from '../utils/responseUtils';
import { useKeyPress } from '../hooks/useKeyPress';

const ResponseHandler = ({ experimentId, onBlockComplete }) => {
  const dispatch = useDispatch();
  const { phase, currentDigit, digitIndex, trialNumber } = useSelector(
    state => state.experiment.trialState
  );

  const handleResponse = async (event) => {
    // Validate key press and phase
    if (!validateKeyPress(event.key, phase)) return;

    // Create response payload
    const response = createResponsePayload({
      experimentId,
      key: event.key,
      digit: currentDigit,
      digitIndex,
      trialNumber
    });

    // Queue response in Redux
    dispatch(queueResponse(response));

    try {
      const data = await submitResponse(experimentId, response);
      
      if (data.blockComplete) {
        onBlockComplete(data.breakDuration);
      }
    } catch (error) {
      // Error handling delegated to error boundary
      throw new Error('Response submission failed');
    }
  };

  // Custom hook for key press handling
  useKeyPress(['f', 'j'], handleResponse);

  return null;
};

export default withResponseErrorHandling(ResponseHandler);
