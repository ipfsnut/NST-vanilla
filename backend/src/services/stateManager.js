const VALID_STATES = [
  'INIT',
  'RUNNING',
  'PRESENTING_DIGIT',
  'AWAIT_RESPONSE',
  'DIGIT_BREAK',
  'TRIAL_BREAK',
  'COMPLETE',
  'ABORTED'
];

const VALID_TRANSITIONS = {
  'INIT': ['RUNNING'],
  'RUNNING': ['PRESENTING_DIGIT', 'COMPLETE', 'ABORTED'],
  'PRESENTING_DIGIT': ['AWAIT_RESPONSE'],
  'AWAIT_RESPONSE': ['DIGIT_BREAK', 'TRIAL_BREAK'],
  'DIGIT_BREAK': ['PRESENTING_DIGIT'],
  'TRIAL_BREAK': ['PRESENTING_DIGIT'],
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
        digitIndex: 0,
        trials: experimentConfig.trials,
        responses: [],
        status: 'INIT',
        breakState: {
          startTime: null,
          duration: null,
          type: null
        }
      }
    };
    this.sessions.set(sessionId, session);
    this.stateTransitions.set(sessionId, []);
    return session;
  }  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastActivity = Date.now();
    return session;
  }

  getFullStateVector(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      experimentState: {
        ...session.state,
      },
      captureState: this.captures.get(sessionId),
      responseState: session.state.responses,
      lastUpdate: Date.now(),
      metadata: {
        trialNumber: session.state.currentTrial,
        digitIndex: session.state.digitIndex
      }
    };
  }

  updateSessionState(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (updates.status) {
      // Log transition for debugging
      console.log(`State transition: ${session.state.status} -> ${updates.status}`);
      
      // Record transition in stateTransitions Map
      const transitions = this.stateTransitions.get(sessionId) || [];
      transitions.push({
        from: session.state.status,
        to: updates.status,
        timestamp: Date.now()
      });
      this.stateTransitions.set(sessionId, transitions);

      // Validate transition
      if (!this.isValidTransition(session.state.status, updates.status)) {
        throw new Error(`Invalid state transition: ${session.state.status} -> ${updates.status}`);
      }

      // Handle break state cleanup when transitioning to PRESENTING_DIGIT
      if (updates.status === 'PRESENTING_DIGIT' && session.state.breakState?.type) {
        if (!this.isBreakComplete(sessionId)) {
          return session;
        }
        session.state.breakState = null;
      }
    }

    session.state = {
      ...session.state,
      ...updates,
      lastActivity: Date.now()
    };

    return session;
  }
  startBreak(sessionId, breakType, duration) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.state.status = breakType;
    session.state.breakState = {
      startTime: Date.now(),
      duration: duration,
      type: breakType
    };
  
    return session;
  }  
  isBreakComplete(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session?.state.breakState?.startTime) return true;
  
    const elapsed = Date.now() - session.state.breakState.startTime;
    return elapsed >= session.state.breakState.duration;
  }
  completeTrialSequence(sessionId) {
    const session = this.sessions.get(sessionId);
    return {
      status: 'COMPLETE',
      finalState: session.state,
      completionTime: Date.now(),
      metrics: {
        totalResponses: session.state.responses.length,
        trialsCompleted: session.state.currentTrial
      }
    };
  }  


  
recordResponse(sessionId, responseData) {
  try {
      const session = this.sessions.get(sessionId);
      if (!session) return null;

      if (!session.state.responsesByPosition) {
          session.state.responsesByPosition = {};
      }

      const positionKey = responseData.positionKey;
      session.state.responsesByPosition[positionKey] = responseData;
      session.state.responses.push(responseData);

      return session.state;
  } catch (error) {
      console.error('State manager error:', error);
      throw new Error('Failed to record response');
  }
}

  getSessionResponses(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      byPosition: session.state.responsesByPosition || {},
      ordered: session.state.responses || [],
      total: session.state.responses?.length || 0
    };

  }  

  async addCapture(sessionId, captureData) {
    const captures = this.captures.get(sessionId) || [];
    const newCapture = {
      timestamp: captureData.metadata.timestamp,
      filename: captureData.filename,
      filepath: captureData.filepath,
      settings: captureData.metadata.settings,
      experimentId: captureData.metadata.experimentId
    };
    
    captures.push(newCapture);
    this.captures.set(sessionId, captures);
    
    console.log('Capture stored:', {
      sessionId,
      captureCount: captures.length,
      latestCapture: newCapture
    });

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

