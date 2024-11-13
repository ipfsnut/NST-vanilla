const platformService = require('../services/experimentService');
const experimentConfig = require('../../config');
const { generateMarkovNumber } = require('../../utils/markovChain');
const archiver = require('archiver');
const { MediaHandler } = require('../../services/mediaHandler');


const createTrial = async (req, res) => {
  try {
    const sessionId = Date.now().toString();
    const session = await platformService.startExperiment('nst', sessionId, {
      effortLevel: experimentConfig.EFFORT_LEVELS[1]
    });

    const { number } = generateMarkovNumber(1, experimentConfig);
    const initialTrial = {
      currentDigit: number[0],
      trials: generateTrialSequence(experimentConfig.numTrials),
      sessionId: session.id,
      sequence: number
    };

    res.json(initialTrial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateTrialSequence = (numTrials) => {
  return Array(numTrials).fill().map(() => ({
    number: generateMarkovNumber(1, experimentConfig).number,
    currentIndex: 0
  }));
};

const getNextDigit = async (req, res) => {
  try {
    const result = generateMarkovNumber(1, experimentConfig);
    console.log('Generated next digit:', result);
    res.json({
      digit: result.number[0],
      metadata: {
        effortLevel: result.effortLevel,
        sequence: result.number,
        ...result.metadata
      }
    });
  } catch (error) {
    console.error('Error generating next digit:', error);
    res.status(500).json({ error: error.message });
  }
};

const submitResponse = async (req, res) => {
  const { 
    experimentId, 
    sessionId, 
    trialNumber, 
    digit, 
    response, 
    timestamp, 
    metadata 
  } = req.body;

  try {
    // Record behavioral response
    const result = await platformService.recordResponse(experimentId, {
      sessionId,
      trialNumber,
      digit,
      response,
      timestamp,
      metadata
    });

    // Handle capture if present
    if (req.files?.capture) {
      const captureResult = await mediaHandler.saveCapture(
        sessionId,
        trialNumber,
        metadata.digitIndex,
        req.files.capture
      );
      result.captureData = captureResult;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getProgress = async (req, res) => {
  const { experimentId } = req.params;
  try {
    const progress = await platformService.getProgress(experimentId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitCapture = async (req, res) => {
  const { imageData, captureData } = req.body;
  try {
    const mediaHandler = new MediaHandler();
    const result = await mediaHandler.saveCapture(
      req.params.sessionId || Date.now().toString(),
      captureData.trialNumber || 1,
      captureData.digitNumber || 1,
      imageData
    );

    res.json({
      success: true,
      filepath: result.filepath,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getCaptureConfig = async (req, res) => {
  res.json({ enabled: true, frequency: 'per_trial' });
};

const getExperimentState = async (req, res) => {
  const { experimentId } = req.params;
  try {
    const state = await platformService.getSessionState(experimentId);
    res.json({ state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTrialState = async (req, res) => {
  const { experimentId } = req.params;
  try {
    const trial = await platformService.getCurrentTrial(experimentId);
    res.json(trial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNSTConfig = async (req, res) => {
  res.json(experimentConfig);
};

const updateNSTConfig = async (req, res) => {
  const newConfig = req.body;
  try {
    const updatedConfig = await platformService.updateConfig('nst', newConfig);
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const convertToCSV = (responses) => {
  const headers = ['trialNumber', 'digit', 'response', 'isCorrect', 'timestamp'];
  const rows = responses.map(r => 
    `${r.trialNumber},${r.digit},${r.response},${r.isCorrect},${r.timestamp}`
  );
  return [headers.join(','), ...rows].join('\n');
};

const exportSessionData = async (req, res) => {
  const { sessionId } = req.params;
  const mediaHandler = new MediaHandler();
  
  res.attachment(`nst-session-${sessionId}.zip`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  try {
    const captures = await mediaHandler.getSessionCaptures(sessionId);
    captures.forEach(capture => {
      archive.file(capture.path, { name: `images/${capture.filename}` });
    });

    const responses = await platformService.getSessionState(sessionId);
    const csvData = convertToCSV(responses);
    archive.append(csvData, { name: 'responses.csv' });

    archive.finalize();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTrial,
  getNextDigit,
  submitResponse,
  getProgress,
  submitCapture,
  getCaptureConfig,
  getExperimentState,
  getTrialState,
  getNSTConfig,
  updateNSTConfig,
  exportSessionData
};
