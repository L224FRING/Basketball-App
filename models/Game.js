import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  homeTeam: {
    type: String,
    required: [true, 'Please add home team'],
    trim: true
  },
  awayTeam: {
    type: String,
    required: [true, 'Please add away team'],
    trim: true
  },
  homeScore: {
    type: Number,
    default: 0,
    min: 0
  },
  awayScore: {
    type: Number,
    default: 0,
    min: 0
  },
  gameDate: {
    type: Date,
    required: [true, 'Please add game date']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  quarter: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  timeRemaining: {
    type: String,
    default: '12:00'
  },
  venue: {
    type: String,
    trim: true
  },
  attendance: {
    type: Number,
    min: 0
  },
  gameStats: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    points: {
      type: Number,
      default: 0
    },
    rebounds: {
      type: Number,
      default: 0
    },
    assists: {
      type: Number,
      default: 0
    },
    steals: {
      type: Number,
      default: 0
    },
    blocks: {
      type: Number,
      default: 0
    },
    minutesPlayed: {
      type: Number,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Game', gameSchema);
