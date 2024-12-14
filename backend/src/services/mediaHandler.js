const fs = require('fs').promises;
const path = require('path');

class MediaHandler {
  constructor(baseDir) {
    this.basePath = baseDir;
    this.processQueue = [];
    this.processing = false;
    this.captures = new Map();  // Initialize Map before any operations
    this.queueStats = {
      processed: 0,
      failed: 0,
      lastCheck: Date.now()
    };
    this.STORAGE_RETRY = 3;
    this.BATCH_SIZE = 10;
    this.initQueueMonitor();
  }
  async queueCapture(captureData) {
    this.processQueue.push(captureData);
    if (!this.processing) {
      await this.processBatch();
    }
  }

  initQueueMonitor() {
    setInterval(() => {
      this.checkQueueHealth();
      this.cleanupStaleCaptures();
    }, 5000);
  }

  async checkQueueHealth() {
    const queueLength = this.processQueue.length;
    this.queueStats.lastCheck = Date.now();
    
    if (queueLength > 50) {
      console.warn(`Large queue size detected: ${queueLength}`);
    }
  }

  async processBatch() {
    this.processing = true;
    
    try {
      while (this.processQueue.length > 0) {
        const batch = this.processQueue.splice(0, this.BATCH_SIZE);
        
        await Promise.all(batch.map(async (captureData) => {
          for (let attempt = 0; attempt < this.STORAGE_RETRY; attempt++) {
            try {
              await this.saveTrialCapture(captureData.sessionId, captureData.trialId, captureData.data);
              this.queueStats.processed++;
              break;
            } catch (error) {
              if (attempt === this.STORAGE_RETRY - 1) {
                this.queueStats.failed++;
                throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }));
      }
    } finally {
      this.processing = false;
    }
  }

  async cleanupStaleCaptures() {
    const staleThreshold = Date.now() - (30 * 60 * 1000); // 30 minutes
    
    for (const [sessionId, captures] of this.captures.entries()) {
      const validCaptures = captures.filter(capture => 
        capture.timestamp > staleThreshold
      );
      
      if (validCaptures.length !== captures.length) {
        this.captures.set(sessionId, validCaptures);
        console.log(`Cleaned up ${captures.length - validCaptures.length} stale captures for session ${sessionId}`);
      }
    }
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

  async batchExportCaptures(sessionId) {
    const sessionPath = path.join(this.basePath, sessionId);
    const captures = await this.getSessionCaptures(sessionId);
    
    return {
      captures,
      metadata: await this.getSessionMetadata(sessionId),
      timestamp: Date.now()
    };
  }

  async getSessionMetadata(sessionId) {
    const sessionPath = path.join(this.basePath, sessionId);
    const files = await fs.readdir(sessionPath);
    
    return {
      sessionId,
      captureCount: files.length,
      createdAt: Date.now(),
      storagePath: sessionPath,
      format: 'jpg'
    };
  }
}

module.exports = MediaHandler;
