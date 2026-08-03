const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authServices = require('../services/auth.services');

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name, avatar: user.avatar },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const existing = await authServices.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await authServices.createUser({ name, email, passwordHash });
    await authServices.createDefaultPreferences(user.id);

    res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await authServices.getUserByEmail(email);
    const valid = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await authServices.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Structure prête pour la connexion Google : le front enverra le idToken obtenu
// via Google Identity Services, vérifié ici avec google-auth-library.
// Vérification réelle à brancher une fois les credentials Google Cloud configurés.
async function googleAuth(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ message: "Connexion Google non configurée pour l'instant." });
  }
  res.status(501).json({ message: 'Vérification du token Google pas encore implémentée.' });
}

module.exports = { register, login, me, googleAuth, signToken, toPublicUser };
