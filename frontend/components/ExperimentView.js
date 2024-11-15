import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { API_CONFIG } from '../config/api';
import { initializeExperiment, setCurrentDigit } from '../redux/experimentSlice';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';

const ExperimentView = () => {
  const dispatch = useDispatch();
  const { experimentId, currentDigit, isActive } = useSelector(state => state.experiment);

  useEffect(() => {
    if (!isActive) {
      fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        dispatch(initializeExperiment({ experimentId: data.experimentId }));
        return fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}?experimentId=${data.experimentId}`);
      })
      .then(res => res.json())
      .then(data => {
        console.log('Complete next-digit response:', JSON.stringify(data, null, 2));
        dispatch(setCurrentDigit({
          digit: data.number,
          trialNumber: data.metadata.trialNumber
        }));
        console.log('Dispatched digit:', data.number);
      });    }
  }, [dispatch, isActive]);

  return (
    <div className="experiment-container">
      <DigitDisplay digit={currentDigit} />
      {experimentId && (
        <ResponseHandler experimentId={experimentId} />
      )}
    </div>
  );
};

export default ExperimentView;