const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/user');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  store: new SQLiteStore({ db: 'data/users.db' }),
  secret: uuidv4(),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }
}));

app.set('view engine', 'ejs');

// Routes
app.use('/', express.static(path.join(__dirname, '..', 'public')));
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Socket.IO real-time
const rooms = {};
io.on('connection', socket => {
  socket.on('join', ({ player, page }) => {
    socket.join(page);
    socket.player = player;
    socket.page = page;
    if (!rooms[page]) {
      rooms[page] = []
    }
    rooms[page].push(player);
    // broadcast new user initial
    io.to(page).emit('update', rooms[page] || []);
  });
  socket.on('move', data => {
    const page = socket.page;
    rooms[page] = rooms[page] || [];
    socket.player = data;
    rooms[page][rooms[page].findIndex(p => p.name === socket.player.name)] = data;

    // send all
    io.to(page).emit('update', Object.values(rooms[page]));
  });
  socket.on('message', player => {
    const page = socket.page;
    rooms[page] = rooms[page] || [];

    socket.player = player;
    rooms[page][rooms[page].findIndex(p => p.name === socket.player.name)] = player;

    // send all
    io.to(page).emit('update', Object.values(rooms[page]));
  });
  socket.on('disconnect', () => {
    const page = socket.page;
    if (rooms[page]) { delete rooms[page][rooms[page].findIndex(p => p.name === socket.player.name)]; }
    io.to(page).emit('update', Object.values((rooms[page]||[])));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));