const jwt = require('jsonwebtoken');
const authServices = require('../services/auth.services');

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  const token = auth.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }

  const user = await authServices.getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }

  req.user = payload;
  return next();
}

module.exports = { requireAuth };
