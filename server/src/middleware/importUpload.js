const multer = require('multer');

// En mémoire : le fichier n'est jamais écrit sur disque, juste parsé puis jeté (cf. import.services.js).
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

module.exports = importUpload;
