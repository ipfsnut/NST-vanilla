const app = require('./app');

const port = process.env.PORT || 5069;
const server = app.listen(port, () => {
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

module.exports = server;