const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// GET signup/login pages
router.get('/signup', (req, res) => res.sendFile('signup.html', { root: 'public' }));
router.get('/login', (req, res) => res.sendFile('login.html', { root: 'public' }));

// POST signup
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.addUser(username, hash);
    res.redirect('/auth/login');
  } catch (e) {
    res.send('Error: ' + e.message);
  }
});

// POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.getUser(username);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.uuid = user.uuid;
    res.redirect('/user/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// GET logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;