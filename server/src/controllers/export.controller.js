const exportServices = require('../services/export.services');

async function exportData(req, res) {
  try {
    const { content, contentType, filename } = await exportServices.buildExport(req.user.userId, req.query.format);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.type(contentType).send(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { exportData };
