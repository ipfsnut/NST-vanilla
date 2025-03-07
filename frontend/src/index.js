import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from '../redux/store';
import { ExperimentProvider } from '../context/ExperimentContext';
import App from './App';
import '../styles/theme.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <ExperimentProvider>
      <App />
    </ExperimentProvider>
  </Provider>
);