module.exports = {
  // CONFIGURATION
  mode: 'block', // 'block' or 'random'
  shuffleTrials: false,
  
  // Original trial config for random mode
  trialConfig: [
    { level: 7, trials: 1 },
    { level: 4, trials: 1 },
    { level: 1, trials: 1 },
  ],
  
  // Block mode configuration
  sequenceType: 'ascending', // or 'descending'
  blockConfig: {
    ascending: [
      { level: 1, trials: 3 },
      { level: 4, trials: 3 },
      { level: 7, trials: 3 }
    ],
    descending: [
      { level: 7, trials: 3 },
      { level: 4, trials: 3 },
      { level: 1, trials: 3 }
    ]
  },
  
  // New break timing configurations
  breaks: {
    digitBreak: {
      duration: 500,    // 0.5s between digits
      enabled: true
    },
    trialBreak: {
      defaultDuration: 15000,  // 15s between regular trials
      longDuration: 30000,    // 30s after trials 3 and 6
      triggerLongBreakAfterTrials: [3, 6],  // Configurable trial numbers
      enabled: true
    }
  },

  // New scoring configurations
  scoring: {
    correctResponse: 1,
    incorrectResponse: 0,
    minimumResponseTime: 200  // ms
  },

  // Existing timing configurations
  timing: {
    digitPresentation: {
      min: 500,    // minimum time to show digit
      max: 2000    // maximum time to show digit
    },
    responseWindow: 3000  // time allowed for response
  },
  
  captureConfig: {
    firstCapture: 1,
    interval: 7,
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