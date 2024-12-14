class ResponsePipeline {
  constructor(platformService, mediaHandler) {
    this.platformService = platformService;
    this.mediaHandler = mediaHandler;
    this.boundaryContract = {
      allowedMethods: ['processResponse', 'validateResponse', 'aggregateResults'],
      responsibilities: 'Response handling and data aggregation'
    };
  }

  async validateVectorAlignment(stateVector) {
    const { experimentState, captureState, responseState } = stateVector;
    
    return {
      isAligned: experimentState.currentTrial === responseState.length,
      captureSync: captureState.length === responseState.length,
      timestamp: Date.now(),
      metadata: {
        trialCount: experimentState.trials.length,
        responseCount: responseState.length,
        captureCount: captureState.length
      }
    };
  }

  async validateStateAlignment(sessionId) {
    const stateVector = await this.platformService.getFullStateVector(sessionId);
    const captures = await this.mediaHandler.getSessionCaptures(sessionId);
    
    return {
      responseCount: stateVector.responseState.length,
      captureCount: captures.length,
      isAligned: stateVector.responseState.length === captures.length,
      timestamp: Date.now()
    };
  }

  async processResponse(experimentId, sessionId, responseData) {
    const validatedResponse = await this.validateResponse(responseData);
    const sessionState = await this.platformService.getSessionState(sessionId);
    
    if (responseData.captureData) {
      try {
        const capture = await this.mediaHandler.saveTrialCapture(
          sessionId, 
          responseData.trialNumber, 
          responseData.captureData
        );
        validatedResponse.captureId = capture.metadata.captureId;
      } catch (error) {
        // Continue processing response even if capture fails
        console.warn(`Capture failed for trial ${responseData.trialNumber}:`, error);
      }
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

  async processBatchResponses(experimentId, sessionId, responses) {
    const results = [];
    const errors = [];
    
    for (const response of responses) {
      try {
        const result = await this.processResponse(experimentId, sessionId, response);
        results.push(result);
      } catch (error) {
        errors.push({ response, error: error.message });
        continue;
      }
    }
    
    return { results, errors };
  }
}

module.exports = wrapService(new ResponsePipeline(), 'ResponsePipeline');


