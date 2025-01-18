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
  console.log('Generating trial numbers with config:', JSON.stringify(config, null, 2));
  
  if (config.mode === 'block') {
    const sequence = config.sequenceType;
    const blocks = config.blockConfig[sequence];
    let trials = [];
    
    blocks.forEach((block, blockIndex) => {
      for (let i = 0; i < block.trials; i++) {
        const trial = generateMarkovNumber(block.level, config);
        trial.blockNumber = blockIndex + 1;
        trial.blockType = sequence;
        trials.push(trial);
      }
    });
    
    console.log(`Generated ${trials.length} trials in ${blocks.length} blocks (${sequence} sequence)`);
    return trials;
  }
  
  // Original random/sequential trial generation
  let trials = [];
  config.trialConfig.forEach(level => {
    for (let i = 0; i < level.trials; i++) {
      trials.push(generateMarkovNumber(level.level, config));
    }
    console.log(`Generating ${level.trials} trials at effort level ${level.level}`);
  });

  console.log(`Generated ${trials.length} trials before shuffling`);
  if (config.shuffleTrials) {
    trials = shuffleArray(trials);
  }
  console.log(`Final trial count after shuffling: ${trials.length}`);
  
  return trials;
};
module.exports = { 
  generateMarkovNumber,
  generateTrialNumbers 
};