const express = require('express');
const router = express.Router();
const nstController = require('../controllers/nstController');

/**
 * Session Management Routes
 * Handles experiment session lifecycle based on state machine defined in NSTvision.txt
 */

/**
 * @route POST /api/start
 * @frontend CORE ENDPOINT - Used in ExperimentView for session initialization
 * @desc Initialize new experiment session
 * @state INIT
 * @vision NSTvision.txt:Session Management:POST /start
 * @triggers 
 *  - Session creation via SessionControl
 *  - Trial sequence generation via markovChain.js
 *  - Configuration loading
 * @returns {Object} sessionId, initialState, config
 */
router.post('/start', nstController.startSession);

/**
 * @route GET /api/state
 * @desc Get current experiment state
 * @state ANY
 * @frontend CORE ENDPOINT - Used in ExperimentView for state tracking
 * @vision NSTvision.txt:Session Management:GET /state
 * @triggers State query via StateManager
 * @returns {Object} currentState, metadata
 */
router.get('/state', nstController.getExperimentState);

/**
 * @route GET /api/trial-state
 * @desc Get current trial state
 * @state TRIAL_START | AWAIT_RESPONSE
 * @vision NSTvision.txt:Session Management:GET /trial-state
 * @triggers Trial state query via NSTExperiment
 * @returns {Object} trialNumber, currentDigit, effortLevel
 */
router.get('/trial-state', nstController.getTrialState);

/**
 * @route GET /api/progress
 * @desc Get experiment progress
 * @state ANY
 * @vision NSTvision.txt:Session Management:GET /progress
 * @triggers Progress calculation via NSTService
 * @returns {Object} completedTrials, totalTrials, currentLevel
 */
router.get('/progress', nstController.getProgress);

/**
 * @route GET /api/results
 * @desc Get complete session results
 * @state COMPLETE
 * @vision NSTvision.txt:Session Management:GET /results
 * @triggers Results compilation and formatting
 * @returns {Object} trialData, responses, captures, metrics
 */
router.get('/results', nstController.getResults);

/**
 * @route PUT /api/session/pause
 * @desc Pause active experiment
 * @state ANY
 * @vision NSTvision.txt:Session Management:PUT /session/pause
 * @triggers SessionControl pause operation
 * @returns {Object} sessionStatus, pauseTimestamp
 */
router.put('/session/pause', nstController.pauseSession);

/**
 * @route PUT /api/session/resume
 * @desc Resume paused experiment
 * @state PAUSED
 * @vision NSTvision.txt:Session Management:PUT /session/resume
 * @triggers Session reactivation
 * @returns {Object} sessionStatus, resumeTimestamp
 */
router.put('/session/resume', nstController.resumeSession);

/**
 * @route PUT /api/session/abort
 * @desc Terminate experiment early
 * @state ANY
 * @vision NSTvision.txt:Session Management:PUT /session/abort
 * @triggers Session termination
 * @returns {Object} sessionStatus, terminationTime
 */
router.put('/session/abort', nstController.abortSession);

/**
 * State Management Routes
 * Handles state transitions and status queries
 */

/**
 * @route GET /api/session/:id/status
 * @desc Get detailed session status
 * @state ANY
 * @vision NSTvision.txt:State Management:GET /session/:id/status
 * @triggers StateManager status query
 * @returns {Object} detailedStatus, stateHistory
 */
router.get('/session/:id/status', nstController.getSessionStatus);

/**
 * @route POST /api/session/:id/transition
 * @desc Request state transition
 * @state ANY
 * @vision NSTvision.txt:State Management:POST /session/:id/transition
 * @triggers State machine transition validation
 * @returns {Object} newState, transitionSuccess
 */
router.post('/session/:id/transition', nstController.requestStateTransition);

/**
 * Error Handling Routes
 * Handles error reporting and recovery
 */

/**
 * @route POST /api/session/:id/error
 * @desc Report error condition
 * @state ANY
 * @vision NSTvision.txt:Error Handling:POST /session/:id/error
 * @triggers Error logging and recovery process
 * @returns {Object} errorStatus, recoverySteps
 */
