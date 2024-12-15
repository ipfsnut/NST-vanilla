const VALID_STATES = ['INIT', 'RUNNING', 'TRIAL_START', 'AWAIT_RESPONSE', 'COMPLETE', 'ABORTED'];
const VALID_TRANSITIONS = {
  'INIT': ['RUNNING'],
  'RUNNING': ['TRIAL_START', 'ABORTED'],
  'TRIAL_START': ['AWAIT_RESPONSE'],
  'AWAIT_RESPONSE': ['TRIAL_START', 'COMPLETE'],
  'COMPLETE': [],
  'ABORTED': []
};

class StateManager {
  constructor() {
    this.sessions = new Map();
    this.captures = new Map();
    this.stateTransitions = new Map();
  }

  isValidTransition(fromState, toState) {
    return VALID_TRANSITIONS[fromState]?.includes(toState);
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
        status: 'INIT'
      }
    };

    this.sessions.set(sessionId, session);
    this.stateTransitions.set(sessionId, []);
    return session;
  }

  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastActivity = Date.now();
    return session;
  }

  getFullStateVector(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      experimentState: session.state,
      captureState: this.captures.get(sessionId),
      responseState: session.state.responses,
      lastUpdate: Date.now(),
      metadata: {
        trialNumber: session.state.currentTrial,
        digitIndex: session.state.currentDigit
      }
    };
  }

  updateSessionState(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (updates.phase === 'trial-start') {
      session.state.currentTrial++;
      session.state.currentDigit = 0;
    }

    session.state = {
      ...session.state,
      ...updates,
      lastActivity: Date.now()
    };

    console.log('State update:', {
      sessionId,
      currentTrial: session.state.currentTrial,
      phase: session.state.phase
    });

    return session;
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

  getStateTransitions(sessionId) {
    return this.stateTransitions.get(sessionId) || [];
  }

  endSession(sessionId) {
    this.sessions.delete(sessionId);
    this.captures.delete(sessionId);
    this.stateTransitions.delete(sessionId);
    return true;
  }
}

module.exports = new StateManager();