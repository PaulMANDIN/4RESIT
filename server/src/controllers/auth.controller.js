const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const authServices = require('../services/auth.services');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

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

// Le front envoie le idToken obtenu via Google Identity Services (bouton "Sign in with Google").
// Vérifié ici via google-auth-library : audience = notre GOOGLE_CLIENT_ID, signature vérifiée
// contre les clés publiques Google. Aucune redirection, pas de client secret nécessaire pour ce flow.
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

    // Normalisé en minuscules comme register/login (validateRegister/validateLogin le font via
    // le sanitizer .toLowerCase()) : sans ça, un email Google à la casse différente ne matcherait
    // pas un compte existant et créerait un doublon.
    const email = payload.email.toLowerCase();
    let user = await authServices.getUserByOAuthAccount('google', payload.sub);

    if (!user) {
      // Email Google déjà vérifié par Google lui-même : on peut relier en confiance à un compte
      // existant créé par email/mot de passe avec la même adresse, plutôt que de dupliquer l'utilisateur.
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

module.exports = { register, login, me, googleAuth, googleConfig, signToken, toPublicUser };
