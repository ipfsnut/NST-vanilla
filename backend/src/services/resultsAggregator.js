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
  
  return {
    totalTime: endTime - startTime,
    trialsCompleted: state.currentTrial,
    totalTrials: state.trials.length,
    responseCount: state.responses.length,
    lastActivity: session.lastActivity,
    status: state.status
  };
}

processTrialDetails(stateVector) {
  const { experimentState, responseState } = stateVector;
  
  return experimentState.trials.map((trial, index) => ({
    trialNumber: index,
    sequence: trial.number,
    effortLevel: trial.effortLevel,
    response: responseState[index] || null,
    timing: responseState[index]?.timestamp || null,
    isComplete: index < experimentState.currentTrial
  }));
}

processCaptureData(stateVector) {
  const { captureState } = stateVector;
  
  return Array.from(captureState || []).map(capture => ({
    trialNumber: capture.trialNumber,
    filepath: capture.filepath,
    timestamp: capture.metadata.timestamp,
    metadata: capture.metadata
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
  
  calculatePerformanceMetrics(session) {
    const responses = session.state.responses;
    const correctResponses = responses.filter(r => r.isCorrect).length;
    
    return {
      accuracyRate: (correctResponses / responses.length) || 0,
      averageResponseTime: responses.reduce((acc, r) => acc + r.timing, 0) / responses.length || 0,
      totalSwitches: session.state.trials.reduce((acc, t) => acc + t.switches, 0),
      completionRate: (session.state.currentTrial / session.state.trials.length) * 100
    };
  }
  
}