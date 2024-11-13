import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

const ResponseHandler = ({ sessionId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyPress = async (event) => {
      if (event.key !== 'f' && event.key !== 'j') return;

      try {
        const response = await fetch('/api/nst/response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            response: event.key === 'f' ? 'odd' : 'even',
            timestamp: Date.now()
          })
        });
        const result = await response.json();
        console.log('Response processed:', result);
      } catch (error) {
        console.error('Response submission failed:', error);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [sessionId]);

  return null;
};

export default ResponseHandler;
