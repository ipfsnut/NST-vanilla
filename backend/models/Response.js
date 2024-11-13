const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  trialNumber: {
    type: Number,
    required: true
  },
  sequence: {
    type: String,
    required: true
  },
  responses: [{
    digit: Number,
    response: String,
    isCorrect: Boolean,
    timestamp: Number
  }],
  performanceMetrics: {
    accuracy: Number,
    averageResponseTime: Number,
    switchCosts: [Number]
  }
}, { timestamps: true });

module.exports = mongoose.model('Response', ResponseSchema);
