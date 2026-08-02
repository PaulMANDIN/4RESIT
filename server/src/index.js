require('dotenv').config();
const http = require('http');
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

require('./sockets')(server);

sequelize.sync().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
