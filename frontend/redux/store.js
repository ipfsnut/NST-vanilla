import { configureStore } from '@reduxjs/toolkit';
import experimentReducer, { responseQueueMiddleware } from './experimentSlice';
import captureReducer from './captureSlice';

export const store = configureStore({
  reducer: {
    experiment: experimentReducer,
    capture: captureReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(responseQueueMiddleware)
});
export default store;