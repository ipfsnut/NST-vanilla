const path = require('path');
const { generateTrialNumbers } = require('../utils/markovChain');
const MediaHandler = require('../services/mediaHandler');
const mediaHandler = new MediaHandler(path.join(process.cwd(), 'uploads'));
const stateManager = require('../services/stateManager');
const { createAndDownloadZip } = require('../utils/zipCreator');
const config = require('../config');
const ResultsAggregator = require('../utils/resultsAggregator');
const resultsAggregator = new ResultsAggregator(stateManager);

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
      trials,
      captureConfig: config.experimentConfig.captureConfig
    };

    console.log('Sending initial state to frontend:', {
      currentDigit: initialState.trialState.currentDigit,
      trialNumber: initialState.trialState.trialNumber
    });

    console.log('CAPTURE CONFIG DEBUG - Sending to frontend:', JSON.stringify(config.experimentConfig.captureConfig));

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
const ResponsePipeline = require('../services/ResponsePipeline');
const responsePipeline = new ResponsePipeline(stateManager, mediaHandler);
const submitResponse = async (req, res) => {
  try {
    const { experimentId, responses } = req.body;
    const session = await stateManager.getSessionState(experimentId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await stateManager.updateSessionState(experimentId, { status: 'AWAIT_RESPONSE' });
    
    const processedResponses = responses.map(response => ({
      ...response,
      timestamp: response.timestamp || Date.now(),
      positionKey: `${response.trialNumber}-${response.position}`
    }));

    // Record each response in its unique position
    for (const response of processedResponses) {
      await stateManager.recordResponse(experimentId, response);
    }

    res.json({ 
      success: true,
      processed: processedResponses.length
    });
  } catch (error) {
    console.error('Response storage error:', error);
    res.status(500).json({ error: error.message });
  }
};
const CAPTURE_SETTINGS = {
  width: 640,
  height: 480,
  imageType: 'image/jpeg',
  quality: 0.8
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
    const { experimentId, captureData, timestamp, trialNumber, digitIndex } = req.body;
    
    console.log('Capture request received:', {
      experimentId,
      timestamp,
      trialNumber,
      digitIndex,
      dataSize: captureData?.length
    });

    // Get the session state
    const session = await stateManager.getSessionState(experimentId);
    
    // Use the trialNumber from the request to get the right trial object
    // This ensures we're getting the correct trial's effort level
    const requestedTrialIndex = parseInt(trialNumber); 
    const trialObj = session.state.trials[requestedTrialIndex];
    
    console.log('Trial lookup for capture:', {
      requestedTrialIndex,
      currentSessionTrialIndex: session.state.currentTrial,
      trialObjExists: !!trialObj,
      effortLevel: trialObj?.effortLevel
    });
    
    // Get the effort level from the specific trial, not just the "currentTrial"
    const effortLevel = trialObj?.effortLevel || 0;

    const fileResult = await mediaHandler.saveTrialCapture(
      experimentId,
      captureData,
      {
        timestamp,
        trialNumber: requestedTrialIndex,
        digitIndex,
        effortLevel: effortLevel,
        width: CAPTURE_SETTINGS.width,
        height: CAPTURE_SETTINGS.height,
        quality: CAPTURE_SETTINGS.quality,
        imageType: CAPTURE_SETTINGS.imageType
      }
    );

    console.log('File save result:', {
      filename: fileResult.filename,
      filepath: fileResult.filepath
    });

    const captureRecord = await stateManager.addCapture(experimentId, {
      ...fileResult,
      timestamp,
      settings: CAPTURE_SETTINGS,
      effortLevel: effortLevel  // Add effort level explicitly to record
    });

    console.log('Capture record created:', captureRecord);

    res.json({
      success: true,
      filepath: fileResult.filepath,
      metadata: {
        ...fileResult.metadata,
        effortLevel: effortLevel  // Make sure effort level is in response metadata
      }
    });
  } catch (error) {
    console.error('Capture error details:', {
      error: error.message,
      stack: error.stack,
      experimentId: req.body.experimentId
    });
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
const { convertToCSV } = require('../utils/exportFormatters');
const exportSessionData = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stateManager.getSessionState(sessionId);
    const captures = await stateManager.getSessionCaptures(sessionId);

    // Format trial and response data for CSV
    const trialData = session.state.trials.map((trial, trialIndex) => {
      const trialResponses = Object.values(session.state.responsesByPosition)
        .filter(r => r.trialNumber === trialIndex)
        .sort((a, b) => a.position - b.position);
      
      // Add effortLevel to each response
      const enhancedResponses = trialResponses.map(response => ({
        ...response,
        effortLevel: trial.effortLevel // Include the effort level from the trial
      }));
      
      return {
        trialNumber: trialIndex + 1,
        sequence: trial.number,
        effortLevel: trial.effortLevel, // Include effort level at trial level
        responses: enhancedResponses
      };
    });

    console.log(`Exporting data with effort levels: ${JSON.stringify(trialData[0]?.effortLevel)}`);

    const csvData = convertToCSV(trialData);
    const jsonData = JSON.stringify(trialData, null, 2);

    const zipFileName = await createAndDownloadZip({
      'data.csv': csvData,
      'data.json': jsonData,
      captures: captures
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=nst-session-${sessionId}.zip`);
    res.sendFile(zipFileName);
  } catch (error) {
    console.error('Export error:', error);
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

const exportFormatters = require('../utils/exportFormatters');
const exportResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stateManager.getSessionState(sessionId);
    
    const formattedData = exportFormatters.formatCSV({
      trials: session.state.trials.map((trial, index) => ({
        trialNumber: index + 1,
        sequence: trial.number,
        effortLevel: trial.effortLevel, // Include effort level here
        responses: session.state.responses.filter(r => r.trialNumber === index + 1).map(response => ({
          digit: response.digit,
          keyPressed: response.key,
          isCorrect: response.isCorrect,
          timestamp: response.timestamp,
          responseTime: response.timing,
          effortLevel: trial.effortLevel // Add effort level to each response
        }))
      }))
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=nst-results-${sessionId}.csv`);
    res.send(formattedData);
  } catch (error) {
    console.error('Export error:', error);
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
  getRecoveryInstructions,
  exportResults
};


