class ResponsePipeline {
  constructor(stateManager, mediaHandler) {
    this.stateManager = stateManager;
    this.mediaHandler = mediaHandler;
  }

  async processResponse(experimentId, sessionId, responseData) {
    const validatedResponse = await this.validateResponse(responseData);
    const sessionState = await this.stateManager.getSessionState(sessionId);
    
    // Process each response with position validation
    const processedResponses = responseData.responses.map(response => {
      const positionKey = `${response.trialNumber}-${response.position}`;
      return {
        ...response,
        positionKey,
        timestamp: response.timestamp,
        validated: true
      };
    });

    return {
      response: {
        isValid: true,
        processedData: processedResponses
      },
      sessionState: sessionState.state,
      timestamp: Date.now()
    };
  }

  async validateResponse(responseData) {
    const { positionKey, trialNumber, position, digit } = responseData;
    
    // Validate position format
    if (!positionKey || !positionKey.match(/^\d+-\d+$/)) {
      throw new Error(`Invalid position key: ${positionKey}`);
    }

    // Validate trial bounds
    if (trialNumber < 0 || trialNumber > 13) {
      throw new Error(`Trial number out of bounds: ${trialNumber}`);
    }

    // Validate digit position
    if (position < 0 || position > 14) {
      throw new Error(`Position out of bounds: ${position}`);
    }

    return {
      isValid: true,
      processedData: responseData,
      validationTimestamp: Date.now()
    };
  }

  async handleResponseError(error, sessionId) {
    const errorLog = {
      timestamp: Date.now(),
      sessionId,
      error: error.message,
      type: 'response_validation'
    };

    console.error('Response validation failed:', errorLog);
    return errorLog;
  }

  async validateStateAlignment(sessionId) {
    const stateVector = await this.stateManager.getFullStateVector(sessionId);
    const captures = await this.mediaHandler.getSessionCaptures(sessionId);
    
    return {
      responseCount: stateVector.responseState.length,
      captureCount: captures.length,
      isAligned: stateVector.responseState.length === captures.length,
      timestamp: Date.now()
    };
  }
}

module.exports = ResponsePipeline;
