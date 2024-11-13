const multer = require('multer');
const path = require('path');
const winston = require('winston');

// Goal 4: Image Handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const processImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Here you can add any image processing logic
  // For now, we'll just log the file info
  winston.info(`Processed image: ${req.file.filename}`);
  next();
};

module.exports = { upload, processImage };
