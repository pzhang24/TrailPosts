const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET api/trails
// @desc    Test route
// @access  Public
router.get('/', (req, res) => {
  res.send('Trails route');
});

module.exports = router;
