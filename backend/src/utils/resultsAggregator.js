const crypto = require('crypto');

class ResultsAggregator {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  async getFullResults(sessionId) {
    const stateVector = this.stateManager.getFullStateVector(sessionId);
    const session = this.stateManager.getSessionState(sessionId);
    
    return {
      sessionMetrics: this.calculateSessionMetrics(session),
      trialDetails: this.processTrialDetails(stateVector),
      captureData: this.processCaptureData(stateVector),
      experimentConfig: session.experimentConfig,
      validationHash: this.generateChecksum(stateVector)
    };
  }

  calculateSessionMetrics(session) {
    const { startTime, state } = session;
    const endTime = Date.now();
    
    // Calculate score metrics
    const responses = state.responses || [];
    const correctResponses = responses.filter(r => this.validateResponse(r.digit, r.key));
    
    return {
      totalTime: endTime - startTime,
      trialsCompleted: state.currentTrial,
      totalTrials: state.trials.length,
      responseCount: state.responses.length,
      score: {
        correct: correctResponses.length,
        total: responses.length,
        percentage: responses.length ? (correctResponses.length / responses.length) * 100 : 0
      },
      presentationTimes: this.calculatePresentationTimes(state),
      lastActivity: session.lastActivity,
      status: state.status
    };
  }

  processTrialDetails(stateVector) {
    const { experimentState, responseState } = stateVector;
    
    return experimentState.trials.map((trial, index) => ({
      trialNumber: index + 1,
      sequence: trial.number,
      responses: trial.number.split('').map((digit, pos) => ({
        digit: digit,
        response: responseState[index]?.key || null,
        isCorrect: this.validateResponse(digit, responseState[index]?.key),
        timestamp: responseState[index]?.timestamp || null,
        presentationTime: responseState[index]?.presentationTime || null,
        position: pos + 1
      })),
      effortLevel: trial.effortLevel,
      totalCorrect: responseState[index]?.filter(r => r.isCorrect).length || 0,
      averagePresentationTime: this.calculateAveragePresentationTime(responseState[index])
    }));
  }

  calculateAveragePresentationTime(responses) {
    if (!responses?.length) return null;
    const times = responses.map(r => r.presentationTime).filter(Boolean);
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
  }

  validateResponse(digit, key) {
    const isOdd = digit % 2 !== 0;
    return (isOdd && key === 'f') || (!isOdd && key === 'j');
  }

  processCaptureData(stateVector) {
    const { captureState } = stateVector;
    
    return Array.from(captureState || []).map(capture => ({
      trialNumber: capture.trialNumber || 0,
      filepath: capture.filepath,
      timestamp: capture.timestamp, // Direct access to timestamp
      metadata: {
        experimentId: capture.experimentId,
        settings: capture.settings,
        digitIndex: capture.digitIndex
      }
    }));
  }

  generateChecksum(stateVector) {
    const dataString = JSON.stringify({
      experimentState: stateVector.experimentState,
      responseState: stateVector.responseState,
      metadata: stateVector.metadata
    });
    
    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
  }
}

module.exports = ResultsAggregator;
