# NST Backend Architecture

## Core Services
1. NSTService
   - Experiment logic and state management
   - Trial generation and validation
   - Response processing
   - Database interactions via mongoose

2. SessionControl
   - Session lifecycle (start, pause, resume, abort)
   - State transitions
   - Session metadata management

3. MediaHandler
   - Image capture storage
   - Session-based file organization
   - Capture validation
   - Cleanup routines

4. ServiceCoordinator
   - Service orchestration
   - Transaction management
   - Cross-service state management
   - Metrics calculation

## Data Models
1. Experiment
   - Configuration
   - Trial definitions
   - Status tracking
   - Timestamps

2. Response
   - Session-linked responses
   - Performance metrics
   - Trial sequences
   - Validation results

3. ExperimentSession
   - Runtime state
   - Trial tracking
   - Response collection
   - Configuration

## Utils
1. Session Generation
   - Unique ID creation
   - Session initialization

2. Service Boundaries
   - Method restrictions
   - Service responsibilities
   - Interface definitions

## API Routes
1. Session Management
2. Trial Control
3. Response Handling
4. Capture Management
5. Configuration
6. Error Handling

## Data Flow - Internal Service Interactions

1. Session Initialization Flow
   - SessionControl initiates new session
   - ServiceCoordinator orchestrates:
     - NSTService generates trial sequence
     - MediaHandler creates session storage
     - PlatformService initializes session state

2. Trial Progression Flow
   - NSTService manages trial state
   - ServiceCoordinator handles:
     - Trial state transitions
     - Response validation
     - Performance metrics calculation
     - Optional image capture triggers

3. Response Processing Chain
   - NSTService validates responses
   - Updates experiment state
   - Stores in MongoDB via mongoose
   - Triggers next trial generation

4. Media Capture Pipeline
   - MediaHandler receives capture request
   - Creates trial-specific storage
   - Validates capture data
   - Links capture to session/trial

## Integration Points - Internal

1. Service Boundaries (from boundaries.js)
   - PlatformService: Session management, global state
   - ExperimentRegistry: Experiment discovery
   - ResponsePipeline: Response handling
   - SessionControl: Lifecycle management

2. Database Interactions
   - Experiment model: Configuration and trial data
   - Response model: Trial responses and metrics
   - ExperimentSession model: Runtime state

3. Cross-Service State Management
   - ServiceCoordinator maintains consistency
   - Transaction logging
   - Error handling and recovery



## TODO List

### Frontend Modifications

1. components/ExperimentController.js
    - Imports: MediaHandler, ResponseHandler, CameraCapture
    - State: Add captureStatus, exportStatus
    - Methods to add:
      - handleCaptureComplete(captureData)
      - prepareExportData()
    - Redux actions: Add capture and export actions

2. components/CameraCapture.js
    - Props from ExperimentController: experimentId, onCaptureReady
    - Events to ExperimentController: onCapture, onError
    - State: captureStatus, deviceStatus

### Backend Modifications ✓

3. services/MediaHandler.js ✓
    - Dependencies: fs, path
    - Interface with: ServiceCoordinator, SessionControl
    - Methods added:
      - batchExportCaptures(sessionId) ✓
      - getSessionMetadata(sessionId) ✓

4. services/ServiceCoordinator.js ✓
    - Dependencies: NSTService, MediaHandler
    - Coordinates: trial responses, captures, exports
    - Methods added:
      - aggregateSessionData(sessionId) ✓
      - prepareBatchExport(sessionId) ✓

5. models/Experiment.js ✓
    - Relations: ExperimentSession, Response
    - New fields:
     
     captureConfig: {
       frequency: Number,
       quality: String,
       storage: String
     },
     exportFormat: String
     

6. models/Response.js ✓
    - Relations: Experiment, ExperimentSession
    - New fields:
     
     captures: [{
       timestamp: Number,
       path: String,
       metadata: Object
     }]
     

