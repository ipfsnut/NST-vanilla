# NST-Vanilla: Number Switching Task Experiment Platform

A lightweight experimental platform for running the Number Switching Task (NST), built with React and Node.js.

## Purpose
This application provides a clean interface for conducting number switching experiments, capturing participant responses, performance data, and webcam images at specified intervals. The basic UI presents digits sequentially and records user identification of odd/even numbers.

## Prerequisites
- **Node.js 16+** (Download from [nodejs.org](https://nodejs.org))
- **MongoDB Community Server** (Download from [mongodb.com](https://www.mongodb.com/try/download/community))
- **Modern web browser** with webcam access permissions

## Installation

### 1. Install MongoDB Community Server
   - **Mac (Homebrew)**: `brew install mongodb-community`
   - **Windows**: Run the .msi installer from MongoDB website
   - **Linux**: Follow platform-specific installation guide at [mongodb.com/docs/manual/installation](https://www.mongodb.com/docs/manual/installation/)

### 2. Clone this repository:
```bash
git clone [your-repository-url]
cd nst-vanilla
```

### 3. Install dependencies:
```bash
npm run install-all
```

### 4. Start MongoDB:
```bash
# Mac (Homebrew)
brew services start mongodb-community

# Windows (as Administrator)
net start MongoDB

# Linux (systemd)
sudo systemctl start mongod
```

### 5. Start the application:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend: http://localhost:5069
   

## Features
- Clean matrix-styled interface
- Real-time response capture
- Webcam image capture at specified intervals
- Performance metrics tracking
- Data export capabilities
- Session management
- Trial randomization

## Architecture
- Frontend: React with Redux state management
- Backend: Express.js REST API
- Database: MongoDB for session and results storage
- Styling: CSS modules with matrix theme

## Usage

1. **Start the application** (ensure MongoDB is running first)
2. **Open your browser** to http://localhost:8080
3. **Allow webcam access** when prompted
4. **Press 'f' for odd numbers, 'j' for even numbers** to begin
5. **Complete the trials** by responding to each digit
6. **Export results** when the experiment completes

## Configuration

Modify experiment settings in `backend/src/experimentConfig.js`:

```javascript
module.exports = {
  shuffleTrials: true,           // Randomize trial order
  trialConfig: [                 // Number of trials per difficulty level
    { level: 6, trials: 1 },
    { level: 4, trials: 1 },
    { level: 2, trials: 1 },
  ],
  captureConfig: {
    firstCapture: 0,             // When to start capturing (digit position)
    interval: 3,                 // Capture every N digits
    quality: 'high',             // Image quality
    cameraId: null               // Specific camera (null = default)
  }
};
```

## Data Collection
- **Response accuracy** - Correct/incorrect classifications
- **Response times** - Millisecond timing for each response  
- **Trial sequence data** - Complete digit sequences shown
- **Performance metrics** - Overall accuracy and speed
- **Session metadata** - Timestamps, trial configuration
- **Webcam captures** - Images captured at specified intervals

## Experiment Flow
1. User starts new experiment session
2. System presents digits sequentially (15 digits per trial)
3. User identifies each digit as odd ('f') or even ('j')
4. System captures response times and accuracy
5. Optional webcam images captured at configured intervals
6. Results exported as CSV/JSON with captured images

## Troubleshooting

### Common Issues

**"Could not establish connection" error:**
- Start MongoDB: `brew services start mongodb-community` (Mac)
- Restart the backend after starting MongoDB

**No digits showing:**
- Check browser console for errors
- Ensure MongoDB is running and connected
- Try refreshing the page

**Webcam not working:**
- Allow camera permissions in browser
- Check if another application is using the camera
- Verify camera is properly connected

**Port already in use:**
- Kill existing processes: `pkill -f "node src/app.js"`
- Or use different ports in configuration

### Development

The application runs on:
- **Frontend**: http://localhost:8080 (webpack-dev-server)
- **Backend**: http://localhost:5069 (Express.js)
- **MongoDB**: localhost:27017 (Database)

To run individual components:
```bash
# Backend only
cd backend && npm start

# Frontend only  
cd frontend && npm start
```

## License
ISC
