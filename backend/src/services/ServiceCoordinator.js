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
    
    const trialState = await this.nstService.getTrialState();

    return {
      sessionId: sessionState.sessionId,
      experimentId,
      config,
      status: sessionState.status,
      trialState
    };
  }

  async handleTrialResponse(sessionId, responseData) {
    // NST boundary: trial logic
    const nextDigit = await this.nstService.getNextDigit();
    const validatedResponse = await this.nstService.validateResponse(responseData);
    
    // Platform boundary: state management
    const updatedState = await this.platformService.updateSessionState(sessionId, {
      lastResponse: validatedResponse,
      nextDigit
    });

    // Media boundary: capture handling
    let captureResult;
    if (responseData.captureData) {
      captureResult = await this.mediaHandler.saveTrialCapture(
        sessionId, 
        responseData.trialNumber, 
        responseData.captureData
      );
    }

    return {
      sessionState: updatedState,
      nextDigit,
      capture: captureResult
    };
  }

  async aggregateResults(sessionId) {
    // Platform boundary: session state
    const sessionData = await this.platformService.getSessionState(sessionId);
    
    // Media boundary: captures
    const captures = await this.mediaHandler.getSessionCaptures(sessionId);
    
    // NST boundary: trial state
    const trialState = await this.nstService.getTrialState();

    return {
      sessionId,
      experimentId: sessionData.experimentId,
      responses: sessionData.responses,
      captures,
      metrics: {
        totalTrials: trialState.total,
        completedTrials: trialState.current,
        captureCount: captures.length
      },
      timing: {
        start: sessionData.metadata.startTime,
        lastUpdate: sessionData.metadata.lastUpdated
      }
    };
  }
}

module.exports = ServiceCoordinator;