const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ephemera-nst');
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };