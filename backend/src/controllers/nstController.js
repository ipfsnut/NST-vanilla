const path = require('path');
const { generateTrialNumbers } = require('../utils/markovChain');
const MediaHandler = require('../services/mediaHandler');
const mediaHandler = new MediaHandler(path.join(process.cwd(), 'uploads'));
const stateManager = require('../services/stateManager');
const { createAndDownloadZip } = require('../utils/zipCreator');
const config = require('../config');
const ResultsAggregator = require('../utils/resultsAggregator');
const resultsAggregator = new ResultsAggregator(stateManager);

const startSession = async (req, res) => {
  try {
    const experimentId = Date.now().toString();
    const trials = await generateTrialNumbers(config.experimentConfig);
    
    const session = await stateManager.createSession(experimentId, {
      type: 'nst',
      trials,
      config: config.experimentConfig
    });

    // Update state sequence: INIT → RUNNING → PRESENTING_DIGIT
    await stateManager.updateSessionState(experimentId, { status: 'RUNNING' });
    await stateManager.updateSessionState(experimentId, { status: 'PRESENTING_DIGIT' });

    const initialState = {
      trialState: {
        currentDigit: trials[0].number[0],
        trialNumber: 1,
        digitIndex: 0,
        phase: 'PRESENTING_DIGIT',
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

    res.json(initialState);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
};

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
const getTrialState = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const session = await stateManager.getSessionState(experimentId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const currentTrialIndex = session.state.currentTrial;
    const currentTrial = session.state.trials[currentTrialIndex];
    
    if (currentTrialIndex >= session.state.trials.length) {
      return res.json({
        trialState: {
          phase: 'complete'
        }
      });
    }

    const trialState = {
      currentDigit: currentTrial.number[session.state.digitIndex],
      trialNumber: currentTrialIndex + 1,
      digitIndex: session.state.digitIndex,
      phase: session.state.phase,
      presentationStartTime: Date.now(),
      metadata: {
        effortLevel: currentTrial.effortLevel,
        sequence: currentTrial.number,
        targetSwitches: currentTrial.metadata.targetSwitches,
        actualSwitches: currentTrial.metadata.actualSwitches
      }
    };

    res.json({ trialState });
  } catch (error) {
    console.error('Trial state error:', error);
    res.status(500).json({ error: error.message });
  }
};
const submitResponse = async (req, res) => {
  try {
    const { experimentId, responses } = req.body;
    const session = await stateManager.getSessionState(experimentId);
    
    // Process responses first
    const processedResponses = responses.map(response => ({
      ...response,
      timestamp: response.timestamp || Date.now(),
      presentationTime: response.presentationTime,
      positionKey: `${response.trialNumber}-${response.position}`
    }));

    for (const response of processedResponses) {
      await stateManager.recordResponse(experimentId, response);
    }

    // Determine break type based on digit index
    const shouldTakeTrialBreak = session.state.digitIndex === 14;
    const breakType = shouldTakeTrialBreak ? 'TRIAL_BREAK' : 'DIGIT_BREAK';
    const breakDuration = shouldTakeTrialBreak ? 15000 : 500;
    
    // Update state: AWAIT_RESPONSE → BREAK
    await stateManager.updateSessionState(experimentId, { status: breakType });
    await stateManager.startBreak(experimentId, breakType, breakDuration);

    res.json({ 
      success: true, 
      processed: processedResponses.length,
      nextState: breakType,
      breakDuration,
      breakStartTime: Date.now()
    });
  } catch (error) {
    console.error('Response submission error:', error);
    res.status(500).json({ error: error.message });
  }
};const handleDigitBreak = async (req, res) => {
  try {
    const { experimentId } = req.body;
    const session = await stateManager.getSessionState(experimentId);
    
    // Ensure break is complete before transitioning
    if (stateManager.isBreakComplete(experimentId)) {
      await stateManager.updateSessionState(experimentId, { 
        status: 'PRESENTING_DIGIT',
        digitIndex: session.state.digitIndex + 1
      });

      res.json({
        status: 'PRESENTING_DIGIT',
        nextDigit: session.state.trials[session.state.currentTrial].number[session.state.digitIndex + 1]
      });
    } else {
      res.json({
        status: 'DIGIT_BREAK',
        remainingTime: session.state.breakState.duration - (Date.now() - session.state.breakState.startTime)
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const handleTrialBreak = async (req, res) => {
  try {
    const { experimentId } = req.body;
    const session = await stateManager.getSessionState(experimentId);
    
    if (stateManager.isBreakComplete(experimentId)) {
      await stateManager.updateSessionState(experimentId, { 
        status: 'PRESENTING_DIGIT',
        currentTrial: session.state.currentTrial + 1,
        digitIndex: 0
      });

      res.json({
        status: 'PRESENTING_DIGIT',
        nextTrial: session.state.currentTrial + 1,
        progress: {
          completed: session.state.currentTrial,
          total: session.state.trials.length
        }
      });
    } else {
      res.json({
        status: 'TRIAL_BREAK',
        remainingTime: session.state.breakState.duration - (Date.now() - session.state.breakState.startTime)
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};const checkBreakStatus = async (req, res) => {
  try {
    const { experimentId } = req.query;
    const session = await stateManager.getSessionState(experimentId);
    const isComplete = stateManager.isBreakComplete(experimentId);
    
    if (isComplete) {
      const nextState = session.state.breakState.type === 'DIGIT_BREAK' ? 
        'TRIAL_START' : 'RUNNING';
      
      await stateManager.updateSessionState(experimentId, { 
        status: nextState
      });
    }

    res.json({
      isComplete,
      remainingTime: isComplete ? 0 : 
        (session.state.breakState.duration - (Date.now() - session.state.breakState.startTime))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const CAPTURE_SETTINGS = {
  width: 640,
  height: 480,
  quality: 0.8,
  imageType: 'image/jpeg'
};

const submitCapture = async (req, res) => {
  try {
    const { experimentId, captureData, timestamp, trialNumber, digitIndex } = req.body;
    
    const fileResult = await mediaHandler.saveTrialCapture(
      experimentId,
      captureData,
      {
        timestamp,
        trialNumber,
        digitIndex,
        width: CAPTURE_SETTINGS.width,
        height: CAPTURE_SETTINGS.height,
        quality: CAPTURE_SETTINGS.quality,
        imageType: CAPTURE_SETTINGS.imageType,
        settings: CAPTURE_SETTINGS
      }
    );

    const captureRecord = await stateManager.addCapture(experimentId, {
      ...fileResult,
      timestamp,
      settings: CAPTURE_SETTINGS
    });

    res.json({
      success: true,
      filepath: fileResult.filepath,
      metadata: fileResult.metadata
    });
  } catch (error) {
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
      
      return {
        trialNumber: trialIndex + 1,
        sequence: trial.number,
        responses: trialResponses
      };
    });

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

const convertToCSV = (data) => {
  const headers = [
    'trialNumber',
    'sequence',
    'responseDigit',
    'keyPressed',
    'isCorrect',
    'responseTime',
    'presentationTime',
    'timestamp'
  ];

  const rows = data.flatMap(trial => 
    trial.responses.map(response => ({
      trialNumber: trial.trialNumber,
      sequence: trial.sequence.join(''),
      responseDigit: response.digit,
      keyPressed: response.key,
      isCorrect: response.isCorrect,
      responseTime: response.timing,
      presentationTime: response.presentationTime,
      timestamp: response.timestamp
    }))
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');

  return csvContent;
};


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

// Configuration Methods
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

// Trial Management
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
    const session = await stateManager.getSessionState(experimentId);
    const currentTrial = session.state.trials[session.state.currentTrial];
    
    res.json({
      digit: currentTrial.number[session.state.digitIndex],
      metadata: {
        effortLevel: currentTrial.effortLevel,
        sequence: currentTrial.number
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

// Core Session Management
const abortSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await stateManager.updateSessionState(sessionId, { status: 'ABORTED' });
    res.json({ status: 'ABORTED', endTime: Date.now() });
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

const exportResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stateManager.getSessionState(sessionId);
    
    const formattedData = exportFormatters.formatCSV({
      trials: session.state.trials.map((trial, index) => ({
        trialNumber: index + 1,
        sequence: trial.number,
        responses: session.state.responses
          .filter(r => r.trialNumber === index + 1)
          .map(response => ({
            digit: response.digit,
            keyPressed: response.key,
            isCorrect: response.isCorrect,
            timestamp: response.timestamp,
            responseTime: response.timing,
            presentationTime: response.presentationTime
          })),
        breaks: {
          digitBreaks: trial.digitBreakTimes || [],
          trialBreak: trial.trialBreakTime
        }
      }))
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=nst-results-${sessionId}.csv`);
    res.send(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // Core Session Management
  startSession,
  getExperimentState,
  getTrialState,
  getProgress,
  abortSession,
  getResults,
  getSessionCaptures,  // Added this
  
  // Break Handling
  handleDigitBreak,
  handleTrialBreak,
  checkBreakStatus,
  
  // Response & Capture
  submitResponse,
  submitCapture,
  
  // Configuration
  getNSTConfig,
  updateNSTConfig,
  getCaptureConfig,
  
  // Trial Management
  createTrial,
  getNextDigit,
  
  // State Management
  getSessionStatus,
  requestStateTransition,
  
  // Error Handling
  reportError,
  getRecoveryInstructions,
  
  // Export & Validation
  exportResults,
  validateExportData,
  exportSessionData  // Added this
};


