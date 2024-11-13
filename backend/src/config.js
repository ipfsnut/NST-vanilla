module.exports = {
  mongoUri: 'mongodb://localhost:27017/ephemera',
  experimentConfig: require('./experimentConfig'),
  port: process.env.PORT || 5069,
  env: process.env.NODE_ENV || 'development'
};