router.post('/session/:id/error', nstController.reportError);

/**
 * @route GET /api/session/:id/recovery
 * @desc Get recovery instructions
 * @state ANY
 * @vision NSTvision.txt:Error Handling:GET /session/:id/recovery
 * @triggers Recovery plan generation
 * @returns {Object} recoveryPlan, fallbackState
 */
router.get('/session/:id/recovery', nstController.getRecoveryInstructions);

/**
 * Trial Management Routes
 * Handles individual trial operations
 */

/**
 * @route POST /api/trials
 * @desc Create new trial
 * @state TRIAL_START
 * @vision NSTvision.txt:Trial Management:POST /trials
 * @triggers 
 *  - Markov chain sequence generation
 *  - Trial initialization
 * @returns {Object} trialId, sequence, effortLevel
 */
router.post('/trials', nstController.createTrial);

/**
 * @route GET /api/next-digit
 * @desc Get next digit in sequence
 * @state TRIAL_START
 * @frontend CORE ENDPOINT - Used for digit sequence progression
 * @vision NSTvision.txt:Trial Management:GET /next-digit
 * @triggers Digit generation via MarkovChain
 * @returns {Object} digit, metadata
 */
router.get('/next-digit', nstController.getNextDigit);

/**
 * @route POST /api/response
 * @desc Submit trial response
 * @state AWAIT_RESPONSE
 * @frontend CORE ENDPOINT - Used for response submission
 * @vision NSTvision.txt:Trial Management:POST /response
 * @triggers 
 *  - Response validation
 *  - Optional image capture
 * @returns {Object} responseValid, nextState
 */
router.post('/response', nstController.submitResponse);

/**
 * Capture Control Routes
 * Handles image capture operations
 */

/**
 * @route POST /api/capture
 * @desc Submit captured image
 * @state ANY
 * @vision NSTvision.txt:Capture Control:POST /capture
 * @triggers Image storage and validation
 * @returns {Object} captureId, storageStatus
 */
router.post('/capture', nstController.submitCapture);

/**
 * @route GET /api/capture-config
 * @desc Get capture configuration
 * @state ANY
 * @vision NSTvision.txt:Capture Control:GET /capture-config
 * @triggers Configuration retrieval
 * @returns {Object} captureEnabled, frequency, quality
 */
router.get('/capture-config', nstController.getCaptureConfig);

/**
 * Configuration Routes
 * Handles NST configuration management
 */

/**
 * @route GET /api/config
 * @desc Get NST configuration
 * @state ANY
 * @vision NSTvision.txt:Configuration:GET /config
 * @triggers Configuration retrieval
 * @returns {Object} fullConfig
 */
router.get('/config', nstController.getNSTConfig);

/**
 * @route PUT /api/config
 * @desc Update NST configuration
 * @state INIT
 * @vision NSTvision.txt:Configuration:PUT /config
 * @triggers Configuration validation and update
 * @returns {Object} updatedConfig
 */
router.put('/config', nstController.updateNSTConfig);

/**
 * Export and Capture Management Routes
 * Handles data export and capture retrieval operations
 */

/**
 * @route GET /api/export/:sessionId
 * @desc Package and return full session data
 * @state COMPLETE
 * @vision NSTvision.txt:Export Management:GET /export/:sessionId
 * @triggers Session data packaging via zipCreator
 * @returns {Object} exportData, metadata
 */
router.get('/export/:sessionId', nstController.exportSessionData);

/**
 * @route GET /api/captures/:sessionId
 * @desc Get list of all captures for a session
 * @state ANY
 * @vision NSTvision.txt:Capture Management:GET /captures/:sessionId
 * @triggers MediaHandler capture retrieval
 * @returns {Object} captures[], metadata
 */
router.get('/captures/:sessionId', nstController.getSessionCaptures);

/**
 * @route POST /api/export/validate
 * @desc Validate export data structure
 * @state ANY
 * @vision NSTvision.txt:Export Management:POST /export/validate
 * @returns {Object} isValid, errors[], metadata
 */
router.post('/export/validate', nstController.validateExportData);


module.exports = router;
