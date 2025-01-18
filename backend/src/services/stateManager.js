const VALID_STATES = [
  'INIT', 
  'RUNNING', 
  'TRIAL_START', 
  'AWAIT_RESPONSE', 
  'BLOCK_COMPLETE',  // New state
  'BREAK',           // New state
  'COMPLETE', 
  'ABORTED'
];

const VALID_TRANSITIONS = {
  'INIT': ['RUNNING'],
  'RUNNING': ['TRIAL_START', 'ABORTED'],
  'TRIAL_START': ['AWAIT_RESPONSE'],
  'AWAIT_RESPONSE': ['TRIAL_START', 'BLOCK_COMPLETE'],
  'BLOCK_COMPLETE': ['BREAK', 'COMPLETE'],
  'BREAK': ['RUNNING'],
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
        currentBlock: 1,
        currentTrial: 0,
        digitIndex: 0,
        trials: experimentConfig.trials,
        responses: [],
        status: 'INIT'
      }
    };

    console.log('Session created with block tracking:', {
      sessionId,
      currentBlock: session.state.currentBlock,
      totalTrials: session.state.trials.length
    });

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
      experimentState: {
        ...session.state,
        blockMetrics: {
          currentBlock: session.state.currentBlock,
          trialsInBlock: this.getTrialsInCurrentBlock(session),
          blockStartTime: session.state.blockStartTime || session.startTime
        }
      },
      captureState: this.captures.get(sessionId),
      responseState: session.state.responses,
      lastUpdate: Date.now(),
      metadata: {
        trialNumber: session.state.currentTrial,
        digitIndex: session.state.digitIndex,
        blockNumber: session.state.currentBlock
      }
    };
  }

  updateSessionState(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Handle block transitions in block mode
    if (session.experimentConfig.mode === 'block') {
      if (updates.phase === 'trial-start') {
        const currentTrial = session.state.trials[session.state.currentTrial];
        const currentBlock = currentTrial?.blockNumber;
        
        // Check for block completion
        if (this.isBlockComplete(session)) {
          if (currentBlock < session.experimentConfig.blockConfig[session.experimentConfig.sequenceType].length) {
            return {
              status: 'BLOCK_COMPLETE',
              nextBlock: currentBlock + 1,
              breakDuration: session.experimentConfig.breakDuration
            };
          }
          return this.completeTrialSequence(sessionId);
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

  isBlockComplete(session) {
    if (!session?.state?.trials) return false;
    
    const currentTrial = session.state.trials[session.state.currentTrial];
    if (!currentTrial) return false;
    
    // Get all trials for current block
    const trialsInBlock = session.state.trials.filter(
        trial => trial.blockNumber === currentTrial.blockNumber
    );
    
    // Count completed trials by looking at unique trial numbers in responses
    const completedTrialNumbers = new Set(
        session.state.responses
            .filter(r => r.blockNumber === currentTrial.blockNumber)
            .map(r => Math.floor(r.positionKey.split('-')[0]))
    );

    console.log('Block completion check:', {
        blockNumber: currentTrial.blockNumber,
        trialsInBlock: trialsInBlock.length,
        completedTrials: completedTrialNumbers.size,
        uniqueTrials: Array.from(completedTrialNumbers)
    });
    
    return completedTrialNumbers.size >= trialsInBlock.length;
}


  getTrialsInCurrentBlock(session) {
    const currentTrial = session.state.trials[session.state.currentTrial];
    return session.state.trials.filter(
      trial => trial.blockNumber === currentTrial.blockNumber
    ).length;
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