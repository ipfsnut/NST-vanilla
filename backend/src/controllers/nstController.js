const NSTService = require('../services/nstService');
const { generateMarkovNumber } = require('../utils/markovChain');
const MediaHandler = require('../services/mediaHandler');
const stateManager = require('../services/stateManager');
const { createAndDownloadZip } = require('../utils/zipCreator');
const config = require('../config');

const nstService = new NSTService();
const mediaHandler = new MediaHandler();


// Session Management Controllers
const startSession = async (req, res) => {
  try {
    const experimentId = Date.now().toString();
    const session = await nstService.startExperiment('nst', experimentId);
    
    // Format experiment data for StateManager
    const experimentData = {
      type: 'nst',
      trials: session.trials,
      state: {
        currentDigit: session.trials[0].number[0],
        currentTrialIndex: 0
      }
    };
    
    await stateManager.createSession(experimentId, experimentData);
    
    const initialState = {
      currentDigit: session.trials[0].number[0],
      trials: session.trials,
      experimentId,
      sequence: session.trials[0].number,
      config: {
        INTER_TRIAL_DELAY: config.experimentConfig.INTER_TRIAL_DELAY,
        DIGITS_PER_TRIAL: 15,
        KEYS: config.experimentConfig.KEYS
      }
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
    console.log('Getting trial state for experiment:', experimentId);
    const trial = await nstService.getTrialState(experimentId);
    console.log('Trial state retrieved:', trial);
    res.json(trial);
  } catch (error) {
    console.error('Trial state error:', error);
    res.status(500).json({ error: error.message });
  }
};


const getProgress = async (req, res) => {
  try {
    const progress = await nstService.getProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResults = async (req, res) => {
  try {
    const results = await nstService.getSessionResults(req.params.sessionId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pauseSession = async (req, res) => {
  try {
    const status = await nstService.pauseSession(req.params.sessionId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resumeSession = async (req, res) => {
  try {
    const status = await nstService.resumeSession(req.params.sessionId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const abortSession = async (req, res) => {
  try {
    const status = await nstService.abortSession(req.params.sessionId);
    res.json(status);
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
    const errorStatus = await nstService.handleError(req.params.id, req.body.error);
    res.json(errorStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecoveryInstructions = async (req, res) => {
  try {
    const recovery = await nstService.getRecoveryPlan(req.params.id);
    res.json(recovery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trial Management Controllers
const createTrial = async (req, res) => {
  try {
    const trial = await nstService.createTrial();
    res.json(trial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNextDigit = async (req, res) => {
  try {
    const experimentId = req.query.experimentId;
    if (!experimentId) {
      return res.status(400).json({ error: 'experimentId required' });
    }
    const result = await nstService.getNextDigit(experimentId);
    res.json({
      digit: result.digit,
      metadata: {
        effortLevel: result.metadata.effortLevel,
        sequence: result.digit
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const submitResponse = async (req, res) => {
  try {
    const result = await nstService.processResponse(
      req.body.experimentId, 
      req.body.response
    );
    res.json(result);
  } catch (error) {
    console.error('Response processing error:', error);
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
    const config = await nstService.getCaptureConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Configuration Controllers
const getNSTConfig = async (req, res) => {
  try {
    const config = await nstService.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateNSTConfig = async (req, res) => {
  try {
    const updatedConfig = await nstService.updateConfig(req.body);
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function for trial sequence generation
const generateTrialSequence = (numTrials) => {
  return Array(numTrials).fill().map(() => ({
    number: generateMarkovNumber(1).number,
    currentIndex: 0
  }));
};

const exportSessionData = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await nstService.getSessionResults(sessionId);
    const zipFileName = await createAndDownloadZip(session);
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