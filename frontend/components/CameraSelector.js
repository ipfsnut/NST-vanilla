import React, { useState, useEffect } from 'react';
import { enumerateCameras } from './CameraCapture';

const CameraSelector = ({ onCameraSelect, selectedCameraId }) => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCameras = async () => {
      setLoading(true);
      const devices = await enumerateCameras();
      setCameras(devices);
      setLoading(false);
    };
    
    loadCameras();
  }, []);

  const handleCameraChange = (event) => {
    const cameraId = event.target.value || null;
    onCameraSelect(cameraId);
  };

  if (loading) return <div>Loading cameras...</div>;

  return (
    <div className="camera-selector">
      <label htmlFor="camera-select">Select Camera:</label>
      <select 
        id="camera-select"
        value={selectedCameraId || ''} 
        onChange={handleCameraChange}
      >
        <option value="">Default Camera</option>
        {cameras.map((camera, index) => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label || `Camera ${index + 1}`}
          </option>
        ))}
      </select>
      <div className="camera-info">
        <p>Found {cameras.length} camera(s)</p>
        {cameras.map((camera, index) => (
          <div key={camera.deviceId} className="camera-item">
            <strong>Camera {index + 1}:</strong> {camera.label || 'Unknown Camera'}
            <br />
            <small>Device ID: {camera.deviceId}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraSelector;