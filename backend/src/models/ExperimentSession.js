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
  config: Object
});

module.exports = mongoose.model('ExperimentSession', ExperimentSessionSchema);
