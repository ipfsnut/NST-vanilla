const express = require('express');

module.exports = (coordinator) => {
  const router = express.Router();

  router.post('/experiments/:experimentId/start', async (req, res, next) => {
    try {
      const result = await coordinator.initializeExperiment(
        req.params.experimentId,
        req.body.config
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/experiments/:experimentId/response', async (req, res, next) => {
    try {
      const result = await coordinator.handleTrialResponse(
        req.params.sessionId,
        req.body
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/experiments/:experimentId/results', async (req, res, next) => {
    try {
      const results = await coordinator.aggregateResults(req.params.sessionId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  return router;
};