import React from 'react';
import { Provider } from 'react-redux';
import ExperimentController from '../components/ExperimentController';
import store from '../redux/store';
import '../styles/theme.css';
import '../styles/experiment.css';

const App = () => {
  return (
    <Provider store={store}>
      <div className="app-container">
        <ExperimentController />
      </div>
    </Provider>
  );
};

export default App;