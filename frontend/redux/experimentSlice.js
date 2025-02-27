import { createSlice } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';

// Process responses function remains the same
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

export const responseQueueMiddleware = store => next => action => {
  const result = next(action);
  
  if (action.type === 'experiment/queueResponse') {
    const state = store.getState().experiment;
    
    processResponses([action.payload], state.experimentId)
      .then(() => {
        store.dispatch(completeResponseProcessing());
        store.dispatch(updateTrialState({
          phase: 'trial-start',
          responseProcessed: true
        }));
      })
      .catch(error => {
        console.error('Response processing error:', error);
      });
  }
  return result;
};

const experimentSlice = createSlice({
  name: 'experiment',
  initialState: {
    experimentId: null,
    displayBlank: false, // Simple flag to control digit visibility
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
      byPosition: {},
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
    setDisplayBlank: (state, action) => {
      state.displayBlank = action.payload;
    },
    
    updateTrialState: (state, action) => {
      console.log('updateTrialState received:', action.payload);
      
      if (action.payload.phase === 'capture') {
        console.log('Capture phase detected, returning to running');
        state.trialState.phase = 'running';
        return;
      }

      if (action.payload.experimentId) {
        state.experimentId = action.payload.experimentId;
        state.trialState.currentDigit = action.payload.currentDigit;
        state.trialState.trialNumber = action.payload.trialNumber - 1;
      }

      if (action.payload.phase === 'trial-start' && action.payload.responseProcessed) {
        console.log('Processing trial progression', {
          currentTrial: state.trialState.trialNumber,
          currentIndex: state.trialState.digitIndex
        });
        const currentTrial = state.trials[state.trialState.trialNumber];
        
        if (currentTrial) {
          const nextDigitIndex = state.trialState.digitIndex + 1;
          const SEQUENCE_LENGTH = 15;
          
          // Handle digit progression first
          if (nextDigitIndex >= SEQUENCE_LENGTH) {
            // If this is the last trial, ensure we process the final response
            if (state.trialState.trialNumber === state.trials.length - 1) {
              state.trialState.phase = 'complete';
              state.isComplete = true;
              return;
            }
            // Otherwise move to next trial
            state.trialState.trialNumber += 1;
            state.trialState.digitIndex = 0;
            state.trialState.currentDigit = state.trials[state.trialState.trialNumber]?.number[0];
          } else {
            state.trialState.digitIndex = nextDigitIndex;
            state.trialState.currentDigit = currentTrial.number[nextDigitIndex];
          }
        }
      }      
      state.trialState.phase = action.payload.phase;
    },
    
    queueResponse: (state, action) => {
      const positionKey = `${action.payload.trialNumber}-${action.payload.position}`;
      if (!state.responses.byPosition[positionKey]) {
        state.responses.byPosition[positionKey] = action.payload;
        state.responses.queue.push(action.payload);
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
    },
    
    // New action to update captureConfig
    setCaptureConfig: (state, action) => {
      console.log('Setting captureConfig:', action.payload);
      state.captureConfig = action.payload;
    }
  }
});

export const {
  updateTrialState,
  queueResponse,
  completeResponseProcessing,
  setTrials,
  setComplete,
  setDisplayBlank,
  setCaptureConfig  // Export the new action
} = experimentSlice.actions;

export default experimentSlice.reducer;