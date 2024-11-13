const logger = require('../utils/logger');

class ServiceBoundaryChecker {
  constructor() {
    this.boundaries = {
      PlatformService: {
        allowedMethods: ['initializeSession', 'updateSessionState', 'getSessionState'],
        responsibilities: 'Session management, global state tracking'
      },
      NSTService: {
        allowedMethods: ['getNextDigit', 'validateResponse', 'getTrialState'],
        responsibilities: 'Trial management, experiment logic'
      },
      MediaHandler: {
        allowedMethods: ['saveTrialCapture', 'getSessionCaptures', 'validateCapture'],
        responsibilities: 'Capture storage and validation'
      }
    };
  }

  checkMethodAccess(serviceName, methodName) {
    const boundary = this.boundaries[serviceName];
    if (!boundary.allowedMethods.includes(methodName)) {
      logger.warn(`${serviceName} attempting to access non-boundary method: ${methodName}`);
      return false;
    }
    return true;
  }
}
