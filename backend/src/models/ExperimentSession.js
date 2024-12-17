const mongoose = require('mongoose');

const ExperimentSessionSchema = new mongoose.Schema({
  experimentId: {
    type: String,
    required: true,
    unique: true
  },
  trials: Array,
  state: Object,
  startTime: Date,
  responses: Array,
  config: Object,
  captureStats: {
    total: Number,
    successful: Number,
    failed: Number
  }
});

module.exports = mongoose.model('ExperimentSession', ExperimentSessionSchema);
