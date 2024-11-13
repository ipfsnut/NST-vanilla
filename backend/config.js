/**
 * Configuration for the Number Switching Task experiment
 *
 * EFFORT_LEVELS: Maps effort levels (1-7) to their switch parameters
 * - min: minimum number of switches in the sequence
 * - max: maximum number of switches in the sequence
 * Higher effort levels require more switches between odd/even numbers
 */
const experimentConfig = {
  EFFORT_LEVELS: {
    1: { min: 1, max: 2 },   // Lowest cognitive load
    2: { min: 3, max: 4 },
    3: { min: 5, max: 6 },
    4: { min: 7, max: 8 },   // Medium cognitive load 
    5: { min: 9, max: 10 },
    6: { min: 11, max: 12 },
    7: { min: 13, max: 14 }, // Highest cognitive load
  },
  KEYS: {
    ODD: 'f',
    EVEN: 'j'
  },
  INTER_TRIAL_DELAY: 1000,
  numTrials: 14,
  trialsPerEffort: 2,
  isCustom: false
};

// Derive effort levels from EFFORT_LEVELS object keys
experimentConfig.effortLevels = Object.keys(experimentConfig.EFFORT_LEVELS);

module.exports = experimentConfig;