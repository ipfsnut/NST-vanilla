require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const nstService = require('./services/nstService');
const MediaHandler = require('./services/mediaHandler');
const routes = require('./routes');

// Initialize services
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: 'sessions'
});

const mediaHandler = new MediaHandler();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(session({
  store: mongoStore,
  secret: 'nst-experiment-secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
      secure: false,
      sameSite: 'lax'
  }
}));

app.use(morgan('dev'));
app.use(express.json());

// Routes with direct service injection
app.use('/api', routes({ nstService, mediaHandler }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(err.status || 500).json({
      message: err.message || 'Something went wrong!',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;