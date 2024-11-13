import React from 'react';
import { Provider } from 'react-redux';
import ExperimentView from './components/ExperimentView';
import store from './redux/store';
import './styles/theme.css';
import './styles/experiment.css';

const App = () => {
  return (
    <Provider store={store}>
      <div className="app-container">
        <ExperimentView />
      </div>
    </Provider>
  );
};

export default App;
