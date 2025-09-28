import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a player name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player must be linked to a user account']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Please assign a team']
  },
  position: {
    type: String,
    required: [true, 'Please add a position'],
    enum: ['PG', 'SG', 'SF', 'PF', 'C']
  },
  jerseyNumber: {
    type: Number,
    required: [true, 'Please add a jersey number'],
    min: [0, 'Jersey number must be positive'],
    max: [99, 'Jersey number cannot exceed 99']
  },
  height: {
    type: String,
    required: [true, 'Please add height'],
    trim: true
  },
  weight: {
    type: Number,
    required: [true, 'Please add weight'],
    min: [100, 'Weight must be at least 100 lbs'],
    max: [400, 'Weight cannot exceed 400 lbs']
  },
  age: {
    type: Number,
    required: [true, 'Please add age'],
    min: [16, 'Age must be at least 16'],
    max: [50, 'Age cannot exceed 50']
  },
  stats: {
    pointsPerGame: {
      type: Number,
      default: 0,
      min: 0
    },
    reboundsPerGame: {
      type: Number,
      default: 0,
      min: 0
    },
    assistsPerGame: {
      type: Number,
      default: 0,
      min: 0
    },
    stealsPerGame: {
      type: Number,
      default: 0,
      min: 0
    },
    blocksPerGame: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
playerSchema.index({ team: 1 });
playerSchema.index({ user: 1 });
playerSchema.index({ isActive: 1 });
playerSchema.index({ jerseyNumber: 1, team: 1 }, { unique: true });

export default mongoose.model('Player', playerSchema);
