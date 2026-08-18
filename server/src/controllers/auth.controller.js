const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const authServices = require('../services/auth.services');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('supmeal-dummy-password', 10);

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
    const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !user.passwordHash || !valid) {
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

async function googleAuth(req, res) {
  if (!googleClient) {
    return res.status(501).json({ message: "Connexion Google non configurée pour l'instant." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(401).json({ message: 'Email Google non vérifié.' });
    }

    const email = payload.email.toLowerCase();
    let user = await authServices.getUserByOAuthAccount('google', payload.sub);

    if (!user) {
      user = await authServices.getUserByEmail(email);
      if (!user) {
        user = await authServices.createUser({
          name: payload.name || email,
          email,
          passwordHash: null,
          avatar: payload.picture || null,
        });
        await authServices.createDefaultPreferences(user.id);
      }
      await authServices.linkOAuthAccount({ userId: user.id, provider: 'google', providerId: payload.sub });
    }

    res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    res.status(401).json({ message: 'Jeton Google invalide.' });
  }
}

function googleConfig(req, res) {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
}

async function updateProfile(req, res) {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.avatar !== undefined) data.avatar = req.body.avatar || null;

    const user = await authServices.updateUser(req.user.userId, data);
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await authServices.getUserById(req.user.userId);

    if (user.passwordHash) {
      const valid = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
      if (!valid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authServices.updateUser(user.id, { passwordHash });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getPreferences(req, res) {
  try {
    const preferences = await authServices.getPreferences(req.user.userId);
    res.json({ preferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updatePreferences(req, res) {
  try {
    const data = {};
    const fields = ['diet', 'allergies', 'cuisineTypes', 'defaultPortions'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    const preferences = await authServices.updatePreferences(req.user.userId, data);
    res.json({ preferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  register, login, me, googleAuth, googleConfig,
  updateProfile, changePassword, getPreferences, updatePreferences,
  signToken, toPublicUser,
};
