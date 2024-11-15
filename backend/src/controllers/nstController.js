const NSTService = require('../services/nstService');
const { generateMarkovNumber } = require('../utils/markovChain');
const { MediaHandler } = require('../services/mediaHandler');
const stateManager = require('../services/stateManager');
const archiver = require('archiver');

const nstService = new NSTService();

// Session Management Controllers
const config = require('../config');
const startSession = async (req, res) => {
  try {
    const experimentId = Date.now().toString();
    const session = await nstService.startExperiment('nst', experimentId);
    const initialState = {
      currentDigit: session.trials[0].number[0],
      trials: session.trials,
      experimentId,
      sequence: session.trials[0].number
    };
    res.json(initialState);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
};
const getExperimentState = async (req, res) => {
  try {
    const state = await nstService.getExperimentState();
    res.json({ state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTrialState = async (req, res) => {
  try {
    const trial = await nstService.getTrialState();
    res.json(trial);
  } catch (error) {
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
    const result = await mediaHandler.saveCapture(
      req.params.sessionId,
      req.body.trialNumber,
      req.body.digitNumber,
      req.body.imageData
    );
    res.json({
      success: true,
      filepath: result.filepath,
      metadata: result.metadata
    });
  } catch (error) {
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
  updateNSTConfig
};