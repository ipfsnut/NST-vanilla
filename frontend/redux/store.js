import { configureStore } from '@reduxjs/toolkit';
import experimentReducer from './experimentSlice';
import captureReducer from './captureSlice';
import apiMiddleware from './middleware';

export const store = configureStore({
  reducer: {
    experiment: experimentReducer,
    capture: captureReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiMiddleware)
});

export default store;
