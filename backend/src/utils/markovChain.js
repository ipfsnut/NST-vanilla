/**
 * Constants and core functions for generating number sequences with controlled 
 * cognitive load through odd/even switching patterns
 * 
 * Each trial generates a 15-digit number where switches between odd/even digits
 * are controlled by effort level parameters from the config
 */
const DIGITS_PER_TRIAL = 15;

/**
 * Generates a single number sequence based on effort level parameters
 * @param {number} effortLevel - Current effort condition (1-7)
 * @param {object} config - Experiment configuration containing EFFORT_LEVELS
 * @returns {object} Generated number and its effort level
 */
const generateMarkovNumber = (effortLevel, config) => {
  const { min, max } = config.EFFORT_LEVELS[effortLevel];
  
  // Calculate target switches for this sequence
  const targetSwitches = Math.floor(Math.random() * (max - min + 1)) + min;

  let number = '';
  let isOdd = Math.random() < 0.5;
  let switches = 0;

  for (let i = 0; i < DIGITS_PER_TRIAL; i++) {
    // Determine if we should switch based on remaining switches needed
    if (switches < targetSwitches && i < DIGITS_PER_TRIAL - 1) {
      const switchProbability = (targetSwitches - switches) / (DIGITS_PER_TRIAL - i);
      if (Math.random() < switchProbability) {
        isOdd = !isOdd;
        switches++;
      }
    }
    // Generate appropriate odd/even digit
    const digit = isOdd ?
      (Math.floor(Math.random() * 5) * 2 + 1).toString() : // Odd digits: 1,3,5,7,9
      (Math.floor(Math.random() * 4) * 2 + 2).toString();  // Even digits: 2,4,6,8
    number += digit;
  }

  return { 
    number, 
    effortLevel,
    metadata: {
      targetSwitches,
      actualSwitches: switches
    }
  };
};

/**
 * Generates full set of trial numbers for an experiment session
 * @param {object} config - Full experiment configuration
 * @returns {array} Array of trial numbers with their effort levels
 */
const generateTrialNumbers = (config) => {

  const trialNumbers = config.trialConfig.flatMap(({ level, trials }) => {
    
    return Array(trials).fill().map(() => generateMarkovNumber(level, config));
  });

  for (let i = 0; i < config.numTrials; i++) {
    const level = effortLevels[i % effortLevels.length];
    trialNumbers.push(generateMarkovNumber(level, config));
  }


  // Fisher-Yates shuffle
  for (let i = trialNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trialNumbers[i], trialNumbers[j]] = [trialNumbers[j], trialNumbers[i]];
  }

  return trialNumbers;
};
module.exports = { 
  generateMarkovNumber,
  generateTrialNumbers 
};