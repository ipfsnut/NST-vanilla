const crypto = require('crypto');

const generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

module.exports = { generateSessionId };
