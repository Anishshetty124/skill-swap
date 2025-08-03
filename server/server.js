import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config({ path: './.env' });

import connectDB from './config/db.js';
import { ApiError } from './utils/ApiError.js';

import userRouter from './routes/user.routes.js';
import skillRouter from './routes/skill.routes.js';
import proposalRouter from './routes/proposal.routes.js';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.set('io', io);
connectDB();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
 
app.use('/api/v1/users', userRouter);
app.use('/api/v1/skills', skillRouter);
app.use('/api/v1/proposals', proposalRouter);

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined notification room: ${userId}`);
  });
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
