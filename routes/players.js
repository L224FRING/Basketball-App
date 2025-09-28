import express from 'express';
import { body, validationResult } from 'express-validator';
import Player from '../models/Player.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all players
// @route   GET /api/players
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { team, position, isActive } = req.query;
    let query = {};

    if (team) query.team = team;
    if (position) query.position = position;
    if (isActive && (isActive === 'true' || isActive === 'false')) query.isActive = isActive === 'true';

    const players = await Player.find(query)
      .populate('team', 'name colors')
      .populate('user', 'name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single player
// @route   GET /api/players/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'name colors coach')
      .populate('user', 'name email');
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new player
// @route   POST /api/players
// @access  Private (Admin/Coach)
router.post('/', protect, authorize('admin', 'coach'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('user').isMongoId().withMessage('Valid user ID is required'),
  body('team').isMongoId().withMessage('Valid team ID is required'),
  body('position').isIn(['PG', 'SG', 'SF', 'PF', 'C']).withMessage('Invalid position'),
  body('jerseyNumber').isInt({ min: 0, max: 99 }).withMessage('Jersey number must be between 0-99'),
  body('height').notEmpty().withMessage('Height is required'),
  body('weight').isInt({ min: 100, max: 400 }).withMessage('Weight must be between 100-400 lbs'),
  body('age').isInt({ min: 16, max: 50 }).withMessage('Age must be between 16-50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { user, team, ...playerData } = req.body;

    // Verify user exists and is a player
    const userExists = await User.findById(user);
    if (!userExists || userExists.role !== 'player') {
      return res.status(400).json({
        success: false,
        message: 'User must exist and have player role'
      });
    }

    // Verify team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.status(400).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if coach is authorized to add players to this team
    if (req.user.role === 'coach' && teamExists.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add players to this team'
      });
    }

    // Check if user already has a player profile
    const existingPlayer = await Player.findOne({ user });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'User already has a player profile'
      });
    }

    // Check if jersey number is already taken in this team
    const jerseyTaken = await Player.findOne({ team, jerseyNumber: playerData.jerseyNumber });
    if (jerseyTaken) {
      return res.status(400).json({
        success: false,
        message: 'Jersey number already taken in this team'
      });
    }

    const player = await Player.create({
      ...playerData,
      user,
      team
    });

    // Update user's team and player profile references
    await User.findByIdAndUpdate(user, {
      team: team,
      playerProfile: player._id
    });

    // Add player to team
    await Team.findByIdAndUpdate(team, {
      $addToSet: { players: player._id }
    });

    const populatedPlayer = await Player.findById(player._id)
      .populate('team', 'name colors')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedPlayer
    });
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update player
// @route   PUT /api/players/:id
// @access  Private (Admin/Coach)
router.put('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate('team');
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if coach is authorized to update this player
    if (req.user.role === 'coach' && player.team.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this player'
      });
    }

    const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('team', 'name colors')
      .populate('user', 'name email');

    res.json({
      success: true,
      data: updatedPlayer
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Private (Admin/Coach)
router.delete('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate('team');
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if coach is authorized to delete this player
    if (req.user.role === 'coach' && player.team.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this player'
      });
    }

    // Remove player from team
    await Team.findByIdAndUpdate(player.team._id, {
      $pull: { players: player._id }
    });

    // Update user's references
    await User.findByIdAndUpdate(player.user, {
      $unset: { team: 1, playerProfile: 1 }
    });

    await Player.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
