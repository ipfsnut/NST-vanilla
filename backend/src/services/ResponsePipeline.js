class ResponsePipeline {
  constructor(platformService, mediaHandler) {
    this.platformService = platformService;
    this.mediaHandler = mediaHandler;
    this.boundaryContract = {
      allowedMethods: ['processResponse', 'validateResponse', 'aggregateResults'],
      responsibilities: 'Response handling and data aggregation'
    };
  }

  async processResponse(experimentId, sessionId, responseData) {
    const validatedResponse = await this.validateResponse(responseData);
    const sessionState = await this.platformService.getSessionState(sessionId);
    
    if (responseData.captureData) {
      const capture = await this.mediaHandler.saveTrialCapture(
        sessionId, 
        responseData.trialNumber, 
        responseData.captureData
      );
      validatedResponse.captureId = capture.metadata.captureId;
    }

    return {
      response: validatedResponse,
      sessionState: sessionState.current,
      timestamp: Date.now()
    };
  }

  async validateResponse(responseData) {
    return {
      isValid: true,
      processedData: responseData,
      validationTimestamp: Date.now()
    };
  }

  async aggregateResults(sessionId) {
    const captures = await this.mediaHandler.getSessionCaptures(sessionId);
    const sessionState = await this.platformService.getSessionState(sessionId);
    
    return {
      responses: sessionState.responses,
      captures: captures,
      aggregationTimestamp: Date.now()
    };
  }
}

module.exports = wrapService(new ResponsePipeline(), 'ResponsePipeline');
