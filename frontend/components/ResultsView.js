import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { API_CONFIG } from '../config/api';

const ResultsView = ({ experimentId, onExportComplete }) => {
  const [results, setResults] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Wait for state transition to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/export/${experimentId}`,
        { 
          method: 'GET',
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nst-session-${experimentId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setExportStatus('complete');
      if (onExportComplete) onExportComplete();
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
    } finally {
      setIsLoading(false);
    }
  };  
  return (
    <div className="results-view">
      <h1>Experiment Complete</h1>
      {results && (
        <div className="results-data">
          <p>Total Trials: {results.metrics?.totalTrials || 'Unknown'}</p>
          <p>Completed Trials: {results.metrics?.completedTrials || 'Unknown'}</p>
          <p>Total Captures: {results.captures?.length || 0}</p>
          {results.captures && results.captures.length > 0 && (
            <div className="capture-details">
              <p>Capture Times:</p>
              <ul>
                {results.captures.map((capture, index) => (
                  <li key={index}>
                    {new Date(capture.timestamp).toLocaleTimeString()} 
                    {capture.trialNumber !== undefined && ` (Trial ${capture.trialNumber})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <button 
        onClick={handleExport}
        disabled={isLoading}
        className="export-button"
      >
        {isLoading ? 'Preparing Export...' : 'Export Results'}
      </button>
    </div>
  );
};

export default ResultsView;
