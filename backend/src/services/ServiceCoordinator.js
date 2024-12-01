class ServiceCoordinator {
  constructor(nstService, platformService, mediaHandler) {
    this.nstService = nstService;
    this.platformService = platformService;
    this.mediaHandler = mediaHandler;
  }

  async initializeExperiment(experimentId, config) {
    const sessionState = await this.platformService.initializeSession(
      experimentId,
      config
    );

    await this.mediaHandler.initializeSession(sessionState.sessionId);
    const trialState = await this.nstService.getTrialState(experimentId);

    return {
      sessionId: sessionState.sessionId,
      experimentId,
      config,
      status: sessionState.status,
      trialState
    };
  }

  calculateMetrics(transaction) {
    const stages = Array.from(transaction.stages.entries());
    const metrics = {
      stageTimings: {},
      totalDuration: stages[stages.length - 1][1] - stages[0][1]
    };
    
    for (let i = 0; i < stages.length - 1; i++) {
      const [stageName, startTime] = stages[i];
      const endTime = stages[i + 1][1];
      metrics.stageTimings[stageName] = endTime - startTime;
    }
    
    return metrics;
  }

  async handleTrialResponse(sessionId, responseData) {
    const transaction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      stages: new Map(),
      metrics: {
        stageTimings: {},
        totalDuration: null
      }
    };

    try {
      transaction.stages.set('init', Date.now());
      
      const currentState = await this.nstService.getTrialState(responseData.experimentId);
      transaction.stages.set('stateRetrieved', Date.now());
      
      const processedResponse = await this.nstService.processResponse(
        responseData.experimentId,
        responseData.response
      );
      transaction.stages.set('responseProcessed', Date.now());

      if (responseData.requiresCapture) {
        await this.mediaHandler.saveTrialCapture(
          sessionId,
          responseData.trialNumber,
          responseData.captureData
        );
        transaction.stages.set('captureSaved', Date.now());
      }

      const updatedState = await this.platformService.updateSessionState(sessionId, {
        lastResponse: processedResponse.validationResult,
        currentState: processedResponse.nextState,
        metadata: {
          timestamp: transaction.timestamp,
          transitionType: 'response-processed'
        }
      });
      transaction.stages.set('stateUpdated', Date.now());
      
      transaction.stages.set('complete', Date.now());
      
      return {
        sessionState: updatedState,
        trialState: processedResponse.nextState,
        validationResult: processedResponse.validationResult,
        transactionMeta: {
          id: transaction.id,
          stages: Object.fromEntries(transaction.stages),
          metrics: this.calculateMetrics(transaction)
        }
      };
    } catch (error) {
      throw new Error('Trial response transaction failed: ' + error.message);
    }
  }

  async aggregateResults(sessionId) {
    const sessionData = await this.platformService.getSessionState(sessionId);
    const captures = await this.mediaHandler.getSessionCaptures(sessionId);
    const trialState = await this.nstService.getTrialState(sessionData.experimentId);

    return {
      sessionId,
      experimentId: sessionData.experimentId,
      responses: sessionData.responses,
      captures,
      metrics: {
        totalTrials: trialState.trialState.totalTrials,
        completedTrials: trialState.trialState.trialNumber,
        captureCount: captures.length
      },
      timing: {
        start: sessionData.metadata.startTime,
        lastUpdate: sessionData.metadata.lastUpdated
      }
    };
  }
  
  async aggregateSessionData(sessionId) {
    const sessionState = await this.platformService.getSessionState(sessionId);
    const captures = await this.mediaHandler.batchExportCaptures(sessionId);
    const experimentData = await this.nstService.getExperimentState();

    return {
      session: sessionState,
      captures: captures,
      experiment: experimentData,
      metadata: {
        timestamp: Date.now(),
        exportVersion: '1.0'
      }
    };

  }
  
  async prepareBatchExport(sessionId) {
    const aggregatedData = await this.aggregateSessionData(sessionId);
    const validation = await this.validateExportData(aggregatedData);

    if (!validation.isValid) {
      throw new Error('Export data validation failed');
    }

    return {
      data: aggregatedData,
      validation,
      readyForExport: true,
      timestamp: Date.now()
    };
  }
  
  async validateExportData(data) {
    return {
      isValid: true,
      errors: [],
      metadata: {
        size: JSON.stringify(data).length,
        format: 'json',
        timestamp: Date.now()
      }
    };
  }

}
module.exports = ServiceCoordinator;