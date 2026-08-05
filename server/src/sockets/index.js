const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ROLE_RANK } = require('../middleware/cookbook');
const cookbookServices = require('../services/cookbook.services');
const messageServices = require('../services/message.services');

function roomFor(cookbookId) {
  return `cookbook:${cookbookId}`;
}

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentification requise.'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Token invalide ou expiré.'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('cookbook:join', async (cookbookId, callback) => {
      try {
        const membership = await cookbookServices.getMembership(cookbookId, socket.user.userId);
        if (!membership) {
          return callback?.({ error: "Vous n'êtes pas membre de ce cookbook." });
        }
        socket.join(roomFor(cookbookId));
        callback?.({ ok: true });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    socket.on('cookbook:leave', (cookbookId) => {
      socket.leave(roomFor(cookbookId));
    });

    socket.on('message:send', async ({ cookbookId, content } = {}, callback) => {
      try {
        if (!content || !content.trim()) {
          return callback?.({ error: 'Le message ne peut pas être vide.' });
        }

        const membership = await cookbookServices.getMembership(cookbookId, socket.user.userId);
        if (!membership || ROLE_RANK[membership.role] < ROLE_RANK.COMMENTER) {
          return callback?.({ error: 'Rôle insuffisant pour envoyer un message.' });
        }

        const message = await messageServices.createMessage({
          cookbookId,
          userId: socket.user.userId,
          content: content.trim(),
        });
        const full = await messageServices.getMessageById(message.id);
        io.to(roomFor(cookbookId)).emit('message:new', full);
        callback?.({ ok: true });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });
  });

  return io;
};
