import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api';

const ResultsView = ({ experimentId, onExportComplete }) => {
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESULTS}?experimentId=${experimentId}`, {
          credentials: 'include'
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      }
    };

    fetchResults();
  }, [experimentId]);

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESULTS}?experimentId=${experimentId}&format=zip`, {
        credentials: 'include'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experiment-${experimentId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };  

  return (
    <div className="results-view">
      <h1 className="matrix-text">Experiment Complete</h1>
      {results && (
        <div className="results-data">
          <p>Total Trials: {results.metrics?.totalTrials}</p>
          <p>Accuracy: {results.metrics?.accuracy}%</p>
          <p>Total Responses: {results.responses?.length}</p>
        </div>
      )}
      <button className="matrix-button" onClick={handleExport}>
        Export Results
      </button>
    </div>
  );
};

export default ResultsView;