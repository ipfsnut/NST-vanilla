module.exports = {
  // CONFIGURATION
  // turn shuffle off or on via boolean here
  shuffleTrials: false,
  // set number of trials per level here
  trialConfig: [
    { level: 1, trials: 1 },
    { level: 4, trials: 1 },
    { level: 7, trials: 1 },
  ],
  captureConfig: {
    firstCapture: 1,    // Capture after X responses
    interval: 7,        // Capture every Y responses after that
    quality: 'high'
  },
  KEYS: {
    ODD: 'f',
    EVEN: 'j'
  },


  // do not modify this 

  EFFORT_LEVELS: {
    1: { min: 1, max: 2 },
    2: { min: 3, max: 4 },
    3: { min: 5, max: 6 },
    4: { min: 7, max: 8 },
    5: { min: 9, max: 10 },
    6: { min: 11, max: 12 },
    7: { min: 13, max: 14 },
  },
};