import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { API_CONFIG } from '../config/api';

const CameraCapture = ({ experimentId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const currentTrial = useSelector(state => state.experiment.currentTrial);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const config = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATE}?experimentId=${experimentId}&type=capture`, {
          credentials: 'include'
        });

        if (!config.captureEnabled) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Camera initialization failed:', error);
      }
    };
    
    initializeCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [experimentId]);

  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      await fetch(`${API_CONFIG.BASE_URL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          experimentId,
          captureData: imageData,
          timestamp: Date.now(),
          trialNumber: currentTrial
        })
      });
    } catch (error) {
      console.error('Capture submission failed:', error);
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} autoPlay />
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
};

export default CameraCapture;