import { createSlice } from '@reduxjs/toolkit';

const captureSlice = createSlice({
  name: 'capture',
  initialState: {
    isCapturing: false,
    deviceStatus: 'initial',
    captureQueue: [],
    lastCapture: null,
    error: null,
    metadata: {
      lastCaptureTime: null,
      deviceInfo: null
    },
    captures: [],
    responseCount: 0
  },
  
  reducers: {
    addToQueue: (state, action) => {
      state.captureQueue.push(action.payload);
    },
    removeFromQueue: (state, action) => {
      state.captureQueue = state.captureQueue.filter(item => item.id !== action.payload);
    },
    setCameraReady: (state, action) => {
      state.isReady = action.payload;
      state.deviceStatus = action.payload ? 'ready' : 'error';
    },
    setCapturing: (state, action) => {
      state.isCapturing = action.payload;
      if (action.payload) {
        state.metadata.lastCaptureTime = Date.now();
      }
    },
    setLastCapture: (state, action) => {
      state.lastCapture = action.payload;
      state.captures.push(action.payload);
    },
    setCaptureError: (state, action) => {
      state.error = action.payload;
      state.deviceStatus = 'error';
    },
    incrementResponseCount: (state) => {
      state.responseCount += 1;
    },
    resetResponseCount: (state) => {
      state.responseCount = 0;
    },
    updateDeviceInfo: (state, action) => {
      state.metadata.deviceInfo = action.payload;
    }
  }
});

export const { 
  setCameraReady, 
  setCapturing, 
  setLastCapture, 
  setCaptureError,
  incrementResponseCount,
  resetResponseCount,
  updateDeviceInfo,
  addToQueue,
  removeFromQueue
} = captureSlice.actions;

export default captureSlice.reducer;
