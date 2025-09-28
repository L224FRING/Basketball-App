import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['player', 'coach', 'admin'],
    default: 'player'
  },
  // For coaches - reference to teams they manage
  managedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  // For players - reference to their team
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  // For players - reference to their player profile
  playerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  position: {
    type: String,
    enum: ['PG', 'SG', 'SF', 'PF', 'C'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ team: 1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
