const rateLimit = require('express-rate-limit');

// Une instance par route : sinon express-rate-limit partagerait le même
// compteur entre /login, /register et /google pour une même IP, et un
// utilisateur légitime bloqué sur l'un se retrouverait aussi bloqué sur les autres.
function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de tentatives, réessaie plus tard.' },
  });
}

module.exports = { createAuthRateLimiter };
