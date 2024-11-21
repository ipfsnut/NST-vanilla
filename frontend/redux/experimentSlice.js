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
    phase: 'start'
  },
  reducers: {
    updateTrialState: (state, action) => {
      console.log('Reducer received:', action.payload);

      if (action.payload.experimentId) {
        state.experimentId = action.payload.experimentId;
      }
      // Only update digit if explicitly provided
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
      state.metadata = {
        lastUpdate: Date.now(),
        transitionType: action.payload.transitionType
      };
    },
    setResponsePending: (state, action) => {
      state.isResponsePending = action.payload;
    },
    setCaptureAndWait: (state, action) => {
      state.isCapturing = action.payload;
    }
  }
});

export const { 
  updateTrialState, 
  setResponsePending, 
  setCaptureAndWait 
} = experimentSlice.actions;

export default experimentSlice.reducer;