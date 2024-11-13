const mongoose = require('mongoose');

const ExperimentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  configuration: {
    type: Object,
    required: true,
  },
  trials: [{
    type: Object,
    required: true,
  }],
  responses: [{
    type: Object,
  }],
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Experiment', ExperimentSchema);
