import React from 'react';
import { updateTrialState, setResponsePending, setCaptureAndWait } from '../redux/experimentSlice';
import { API_CONFIG } from '../config/api';

class ResponseHandler extends React.Component {
  constructor(props) {
    super(props);
    console.log('ResponseHandler constructor called with props:', props);
    this.state = {
      responseCount: 0
    };
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  compareStateVectors(clientVector, serverVector) {
    if (!serverVector || !serverVector.trial) {
      return true;
    }
    return (
      clientVector.trial === serverVector.trial &&
      clientVector.digit === serverVector.digit &&
      clientVector.phase === serverVector.phase &&
      Math.abs(clientVector.vector[0] - serverVector.vector[0]) <= 1
    );
  }

  calculateDrift(clientVector, serverVector) {
    return {
      trialDrift: serverVector.trial - clientVector.trial,
      digitDrift: serverVector.digit - clientVector.digit,
      phaseDrift: serverVector.phase !== clientVector.phase,
      vectorDrift: serverVector.vector.map((v, i) => v - clientVector.vector[i])
    };
  }

  handleKeyPress = (event) => {
    console.log('Keypress detected:', event.key);
    if (event.key === 'f' || event.key === 'j') {
      console.log('Valid key pressed, submitting response');
      this.props.onResponse(event.key, this.props.currentDigit);
    }
  }

  componentDidMount() {
    window.addEventListener('keypress', this.handleKeyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('keypress', this.handleKeyPress);
  }

  render() {
    return null;
  }
}

export default ResponseHandler;