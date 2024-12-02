import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { API_CONFIG } from '../config/api';

const ResultsView = ({ experimentId, onExportComplete }) => {
  const [results, setResults] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const captures = useSelector(state => state.capture.captures);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESULTS}?experimentId=${experimentId}`, 
          { credentials: 'include' }
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      }
    };

    fetchResults();
  }, [experimentId]);

  const handleExport = async () => {
    setExportStatus('preparing');
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESULTS}?experimentId=${experimentId}&format=export`, 
        { credentials: 'include' }
      );
      const data = await response.json();
      
      // Include capture data in export
      const fullExport = {
        ...data,
        captures: captures.map(capture => ({
          timestamp: capture.timestamp,
          metadata: capture.metadata
        }))
      };

      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nst-experiment-${experimentId}.json`;
      a.click();
      
      setExportStatus('complete');
      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
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
          <p>Captures: {captures.length}</p>
        </div>
      )}
      <button 
        className="matrix-button" 
        onClick={handleExport}
        disabled={exportStatus === 'preparing'}
      >
        {exportStatus === 'preparing' ? 'Preparing Export...' : 'Export Results'}
      </button>
      {exportStatus === 'error' && (
        <div className="error-message">Export failed. Please try again.</div>
      )}
    </div>
  );
};

export default ResultsView;
