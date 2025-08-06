import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { app, server } from './socket/socket.js'; 

import connectDB from './config/db.js';
import { ApiError } from './utils/ApiError.js';

import userRouter from './routes/user.routes.js';
import skillRouter from './routes/skill.routes.js';
import proposalRouter from './routes/proposal.routes.js';
import messageRouter from './routes/message.routes.js';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 8000;

connectDB();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use('/api/v1/messages', messageRouter);

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

server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

