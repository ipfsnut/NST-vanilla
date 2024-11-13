const { registerExperiment } = require('../core/experimentLoader');
const NSTExperiment = require('./NSTExperiment');

// Register available experiments
registerExperiment('nst', NumberSwitchingTask);

module.exports = {
  // Export experiment-related utilities as needed
  getAvailableExperiments: () => ['nst']
};
