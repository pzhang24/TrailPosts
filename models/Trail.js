const mongoose = require('mongoose');

const TrailSchema = new mongoose.Schema({
  //Author and revision date info

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  last_revised: {
    type: Date,
    default: Date.now,
  },

  //Guide info
  name: {
    type: String,
    required: true,
    unique: true,
  },
  region: {
    type: String,
  },
  province_state: {
    type: String,
    required: true,
  },
  distance: {
    type: Number,
    required: true,
    min: 0,
  },
  trail_type: {
    type: String,
    required: true,
  },
  season: {
    type: String,
  },
  elevation_gain: {
    type: Number,
    min: 0,
  },
  elevation_loss: {
    type: Number,
    min: 0,
  },
  completion_time_days: {
    type: Number,
    min: 0,
  },
  completion_time_hours: {
    type: Number,
    min: 0,
    max: 23,
  },
  completion_time_minutes: {
    type: Number,
    min: 0,
    max: 59,
  },
  difficulty: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  technical_challenges: {
    type: [String],
  },
  hazards: {
    type: [String],
  },
  sights_features: {
    type: [String],
  },
  flora_fauna: {
    type: [String],
  },
  average_rating: {
    type: Number,
    min: 0,
    max: 5,
  },

  posts: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      date: {
        type: Date,
        default: Date.now,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
      completion_time_days: {
        type: Number,
        min: 0,
      },
      completion_time_hours: {
        type: Number,
        min: 0,
        max: 23,
      },
      completion_time_minutes: {
        type: Number,
        min: 0,
        max: 59,
      },
      difficulty: {
        type: String,
      },
      title: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    },
  ],
  feedback: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
      date: {
        type: Date,
        default: Date.now,
      },
      title: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      resolved: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
  ],
});

module.exports = Trail = mongoose.model('trail', TrailSchema);
