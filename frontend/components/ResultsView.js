import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { API_CONFIG } from '../config/api';

const ResultsView = ({ experimentId }) => {
  const [results, setResults] = useState(null);
  const responses = useSelector(state => state.experiment.responses);

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
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESULTS}?experimentId=${experimentId}&format=export`, {
        credentials: 'include'
      });
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nst-experiment-${experimentId}.json`;
      a.click();
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
          <p>Total Responses: {responses.length}</p>
        </div>
      )}
      <button className="matrix-button" onClick={handleExport}>
        Export Results
      </button>
    </div>
  );
};

export default ResultsView;