class SessionControl {
  constructor(platformService) {
    this.platformService = platformService;
    this.boundaryContract = {
      allowedMethods: ['start', 'pause', 'resume', 'abort'],
      responsibilities: 'Session lifecycle management'
    };
  }

  async start(experimentId, config) {
    const sessionState = await this.platformService.initializeSession(experimentId, config);
    return {
      sessionId: sessionState.sessionId,
      status: 'RUNNING',
      startTime: Date.now()
    };
  }

  async pause(sessionId) {
    const sessionState = await this.platformService.updateSessionState(sessionId, {
      status: 'PAUSED',
      pauseTime: Date.now()
    });
    return {
      sessionId,
      status: sessionState.status
    };
  }

  async resume(sessionId) {
    const sessionState = await this.platformService.updateSessionState(sessionId, {
      status: 'RUNNING',
      resumeTime: Date.now()
    });
    return {
      sessionId,
      status: sessionState.status
    };
  }

  async abort(sessionId) {
    const sessionState = await this.platformService.updateSessionState(sessionId, {
      status: 'TERMINATED',
      endTime: Date.now()
    });
    return {
      sessionId,
      status: sessionState.status,
      endTime: sessionState.endTime
    };
  }
}

module.exports = wrapService(new SessionControl(), 'SessionControl');
