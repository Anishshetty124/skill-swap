import { Router } from 'express';
import passport from 'passport';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CORS_ORIGIN}/login`, 
    session: false,
  }),
  (req, res) => {
    const user = req.user;
    const accessToken = user.generateAccessToken();
    
   
    res.redirect(`${process.env.CORS_ORIGIN}/auth/success?token=${accessToken}`);
  }
);

export default router;
