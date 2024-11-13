import { createSlice } from '@reduxjs/toolkit';

const experimentSlice = createSlice({
  name: 'experiment',
  initialState: {
    currentState: 'INIT',
    currentTrial: 0,
    currentDigit: null,
    responses: [],
    trialTimings: [],
    error: null
  },
  reducers: {
    setState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentTrial: (state, action) => {
      state.currentTrial = action.payload;
    },
    setCurrentDigit: (state, action) => {
      state.currentDigit = action.payload;
    },
    addResponse: (state, action) => {
      state.responses.push(action.payload);
    },
    addTrialTiming: (state, action) => {
      state.trialTimings.push(action.payload);
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setState, setCurrentTrial, setCurrentDigit, addResponse, addTrialTiming, setError } = experimentSlice.actions;
export default experimentSlice.reducer;
