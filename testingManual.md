# NST Backend Testing Manual

## Session Management Endpoints

### POST /api/start
1. Request:
```bash
curl -X POST http://localhost:5069/api/start

Expected Response:
{
  "currentDigit": "string",
  "trials": [],
  "experimentId": "timestamp",
  "sequence": "string",
  "config": {
    "INTER_TRIAL_DELAY": number,
    "DIGITS_PER_TRIAL": 15,
    "KEYS": {}
  }
}

GET /api/state
Request:
curl http://localhost:5069/api/state

Expected Response:
{
  "state": {
    "phase": "string",
    "experimentId": "string",
    "trialNumber": number,
    "digitIndex": number
  }
}

GET /api/captures/:sessionId
Request:
curl http://localhost:5069/api/captures/[SESSION_ID]

Expected Response:
{
  "captures": [{
    "filename": "string",
    "path": "string",
    "metadata": {
      "sessionId": "string",
      "trialId": "string",
      "timestamp": number
    }
  }],
  "metadata": {
    "sessionId": "string",
    "timestamp": number,
    "count": number
  }
}

POST /api/capture
Request:
curl -X POST http://localhost:5069/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "string",
    "trialNumber": number,
    "captureData": "base64string"
  }'

  Expected Response:
{
  "success": true,
  "filepath": "string",
  "metadata": {
    "sessionId": "string",
    "trialId": "string",
    "captureTime": number
  }
}

Export Management Endpoints
GET /api/export/:sessionId
Request:
curl http://localhost:5069/api/export/[SESSION_ID]

Expected Response:
{
  "exportData": "filename.zip",
  "metadata": {
    "timestamp": number,
    "format": "zip",
    "sessionId": "string"
  }
}

POST /api/export/validate
Request:
curl -X POST http://localhost:5069/api/export/validate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "string",
    "format": "zip",
    "includeMetadata": true
  }'

  Expected Response:
{
  "isValid": boolean,
  "errors": [],
  "metadata": {
    "size": number,
    "format": "string",
    "timestamp": number
  }
}

Testing Flow
Start New Session

Execute POST /api/start
Save returned sessionId
Capture Data

Use sessionId to post captures
Verify with GET /api/captures/:sessionId
Export Data

Validate export with POST /api/export/validate
Download export with GET /api/export/:sessionId
Response Codes
200: Success
201: Created (new capture)
400: Invalid request
404: Resource not found
409: Conflict
413: Payload too large
500: Server error
503: Service unavailable
Testing Environment Setup
Start MongoDB
mongod --dbpath ./data
Start Backend Server
cd NST-vanilla/backend
npm start

Verify Server Status
curl http://localhost:5069/api/state
