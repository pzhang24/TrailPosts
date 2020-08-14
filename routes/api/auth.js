const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');

const router = express.Router();

// @route   GET api/auth
// @desc    Get authenticated user's info
// @access  Private

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth
// @desc    Authenticate user (Login) & get token
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      //See if users exist
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Incorrect email or password' }] });
      }

      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (!passwordsMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Incorrect email or password' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (error, token) => {
          if (error) throw error;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
