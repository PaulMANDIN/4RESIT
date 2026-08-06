const importServices = require('../services/import.services');

async function importData(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier fourni.' });
  }

  try {
    const summary = await importServices.importData(req.user.userId, req.query.format, req.file.buffer);
    res.status(201).json(summary);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { importData };
