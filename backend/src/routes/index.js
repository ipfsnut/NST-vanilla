const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = function(nstService, mediaHandler) {
  // Initialize new experiment session
  router.post('/experiments', async (req, res, next) => {
    try {
      const experimentId = uuidv4();
      await nstService.initialize(experimentId);
      req.session.experimentId = experimentId; // Store in session
      res.json({ experimentId, status: 'initialized' });
    } catch (error) {
      next(error);
    }
  });

  // Get experiment state
  router.get('/experiments/:experimentId', async (req, res, next) => {
    try {
      const { experimentId } = req.params;
      const state = await nstService.getExperimentState(experimentId);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  // Process trial response
  router.post('/experiments/:experimentId/response', async (req, res, next) => {
    try {
      const { experimentId } = req.params;
      const { response } = req.body;
      
      if (experimentId !== req.session.experimentId) {
        throw new Error('Invalid experiment session');
      }
      
      const result = await nstService.processResponse(experimentId, response);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Get experiment results
  router.get('/experiments/:experimentId/results', async (req, res, next) => {
    try {
      const { experimentId } = req.params;
      const results = await nstService.getExperimentResults(experimentId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  // Get current session info
  router.get('/session', (req, res) => {
    res.json({
      experimentId: req.session.experimentId || null,
      isActive: !!req.session.experimentId
    });
  });

  return router;
}
