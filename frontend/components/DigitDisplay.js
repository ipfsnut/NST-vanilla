import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const DigitDisplay = () => {
  const [currentDigit, setCurrentDigit] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchNextDigit = async () => {
      try {
        const response = await fetch('/api/nst/next-digit');
        const data = await response.json();
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentDigit(data.digit);
          setIsTransitioning(false);
        }, 300);
      } catch (error) {
        console.error('Failed to fetch digit:', error);
      }
    };

    fetchNextDigit();
  }, []);

  return (
    <div className={`digit-display ${isTransitioning ? 'fade' : ''}`}>
      <div className="digit">{currentDigit}</div>
      <div className="instruction">Press 'f' for odd, 'j' for even</div>
    </div>
  );
};

export default DigitDisplay;
