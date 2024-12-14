const { generateTrialNumbers } = require('../utils/markovChain');
const MediaHandler = require('../services/mediaHandler');
const stateManager = require('../services/stateManager');
const { createAndDownloadZip } = require('../utils/zipCreator');
const config = require('../config');

const mediaHandler = new MediaHandler();


// Session Management Controllers
const startSession = async (req, res) => {
  try {
    const experimentId = Date.now().toString();
    const trials = await generateTrialNumbers(config.experimentConfig);

    console.log('Starting session:', {
      experimentId,
      trialCount: trials.length
    });

    const session = await stateManager.createSession(experimentId, {
      type: 'nst',
      trials,
      config: config.experimentConfig
    });
    
    console.log('Session created:', {
      id: experimentId,
      stored: await stateManager.getSessionState(experimentId)
    });

    await stateManager.createSession(experimentId, {
      type: 'nst',
      trials,
      config: config.experimentConfig
    });

    const initialState = {
      currentDigit: trials[0].number[0],
      trials,
      experimentId,
      sequence: trials[0].number
    };
    res.json(initialState);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getExperimentState = async (req, res) => {
  try {
    const { experimentId, type } = req.query;
    console.log(`Getting ${type} state for experiment: ${experimentId}`);
    const state = await stateManager.getSessionState(experimentId);
    res.json({ state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTrialState = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const session = await stateManager.getSessionState(experimentId);
    const currentTrial = session.state.trials[session.state.currentTrial];
    
    res.json({
      currentDigit: currentTrial.sequence[session.state.currentDigit],
      trialState: {
        position: session.state.currentDigit,
        trialNumber: session.state.currentTrial,
        isLastDigit: session.state.currentDigit >= currentTrial.sequence.length - 1,
        totalDigits: currentTrial.sequence.length,
        effortLevel: currentTrial.effortLevel
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getProgress = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const session = await stateManager.getSessionState(experimentId);
    
    res.json({
      completedTrials: session.state.currentTrial,
      totalTrials: session.state.trials.length,
      currentLevel: session.state.trials[session.state.currentTrial].effortLevel
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResults = async (req, res) => {
  try {
    const session = await stateManager.getSessionState(req.params.sessionId);
    res.json({
      trials: session.state.trials,
      responses: session.state.responses,
      metadata: {
        startTime: session.startTime,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pauseSession = async (req, res) => {
  try {
    const session = await stateManager.getSessionState(req.params.sessionId);
    session.state.status = 'PAUSED';
    session.lastActivity = Date.now();
    res.json({ status: 'PAUSED', pauseTime: session.lastActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resumeSession = async (req, res) => {
  try {
    const session = await stateManager.getSessionState(req.params.sessionId);
    session.state.status = 'RUNNING';
    session.lastActivity = Date.now();
    res.json({ status: 'RUNNING', resumeTime: session.lastActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const abortSession = async (req, res) => {
  try {
    const session = await stateManager.getSessionState(req.params.sessionId);
    session.state.status = 'ABORTED';
    session.lastActivity = Date.now();
    res.json({ status: 'ABORTED', endTime: session.lastActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// State Management Controllers
const getSessionStatus = async (req, res) => {
  try {
    const status = await stateManager.getSessionState(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestStateTransition = async (req, res) => {
  try {
    const newState = await stateManager.transitionState(req.params.id, req.body.targetState);
    res.json(newState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Error Handling Controllers
const reportError = async (req, res) => {
  try {
    const session = await stateManager.getSessionState(req.params.id);
    session.state.errors = session.state.errors || [];
    session.state.errors.push({
      error: req.body.error,
      timestamp: Date.now()
    });
    res.json({ status: 'error_logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecoveryInstructions = async (req, res) => {
  try {
    const session = await stateManager.getSessionState(req.params.id);
    res.json({
      instructions: 'Resume from last valid state',
      lastValidState: session.state.currentTrial
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trial Management Controllers
const createTrial = async (req, res) => {
  try {
    const trial = await generateTrialNumbers(config.experimentConfig);
    res.json(trial[0]); // Return single trial
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNextDigit = async (req, res) => {
  try {
    const { experimentId } = req.query;
    if (!experimentId) {
      return res.status(400).json({ error: 'experimentId required' });
    }
    const session = await stateManager.getSessionState(experimentId);
    const currentTrial = session.state.trials[session.state.currentTrial];
    
    res.json({
      digit: currentTrial.sequence[session.state.currentDigit],
      metadata: {
        effortLevel: currentTrial.effortLevel,
        sequence: currentTrial.sequence
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitResponse = async (req, res) => {
  try {
    const { experimentId, response, isCorrect, digit } = req.body;
    const session = await stateManager.getSessionState(experimentId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Just store the response
    await stateManager.recordResponse(experimentId, {
      response,
      isCorrect,
      digit,
      timestamp: Date.now()
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Response storage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Capture Control Controllers
const submitCapture = async (req, res) => {
  try {
    const { experimentId, trialNumber, captureData } = req.body;
    // Save to filesystem via MediaHandler
    const fileResult = await mediaHandler.saveTrialCapture(
      experimentId,
      trialNumber, 
      captureData
    );
    // Update state via StateManager
    await stateManager.addCapture(experimentId, {
      ...fileResult,
      trialNumber
    });
    res.json({
      success: true,
      filepath: fileResult.filepath,
      metadata: fileResult.metadata
    });
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getCaptureConfig = async (req, res) => {
  try {
    res.json({
      enabled: true,
      frequency: config.experimentConfig.captureFrequency || 1,
      quality: 'high'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Configuration Controllers
const getNSTConfig = async (req, res) => {
  try {
    res.json(config.experimentConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateNSTConfig = async (req, res) => {
  try {
    Object.assign(config.experimentConfig, req.body);
    res.json(config.experimentConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const exportSessionData = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stateManager.getSessionState(sessionId);
    const zipFileName = await createAndDownloadZip({
      trials: session.state.trials,
      responses: session.state.responses,
      captures: session.state.captures || []
    });
    res.json({
      exportData: zipFileName,
      metadata: {
        timestamp: Date.now(),
        format: 'zip',
        sessionId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSessionCaptures = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const state = await stateManager.getSessionState(sessionId);
    res.json({
      captures: state.capture.captures,
      metadata: {
        sessionId,
        timestamp: Date.now(),
        count: state.capture.captures.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const validateExportData = async (req, res) => {
  try {
    const validation = await mediaHandler.validateCapture(req.body);
    res.json({
      isValid: validation.isValid,
      errors: [],
      metadata: {
        size: validation.size,
        timestamp: Date.now(),
        format: req.body.format || 'zip'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  startSession,
  getExperimentState,
  getTrialState,
  getProgress,
  getResults,
  pauseSession,
  resumeSession,
  abortSession,
  getSessionStatus,
  requestStateTransition,
  reportError,
  getRecoveryInstructions,
  createTrial,
  getNextDigit,
  submitResponse,
  submitCapture,
  getCaptureConfig,
  getNSTConfig,
  exportSessionData,
  getSessionCaptures,
  validateExportData,
  updateNSTConfig
};