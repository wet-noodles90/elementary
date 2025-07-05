const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');

// Ensure logged in
router.use((req,res,next) => req.session.uuid ? next() : res.redirect('/auth/login'));
// POST settings: displayName, color
router.post('/settings', async (req, res) => {
  const { displayName, color } = req.body;
  await db.updateUser(req.session.uuid, { displayName, color });
  const uuid = req.session.uuid;
  // generate code
  const scriptUrl = `https://${req.get('host')}/client.js`;
  const bookmark = `javascript:(function(){if(!window.jQuery){var s=document.createElement('script');s.src='https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js';document.body.appendChild(s);}if(!window.io){var i=document.createElement('script');i.src='https://cdn.socket.io/4.8.1/socket.io.min.js';document.body.appendChild(i)};if(!window.elementary){var m=document.createElement('meta');m.setAttribute('ele-uuid', '${uuid}');m.id='ele-uuid';document.head.appendChild(m);var mc=document.createElement('meta');mc.setAttribute('ele-color', '${color}');mc.id='ele-color';document.head.appendChild(mc);var mn=document.createElement('meta');mn.setAttribute('ele-name', '${displayName}');mn.id='ele-name';document.head.appendChild(mn);var c=document.createElement('script');c.src='${scriptUrl}';document.body.appendChild(c);}else{console.log("didn't inject elementary because it is already added!")}})();`;
  res.render('bookmarklet', { bookmark })
});

router.get('/player/:user', async (req, res) => {
  user = await db.getUserFromUUID(req.params.user);

  try {
    res.status(200).send(JSON.stringify({color: user.color, displayName: user.displayName}));
  } catch (e) {
    res.status(403).send("u smell and also u probably sent a bad uuid (or one that does not exist)")
  }
})

router.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, "..", "public", "dashboard.html")));

module.exports = router;