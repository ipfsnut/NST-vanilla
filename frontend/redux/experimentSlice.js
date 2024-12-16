import { createSlice } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';

export const responseQueueMiddleware = store => next => action => {
  const result = next(action);
  if (action.type === 'experiment/queueResponse') {
    const state = store.getState().experiment;
    console.log('Response queued:', action.payload);
    // Process immediately and clear
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
        const currentTrial = state.trials[state.trialState.trialNumber];
        console.log('Trial progression debug:', {
          currentTrialNumber: state.trialState.trialNumber,
          currentDigitIndex: state.trialState.digitIndex,
          sequenceLength: currentTrial?.number?.length,
          fullSequence: currentTrial?.number
        });
        
        if (currentTrial) {
          const nextDigitIndex = state.trialState.digitIndex + 1;
          
          if (nextDigitIndex >= currentTrial.number.length) {
            state.trialState.trialNumber += 1;
            
            // Check completion after incrementing trial number
            if (state.trialState.trialNumber >= state.trials.length) {
              state.trialState.phase = 'complete';
              state.isComplete = true;
              return;
            }
            
            state.trialState.digitIndex = 0;
            state.trialState.currentDigit = state.trials[state.trialState.trialNumber]?.number[0];
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

    queueResponse: (state, action) => {
      const positionKey = `${action.payload.trialNumber}-${action.payload.position}`;
      // Only queue if we don't have a response for this position
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