7. models/ExperimentSession.js ✓
    - Relations: Experiment, Response
    - New fields:
     
     captureStats: {
       total: Number,
       successful: Number,
       failed: Number
     }
     

8. controllers/nstController.js ✓
    - Dependencies: all services
    - New endpoints:
      - exportSessionData ✓
      - getCaptureStatus ✓
      - validateExportData ✓

9. routes/NSTRoutes.js ✓
    - New routes:
     
     router.get('/export/:sessionId', (req, res) => {
       const { sessionId } = req.params;
       const zipCreator = new ZipCreator();
       ExperimentSession.findById(sessionId)
         .then(session => zipCreator.packageSessionData(session))
         .then(zipBuffer => {
           res.set('Content-Type', 'application/zip');
           res.set('Content-Disposition', `attachment; filename=${sessionId}_export.zip`);
           res.send(zipBuffer);
         })
         .catch(err => res.status(500).json({ error: 'Export failed', details: err.message }));
     });

     router.get('/captures/:sessionId', (req, res) => {
       const { sessionId } = req.params;
       const mediaHandler = new MediaHandler();
       mediaHandler.getSessionCaptures(sessionId)
         .then(captures => res.json(captures))
         .catch(err => res.status(500).json({ error: 'Failed to retrieve captures', details: err.message }));
     });

     router.post('/export/validate', (req, res) => {
       const serviceCoordinator = new ServiceCoordinator();
       serviceCoordinator.validateExportData(req.body)
         .then(validationResult => res.json(validationResult))
         .catch(err => res.status(400).json({ error: 'Validation failed', details: err.message }));
     });
     

10. services/boundaries.js ✓
     - New boundary definitions:
     
     CaptureService: {
       allowedMethods: ['capture', 'export', 'validate'],
       responsibilities: 'Image capture and export management'
     }
     

[Previous sections remain the same...]

## Version Requirements
- Node.js: 14+
- MongoDB: 4.4+
- React: 17+
- Express: 4+
## API Response Formats

1. Session Management

POST /api/start
{
  sessionId: string,
  initialState: {
    experimentId: string,
    currentDigit: string,
    trials: array,
    config: object
  },
  status: 'RUNNING'
}

GET /api/state
{
  currentState: {
    phase: string,
    experimentId: string,
    trialNumber: number,
    digitIndex: number
  }
}

PUT /api/session/pause
{
  sessionId: string,
  status: 'PAUSED',
  pauseTime: number
}

PUT /api/session/resume
{
  sessionId: string,
  status: 'RUNNING',
  resumeTime: number
}

PUT /api/session/abort
{
  sessionId: string,
  status: 'TERMINATED',
  endTime: number
}

GET /api/trial-state
{
  currentDigit: string,
  trialState: {
    position: number,
    trialNumber: number,
    isLastDigit: boolean,
    totalDigits: number,
    effortLevel: number
  }
}

POST /api/response
{
  isCorrect: boolean,
  trialComplete: boolean,
  isLastTrial: boolean,
  nextState: {
    digit: string,
    trialNumber: number,
    digitIndex: number
  }
}


