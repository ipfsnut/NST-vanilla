import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTrialState, setResponsePending } from '../redux/experimentSlice';
import { incrementResponseCount } from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';

const ResponseHandler = ({ experimentId, currentDigit, onResponse }) => {
  const dispatch = useDispatch();
  const { responseCount } = useSelector(state => state.capture);
  const { phase } = useSelector(state => state.experiment);

  const compareStateVectors = (clientVector, serverVector) => {
    if (!serverVector || !serverVector.trial) {
      return true;
    }
    return (
      clientVector.trial === serverVector.trial &&
      clientVector.digit === serverVector.digit &&
      clientVector.phase === serverVector.phase &&
      Math.abs(clientVector.vector[0] - serverVector.vector[0]) <= 1
    );
  }

  const calculateDrift = (clientVector, serverVector) => {
    return {
      trialDrift: serverVector.trial - clientVector.trial,
      digitDrift: serverVector.digit - clientVector.digit,
      phaseDrift: serverVector.phase !== clientVector.phase,
      vectorDrift: serverVector.vector.map((v, i) => v - clientVector.vector[i])
    };
  }

  const handleKeyPress = async (event) => {
    if (phase !== 'running' && phase !== 'awaiting-response') return;
    
    if (event.key === 'f' || event.key === 'j') {
      console.log('Valid key pressed:', event.key);
      dispatch(setResponsePending(true));
      
      const stateVector = {
        trial: currentDigit,
        phase,
        vector: [responseCount, Date.now()]
      };

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experimentId,
            response: event.key,
            digit: currentDigit,
            stateVector
          })
        });

        const data = await response.json();
        
        if (!compareStateVectors(stateVector, data.stateVector)) {
          const drift = calculateDrift(stateVector, data.stateVector);
          console.error('State drift detected:', drift);
          throw new Error('State synchronization error');
        }

        dispatch(incrementResponseCount());
        onResponse(event.key, currentDigit);
        
      } catch (error) {
        console.error('Response processing error:', error);
        dispatch(updateTrialState({
          phase: 'error',
          transitionType: 'response-error'
        }));
      } finally {
        dispatch(setResponsePending(false));
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentDigit, phase, responseCount]);

  return null;
};

export default ResponseHandler;
