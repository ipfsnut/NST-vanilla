const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { generateTrialNumbers } = require('../utils/markovChain');
const config = require('../experimentConfig');
const ExperimentSession = require('../models/ExperimentSession');

class NSTService {
  constructor() {
    this.experiments = new Map();
    this.state = {
      experimentId: null,
      currentTrial: 0,
      currentDigit: null,
      responses: [],
      captureSettings: {
        enabled: true,
        interval: 'perTrial'
      }
    };
  }

  async startExperiment(experimentType, experimentId) {
    console.log('Starting experiment:', experimentId);
    this.state.experimentId = experimentId;
    this.trials = await generateTrialNumbers(config);
    
    const experimentData = {
      trials: this.trials.map(trial => ({
        ...trial,
        digit: trial.number // Convert for consistency
      })),
      state: { 
        currentTrial: 0,
        responses: [],
        experimentId 
      },
      startTime: Date.now()
    };
    
    this.experiments.set(experimentId, experimentData);
    return experimentData;
  }

  async getNextDigit(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');
    
    const trial = experiment.trials[experiment.state.currentTrial];
    if (!trial) {
      return {
        digit: null,
        isLastDigit: true,
        trialNumber: experiment.state.currentTrial,
        metadata: {
          effortLevel: null,
          digitPosition: null,
          isComplete: true
        }
      };
    }
    
    // Get current digit from the trial's digit string
    const currentDigit = trial.digit.toString()[experiment.state.currentDigit || 0];
    
    // Increment digit position
    experiment.state.currentDigit = (experiment.state.currentDigit || 0) + 1;
    
    return {
      digit: currentDigit,
      isLastDigit: experiment.state.currentDigit >= trial.digit.toString().length,
      trialNumber: experiment.state.currentTrial,
      metadata: {
        effortLevel: trial.effortLevel,
        digitPosition: experiment.state.currentDigit - 1
      }
    };
  }  
  async getExperimentState(experimentId) {
    // Try memory first, then fallback to database
    let experiment = this.experiments.get(experimentId);
    if (!experiment) {
      experiment = await ExperimentSession.findOne({ experimentId });
      if (!experiment) throw new Error('Experiment not found');
      this.experiments.set(experimentId, experiment);
    }
    
    return {
      experimentId,
      currentTrial: experiment.state.currentTrial,
      totalTrials: experiment.trials.length,
      status: this.getStatus(experimentId),
      config: this.config
    };
  }

  async processResponse(experimentId, response) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');
  
    const trial = experiment.trials[experiment.state.currentTrial];
    if (!trial) return { isComplete: true };
  
    const isCorrect = this.validateResponse(trial.digit, response);
  
    experiment.state.responses.push({
      trial: experiment.state.currentTrial,
      digit: trial.digit,
      response,
      isCorrect,
      timestamp: Date.now()
    });

    // Check if we should advance to next trial
    const isLastDigit = experiment.state.currentDigit >= trial.digit.toString().length;
    if (isLastDigit) {
      if (experiment.state.currentTrial < experiment.trials.length - 1) {
        experiment.state.currentTrial++;
        experiment.state.currentDigit = 0;
      }
    }

    return { 
      isCorrect, 
      trialComplete: isLastDigit,
      isLastTrial: experiment.state.currentTrial >= experiment.trials.length - 1
    };
  }
  async getProgress() {
    return {
      currentTrial: this.state.currentTrial,
      totalTrials: this.trials.length,
      completedResponses: this.state.responses.length
    };
  }

  async processCapture(imageData, metadata) {
    logger.info('Processing capture for trial:', this.state.currentTrial);
    return {
      stored: true,
      trial: this.state.currentTrial,
      timestamp: Date.now()
    };
  }

  async getCaptureConfig() {
    return {
      ...this.state.captureSettings,
      shouldCapture: this.shouldCaptureImage(),
      currentTrial: this.state.currentTrial
    };
  }

  async getExperimentState() {
    return {
      currentTrial: this.state.currentTrial,
      totalTrials: this.trials.length,
      status: this.getStatus(),
      config: this.config
    };
  }

  async getTrialState() {
    return {
      currentTrial: this.state.currentTrial,
      currentDigit: this.state.currentDigit,
      requiresCapture: this.shouldCaptureImage()
    };
  }

  async getConfig() {
    return this.config;
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Updated NST config:', this.config);
    return this.config;
  }

  shouldCaptureImage() {
    if (!this.state.captureSettings.enabled) return false;
    return this.state.captureSettings.interval === 'perTrial';
  }

  validateResponse(digit, response) {
    const isOdd = digit % 2 !== 0;
    return (isOdd && response === 'odd') || (!isOdd && response === 'even');
  }

  getStatus() {
    if (this.state.currentTrial >= this.trials.length) return 'complete';
    return 'active';
  }
}

module.exports = NSTService;