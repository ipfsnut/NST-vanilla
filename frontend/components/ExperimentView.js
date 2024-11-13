import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DigitDisplay from './DigitDisplay';
import ResponseHandler from './ResponseHandler';
import CameraCapture from './CameraCapture';
import ResultsView from './ResultsView';

const ExperimentView = () => {
  const dispatch = useDispatch();
  const [sessionId, setSessionId] = useState(null);
  const experimentState = useSelector(state => state.experiment.currentState);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('/api/nst/start', {
          method: 'POST'
        });
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error('Session initialization failed:', error);
      }
    };

    initializeSession();
  }, []);

  return (
    <div className="experiment-container">
      {experimentState === 'COMPLETE' ? (
        <ResultsView sessionId={sessionId} />
      ) : (
        <>
          <DigitDisplay />
          <ResponseHandler sessionId={sessionId} />
          <CameraCapture sessionId={sessionId} />
        </>
      )}
    </div>
  );
};

export default ExperimentView;