2. Capture Endpoints
```javascript
GET /api/captures/:sessionId
{
  captures: [{
    filename: string,
    path: string,
    metadata: {
      sessionId: string,
      trialId: string,
      timestamp: number
    }
  }]
}

POST /api/capture
{
  success: boolean,
  filepath: string,
  metadata: {
    sessionId: string,
    trialId: string,
    captureTime: number
  }
}

POST /api/export/validate
{
  isValid: boolean,
  errors: string[],
  metadata: {
    size: number,
    format: string,
    timestamp: number
  }
}

// Trial Capture
{
  experimentId: string,
  trialNumber: number,
  captureData: string, // base64
  metadata: {
    timestamp: number,
    deviceInfo: object
  }
}

// Export Request
{
  sessionId: string,
  format: string,
  includeMetadata: boolean
}


Capture Flow

READY -> CAPTURING -> PROCESSING -> STORED
                  \-> ERROR -> RETRY


Export Flow

INIT -> COLLECTING -> PACKAGING -> COMPLETE
                  \-> ERROR -> ROLLBACK



Response Codes
200: Success
201: Created (new capture)
400: Invalid request
404: Resource not found
409: Conflict (duplicate capture)
413: Payload too large
500: Server error
503: Service unavailable

## Frontend Architecture Updates

1. State Management Modifications
   - captureSlice.js:
     - Add capture status tracking
     - Include device state management
     - Add capture metadata handling
     - Implement retry queue
   
   - experimentSlice.js:
     - Add capture coordination states
     - Include trial-capture synchronization
     - Add export status tracking
     - Implement state vector validation

   - middleware.js:
     - Add capture request interceptor
     - Implement response validation
     - Add export request handling
     - Include media state transitions

2. Component Updates
   - ExperimentController.js:
     
     interface ControllerState {
       captureStatus: 'idle' | 'capturing' | 'processing' | 'error'
       exportStatus: 'idle' | 'preparing' | 'downloading' | 'error'
       deviceState: DeviceStatus
       retryQueue: CaptureRetry[]
     }
     
   
   - CameraCapture.js:
     - Device initialization
     - Quality configuration
     - Error recovery
     - Metadata collection

   - ResponseHandler.js:
     - Capture trigger coordination
     - State vector validation
     - Drift compensation
     - Media synchronization

   - ResultsView.js:
     - Enhanced export options
     - Capture statistics
     - Download management
     - Progress indicators

3. Configuration Integration
   - api.js:
     
     const CAPTURE_ENDPOINTS = {
       INIT: '/capture/init',
       VALIDATE: '/capture/validate',
       STORE: '/capture/store',
       EXPORT: '/capture/export'
     }
     
   
   - ExperimentContext.js:
     - Media initialization
     - Capture configuration
     - Session state tracking
     - Export preferences

4. Data Flow Patterns
   - Capture Pipeline:
     1. Device initialization
     2. Trial synchronization
     3. Capture execution
     4. Validation and storage
   
   - Export Pipeline:
     1. Data aggregation
     2. Format validation
     3. Package creation
     4. Download management

5. Integration Testing Points
   - Device compatibility
   - Capture synchronization
   - Response correlation
   - Export validation

## Core Implementation Considerations

1. State Synchronization
   - ExperimentContext + Redux Integration
     
     interface StateVector {
       experimentState: ExperimentState
       captureState: CaptureState
       responseState: ResponseState
     }
     
   - Trial Flow Protection
     - Capture operations isolated from core experiment flow
     - State updates maintain existing response chain

2. Error Boundaries
   - Media Operation Handling
     - middleware.js expansion for capture errors
     - Isolated capture error state
   - Fallback Behaviors
     - Continue experiment on capture failure
     - Maintain response validation chain

3. Capture Integration
   - Optional Camera Access
     - Graceful fallback without camera
     - Maintain core experiment functionality
   - Response Handler Integration
     - Optional capture triggers
     - Maintain existing response validation

## Logging and Error Handling

1. Critical State Transitions
   - Trial State Changes
     - Response submission
     - Capture triggers
     - Trial completion
   - Capture Operations
     - Device initialization
     - Image capture attempts
     - Storage confirmation
   - State Vector Validation
     - Response-capture sync
     - Trial state alignment
     - Backend state verification

2. Error Detection Points
   - API Layer (middleware.js)
     - Response validation failures
     - Capture storage errors
     - State sync mismatches
   - Device Layer (captureSlice.js)
     - Camera initialization
     - Capture execution
     - Storage confirmation
   - Experiment Layer (experimentSlice.js)
     - Trial state corruption
     - Response validation errors
     - Capture timing mismatches

3. Experiment Stop Conditions
   - Device Initialization
     - Camera access denied
     - Device compatibility issues
   - State Management
     - Response-capture desync
     - Trial state corruption
   - Storage Operations
     - Capture storage failure
     - Response logging errors
