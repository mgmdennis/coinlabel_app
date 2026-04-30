
const express = require('express');
const axios = require('axios');
const User = require('../models/userModel');
const router = express.Router();

// Get current user info
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const user = await User.findById(req.session.userId).select('-accessToken -refreshToken');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Config (replace with your actual values or use env vars)
const NUMISTA_CLIENT_ID = process.env.NUMISTA_CLIENT_ID;
const NUMISTA_API_KEY = process.env.NUMISTA_API_KEY; 
// Remove static NUMISTA_REDIRECT_URI; will construct dynamically
const NUMISTA_AUTH_URL = 'https://en.numista.com/api/oauth_authorize.php';
const NUMISTA_TOKEN_URL = 'https://api.numista.com/v3/oauth_token';

// Step 1: Redirect user to Numista OAuth
router.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const scope = 'view_collection';
  // Dynamically construct redirect_uri for Numista OAuth
  const protocol = req.protocol || 'https';
  const host = req.get('host');
  const redirectUri = `${protocol}://${host}/api/auth/callback`;
  const url = `${NUMISTA_AUTH_URL}?response_type=code&client_id=${NUMISTA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  res.redirect(url);
});

// Step 2: Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    // Dynamically construct redirect_uri to match what was sent to Numista
    const protocol = req.protocol || 'https';
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/auth/callback`;
    // Debug: log the API key being used
    console.log('NUMISTA_API_KEY:', process.env.NUMISTA_API_KEY);
    // Exchange code for access token (POST, x-www-form-urlencoded)
    const qs = require('querystring');
    const tokenRes = await axios.post(NUMISTA_TOKEN_URL, qs.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: NUMISTA_CLIENT_ID,
      client_secret: NUMISTA_API_KEY,
      redirect_uri: redirectUri
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('Numista token response:', tokenRes.data);
    const { access_token, user_id } = tokenRes.data;
    let userRes;
    let numistaId;
    if (user_id) {
      // Use the correct endpoint with user_id
      userRes = await axios.get(`https://api.numista.com/v3/users/${user_id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Numista-API-Key': process.env.NUMISTA_API_KEY
        }
      });
      numistaId = user_id;
    } else {
      // Fallback: try /me (may fail)
      userRes = await axios.get('https://api.numista.com/v3/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Numista-API-Key': process.env.NUMISTA_API_KEY
        }
      });
      numistaId = userRes.data.id;
    }
    // Upsert user
    let user = await User.findOneAndUpdate(
      { numistaId },
      { accessToken: access_token, username: userRes.data.username },
      { upsert: true, new: true }
    );
    // Set session/cookie (or return token)
    req.session.userId = user._id;
    // Environment-aware frontend redirect
    let redirectUrl = '/';
    if (process.env.NODE_ENV === 'production') {
      const protocol = req.protocol || 'https';
      redirectUrl = `${protocol}://${req.get('host')}/`;
    } else {
      // Development: always redirect to React dev server
      redirectUrl = 'http://localhost:3000/';
    }
    res.redirect(redirectUrl);
  } catch (err) {
    // Log full error details for debugging
    if (err.response) {
      console.error('Numista token error:', err.response.status, err.response.data);
      res.status(500).json({ error: err.response.data || err.message });
    } else {
      console.error('Numista token error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// Step 3: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
