const fs = require('fs');
const path = require('path');

class MediaHandler {
  constructor(baseDir) {
    this.basePath = baseDir;
    this.processQueue = [];
    this.processing = false;
    this.captures = new Map();
    this.queueStats = {
      processed: 0,
      failed: 0,
      lastCheck: Date.now()
    };
    this.STORAGE_RETRY = 3;
    this.BATCH_SIZE = 10;
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
    
    this.initQueueMonitor();
  }

  initQueueMonitor() {
    setInterval(() => {
      if (this.processQueue.length > 0 && !this.processing) {
        this.processBatch();
      }
      this.updateQueueStats();
    }, 1000);
  }

  updateQueueStats() {
    this.queueStats.lastCheck = Date.now();
  }

  async processBatch() {
    this.processing = true;
    const batch = this.processQueue.splice(0, this.BATCH_SIZE);
    
    for (const item of batch) {
      try {
        await this.saveTrialCapture(item.experimentId, item.captureData, item.metadata);
        this.queueStats.processed++;
      } catch (error) {
        this.queueStats.failed++;
        console.error('Batch processing error:', error);
      }
    }
    
    this.processing = false;
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async saveTrialCapture(experimentId, captureData, metadata) {
    const filename = `nst_trial${metadata.trialNumber}_pos${metadata.digitIndex}_${Date.now()}.jpg`;
    const filepath = path.join(this.basePath, filename);
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(captureData.split(',')[1], 'base64');
    
    await fs.promises.writeFile(filepath, imageBuffer);
    
    return {
      filename,
      filepath,
      metadata: {
        experimentId,
        timestamp: metadata.timestamp,
        settings: metadata.settings,
        captureType: 'trial',
        format: 'jpg'
      }
    };
  }

  async validateCapture(captureData) {
    const size = Buffer.from(captureData.split(',')[1], 'base64').length;
    return {
      isValid: size > 0,
      size,
      format: 'jpg'
    };
  }

  async getCapturePath(filename) {
    return path.join(this.basePath, filename);
  }

  async deleteCapture(filename) {
    const filepath = path.join(this.basePath, filename);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      return true;
    }
    return false;
  }

  async getCaptureStats(filename) {
    const filepath = path.join(this.basePath, filename);
    if (fs.existsSync(filepath)) {
      const stats = await fs.promises.stat(filepath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }
    return null;
  }
}
module.exports = MediaHandler;