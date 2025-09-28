import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true,
    unique: true,
    maxlength: [50, 'Team name cannot be more than 50 characters']
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a coach to the team']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  foundedYear: {
    type: Number,
    min: [1800, 'Founded year must be after 1800'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  homeVenue: {
    type: String,
    trim: true,
    maxlength: [100, 'Home venue name cannot be more than 100 characters']
  },
  colors: {
    primary: {
      type: String,
      trim: true,
      default: '#000000'
    },
    secondary: {
      type: String,
      trim: true,
      default: '#FFFFFF'
    }
  },
  logo: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  stats: {
    wins: {
      type: Number,
      default: 0,
      min: 0
    },
    losses: {
      type: Number,
      default: 0,
      min: 0
    },
    winPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate win percentage before saving
teamSchema.pre('save', function(next) {
  const totalGames = this.stats.wins + this.stats.losses;
  if (totalGames > 0) {
    this.stats.winPercentage = this.stats.wins / totalGames;
  } else {
    this.stats.winPercentage = 0;
  }
  next();
});

// Index for better query performance
teamSchema.index({ coach: 1 });
teamSchema.index({ isActive: 1 });

export default mongoose.model('Team', teamSchema);
