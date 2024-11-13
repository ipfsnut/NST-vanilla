const BaseExperiment = require('../../core/baseExperiment');
const logger = require('../utils/logger');
const { generateTrialNumbers } = require('../../utils/markovChain');



class NSTService extends BaseExperiment {
  constructor() {
    super();
    this.state = {
      currentTrial: 0,
      currentDigit: null,
      responses: [],
      captureSettings: {
        enabled: true,
        interval: 'perTrial'
      }
    };
  }

  async getNextDigit() {
    const trial = this.trials[this.state.currentTrial];
    if (!trial) throw new Error('No more trials available');
    this.state.currentDigit = trial.number;
    return trial.number;
  }

  async processResponse(response) {
    const trial = this.trials[this.state.currentTrial];
    const isCorrect = this.validateResponse(trial.number, response);
    
    this.state.responses.push({
      trial: this.state.currentTrial,
      digit: trial.number,
      response,
      isCorrect,
      timestamp: Date.now()
    });

    this.state.currentTrial++;
    return { isCorrect, trialComplete: true };
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

module.exports = new NSTService();