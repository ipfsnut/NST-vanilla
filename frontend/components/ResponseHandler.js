import React, { useEffect } from 'react';

const ResponseHandler = ({ onResponse }) => {
  const handleKeyPress = (event) => {
    if (event.key === 'f' || event.key === 'j') {
      onResponse(event.key);
    }
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [onResponse]);

  return null;
};

export default ResponseHandler;