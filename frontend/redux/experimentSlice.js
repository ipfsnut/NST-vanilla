import { createSlice } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';

export const responseQueueMiddleware = store => next => action => {
  console.log('Middleware received action:', action.type);
  const result = next(action);
  
  if (action.type === 'experiment/queueResponse') {
    const state = store.getState().experiment;
    console.log('Middleware processing response:', {
      digit: action.payload.digit,
      trialNumber: action.payload.trialNumber,
      position: action.payload.position
    });
    
    processResponses([action.payload], state.experimentId)
      .then(() => {
        console.log('Response processed, updating trial state');
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
    },
    currentBlock: null,
    phase: null,
    breakDuration: null,
    config: {
      breakDuration: null
    },
    breakState: {
      isBreak: false,
      breakType: null,
      duration: null,
      startTime: null
    }
  },
  reducers: {
    updateTrialState: (state, action) => {
      console.log('updateTrialState received:', action.payload);
      
      // Handle experimentId at root level
      if (action.payload.experimentId) {
        state.experimentId = action.payload.experimentId;
      }
      
      // Update all trialState properties that are present in payload
      Object.keys(action.payload).forEach(key => {
        if (key !== 'experimentId') {
          state.trialState[key] = action.payload[key];
        }
      });

      // Existing special case handling
      if (action.payload.phase === 'AWAIT_RESPONSE' && action.payload.responseProcessed) {
        const currentTrial = state.trials[state.trialState.trialNumber];
        if (currentTrial) {
          const nextDigitIndex = state.trialState.digitIndex + 1;
          
          // First: Check if we're at trial end (digitIndex 14)
          if (nextDigitIndex > 14) {
            state.phase = 'TRIAL_BREAK';
            state.breakState = {
              type: 'TRIAL_BREAK',
              startTime: Date.now(),
              duration: 15000,
              isBreak: true
            };
            // Prepare for next trial
            state.trialState.trialNumber += 1;
            state.trialState.digitIndex = 0;
          } else {
            // Normal digit progression
            state.phase = 'DIGIT_BREAK';
            state.breakState = {
              type: 'DIGIT_BREAK',
              startTime: Date.now(),
              duration: 500,
              isBreak: true
            };
            state.trialState.digitIndex = nextDigitIndex;
            state.trialState.currentDigit = currentTrial.number[nextDigitIndex];
          }
        }
      }
      
      if (action.payload.phase === 'PRESENTING_DIGIT') {
        state.phase = 'PRESENTING_DIGIT';
        state.breakState = {
          isBreak: false,
          breakType: null,
          duration: null,
          startTime: null
        };
      }
    },    queueResponse: (state, action) => {
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
    
    startBreak: (state, action) => {
      state.breakState = {
        isBreak: true,
        breakType: action.payload.type,
        duration: action.payload.duration,
        startTime: Date.now()
      };
      state.phase = action.payload.type;
    },

    endBreak: (state) => {
      state.breakState = {
        isBreak: false,
        breakType: null,
        duration: null,
        startTime: null
      };
      state.phase = 'running';
    },

    updateBreakProgress: (state, action) => {
      if (state.breakState.isBreak) {
        state.breakState.remainingTime = 
          state.breakState.duration - (Date.now() - state.breakState.startTime);
      }
    }
  }
});

export const {
  updateTrialState,
  queueResponse,
  completeResponseProcessing,
  setTrials,
  setComplete,
  startBreak,
  endBreak,
  updateBreakProgress
} = experimentSlice.actions;
export default experimentSlice.reducer;
