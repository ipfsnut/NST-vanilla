module.exports = {
  // CONFIGURATION
  // turn shuffle off or on vi
  // a boolean here
  shuffleTrials: true,
  // set number of trials per level here, 
  // the experiment will respect the ordering 
  // you use if shuffle is set to false
  trialConfig: [
    { level: 6, trials: 5 },
    { level: 4, trials: 5 },
    { level: 2, trials: 5 },
  ],
  captureConfig: {
    firstCapture: 1,    // Capture after X responses
    interval: 3,        // Capture every Y responses after that
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