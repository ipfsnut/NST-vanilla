import { createSlice } from '@reduxjs/toolkit';

const experimentSlice = createSlice({
  name: 'experiment',
  initialState: {
    experimentId: null,
    currentTrial: 0,
    currentDigit: null,
    digitIndex: 0,
    trialNumber: null,
    isActive: false
  },
  reducers: {
    initializeExperiment: (state, action) => {
      state.experimentId = action.payload.experimentId;
      state.isActive = true;
      state.digitIndex = 0;
    },
    setCurrentDigit: (state, action) => {
      state.currentDigit = action.payload.digit;
      state.trialNumber = action.payload.trialNumber;
    },
    advanceDigit: (state) => {
      state.digitIndex += 1;
    },
    nextTrial: (state) => {
      state.currentTrial += 1;
      state.digitIndex = 0;
    }
  }
});

export const { initializeExperiment, setCurrentDigit, advanceDigit, nextTrial } = experimentSlice.actions;
export default experimentSlice.reducer;