const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { calcAverage } = require('../../util/utilities');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Trail = require('../../models/Trail');

const router = express.Router();

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Please provide a name').notEmpty(),
    check('email', 'Please provide a valid email').isEmail(),
    check(
      'password',
      'Password with at least 8 characters is required'
    ).isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //See if users exist
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'A user with this email already exists' }] });
      }

      user = new User({
        name,
        email,
        password,
      });

      //Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

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

// @route   PUT api/users/:user_id/name
// @desc    Update User's Name
// @access  Private, must be user given by the user_id
router.put(
  '/:user_id/name',
  [auth, [check('name', 'Name must not be empty').notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.id !== req.params.user_id) {
      return res.status(401).json({ errors: [{ msg: 'User not authorized' }] });
    }

    try {
      let user = await User.findById(req.user.id, '-password');
      if (!user) {
        return res.status(404).json({ errors: [{ msg: 'User not found' }] });
      }

      user.name = req.body.name;
      await user.save();
      res.json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/users/:user_id/password
// @desc    Update User's Password
// @access  Private, must be user given by the user_id
router.put(
  '/:user_id/password',
  [
    auth,
    [
      check('currentPassword', 'Current Password is required').isLength({
        min: 8,
      }),
      check(
        'newPassword',
        'New Password must be at least 8 characters'
      ).isLength({
        min: 8,
      }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.id !== req.params.user_id) {
      return res.status(401).json({ errors: [{ msg: 'User not authorized' }] });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      let user = await User.findById(req.user.id, 'password');
      if (!user) {
        return res.status(404).json({ errors: [{ msg: 'User not found' }] });
      }

      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Incorrect Password' }] });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();
      res.sendStatus(204);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/users/:user_id
// @desc    Delete user, their trail guides, and their posts/feedback
// @access  Private, must be user given by the user_id
router.delete('/:user_id', auth, async (req, res) => {
  if (req.user.id !== req.params.user_id) {
    return res.status(401).json({ errors: [{ msg: 'User not authorized' }] });
  }
  try {
    await Trail.deleteMany({ user: req.user.id });

    let trails = await Trail.find({});
    for (let trail of trails) {
      trail.posts = trail.posts.filter(
        (post) => post.user.toString() !== req.user.id
      );
      trail.average_rating = calcAverage(
        trail.posts.map((post) => post.rating)
      );

      trail.feedback = trail.feedback.filter(
        (feedback) => feedback.user.toString() !== req.user.id
      );

      await trail.save();
    }

    await User.deleteOne({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
