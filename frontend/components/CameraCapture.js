import React, { useEffect, useRef } from 'react';

const CameraCapture = ({ sessionId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const config = await fetch('/api/nst/capture-config').then(r => r.json());
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
  }, []);

  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg');
    try {
      await fetch('/api/nst/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imageData,
          timestamp: Date.now()
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
