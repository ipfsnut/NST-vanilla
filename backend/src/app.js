const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const ServiceCoordinator = require('./services/ServiceCoordinator');
const NSTService = require('./services/nstService');
const PlatformService = require('./services/platformService');
const MediaHandler = require('./services/mediaHandler');
const routes = require('./routes');

// Initialize services
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: 'sessions'
});

const coordinator = new ServiceCoordinator(
  new NSTService(),
  new PlatformService(mongoStore),
  new MediaHandler()
);

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

// Inject coordinator into routes
app.use('/api', routes(coordinator));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;