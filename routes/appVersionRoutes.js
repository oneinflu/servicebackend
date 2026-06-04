const express = require('express');
const router = express.Router();
const { getAppVersion } = require('../controllers/appVersionController');

router.get('/', getAppVersion);

module.exports = router;
