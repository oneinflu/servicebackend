const express = require('express');
// Note: Do not protect the payment view; the page itself uses token-based API calls.

const router = express.Router();

router.get('/payment', (req, res) => {
  res.render('payment', {
    layout: false
  });
});

module.exports = router;