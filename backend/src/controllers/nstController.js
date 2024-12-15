const path = require('path');
const { generateTrialNumbers } = require('../utils/markovChain');
const MediaHandler = require('../services/mediaHandler');
const mediaHandler = new MediaHandler(path.join(process.cwd(), 'uploads'));
const stateManager = require('../services/stateManager');
const { createAndDownloadZip } = require('../utils/zipCreator');
const config = require('../config');

// Core Session Management
/**
 * @frontend ExperimentController initiates session
 * Creates new experiment session and returns initial state
 * Frontend needs: none (POST request only)
 * Frontend receives: experimentId, initial digit, trial metadata
 */
const startSession = async (req, res) => {
  try {
    const experimentId = Date.now().toString();
    const trials = await generateTrialNumbers(config.experimentConfig);
    
    console.log('Generated trials[0]:', {
      number: trials[0].number,
      firstDigit: trials[0].number[0],
      metadata: trials[0].metadata
    });

    const session = await stateManager.createSession(experimentId, {
      type: 'nst',
      trials,
      config: config.experimentConfig
    });
    
    console.log('Session created with initial trial state:', {
      currentTrial: session.state.currentTrial,
      currentDigit: session.state.currentDigit
    });

    await stateManager.updateSessionState(experimentId, { status: 'RUNNING' });
    
    // This structure maps directly to frontend experimentSlice initial state
    const initialState = {
      trialState: {
        currentDigit: trials[0].number[0],
        trialNumber: 1,
        digitIndex: 0,
        phase: 'start',
        metadata: {
          targetSwitches: trials[0].metadata.targetSwitches,
          actualSwitches: trials[0].metadata.actualSwitches,
          effortLevel: trials[0].effortLevel,
          sequence: trials[0].number
        }
      },
      experimentId,
      trials
    };

    console.log('Sending initial state to frontend:', {
      currentDigit: initialState.trialState.currentDigit,
      trialNumber: initialState.trialState.trialNumber
    });

    res.json(initialState);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
};
const abortSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await stateManager.updateSessionState(sessionId, { status: 'ABORTED' });
    res.json({ status: 'ABORTED', endTime: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// State Management
const getExperimentState = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const state = await stateManager.getSessionState(experimentId);
    res.json({ state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    const newState = await stateManager.updateSessionState(req.params.id, { 
      status: req.body.targetState 
    });
    res.json(newState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trial Management
/**
 * @frontend ExperimentController requests current trial state
 * Returns current digit and trial metadata for display
 * Frontend needs: experimentId (query param)
 * Frontend receives: currentDigit, trialNumber, phase, metadata
 */
const getTrialState = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const session = await stateManager.getSessionState(experimentId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const currentTrialIndex = session.state.currentTrial;
    const currentTrial = session.state.trials[currentTrialIndex];

    console.log('Trial state request:', {
      experimentId,
      currentTrialIndex,
      currentDigit: currentTrial?.number[session.state.digitIndex],
      digitIndex: session.state.digitIndex
    });
    
    if (currentTrialIndex >= session.state.trials.length) {
      return res.json({
        trialState: {
          phase: 'complete'
        }
      });
    }

    res.json({
      trialState: {
        currentDigit: currentTrial.number[session.state.digitIndex],
        trialNumber: currentTrialIndex + 1,
        digitIndex: session.state.digitIndex,
        phase: session.state.phase,
        metadata: {
          effortLevel: currentTrial.effortLevel,
          sequence: currentTrial.number,
          targetSwitches: currentTrial.metadata.targetSwitches,
          actualSwitches: currentTrial.metadata.actualSwitches
        }
      }
    });
  } catch (error) {
    console.error('Trial state error:', error);
    res.status(500).json({ error: error.message });
  }
};
const createTrial = async (req, res) => {
  try {
    const trial = await generateTrialNumbers(config.experimentConfig);
    await stateManager.updateSessionState(req.params.id, { status: 'TRIAL_START' });
    res.json(trial[0]);
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
    
    await stateManager.updateSessionState(experimentId, { status: 'TRIAL_START' });
    
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

// Response Handling
/**
 * @frontend CameraCapture submits image data
 * Stores captured images with trial metadata
 * Frontend needs: experimentId, trialNumber, base64 image data
 * Frontend receives: capture success status, filepath
 */
const submitResponse = async (req, res) => {
  try {
    const { experimentId, responses } = req.body;
    const session = await stateManager.getSessionState(experimentId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await stateManager.updateSessionState(experimentId, { status: 'AWAIT_RESPONSE' });
    
    const processedResponses = await Promise.all(
      responses.map(async response => {
        await stateManager.recordResponse(experimentId, {
          ...response,
          timestamp: response.timestamp || Date.now()
        });
        return response;
      })
    );

    res.json({ 
      success: true,
      processed: processedResponses.length
    });
  } catch (error) {
    console.error('Response storage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Media Handling
/**
 * @frontend ExperimentController checks progress
 * Returns experiment completion status and metrics
 * Frontend needs: experimentId (query param)
 * Frontend receives: currentTrial, totalTrials, percentComplete
 */
const submitCapture = async (req, res) => {
  try {
    const { experimentId, trialNumber, captureData } = req.body;
    const fileResult = await mediaHandler.saveTrialCapture(
      experimentId,
      trialNumber,
      captureData
    );
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

const getSessionCaptures = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const captures = await stateManager.getSessionCaptures(sessionId);
    res.json({
      captures,
      metadata: {
        sessionId,
        timestamp: Date.now(),
        count: captures.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Configuration
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

// Data Export
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

// Error Handling
const reportError = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await stateManager.getSessionState(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    await stateManager.updateSessionState(id, {
      lastError: {
        message: req.body.error,
        timestamp: Date.now()
      }
    });
    res.json({ status: 'error_logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResults = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const session = await stateManager.getSessionState(experimentId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.state.status !== 'COMPLETE') {
      return res.status(400).json({ error: 'Session not yet complete' });
    }

    const results = {
      trialData: session.state.trials,
      responses: session.state.responses,
      captures: session.state.captures || [],
      metrics: {
        totalTrials: session.state.trials.length,
        completedTrials: session.state.currentTrial,
        startTime: session.startTime,
        endTime: session.lastActivity
      }
    };

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecoveryInstructions = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await stateManager.getSessionState(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({
      instructions: 'Resume from last valid state',
      lastValidState: session.state.currentTrial
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @frontend ResultsView requests final data
 * Returns complete experiment data for analysis
 * Frontend needs: experimentId (query param)
 * Frontend receives: trials, responses, captures, metrics
 */
const getProgress = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const state = await stateManager.getSessionState(experimentId);
    
    if (!state) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const progress = {
      currentTrial: state.state.currentTrial,
      totalTrials: state.state.trials.length,
      status: state.state.status,
      percentComplete: Math.round((state.state.currentTrial / state.state.trials.length) * 100),
      lastActivity: state.lastActivity
    };

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  startSession,
  getExperimentState,
  getTrialState,
  getProgress,
  abortSession,
  getSessionStatus,
  requestStateTransition,
  createTrial,
  getNextDigit,
  submitResponse,
  submitCapture,
  getCaptureConfig,
  getNSTConfig,
  getResults,
  updateNSTConfig,
  exportSessionData,
  getSessionCaptures,
  validateExportData,
  reportError,
  getRecoveryInstructions
};