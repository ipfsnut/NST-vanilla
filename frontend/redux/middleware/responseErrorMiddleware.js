import { queueResponse, updateTrialState } from '../experimentSlice';

export const responseErrorMiddleware = store => next => action => {
  if (action.type === queueResponse.type) {
    try {
      const result = next(action);
      const state = store.getState().experiment;
      
      // Track failed response attempts
      if (state.responses.errors > 3) {
        store.dispatch(updateTrialState({ 
          phase: 'error',
          error: 'Maximum response errors exceeded'
        }));
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Response error:', {
        action,
        error,
        timestamp: Date.now()
      });
      
      store.dispatch(updateTrialState({
        phase: 'retry',
        lastError: error.message
      }));
    }
  }
  return next(action);
};
