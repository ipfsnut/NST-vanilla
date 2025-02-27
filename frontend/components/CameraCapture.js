import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCameraReady, 
  setCapturing, 
  setLastCapture, 
  setCaptureError, 
  updateDeviceInfo,
  addToQueue,
  removeFromQueue 
} from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';

export const checkCameraAvailability = async (dispatch) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    dispatch(setCameraReady(true));
    return true;
  } catch (error) {
    dispatch(setCaptureError('Camera not available'));
    return false;
  }
};

const CAPTURE_SETTINGS = {
  width: 640,
  height: 480,
  imageType: 'image/jpeg',
  quality: 0.8
};
const CameraCapture = ({ experimentId, shouldCapture }) => {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const processingRef = useRef(false);
  
  const { deviceStatus } = useSelector(state => state.capture);
  const { trialNumber, digitIndex } = useSelector(state => state.experiment.trialState);

  // Initialize camera stream once
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: CAPTURE_SETTINGS.width,
            height: CAPTURE_SETTINGS.height
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          streamRef.current = stream;
          dispatch(setCameraReady(true));
        }
      } catch (err) {
        console.error('Camera initialization failed:', err);
      }
    };

    initializeCamera();
  }, []);

  // Update capture effect
  useEffect(() => {
    console.log('CAMERA CAPTURE CHECK:');
    console.log('  shouldCapture prop:', shouldCapture);
    console.log('  streamRef.current exists:', !!streamRef.current);
    console.log('  processingRef.current:', processingRef.current);
    
    if (shouldCapture && streamRef.current && !processingRef.current) {
      processingRef.current = true;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      // Prepare canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL(CAPTURE_SETTINGS.imageType, CAPTURE_SETTINGS.quality);

      fetch(`${API_CONFIG.BASE_URL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          experimentId,
          captureData: imageData,
          timestamp: Date.now(),
          settings: CAPTURE_SETTINGS,
          trialNumber,
          digitIndex
        })
      })
      .then(() => console.log('Capture completed'))
      .finally(() => {
        processingRef.current = false;
      });
    }
  }, [shouldCapture, experimentId, trialNumber, digitIndex]);

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} width={CAPTURE_SETTINGS.width} height={CAPTURE_SETTINGS.height} />
    </div>
  );
};
export default CameraCapture;