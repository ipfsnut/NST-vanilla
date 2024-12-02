import { createSlice } from '@reduxjs/toolkit';

const captureSlice = createSlice({
  name: 'capture',
  initialState: {
    isReady: false,
    isCapturing: false,
    lastCapture: null,
    error: null,
    deviceStatus: 'uninitiated',
    responseCount: 0,
    captures: [],
    metadata: {
      deviceInfo: null,
      lastCaptureTime: null
    }
  },
  reducers: {
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
  updateDeviceInfo
} = captureSlice.actions;

export default captureSlice.reducer;
