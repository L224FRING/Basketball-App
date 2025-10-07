import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/players.js';
import http from "http"
import gameRoutes from './routes/games.js';
import teamRoutes from './routes/teams.js';
import  initGameSockets  from './sockets/gameSockets.js';
import { protectSocket } from './middleware/socketAuth.js';
import { Server } from 'socket.io';

dotenv.config({ path: './config.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/teams', teamRoutes);

// Basic route
app.get('/', (_req, res) => {
  res.json({ message: 'Basketball MERN API is running!' });
});

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "PUT"]
    }
})

io.use(protectSocket)

initGameSockets(io);

app.set("io",io)

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/basketball';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
