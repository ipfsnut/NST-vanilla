class StateManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeouts = new Map();
    this.TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  }

  createSession(sessionId, experiment) {
    this.sessions.set(sessionId, {
      experiment,
      startTime: Date.now(),
      lastActivity: Date.now(),
      trialResponses: [],
      state: {
        currentDigit: 0,
        currentTrialIndex: 0,
        trials: experiment.generateTrials() // Ensure trials are generated
      }
    });
    this.resetTimeout(sessionId);
  }

  resetTimeout(sessionId) {
    if (this.sessionTimeouts.has(sessionId)) {
      clearTimeout(this.sessionTimeouts.get(sessionId));
    }
    
    const timeout = setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionTimeouts.delete(sessionId);
    }, this.TIMEOUT_DURATION);
    
    this.sessionTimeouts.set(sessionId, timeout);
  }

  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    session.lastActivity = Date.now();
    this.resetTimeout(sessionId);
    
    return {
      currentTrial: session.experiment.currentTrialIndex,
      currentDigit: session.experiment.state.currentDigit,
      totalTrials: session.experiment.trials.length,
      responses: session.trialResponses
    };
  }

  async saveCapture(sessionId, imageData, captureData) {
    const session = this.sessions.get(sessionId);
    this.resetTimeout(sessionId);
    return { success: true };
  }

  processResponse(sessionId, response) {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };
    
    session.trialResponses.push(response);
    this.resetTimeout(sessionId);
    return { success: true };
  }
}

module.exports = new StateManager();