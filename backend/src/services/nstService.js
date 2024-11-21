const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { generateTrialNumbers } = require('../utils/markovChain');
const config = require('../experimentConfig');

const ExperimentResponseSchema = new mongoose.Schema({
  experimentId: String,
  responses: Array,
  trials: Array,
  startTime: Date,
  endTime: Date
});

const ExperimentResponse = mongoose.model('ExperimentResponse', ExperimentResponseSchema);

class NSTService {
  constructor() {
    // Single source of truth - stores all experiment data
    this.experiments = new Map();
  }

  // Initializes new experiment with parsed trial data
  async startExperiment(experimentType, experimentId) {
    logger.info(`Starting experiment: ${experimentId}, type: ${experimentType}`);
    const trials = await generateTrialNumbers(config);
    logger.debug(`Generated ${trials.length} trials`);
    
    const experimentData = {
      trials: trials.map(trial => ({
        ...trial,
        digit: trial.number.toString(),
        sequence: trial.number.toString().split(''),
        effortLevel: trial.effortLevel
      })),
      state: {
        currentTrial: 0,
        currentDigit: 0,
        responses: []
      },
      startTime: Date.now()
    };

     // Create initial database record
    await ExperimentResponse.create({
      experimentId,
      trials: experimentData.trials,
      startTime: experimentData.startTime,
      responses: []
    });
    
    this.experiments.set(experimentId, experimentData);
    logger.info(`Experiment ${experimentId} initialized with ${trials.length} trials`);
    return experimentData;
  }

  // Validates odd/even responses with detailed metadata
  validateResponse(digit, response) {
    const numericDigit = parseInt(digit, 10);
    return {
      isCorrect: (numericDigit % 2 !== 0 && response === 'odd') ||
                 (numericDigit % 2 === 0 && response === 'even'),
      metadata: {
        providedDigit: numericDigit,
        expectedResponse: numericDigit % 2 !== 0 ? 'odd' : 'even',
        actualResponse: response
      }
    };
  }

  // Gets current trial state using pre-parsed sequence
  async getTrialState(experimentId) {
    logger.debug(`Getting trial state for experiment: ${experimentId}`);
    let experiment = this.experiments.get(experimentId);
    if (!experiment) {
        const savedExperiment = await ExperimentResponse.findOne({ experimentId });
        logger.debug('Database query result:', savedExperiment);
        if (!savedExperiment) throw new Error('Experiment not found');
        
        experiment = {
            trials: savedExperiment.trials,
            state: {
                currentTrial: savedExperiment.currentTrial || 0,
                currentDigit: savedExperiment.currentDigit || 0,
                responses: savedExperiment.responses || []
            },
            startTime: savedExperiment.startTime
        }; 
        logger.debug('Reconstructed experiment:', experiment);
        this.experiments.set(experimentId, experiment);
    }

    const currentTrial = experiment.trials[experiment.state.currentTrial];
    logger.debug('Current trial data:', currentTrial);
    const digitIndex = experiment.state.currentDigit;

    return {
        currentDigit: currentTrial.sequence[digitIndex],
        trialState: {
            position: digitIndex,
            trialNumber: experiment.state.currentTrial,
            isLastDigit: digitIndex >= currentTrial.sequence.length - 1,
            totalDigits: currentTrial.sequence.length,
            effortLevel: currentTrial.effortLevel
        }
    };
}
  // Advances through digit sequence or to next trial
  async advanceTrialState(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');
    
    const currentState = await this.getTrialState(experimentId);
    
    if (currentState.trialState.isLastDigit) {
      if (experiment.state.currentTrial < experiment.trials.length - 1) {
        experiment.state.currentTrial++;
        experiment.state.currentDigit = 0;
      }
    } else {
      experiment.state.currentDigit++;
    }
    
    return this.getTrialState(experimentId);
  }

  // Processes response and advances state
  async processResponse(experimentId, response) {
    logger.debug(`Processing response for experiment ${experimentId}: ${response}`);
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      logger.error(`Experiment not found: ${experimentId}`);
      throw new Error('Experiment not found');
    }
  
    const currentState = await this.getTrialState(experimentId);
    const validationResult = this.validateResponse(currentState.currentDigit, response);
  
    const responseData = {
      trial: experiment.state.currentTrial,
      digit: currentState.currentDigit,
      response,
      isCorrect: validationResult.isCorrect,
      timestamp: Date.now()
    };
    
      // Update both in-memory and database state
    experiment.state.responses.push(responseData);
    
    await ExperimentResponse.findOneAndUpdate(
      { experimentId },
      { 
        $push: { responses: responseData },
        $set: { 
          lastUpdated: Date.now(),
          currentTrial: experiment.state.currentTrial
        }
      }
    );

    const nextState = await this.advanceTrialState(experimentId);
    logger.debug(`Response processed, moving to next state`, nextState);
    
    return {
      isCorrect: validationResult.isCorrect,
      trialComplete: nextState.trialState.isLastDigit,
      isLastTrial: experiment.state.currentTrial >= experiment.trials.length - 1,
      nextState: {
        digit: nextState.currentDigit,
        trialNumber: experiment.state.currentTrial,
        digitIndex: experiment.state.currentDigit
      }
    };
  }

  // Simple status check for experiment completion
  getStatus(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return 'not_found';
    return experiment.state.currentTrial >= experiment.trials.length ? 'complete' : 'active';
  }
}

module.exports = NSTService;
