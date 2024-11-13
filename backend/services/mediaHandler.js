const fs = require('fs').promises;
const path = require('path');

class MediaHandler {
  constructor(baseDir = path.join(__dirname, '../data/captures')) {
    this.basePath = baseDir;
  }

  async initializeSession(sessionId) {
    const sessionPath = path.join(this.basePath, sessionId);
    await fs.mkdir(sessionPath, { recursive: true });
    return sessionPath;
  }

  async saveTrialResponse(sessionId, captureId, responseData) {
    const sessionPath = path.join(this.basePath, sessionId);
    const capturePath = path.join(sessionPath, captureId);
    const metadataPath = path.join(capturePath, 'metadata.json');
    
    await fs.writeFile(
      metadataPath, 
      JSON.stringify({
        timestamp: Date.now(),
        responseData
      })
    );

    return {
      sessionId,
      captureId,
      timestamp: Date.now(),
      status: 'captured'
    };
  }

  async saveTrialCapture(sessionId, trialId, captureData) {
    const sessionPath = await this.initializeSession(sessionId);
    const filename = `trial_${trialId}_${Date.now()}.jpg`;
    const filepath = path.join(sessionPath, filename);
    
    await fs.writeFile(filepath, captureData, 'base64');
    
    return {
      filepath,
      timestamp: Date.now(),
      metadata: {
        sessionId,
        trialId,
        captureTime: Date.now()
      }
    };
  }
  
  async validateCapture(captureData) {
    const isBase64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(captureData);
    
    return {
      isValid: isBase64,
      size: Buffer.from(captureData, 'base64').length,
      timestamp: Date.now()
    };
  }
  
  async getSessionCaptures(sessionId) {
    const sessionPath = path.join(this.basePath, sessionId);
    const files = await fs.readdir(sessionPath);
    
    return files.map(file => ({
      filename: file,
      path: path.join(sessionPath, file),
      metadata: {
        sessionId,
        trialId: file.split('_')[1],
        timestamp: parseInt(file.split('_')[2])
      }
    }));
  }
  

  async cleanupSession(sessionId) {
    const sessionPath = path.join(this.basePath, sessionId);
    await fs.rm(sessionPath, { recursive: true, force: true });
  }
}

module.exports = MediaHandler;