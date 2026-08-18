const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${MIME_TO_EXTENSION[file.mimetype]}`),
});

function fileFilter(req, file, cb) {
  if (!MIME_TO_EXTENSION[file.mimetype]) {
    const err = new Error("Format d'image non supporté (jpeg, png, webp ou gif uniquement).");
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

const recipeImageUpload = (req, res, next) => {
  multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }).single('image')(req, res, (err) => {
    if (err) {
      err.status = err.status || (err instanceof multer.MulterError ? 400 : 500);
      return next(err);
    }
    next();
  });
};

module.exports = recipeImageUpload;
