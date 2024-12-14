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
  
  const { 
    isCapturing, 
    deviceStatus, 
    captureQueue 
  } = useSelector(state => state.capture);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: CAPTURE_SETTINGS.width },
          height: { ideal: CAPTURE_SETTINGS.height }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      const settings = videoTrack.getSettings();

      dispatch(setCameraReady(true));
      dispatch(updateDeviceInfo({
        deviceId: settings.deviceId,
        capabilities,
        settings
      }));

      return true;
    } catch (error) {
      console.error('Camera initialization failed:', error);
      dispatch(setCameraReady(false));
      dispatch(setCaptureError(error.message));
      return false;
    }
  }, [dispatch]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || captureQueue.length === 0) return;
    
    processingRef.current = true;
    
    while (captureQueue.length > 0) {
      const captureRequest = captureQueue[0];
      
      try {
        dispatch(setCapturing(true));
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL(
          CAPTURE_SETTINGS.imageType, 
          CAPTURE_SETTINGS.quality
        );

        const response = await fetch(`${API_CONFIG.BASE_URL}/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            experimentId,
            captureData: imageData,
            timestamp: Date.now(),
            metadata: {
              deviceStatus,
              resolution: `${canvas.width}x${canvas.height}`,
              requestId: captureRequest.id
            }
          })
        });

        if (!response.ok) throw new Error('Capture upload failed');

        const result = await response.json();
        
        dispatch(setLastCapture({
          timestamp: Date.now(),
          status: 'success',
          metadata: result
        }));
        
      } catch (error) {
        console.error('Capture failed:', error);
        dispatch(setCaptureError(error.message));
      } finally {
        dispatch(removeFromQueue(captureRequest.id));
        dispatch(setCapturing(false));
      }
    }
    
    processingRef.current = false;
  }, [captureQueue, deviceStatus, experimentId, dispatch]);

  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  useEffect(() => {
    if (shouldCapture && deviceStatus === 'ready' && !isCapturing) {
      dispatch(addToQueue({
        id: Date.now().toString(),
        timestamp: Date.now()
      }));
    }
  }, [shouldCapture, deviceStatus, isCapturing, dispatch]);

  useEffect(() => {
    if (captureQueue.length > 0 && !isCapturing) {
      processQueue();
    }
  }, [captureQueue, isCapturing, processQueue]);

  return (
    <div style={{ display: 'none' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
      />
      <canvas 
        ref={canvasRef} 
        width={CAPTURE_SETTINGS.width} 
        height={CAPTURE_SETTINGS.height} 
      />
    </div>
  );
};

export default CameraCapture;
