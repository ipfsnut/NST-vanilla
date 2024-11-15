# NST-Vanilla: Number Switching Task Experiment Platform

A lightweight experimental platform for running the Number Switching Task (NST), built with React and Node.js.

## Purpose
This application provides a clean interface for conducting number switching experiments, capturing participant responses and performance data. The matrix-styled UI presents digits sequentially and records user identification of odd/even numbers.

## Prerequisites
- Node.js (Download from nodejs.org)
- MongoDB Community Server (Download from mongodb.com/try/download/community)

## Installation

1. Install MongoDB Community Server
   - Windows: Run the .msi installer
   - Mac/Linux: Follow platform-specific installation guide at mongodb.com/docs/manual/installation/

2. Clone this repository:
   
   git clone <repository-url>
   cd nst-vanilla
   

3. Install dependencies:
   
   npm run install-all
   

4. Start the application:
   
   npm start
   

## Features
- Clean matrix-styled interface
- Real-time response capture
- Performance metrics tracking
- Data export capabilities
- Session management
- Trial randomization

## Architecture
- Frontend: React with Redux state management
- Backend: Express.js REST API
- Database: MongoDB for session and results storage
- Styling: CSS modules with matrix theme

## Development
The application runs on:
- Frontend: http://localhost:8080
- Backend: http://localhost:5000
- MongoDB: localhost:27017

## Experiment Flow
1. User starts new experiment session
2. System presents digits sequentially
3. User identifies each digit as odd or even
4. System captures response times and accuracy
5. Results available for export after completion

## Data Collection
- Response accuracy
- Response times
- Trial sequence data
- Performance metrics
- Session metadata

## License
ISC
