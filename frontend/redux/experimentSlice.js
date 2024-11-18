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
    initializeExperiment: (state, action) => {
      state.experimentId = action.payload.experimentId;
      state.currentDigit = action.payload.currentDigit;
      state.isActive = true;
      state.digitIndex = 0;
      state.phase = 'running';
    },
    setCurrentDigit: (state, action) => {
      state.currentDigit = action.payload.digit;
      state.trialNumber = action.payload.trialNumber;
    },
    advanceDigit: (state) => {
      state.digitIndex += 1;
    },
    setTransitioning: (state, action) => {
      state.isTransitioning = action.payload;
    },
    setPhase: (state, action) => {
      state.phase = action.payload;
    }
  }
});

export const { 
  initializeExperiment, 
  setCurrentDigit, 
  advanceDigit, 
  setTransitioning,
  setPhase 
} = experimentSlice.actions;export default experimentSlice.reducer;