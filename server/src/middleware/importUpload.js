const multer = require('multer');

const importUpload = (req, res, next) => {
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }).single('file')(req, res, (err) => {
    if (err) {
      err.status = err.status || (err instanceof multer.MulterError ? 400 : 500);
      return next(err);
    }
    next();
  });
};

module.exports = importUpload;
