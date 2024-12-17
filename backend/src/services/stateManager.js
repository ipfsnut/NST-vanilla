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
        digitIndex: 0,
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
        digitIndex: session.state.digitIndex
      }
    };
  }
  updateSessionState(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Handle trial progression
    if (updates.phase === 'trial-start') {
      const currentTrial = session.state.trials[session.state.currentTrial];
      
      if (currentTrial?.number) {
        const sequenceLength = currentTrial.number.length;
        // Complete only after the last digit of trial 14
        if (session.state.currentTrial === session.state.trials.length - 1 && 
            session.state.digitIndex >= sequenceLength - 1) {
          return this.completeTrialSequence(sessionId);
        }
        
        if (session.state.digitIndex >= sequenceLength - 1) {
          session.state.currentTrial++;
          session.state.digitIndex = 0;
        } else {
          session.state.digitIndex++;
        }
      }
    }

    session.state = {
      ...session.state,
      ...updates,
      lastActivity: Date.now()
    };
    
    return session;
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
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Store response in position-keyed object
    if (!session.state.responsesByPosition) {
      session.state.responsesByPosition = {};
    }

    const positionKey = responseData.positionKey;
    if (!session.state.responsesByPosition[positionKey]) {
      session.state.responsesByPosition[positionKey] = responseData;
      session.state.responses.push(responseData);
    }

    console.log('Response recorded:', {
      sessionId,
      positionKey,
      totalResponses: session.state.responses.length
    });

    return session.state;
  }

  getSessionResponses(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      byPosition: session.state.responsesByPosition || {},
      ordered: session.state.responses || [],
      total: session.state.responses?.length || 0
    };
  }  async addCapture(sessionId, captureData) {
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