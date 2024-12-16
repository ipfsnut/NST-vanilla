import { configureStore } from '@reduxjs/toolkit';
import experimentReducer from './experimentSlice';
import captureReducer from './captureSlice';

export const store = configureStore({
  reducer: {
    experiment: experimentReducer,
    capture: captureReducer
  }
});

export default store;