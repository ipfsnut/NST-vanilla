/**
 * Experiment phase constants
 * Defines all valid states for the NST experiment
 */
const PHASES = {
  INIT: 'INIT',                     // Initial experiment state
  PRESENTING_DIGIT: 'PRESENTING_DIGIT', // Showing current digit
  AWAIT_RESPONSE: 'AWAIT_RESPONSE',     // Waiting for user input
  DIGIT_BREAK: 'DIGIT_BREAK',           // 0.5s break between digits
  TRIAL_BREAK: 'TRIAL_BREAK',           // 15s break between trials
  COMPLETE: 'COMPLETE',                 // Experiment finished
  ERROR: 'ERROR'                        // Error recovery state
};

// Freeze to prevent modifications
Object.freeze(PHASES);

// Valid phase transitions map
const VALID_TRANSITIONS = {
  [PHASES.INIT]: [PHASES.PRESENTING_DIGIT],
  [PHASES.PRESENTING_DIGIT]: [PHASES.AWAIT_RESPONSE],
  [PHASES.AWAIT_RESPONSE]: [PHASES.DIGIT_BREAK, PHASES.TRIAL_BREAK],
  [PHASES.DIGIT_BREAK]: [PHASES.PRESENTING_DIGIT],
  [PHASES.TRIAL_BREAK]: [PHASES.PRESENTING_DIGIT],
  // Error state can be entered from any state
  [PHASES.ERROR]: [PHASES.PRESENTING_DIGIT]
};

Object.freeze(VALID_TRANSITIONS);

module.exports = {
  PHASES,
  VALID_TRANSITIONS
};
