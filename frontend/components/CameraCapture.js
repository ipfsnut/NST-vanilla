import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCameraReady, setCapturing, setLastCapture, setCaptureError, updateDeviceInfo } from '../redux/captureSlice';
import { API_CONFIG } from '../config/api';

// Utility function for camera checks
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

const CameraCapture = ({ experimentId, shouldCapture }) => {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { isCapturing, deviceStatus } = useSelector(state => state.capture);
  const captureRef = useRef(false);

  useEffect(() => {
    if (shouldCapture && !captureRef.current && deviceStatus === 'ready' && !isCapturing) {
      captureRef.current = true;
      captureImage().finally(() => {
        captureRef.current = false;
      });
    }
  }, [shouldCapture, deviceStatus, isCapturing]);
  
  const initializeCamera = async () => {
    try {
      const config = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATE}?experimentId=${experimentId}&type=capture`, {
        credentials: 'include'
      });

      if (!config.captureEnabled) return;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      
      const videoTrack = stream.getVideoTracks()[0];
      dispatch(setCameraReady(true));
      dispatch(updateDeviceInfo({
        deviceId: videoTrack.getSettings().deviceId,
        capabilities: videoTrack.getCapabilities(),
        settings: videoTrack.getSettings()
      }));
      
      return true;
    } catch (error) {
      console.error('Camera initialization failed:', error);
      dispatch(setCameraReady(false));
      dispatch(setCaptureError(error.message));
      return false;
    }
  };

  useEffect(() => {
    initializeCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [experimentId]);

  useEffect(() => {
    if (shouldCapture && deviceStatus === 'ready' && !isCapturing) {
      captureImage();
    }
  }, [shouldCapture, deviceStatus, isCapturing]);

  const captureImage = async () => {
    dispatch(setCapturing(true));
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    try {
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');

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
            resolution: `${canvas.width}x${canvas.height}`
          }
        })
      });

      const result = await response.json();
      dispatch(setLastCapture({
        timestamp: Date.now(),
        status: 'success',
        metadata: result
      }));
    } catch (error) {
      console.error('Capture submission failed:', error);
      dispatch(setCaptureError(error.message));
    } finally {
      dispatch(setCapturing(false));
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
