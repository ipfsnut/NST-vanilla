import { createSlice } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';

// Simplified middleware for handling response queue processing
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

// Async response processing
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
      console.log('Trial State Update:', {
        currentDigit: action.payload.currentDigit,
        newPhase: action.payload.phase,
        oldDigit: state.trialState.currentDigit,
        oldPhase: state.trialState.phase
      });
      
      if (action.payload.experimentId) {
        state.experimentId = action.payload.experimentId;
      }

      state.trialState = {
        ...state.trialState,
        currentDigit: action.payload.digit ?? action.payload.currentDigit ?? state.trialState.currentDigit,
        trialNumber: action.payload.trialNumber ?? state.trialState.trialNumber,
        digitIndex: action.payload.digitIndex ?? state.trialState.digitIndex,
        phase: action.payload.phase,
        metadata: {
          ...state.trialState.metadata,
          ...action.payload.metadata
        }
      };

      state.stateVector = {
        lastUpdate: Date.now(),
        transitionType: action.payload.transitionType,
        captureSync: action.payload.captureSync || false,
        validationState: action.payload.validationState
      };

      // Reset captureTriggered when moving to next trial
      if (action.payload.trialNumber !== state.trialState.trialNumber) {
        state.responses.captureTriggered = false;
      }
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