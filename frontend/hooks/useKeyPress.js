import { useEffect } from 'react';

export const useKeyPress = (targetKeys, handler) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (targetKeys.includes(event.key)) {
        handler(event);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handler, targetKeys]);
};
