const { generateMarkovNumber } = require('../../utils/markovChain');
const experimentConfig = require('../../config');

const generateTrialNumbers = (config) => {
  if (!config.numTrials || !config.effortLevels) {
    throw new Error('Invalid configuration for trial generation');
  }

  const trialNumbers = [];
  const effortLevels = config.effortLevels;

  for (let i = 0; i < config.numTrials; i++) {
    const level = effortLevels[i % effortLevels.length];
    const trial = generateMarkovNumber(level, config);
    if (!trial.number) {
      throw new Error('Invalid trial number generated');
    }
    trial.digits = trial.number.toString().split('');
    trial.currentDigitIndex = 0;
    trialNumbers.push(trial);
  }

  // Fisher-Yates shuffle
  for (let i = trialNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trialNumbers[i], trialNumbers[j]] = [trialNumbers[j], trialNumbers[i]];
  }

  return trialNumbers;
};

const generateNSTTrials = (numTrials, effortLevel) => {
  if (!numTrials || !effortLevel) {
    throw new Error('Missing required parameters for trial generation');
  }

  const config = {
    ...experimentConfig,
    numTrials,
    effortLevel
  };
  return generateTrialNumbers(config);
};

const getCurrentDigit = (trial) => {
  if (!trial || !trial.digits || trial.currentDigitIndex === undefined) {
    throw new Error('Invalid trial data');
  }
  if (trial.currentDigitIndex >= trial.digits.length) {
    return null;
  }
  return parseInt(trial.digits[trial.currentDigitIndex]);
};

const handleNSTResponse = (response, currentTrial) => {
  if (!response || !currentTrial) {
    throw new Error('Missing response or trial data');
  }

  const currentDigit = getCurrentDigit(currentTrial);
  if (currentDigit === null) {
    throw new Error('Trial completed');
  }

  const isCorrect = (currentDigit % 2 === 0 && response === 'j') ||
                   (currentDigit % 2 !== 0 && response === 'f');

  return {
    digit: currentDigit,
    response,
    responseTime: Date.now() - currentTrial.startTime,
    isCorrect,
    trialIndex: currentTrial.currentDigitIndex
  };
};

const isNSTComplete = (currentTrialIndex, totalTrials) => {
  return currentTrialIndex >= totalTrials - 1;
};

const getNextNSTState = (currentState, action) => {
  const validStates = ['INITIALIZING', 'SHOWING_DIGIT', 'INTER_TRIAL_DELAY'];
  if (!validStates.includes(currentState)) {
    throw new Error('Invalid state');
  }

  switch (currentState) {
    case 'INITIALIZING':
      return 'SHOWING_DIGIT';
    case 'SHOWING_DIGIT':
      return action === 'RESPONSE_RECEIVED' ? 'INTER_TRIAL_DELAY' : currentState;
    case 'INTER_TRIAL_DELAY':
      return 'SHOWING_DIGIT';
    default:
      return currentState;
  }
};

module.exports = {
  generateNSTTrials,
  handleNSTResponse,
  isNSTComplete,
  getNextNSTState,
  getCurrentDigit
};