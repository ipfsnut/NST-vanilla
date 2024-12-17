import { createSlice } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';

export const responseQueueMiddleware = store => next => action => {
  const result = next(action);
  if (action.type === 'experiment/queueResponse') {
    const state = store.getState().experiment;
    console.log('Response queued:', action.payload);
    processResponses([action.payload], state.experimentId)
      .then(() => store.dispatch(completeResponseProcessing()));
  }
  return result;
};
const processResponses = async (responses, experimentId) => {
  try {
    const processedResponses = responses.map(response => ({
      ...response,
      experimentId,
      timestamp: response.timestamp || Date.now()
    }));

    await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESPONSE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        experimentId,
        responses: processedResponses
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
      byPosition: {}, // Will store responses keyed by `${trialNumber}-${digitIndex}`
      queue: [],
      lastProcessed: null
    },
    captureConfig: {
      firstCapture: 1,
      interval: 7,
      quality: 'high',
      enabled: true
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
        const currentTrial = state.trials[state.trialState.trialNumber];
        
        if (currentTrial) {
          const nextDigitIndex = state.trialState.digitIndex + 1;
          const SEQUENCE_LENGTH = 15;
          
          // Debug the exact position
          console.log('Position check:', {
            digitIndex: state.trialState.digitIndex,
            nextIndex: nextDigitIndex,
            trialNumber: state.trialState.trialNumber,
            totalTrials: state.trials.length
          });
          
          // Only complete after processing ALL digits of the final trial
          if (state.trialState.trialNumber === state.trials.length - 1 && 
              nextDigitIndex > SEQUENCE_LENGTH - 1) {
            state.trialState.phase = 'complete';
            state.isComplete = true;
            return;
          }
          
          // Handle progression to next trial or next digit
          if (nextDigitIndex >= SEQUENCE_LENGTH) {
            if (state.trialState.trialNumber < state.trials.length - 1) {
              state.trialState.trialNumber += 1;
              state.trialState.digitIndex = 0;
              state.trialState.currentDigit = state.trials[state.trialState.trialNumber]?.number[0];
            }
          } else {
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

    updateCaptureConfig: (state, action) => {
      state.captureConfig = {
        ...state.captureConfig,
        ...action.payload
      };
    },

    queueResponse: (state, action) => {
      const positionKey = `${action.payload.trialNumber}-${action.payload.position}`;
      if (!state.responses.byPosition[positionKey]) {
        state.responses.byPosition[positionKey] = action.payload;
        state.responses.queue.push(action.payload);
      }
    },
    processResponseQueue: (state) => {
      if (state.responses.queue.length > 0) {
        // Queue will only contain unique position responses
        processResponses(state.responses.queue, state.experimentId);
      }
    },
    completeResponseProcessing: (state) => {
      state.responses.queue = [];
      state.responses.lastProcessed = Date.now();
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