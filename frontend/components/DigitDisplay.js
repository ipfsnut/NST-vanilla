import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { API_CONFIG } from '../config/api';
import { setCurrentDigit } from '../redux/experimentSlice';

const DigitDisplay = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { currentDigit, experimentId, digitIndex } = useSelector(state => state.experiment);
  console.log('Redux store currentDigit:', currentDigit);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!experimentId) return;

    const fetchNextDigit = async () => {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEXT_DIGIT}?experimentId=${experimentId}`);
      const data = await response.json();
      setIsTransitioning(true);
      setTimeout(() => {
        dispatch(setCurrentDigit({
          digit: data.number,
          trialNumber: data.metadata.trialNumber
        }));
        setIsTransitioning(false);
      }, 300);
    };

    fetchNextDigit();
  }, [experimentId, digitIndex, dispatch]);

  return (
    <div className={`digit-display ${isTransitioning ? 'fade' : ''}`}>
      <div className="digit">{currentDigit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
    </div>
  );
};

export default DigitDisplay;