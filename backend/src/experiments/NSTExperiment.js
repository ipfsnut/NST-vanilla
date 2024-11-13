const BaseExperiment = require('../core/baseExperiment');
const { generateMarkovNumber } = require('../utils/markovChain');

class NSTExperiment extends BaseExperiment {
  constructor(config) {
    super();
    this.config = config;
    this.currentEffortLevel = 1;
    this.trialCount = 0;
  }

  getNextDigit() {
    this.trialCount++;
    console.log('Getting next digit, trial count:', this.trialCount);
    
    // Generate number sequence using Markov chain
    const result = generateMarkovNumber(this.currentEffortLevel, this.config);
    console.log('Generated Markov result:', result);

    // Adjust effort level based on config rules
    if (this.trialCount % this.config.trialsPerLevel === 0) {
      this.currentEffortLevel = Math.min(7, this.currentEffortLevel + 1);
    }

    return {
      number: result.number,
      metadata: {
        trialNumber: this.trialCount,
        effortLevel: this.currentEffortLevel,
        ...result.metadata
      }
    };
  }
  generateTrials() {
    const trials = [];
    for (let i = 0; i < this.config.trialsPerLevel; i++) {
      trials.push(this.getNextDigit());
    }
    return trials;
  }  
processResponse(response) {
  console.log('Processing response in NSTExperiment:', response);
    
  const currentDigit = parseInt(response.digit);
  const isCorrect = (response.response === 'odd' && currentDigit % 2 === 1) ||
                   (response.response === 'even' && currentDigit % 2 === 0);
    
  const result = {
      digit: currentDigit,
      response: response.response,
      responseTime: response.timestamp,
      isCorrect,
      trialIndex: this.trialCount
  };
    
  console.log('Calculated response result:', result);
    
  this.state.responses.push({
      trial: this.trialCount,
      digit: currentDigit,
      response: response.response,
      isCorrect,
      effortLevel: this.currentEffortLevel,
      timestamp: Date.now()
  });
    
  return result;
}
}

module.exports = NSTExperiment;
