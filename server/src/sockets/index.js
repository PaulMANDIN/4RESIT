const { Server } = require('socket.io');

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
  });

  return io;
};
