import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import { app, server } from './socket/socket.js'; 

import connectDB from './config/db.js';
import './config/passport.setup.js'; 

import { ApiError } from './utils/ApiError.js';

import userRouter from './routes/user.routes.js';
import skillRouter from './routes/skill.routes.js';
import proposalRouter from './routes/proposal.routes.js';
import messageRouter from './routes/message.routes.js';
import authRouter from './routes/auth.routes.js'; 
import feedbackRouter from './routes/feedback.routes.js';

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

app.use(session({
    secret: process.env.SESSION_SECRET || 'a_default_session_secret', // Add a SESSION_SECRET to your .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/skills', skillRouter);
app.use('/api/v1/proposals', proposalRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/feedback', feedbackRouter);

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

