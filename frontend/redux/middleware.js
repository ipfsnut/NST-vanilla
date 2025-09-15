import { API_BASE_URL } from '../config/api';

const apiMiddleware = store => next => async action => {
  if (!action.meta?.api) return next(action);
  
  const { endpoint, method = 'GET', body } = action.meta.api;
  const state = store.getState();
  
  // Add capture metadata if needed
  const enrichedBody = body && state.capture.isReady ? {
    ...body,
    captureMetadata: {
      deviceStatus: state.capture.deviceStatus,
      responseCount: state.capture.responseCount,
      lastCaptureTime: state.capture.metadata.lastCaptureTime
    }
  } : body;
  
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrichedBody)
    });
    
    const data = await response.json();
    
    // Validate state consistency
    if (data.stateVector && state.experiment.stateVector) {
      const isConsistent = Math.abs(
        data.stateVector.lastUpdate - state.experiment.stateVector.lastUpdate
      ) < 5000; // 5 second threshold
      
      if (!isConsistent) {
        console.error('State vector mismatch detected');
        throw new Error('State synchronization error');
      }
    }
    
    return next({
      ...action,
      payload: data
    });
  } catch (error) {
    console.error(`API Error ${endpoint}:`, error);
    return next({
      ...action,
      error: true,
      payload: error.message
    });
  }
};

export default apiMiddleware;
