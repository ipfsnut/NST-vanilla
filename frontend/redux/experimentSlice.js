import { createSlice } from '@reduxjs/toolkit';

const experimentSlice = createSlice({
  name: 'experiment',
  initialState: {
    experimentId: null,
    currentDigit: null,
    currentTrial: 1,
    digitIndex: 0,
    trials: [],
    isComplete: false,
    isTransitioning: false,
    captureRequested: false,
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
      console.log('Trial State Update:', {
        currentDigit: action.payload.currentDigit,
        newPhase: action.payload.phase,
        oldDigit: state.currentDigit,
        oldPhase: state.phase
      });
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
    setTrials: (state, action) => {
      state.trials = action.payload;
    },
  
    setTransitioning: (state, action) => {
      state.isTransitioning = action.payload;
    },
  
    setCaptureRequested: (state, action) => {
      state.captureRequested = action.payload;
    },
  
    setComplete: (state, action) => {
      state.isComplete = action.payload;
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
  addResponse,
  setTrials,
  setTransitioning,
  setCaptureRequested,
  setComplete
} = experimentSlice.actions;


export default experimentSlice.reducer;
