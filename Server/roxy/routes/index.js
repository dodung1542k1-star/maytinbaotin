const express = require('express');
const router = express.Router();

// CONFIG
router.use('/conf', require('./conf'));

// FILE MANAGER
router.use('/fileman', require('./fileman'));

module.exports = router;
