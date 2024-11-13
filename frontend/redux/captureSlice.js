import { createSlice } from '@reduxjs/toolkit';

const captureSlice = createSlice({
  name: 'capture',
  initialState: {
    isReady: false,
    isCapturing: false,
    lastCapture: null,
    error: null
  },
  reducers: {
    setCameraReady: (state, action) => {
      state.isReady = action.payload;
    },
    setCapturing: (state, action) => {
      state.isCapturing = action.payload;
    },
    setLastCapture: (state, action) => {
      state.lastCapture = action.payload;
    },
    setCaptureError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setCameraReady, setCapturing, setLastCapture, setCaptureError } = captureSlice.actions;
export default captureSlice.reducer;
