const ServiceBoundaries = {
  // Existing boundaries
  PlatformService: {
    allowedMethods: ['initializeSession', 'updateSessionState', 'getSessionState'],
    responsibilities: 'Session management, global state tracking'
  },
  
  // New boundaries from vision.txt
  ExperimentRegistry: {
    allowedMethods: ['listExperiments', 'getExperimentInfo', 'validateCapabilities'],
    responsibilities: 'Experiment discovery and capability detection'
  },
  
  ResponsePipeline: {
    allowedMethods: ['processResponse', 'validateResponse', 'aggregateResults'],
    responsibilities: 'Response handling and data aggregation'
  },
  
  SessionControl: {
    allowedMethods: ['start', 'pause', 'resume', 'abort'],
    responsibilities: 'Session lifecycle management'
  }
};
