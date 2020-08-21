const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { calcAverage } = require('../../util/utilities');
const { check, validationResult } = require('express-validator');

const Trail = require('../../models/Trail');

// --Routes--
// @route   POST api/trails
// @desc    Create a new trail
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').notEmpty(),
      check('province_state', 'Province or State is required').notEmpty(),
      //distance should be in metres
      check('distance', 'Distance (non-negative integer) is required').isInt({
        min: 0,
      }),
      check('trail_type', 'Trail Type is required').notEmpty(),
      check('elevation_gain', 'Elevation gain must be non-negative integer')
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check('elevation_loss', 'Elevation loss must be non-negative integer')
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check(
        'completion_time_days',
        'The completion time in days must be an Integer at least 0'
      )
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check(
        'completion_time_hours',
        'The completion time in hours must be an Integer between 0 and 23'
      )
        .optional({ nullable: true })
        .isInt({ min: 0, max: 23 }),
      check(
        'completion_time_minutes',
        'The completion time in minutes must be an Integer between 0 and 59'
      )
        .optional({ nullable: true })
        .isInt({ min: 0, max: 59 }),
      check('difficulty', 'Difficulty is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
    ],
  ],
  async (req, res) => {
    //Convert non-string properties to strings
    for (key in req.body) {
      if (typeof req.body[key] !== 'string') {
        req.body[key] = req.body[key] + '';
      }
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Reconvert numeric strings back to numbers
    req.body.distance = req.body.distance && parseInt(req.body.distance, 10);
    req.body.elevation_gain =
      req.body.elevation_gain && parseInt(req.body.elevation_gain, 10);
    req.body.elevation_loss =
      req.body.elevation_loss && parseInt(req.body.elevation_loss, 10);
    req.body.completion_time_days =
      req.body.completion_time_days &&
      parseInt(req.body.completion_time_days, 10);
    req.body.completion_time_hours =
      req.body.completion_time_hours &&
      parseInt(req.body.completion_time_hours, 10);
    req.body.completion_time_minutes =
      req.body.completion_time_minutes &&
      parseInt(req.body.completion_time_minutes, 10);

    const {
      name,
      region,
      province_state,
      distance,
      trail_type,
      season,
      elevation_gain,
      elevation_loss,
      completion_time_days,
      completion_time_hours,
      completion_time_minutes,
      difficulty,
      description,
      technical_challenges,
      hazards,
      sights_features,
      flora_fauna,
    } = req.body;

    const fields = {};
    fields.user = req.user.id;
    fields.name = name ? name : undefined;
    fields.region = region ? region : undefined;
    fields.province_state = province_state ? province_state : undefined;
    fields.distance = typeof distance === 'number' ? distance : undefined;
    fields.trail_type = trail_type ? trail_type : undefined;
    fields.season = season ? season : undefined;
    fields.elevation_gain =
      typeof elevation_gain === 'number' ? elevation_gain : undefined;
    fields.elevation_loss =
      typeof elevation_gain === 'number' ? elevation_loss : undefined;
    fields.completion_time_days =
      typeof completion_time_days === 'number'
        ? completion_time_days
        : undefined;

    fields.completion_time_hours =
      typeof completion_time_hours === 'number'
        ? completion_time_hours
        : undefined;

    fields.completion_time_minutes =
      typeof completion_time_minutes === 'number'
        ? completion_time_minutes
        : undefined;
    fields.difficulty = difficulty ? difficulty : undefined;
    fields.description = description ? description : undefined;

    fields.technical_challenges = technical_challenges
      ? technical_challenges.split(',').map((item) => item.trim())
      : undefined;
    fields.hazards = hazards
      ? hazards.split(',').map((item) => item.trim())
      : undefined;

    fields.sights_features = sights_features
      ? sights_features.split(',').map((item) => item.trim())
      : undefined;
    fields.flora_fauna = flora_fauna
      ? flora_fauna.split(',').map((item) => item.trim())
      : undefined;
    fields.average_rating = undefined;

    try {
      let trail = await Trail.findOne({ name: `${name}` });
      if (trail) {
        return res.status(400).json({
          errors: [{ msg: 'A guide with this trail name already exists' }],
        });
      }

      trail = new Trail(fields);

      await trail.save();
      await trail.populate('user', ['name']).execPopulate();
      res.json(trail);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/trails
// @desc    Get trail info & ratings for all trails
// @access  Public
router.get('/', async (req, res) => {
  var {
    author,
    search,
    minRating,
    province_state,
    difficulty,
    minDistance,
    maxDistance,
  } = req.query;

  //Convert to int
  minRating = minRating && parseInt(minRating);
  minDistance = minDistance && parseInt(minDistance);
  maxDistance = maxDistance && parseInt(maxDistance);

  if (minRating < 0 || minDistance < 0 || maxDistance < 0) {
    return res.status(400).json({
      errors: {
        msg:
          'minRating, minDistance, and maxDistance query params must be non-negative.',
      },
    });
  }

  var filters = {};

  if (author) filters.user = author;
  if (province_state) filters.province_state = province_state;
  if (difficulty) filters.difficulty = difficulty;
  if (search) filters.name = new RegExp(search, 'i');

  if (typeof minRating === 'number')
    filters.rating = { average_rating: { $gte: minRating } };

  var distancefilter = {};
  if (typeof minDistance === 'number') distancefilter.$gte = minDistance;
  if (typeof maxDistance === 'number') distancefilter.$lte = maxDistance;
  if (Object.keys(distancefilter).length) filters.distance = distancefilter;

  try {
    let trails = await Trail.find(filters, '-posts -feedback').populate(
      'user',
      ['name']
    );
    res.json(trails);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/trails/:trail_id
// @desc    Get trail info & rating by id
// @access  Public
router.get('/:trail_id', async (req, res) => {
  try {
    let trail = await Trail.findById(
      req.params.trail_id,
      '-posts -feedback'
    ).populate('user', ['name']);

    if (!trail) return res.status(404).json({ msg: 'Trail not found' });
  } catch (error) {
    if (error.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Trail not found' });
    }

    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/trails/:trail_id
// @desc    Replace trail info
// @access  Private, must be author of trail guide
router.put(
  '/:trail_id',
  [
    auth,
    [
      check('name', 'Name is required').notEmpty(),
      check('province_state', 'Province or State is required').notEmpty(),
      //distance should be in metres
      check('distance', 'Distance (non-negative integer) is required').isInt({
        min: 0,
      }),
      check('trail_type', 'Trail Type is required').notEmpty(),
      check('elevation_gain', 'Elevation gain must be non-negative integer')
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check('elevation_loss', 'Elevation loss must be non-negative integer')
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check(
        'completion_time_days',
        'The completion time in days must be an Integer at least 0'
      )
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check(
        'completion_time_hours',
        'The completion time in hours must be an Integer between 0 and 23'
      )
        .optional({ nullable: true })
        .isInt({ min: 0, max: 23 }),
      check(
        'completion_time_minutes',
        'The completion time in minutes must be an Integer between 0 and 59'
      )
        .optional({ nullable: true })
        .isInt({ min: 0, max: 59 }),
      check('difficulty', 'Difficulty is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
    ],
  ],
  async (req, res) => {
    //Convert non-string properties to strings
    for (key in req.body) {
      if (typeof req.body[key] !== 'string') {
        req.body[key] = req.body[key] + '';
      }
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Reconvert numeric strings back to numbers
    req.body.distance = req.body.distance && parseInt(req.body.distance, 10);
    req.body.elevation_gain =
      req.body.elevation_gain && parseInt(req.body.elevation_gain, 10);
    req.body.elevation_loss =
      req.body.elevation_loss && parseInt(req.body.elevation_loss, 10);
    req.body.completion_time_days =
      req.body.completion_time_days &&
      parseInt(req.body.completion_time_days, 10);
    req.body.completion_time_hours =
      req.body.completion_time_hours &&
      parseInt(req.body.completion_time_hours, 10);
    req.body.completion_time_minutes =
      req.body.completion_time_minutes &&
      parseInt(req.body.completion_time_minutes, 10);

    const {
      name,
      region,
      province_state,
      distance,
      trail_type,
      season,
      elevation_gain,
      elevation_loss,
      completion_time_days,
      completion_time_hours,
      completion_time_minutes,
      difficulty,
      description,
      technical_challenges,
      hazards,
      sights_features,
      flora_fauna,
    } = req.body;

    const fields = {};
    fields.user = req.user.id;
    fields.last_revised = new Date();
    fields.name = name ? name : undefined;
    fields.region = region ? region : undefined;
    fields.province_state = province_state ? province_state : undefined;
    fields.distance = typeof distance === 'number' ? distance : undefined;
    fields.trail_type = trail_type ? trail_type : undefined;
    fields.season = season ? season : undefined;
    fields.elevation_gain =
      typeof elevation_gain === 'number' ? elevation_gain : undefined;
    fields.elevation_loss =
      typeof elevation_gain === 'number' ? elevation_loss : undefined;
    fields.completion_time_days =
      typeof completion_time_days === 'number'
        ? completion_time_days
        : undefined;

    fields.completion_time_hours =
      typeof completion_time_hours === 'number'
        ? completion_time_hours
        : undefined;

    fields.completion_time_minutes =
      typeof completion_time_minutes === 'number'
        ? completion_time_minutes
        : undefined;
    fields.difficulty = difficulty ? difficulty : undefined;
    fields.description = description ? description : undefined;

    fields.technical_challenges = technical_challenges
      ? technical_challenges.split(',').map((item) => item.trim())
      : undefined;
    fields.hazards = hazards
      ? hazards.split(',').map((item) => item.trim())
      : undefined;

    fields.sights_features = sights_features
      ? sights_features.split(',').map((item) => item.trim())
      : undefined;
    fields.flora_fauna = flora_fauna
      ? flora_fauna.split(',').map((item) => item.trim())
      : undefined;

    try {
      let trail = await Trail.findById(req.params.trail_id, '-posts -feedback');

      //Check that trail exists
      if (!trail) {
        return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
      }
      //Check that author of trail is the logged in user
      console.log(req.user.id);
      console.log(trail.user.toString());
      if (req.user.id !== trail.user.toString()) {
        return res.status(401).json({
          errors: [{ msg: 'User not authorized' }],
        });
      }

      //See if trail name is already taken
      let trailNameExists = await Trail.findOne({ name: `${name}` });
      if (
        trailNameExists &&
        trailNameExists.id.toString() !== req.params.trail_id
      ) {
        return res.status(400).json({
          errors: [{ msg: 'A guide with this trail name already exists' }],
        });
      }

      //Find trail by id and replace
      trail = await Trail.findOneAndUpdate(req.params.trail_id, fields, {
        new: true,
      }).populate('user', ['name']);
      res.json(trail);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/trails/:trail_id
// @desc    Delete trail (info, posts, and feedback)
// @access  Private, must be author of trail guide
router.delete('/:trail_id', auth, async (req, res) => {
  try {
    let trail = await Trail.findById(req.params.trail_id, '-posts -feedback');
    //Check that trail exists
    if (!trail) {
      return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
    }
    //Check that author of trail is the logged in user
    if (req.user.id !== trail.user.toString()) {
      return res.status(401).json({
        errors: [{ msg: 'User not authorized' }],
      });
    }

    await Trail.findByIdAndDelete(req.params.trail_id);
    res.json({ msg: 'Trail Deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/trails/:trail_id/posts
// @desc    Add post to trail
// @access  Private
router.post(
  '/:trail_id/posts',
  [
    auth,
    [
      check('title', 'Title is required').notEmpty(),
      check('text', 'Text is required').notEmpty(),
      check('rating', 'The rating must be an Integer between 0 and 5')
        .optional({ nullable: true })
        .isInt({ min: 0, max: 5 }),
      check(
        'completion_time_days',
        'The completion time in days must be an Integer at least 0'
      )
        .optional({ nullable: true })
        .isInt({ min: 0 }),
      check(
        'completion_time_hours',
        'The completion time in hours must be an Integer between 0 and 23'
      )
        .optional({ nullable: true })
        .isInt({ min: 0, max: 23 }),
      check(
        'completion_time_minutes',
        'The completion time in minutes must be an Integer between 0 and 59'
      )
        .optional({ nullable: true })
        .isInt({ min: 0, max: 59 }),
    ],
  ],
  async (req, res) => {
    try {
      //Convert non-string properties to strings
      for (key in req.body) {
        if (typeof req.body[key] !== 'string') {
          req.body[key] = req.body[key] + '';
        }
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      }

      let trail = await Trail.findById(req.params.trail_id, 'rating posts');
      //Check that trail exists
      if (!trail) {
        return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
      }

      //Reobtain numeric properties
      req.body.rating = req.body.rating && parseInt(req.body.rating, 10);
      req.body.completion_time_days =
        req.body.completion_time_days &&
        parseInt(req.body.completion_time_days, 10);
      req.body.completion_time_hours =
        req.body.completion_time_hours &&
        parseInt(req.body.completion_time_hours, 10);
      req.body.completion_time_minutes =
        req.body.completion_time_minutes &&
        parseInt(req.body.completion_time_minutes, 10);

      const {
        rating,
        completion_time_days,
        completion_time_hours,
        completion_time_minutes,
        difficulty,
        title,
        text,
      } = req.body;

      const newPost = {};
      newPost.user = req.user.id;
      newPost.rating = typeof rating === 'number' ? rating : undefined;
      newPost.completion_time_days =
        typeof completion_time_days === 'number'
          ? completion_time_days
          : undefined;
      newPost.completion_time_hours =
        typeof completion_time_hours === 'number'
          ? completion_time_hours
          : undefined;
      newPost.completion_time_minutes =
        typeof completion_time_minutes === 'number'
          ? completion_time_minutes
          : undefined;
      newPost.difficulty = difficulty ? difficulty : undefined;
      newPost.title = title ? title : undefined;
      newPost.text = text ? text : undefined;

      trail.posts.unshift(newPost);

      trail.average_rating = calcAverage(
        trail.posts.map((post) => post.rating)
      );

      await trail.save();

      await trail.populate('posts.user', ['name']).execPopulate();

      res.json(trail.posts);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/trails/:trail_id/posts
// @desc    Get all posts for a trail
// @access  Private
router.get('/:trail_id/posts', auth, async (req, res) => {
  try {
    const trail = await Trail.findById(
      req.params.trail_id,
      'posts'
    ).populate('posts.user', ['name']);

    //Check that trail exists
    if (!trail) {
      return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
    }

    res.json(trail.posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/trails/:trail_id/posts/:post_id
// @desc    Delete a post from a trail
// @access  Private, must be author of post
router.delete('/:trail_id/posts/:post_id', auth, async (req, res) => {
  const { trail_id, post_id } = req.params;

  try {
    const trail = await Trail.findById(trail_id, 'posts');

    //Check if trail exists
    if (!trail) {
      return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
    }

    //Check if post exists
    const post = trail.posts.find((post) => post.id.toString() === post_id);
    if (!post) {
      return res.status(404).json({ errors: [{ msg: 'Post not found' }] });
    }

    //Check to see if user authorized
    if (req.user.id !== post.user.toString()) {
      return res.status(401).json({ errors: [{ msg: 'User not authorized' }] });
    }

    //Filter out post to be deleted
    trail.posts = trail.posts.filter((post) => post.id.toString() !== post_id);

    //Calculate average rating
    trail.average_rating = calcAverage(trail.posts.map((post) => post.rating));

    await trail.save();
    await trail.populate('post.user', ['name']).execPopulate();

    res.json(trail.posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/trails/:trail_id/feedback
// @desc    Add feedback to trail
// @access  Private
router.post(
  '/:trail_id/feedback',
  [
    auth,
    [
      check('title', 'Title is required').notEmpty(),
      check('text', 'Text is required').notEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      }

      let trail = await Trail.findById(req.params.trail_id, 'feedback');
      //Check that trail exists
      if (!trail) {
        return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
      }

      const { title, text } = req.body;

      const newFeedback = {};
      newFeedback.user = req.user.id;
      if (title) newFeedback.title = title;
      if (text) newFeedback.text = text;

      trail.feedback.unshift(newFeedback);
      await trail.save();

      await trail.populate('feedback.user', ['name']).execPopulate();

      res.json(trail.feedback);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/trails/:trail_id/feedback
// @desc    Get all feedback for a trail
// @access  Private
router.get('/:trail_id/feedback', auth, async (req, res) => {
  try {
    const trail = await Trail.findById(
      req.params.trail_id,
      'feedback'
    ).populate('feedback.user', ['name']);

    //Check that trail exists
    if (!trail) {
      return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
    }

    res.json(trail.feedback);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/trails/:trail_id/feedback/:feedback_id
// @desc    Delete a feedback from a trail
// @access  Private, must be author of feedback
router.delete('/:trail_id/feedback/:feedback_id', auth, async (req, res) => {
  const { trail_id, feedback_id } = req.params;

  try {
    const trail = await Trail.findById(trail_id, 'feedback');

    //Check if trail exists
    if (!trail) {
      return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
    }

    //Check if feedback exists
    const feedback = trail.feedback.find(
      (feedback) => feedback.id.toString() === feedback_id
    );
    if (!feedback) {
      return res.status(404).json({ errors: [{ msg: 'feedback not found' }] });
    }

    //Check to see if user authorized
    if (req.user.id !== feedback.user.toString()) {
      return res.status(401).json({ errors: [{ msg: 'User not authorized' }] });
    }

    //Filter out feedback to be deleted
    trail.feedback = trail.feedback.filter(
      (feedback) => feedback.id.toString() !== feedback_id
    );

    await trail.save();
    await trail.populate('feedback.user', ['name']).execPopulate();

    res.json(trail.feedback);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/trails/:trail_id/feedback/:feedback_id
// @desc    Update feedback
// @access  Private, must be author of feedback (to modify title/text),
//          or author of trail (to mark/unmark resolved)
router.patch(
  '/:trail_id/feedback/:feedback_id',
  [
    auth,
    [
      check('title', 'Title must be at least one character long')
        .optional({ nullable: true })
        .notEmpty(),
      check('text', 'Text must be at least one character long')
        .optional({ nullable: true })
        .notEmpty(),
      check('resolved', 'Resolved must be a boolean value')
        .optional({ nullable: true })
        .isBoolean(),
    ],
  ],
  async (req, res) => {
    //Convert non-string properties to string
    for (key in req.body) {
      if (typeof req.body[key] !== 'string') {
        req.body[key] = req.body[key] + '';
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    //Convert resolved back to boolean if it is either true or false
    if (req.body.resolved === 'true') req.body.resolved = true;
    if (req.body.resolved === 'false') req.body.resolved = false;

    const { title, text, resolved } = req.body;
    const { trail_id, feedback_id } = req.params;

    try {
      const trail = await Trail.findById(trail_id, 'user feedback');

      //Check if trail exists
      if (!trail) {
        return res.status(404).json({ errors: [{ msg: 'Trail not found' }] });
      }

      //Check if feedback exists
      const feedback = trail.feedback.find(
        (feedback) => feedback.id.toString() === feedback_id
      );
      if (!feedback) {
        return res
          .status(404)
          .json({ errors: [{ msg: 'Feedback not found' }] });
      }

      //Check to see if user authorized (either trail author, or feedback author)
      if (
        req.user.id !== feedback.user.toString() &&
        req.user.id !== trail.user.toString()
      ) {
        return res
          .status(401)
          .json({ errors: [{ msg: 'User not authorized' }] });
      }

      if (req.user.id === trail.user.toString()) {
        trail.feedback = trail.feedback.map((feedback) => {
          if (feedback.id.toString() === feedback_id) {
            feedback.resolved =
              typeof resolved === 'boolean' ? resolved : feedback.resolved;
          }

          return feedback;
        });
      }

      if (req.user.id === feedback.user.toString()) {
        trail.feedback = trail.feedback.map((feedback) => {
          if (feedback.id.toString() === feedback_id) {
            feedback.title = typeof title === 'string' ? title : feedback.title;
            feedback.text = typeof text === 'string' ? text : feedback.text;
          }

          return feedback;
        });
      }

      await trail.save();
      await trail.populate('feedback.user', ['name']).execPopulate();

      const returnFeedback = trail.feedback.find(
        (feedback) => feedback.id.toString() === feedback_id
      );
      res.json(returnFeedback);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
