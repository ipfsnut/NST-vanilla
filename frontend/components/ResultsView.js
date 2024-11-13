import React, { useEffect, useState } from 'react';

const ResultsView = ({ sessionId }) => {
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/nst/results?sessionId=${sessionId}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      }
    };

    fetchResults();
  }, [sessionId]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/nst/session/${sessionId}/status`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nst-session-${sessionId}.json`;
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
        </div>
      )}
      <button className="matrix-button" onClick={handleExport}>
        Export Results
      </button>
    </div>
  );
};

export default ResultsView;
