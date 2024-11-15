import React, { createContext, useContext, useState } from 'react';

const ExperimentContext = createContext(null);

export const ExperimentProvider = ({ children }) => {
  const [experimentData, setExperimentData] = useState({
    experimentId: null,
    currentDigit: null,
    isActive: false
  });

  const initializeExperiment = async () => {
    const startResponse = await fetch('/api/start', { method: 'POST' });
    const { experimentId } = await startResponse.json();
    const digitResponse = await fetch(`/api/next-digit?experimentId=${experimentId}`);
    const { digit } = await digitResponse.json();
    
    setExperimentData({
      experimentId,
      currentDigit: digit,
      isActive: true
    });
  };

  const updateDigit = async () => {
    if (!experimentData.experimentId) return;
    const response = await fetch(`/api/next-digit?experimentId=${experimentData.experimentId}`);
    const { digit } = await response.json();
    setExperimentData(prev => ({ ...prev, currentDigit: digit }));
  };

  return (
    <ExperimentContext.Provider value={{ 
      experimentData, 
      initializeExperiment,
      updateDigit 
    }}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => useContext(ExperimentContext);