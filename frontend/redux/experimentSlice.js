import { createSlice } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';

export const responseQueueMiddleware = store => next => action => {
  const result = next(action);
  if (action.type === 'experiment/processResponseQueue') {
    const state = store.getState().experiment;
    if (state.responses.queue.length > 0) {
      processResponses(state.responses.queue, state.experimentId)
        .then(() => store.dispatch(completeResponseProcessing()));
    }
  }
  return result;
};

const processResponses = async (responses, experimentId) => {
  try {
    await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentId,
        responses
      })
    });
  } catch (error) {
    console.error('Response processing error:', error);
  }
};

const experimentSlice = createSlice({
  name: 'experiment',
  initialState: {
    experimentId: null,
    trialState: {
      currentDigit: null,
      trialNumber: 0,
      digitIndex: 0,
      phase: 'start',
      validationStatus: null,
      metadata: {
        targetSwitches: null,
        actualSwitches: null,
        effortLevel: null,
        sequence: []
      }
    },
    trials: [],
    isComplete: false,
    responses: {
      queue: [],
      lastProcessed: null,
      captureTriggered: false
    },
    captureConfig: {
      enabled: false,
      frequency: 3,
      quality: 'high'
    },
    stateVector: {
      lastUpdate: null,
      transitionType: null,
      captureSync: false,
      validationState: null
    },
    captureState: {
      lastCaptureTrial: 0,
      isProcessing: false
    }
  },
  reducers: {
    updateTrialState: (state, action) => {
      console.log('Reducer received action:', action.payload);
      
      if (action.payload.experimentId) {
        state.experimentId = action.payload.experimentId;
        state.trialState.currentDigit = action.payload.currentDigit;
        state.trialState.trialNumber = action.payload.trialNumber - 1;
      }
      // Handle digit progression within trials
    if (action.payload.phase === 'trial-start') {
    // Check completion first
    if (state.trialState.trialNumber > state.trials.length - 1) {
      state.trialState.phase = 'complete';
      state.isComplete = true;
      return;
    }

    const currentTrial = state.trials[state.trialState.trialNumber];
    if (currentTrial) {
      const nextDigitIndex = state.trialState.digitIndex + 1;
      
      if (nextDigitIndex >= currentTrial.number.length) {
        // Move to next trial
        state.trialState.trialNumber += 1;
        state.trialState.digitIndex = 0;
        state.trialState.currentDigit = state.trials[state.trialState.trialNumber]?.number[0];
      } else {
        // Next digit in current trial
        state.trialState.digitIndex = nextDigitIndex;
        state.trialState.currentDigit = currentTrial.number[nextDigitIndex];
      }
    }
  }

      state.trialState.phase = action.payload.phase;
      
      if (action.payload.metadata) {
        state.trialState.metadata = {
          ...state.trialState.metadata,
          ...action.payload.metadata
        };
      }

      state.stateVector = {
        lastUpdate: Date.now(),
        transitionType: action.payload.transitionType,
        captureSync: action.payload.captureSync || false,
        validationState: action.payload.validationState
      };
    },

    queueResponse: (state, action) => {
      state.responses.queue.push({
        ...action.payload,
        timestamp: Date.now()
      });
    },

    processResponseQueue: (state) => {
      if (!state.captureState.isProcessing && 
          state.trialState.trialNumber % 3 === 0 && 
          state.trialState.trialNumber !== state.captureState.lastCaptureTrial) {
        state.captureState.isProcessing = true;
        state.captureState.lastCaptureTrial = state.trialState.trialNumber;
      }
    },

    completeResponseProcessing: (state) => {
      state.responses.queue = [];
      state.responses.lastProcessed = Date.now();
      state.captureState.isProcessing = false;
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

    setComplete: (state, action) => {
      state.isComplete = action.payload;
    }
  }
});

export const {
  updateTrialState,
  queueResponse,
  processResponseQueue,
  completeResponseProcessing,
  updateCaptureConfig,
  setTrials,
  setComplete
} = experimentSlice.actions;

export default experimentSlice.reducer;