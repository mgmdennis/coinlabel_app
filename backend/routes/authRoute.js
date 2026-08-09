
const express = require('express');
const axios = require('axios');
const User = require('../models/userModel');
const requireAuth = require('../middleware/requireAuth');
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
const NUMISTA_AUTH_URL = 'https://en.numista.com/api/oauth_authorize.php';
const NUMISTA_TOKEN_URL = 'https://api.numista.com/v3/oauth_token';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function getRedirectUri(req) {
  if (process.env.NUMISTA_REDIRECT_URI) return process.env.NUMISTA_REDIRECT_URI;
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}/api/auth/callback`;
}

// Step 1: Redirect user to Numista OAuth
router.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const scope = 'view_collection';
  const redirectUri = getRedirectUri(req);
  const url = `${NUMISTA_AUTH_URL}?response_type=code&client_id=${NUMISTA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  res.redirect(url);
});

// Step 2: Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const redirectUri = getRedirectUri(req);
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
      redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000/';
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

// --- Google OAuth ---

// Step 1: Redirect user to Google OAuth
router.get('/google/login', (req, res) => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id') {
    return res.status(500).send('Google OAuth not configured');
  }
  const state = Math.random().toString(36).substring(2);
  const redirectUri = getRedirectUri(req).replace('/auth/callback', '/auth/google/callback');
  const scope = 'openid email profile';
  const url = `${GOOGLE_AUTH_URL}?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
});

// Step 2: Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const redirectUri = getRedirectUri(req).replace('/auth/callback', '/auth/google/callback');
    const qs = require('querystring');
    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, qs.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const { access_token } = tokenRes.data;

    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const { id: googleId, email, name } = userRes.data;

    // Find existing user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // No Google user — try to match by email (in case Numista user has same email)
      // (Numista doesn't return email, so this won't match for now, but future-proof)
      user = await User.findOne({ email });
      if (user) {
        // Link Google to existing account
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new Google-only user
        user = await User.create({
          googleId,
          email,
          username: name || email,
        });
      }
    }

    req.session.userId = user._id;
    let redirectUrl = '/';
    if (process.env.NODE_ENV === 'production') {
      const protocol = req.protocol || 'https';
      redirectUrl = `${protocol}://${req.get('host')}/`;
    } else {
      redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000/';
    }
    res.redirect(redirectUrl);
  } catch (err) {
    if (err.response) {
      console.error('Google token error:', err.response.status, err.response.data);
      res.status(500).json({ error: err.response.data || err.message });
    } else {
      console.error('Google token error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// --- Account Linking ---

// Link Google account to the currently logged-in user
router.get('/link/google', requireAuth, (req, res) => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id') {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  const state = Math.random().toString(36).substring(2);
  req.session.linkGoogleState = state;
  const redirectUri = getRedirectUri(req).replace('/auth/callback', '/auth/link/google/callback');
  const scope = 'openid email profile';
  const url = `${GOOGLE_AUTH_URL}?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
});

// Handle linking callback
router.get('/link/google/callback', requireAuth, async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');
  if (state !== req.session.linkGoogleState) return res.status(400).send('State mismatch');

  try {
    const redirectUri = getRedirectUri(req).replace('/auth/callback', '/auth/link/google/callback');
    const qs = require('querystring');
    const tokenRes = await axios.post(GOOGLE_TOKEN_URL, qs.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const { access_token } = tokenRes.data;

    const userRes = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const { id: googleId, email, name } = userRes.data;

    // Check if this Google account is already linked to another user
    const existing = await User.findOne({ googleId });
    if (existing && existing._id.toString() !== req.session.userId) {
      return res.status(400).send('This Google account is already linked to another user');
    }

    // Link to current user
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found');
    user.googleId = googleId;
    if (!user.email) user.email = email;
    await user.save();

    delete req.session.linkGoogleState;

    let redirectUrl = '/settings';
    if (process.env.NODE_ENV === 'production') {
      const protocol = req.protocol || 'https';
      redirectUrl = `${protocol}://${req.get('host')}/settings`;
    } else {
      redirectUrl = (process.env.FRONTEND_URL || 'http://localhost:3000/') + 'settings';
    }
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google link error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Unlink Google account
router.post('/unlink/google', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.numistaId && !user.googleId) {
      return res.status(400).json({ error: 'Cannot unlink the only auth method' });
    }
    user.googleId = undefined;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get auth providers status for current user
router.get('/providers', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select('numistaId googleId username email');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    numista: !!user.numistaId,
    google: !!user.googleId,
    username: user.username,
    email: user.email,
  });
});

module.exports = router;
