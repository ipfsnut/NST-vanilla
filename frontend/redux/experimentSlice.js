import { createSlice } from '@reduxjs/toolkit';

const experimentSlice = createSlice({
  name: 'experiment',
  initialState: {
    experimentId: null,
    currentDigit: null,
    currentTrial: 1,
    digitIndex: 0,
    responses: [],
    isActive: false,
    phase: 'start',
    captureConfig: {
      enabled: false,
      frequency: 3,
      quality: 'high'
    },
    stateVector: {
      lastUpdate: null,
      transitionType: null,
      captureSync: false
    }
  },
  reducers: {
    updateTrialState: (state, action) => {
      console.log('Reducer received:', action.payload);

      if (action.payload.experimentId) {
        state.experimentId = action.payload.experimentId;
      }
      if (action.payload.digit !== undefined) {
        state.currentDigit = action.payload.digit;
      } else if (action.payload.currentDigit !== undefined) {
        state.currentDigit = action.payload.currentDigit;
      }
      if (action.payload.trialNumber) {
        state.trialNumber = action.payload.trialNumber;
      }
      if (action.payload.digitIndex !== undefined) {
        state.digitIndex = action.payload.digitIndex;
      }
      state.phase = action.payload.phase;
      state.stateVector = {
        lastUpdate: Date.now(),
        transitionType: action.payload.transitionType,
        captureSync: action.payload.captureSync || false
      };
    },
    setResponsePending: (state, action) => {
      state.isResponsePending = action.payload;
    },
    setCaptureAndWait: (state, action) => {
      state.isCapturing = action.payload;
    },
    updateCaptureConfig: (state, action) => {
      state.captureConfig = {
        ...state.captureConfig,
        ...action.payload
      };
    },
    addResponse: (state, action) => {
      state.responses.push({
        ...action.payload,
        timestamp: Date.now()
      });
    }
  }
});

export const { 
  updateTrialState, 
  setResponsePending, 
  setCaptureAndWait,
  updateCaptureConfig,
  addResponse
} = experimentSlice.actions;

export default experimentSlice.reducer;
