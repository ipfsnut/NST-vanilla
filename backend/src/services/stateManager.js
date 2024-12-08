class StateManager {
  constructor() {
    this.sessions = new Map();
    this.captures = new Map();
  }

  createSession(sessionId, experimentConfig) {
    const session = {
      experimentConfig,
      startTime: Date.now(),
      lastActivity: Date.now(),
      state: {
        currentTrial: 0,
        currentDigit: 0,
        trials: experimentConfig.trials,
        responses: [],
        status: 'RUNNING'
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    session.lastActivity = Date.now();
    return session;
  }

  updateSessionState(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.state = {
      ...session.state,
      ...updates,
      lastActivity: Date.now()
    };

    console.log('State update:', {
      sessionId,
      previousState: session.state,
      updates,
      newState: {...session.state, ...updates}
    });

    return session.state;
  }

  recordResponse(sessionId, responseData) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.state.responses.push({
      ...responseData,
      timestamp: Date.now()
    });

    console.log('Response recorded:', {
      sessionId,
      responseData,
      totalResponses: session.state.responses.length
    });

    return session.state;
  }

  // Capture methods
  addCapture(sessionId, captureData) {
    const captures = this.captures.get(sessionId) || [];
    const newCapture = {
      timestamp: Date.now(),
      data: captureData
    };
    
    captures.push(newCapture);
    this.captures.set(sessionId, captures);
    return newCapture;
  }

  getSessionCaptures(sessionId) {
    return this.captures.get(sessionId) || [];
  }

  // Session cleanup
  endSession(sessionId) {
    this.sessions.delete(sessionId);
    this.captures.delete(sessionId);
    return true;
  }
}

module.exports = new StateManager();
