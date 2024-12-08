class StateManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeouts = new Map();
    this.TIMEOUT_DURATION = 30 * 60 * 1000;
    this.subscribers = new Map();
  }

  createSession(sessionId, experiment) {
    this.sessions.set(sessionId, {
      experiment,
      startTime: Date.now(),
      lastActivity: Date.now(),
      trialResponses: [],
      captures: [],
      state: {
        currentDigit: 0,
        currentTrialIndex: 0,
        trials: experiment.generateTrials()
      }
    });
    this.resetTimeout(sessionId);
  }
  
  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    session.lastActivity = Date.now();
    this.resetTimeout(sessionId);
    
    return {
      experiment: {
        currentTrial: session.experiment.currentTrialIndex,
        currentDigit: session.experiment.state.currentDigit,
        totalTrials: session.experiment.trials.length,
        responses: session.trialResponses
      },
      capture: {
        captures: session.captures,
        lastCapture: session.captures[session.captures.length - 1]
      }
    };
  }
  

  updateState(sessionId, update) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const { type, payload } = update;
    session.state[type] = payload;
    session.lastActivity = Date.now();
    
    this._notifySubscribers(sessionId);
    this.resetTimeout(sessionId);
    return session.state;
  }

  // Using underscore prefix as convention for "internal" methods
  _notifySubscribers(sessionId) {
    const subscribers = this.subscribers.get(sessionId);
    if (subscribers) {
      const state = this.getSessionState(sessionId);
      subscribers.forEach(callback => callback(state));
    }
  }

  resetTimeout(sessionId) {
    if (this.sessionTimeouts.has(sessionId)) {
      clearTimeout(this.sessionTimeouts.get(sessionId));
    }
    
    const timeout = setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionTimeouts.delete(sessionId);
      this.subscribers.delete(sessionId);
    }, this.TIMEOUT_DURATION);
    
    this.sessionTimeouts.set(sessionId, timeout);
  }
}

module.exports = new StateManager();
