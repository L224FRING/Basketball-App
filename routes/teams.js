import express from 'express';
import { body, validationResult } from 'express-validator';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { coach, isActive } = req.query;
    let query = {};

    if (coach) query.coach = coach;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const teams = await Team.find(query)
      .populate('coach', 'name email')
      .populate('players', 'name position jerseyNumber')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('coach', 'name email')
      .populate('players', 'name position jerseyNumber stats isActive');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Admin/Coach)
router.post('/', protect, authorize('admin', 'coach'), [
  body('name').notEmpty().withMessage('Team name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
  body('homeVenue').optional().isString().withMessage('Home venue must be a string'),
  body('colors.primary').optional().isString().withMessage('Primary color must be a string'),
  body('colors.secondary').optional().isString().withMessage('Secondary color must be a string')
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

    const { name, description, foundedYear, homeVenue, colors, logo } = req.body;

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team name already exists'
      });
    }

    // For coaches, they can only create teams for themselves
    const coachId = req.user.role === 'coach' ? req.user.id : req.body.coach;
    
    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: 'Coach must be specified'
      });
    }

    // Verify coach exists and has coach role
    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(400).json({
        success: false,
        message: 'Invalid coach specified'
      });
    }

    const teamData = {
      name,
      coach: coachId,
      description,
      foundedYear,
      homeVenue,
      colors,
      logo
    };

    const team = await Team.create(teamData);

    // Add team to coach's managed teams
    await User.findByIdAndUpdate(coachId, {
      $addToSet: { managedTeams: team._id }
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('coach', 'name email')
      .populate('players', 'name position jerseyNumber');

    res.status(201).json({
      success: true,
      data: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Admin/Coach - only team's coach)
router.put('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team's coach or admin
    if (req.user.role !== 'admin' && team.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this team'
      });
    }

    const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('coach', 'name email')
      .populate('players', 'name position jerseyNumber');

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Add player to team
// @route   POST /api/teams/:id/players
// @access  Private (Admin/Coach - only team's coach)
router.post('/:id/players', protect, authorize('admin', 'coach'), [
  body('playerId').isMongoId().withMessage('Valid player ID is required')
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

    const { playerId } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team's coach or admin
    if (req.user.role !== 'admin' && team.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this team'
      });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if player is already on this team
    if (team.players.includes(playerId)) {
      return res.status(400).json({
        success: false,
        message: 'Player is already on this team'
      });
    }

    // Update player's team
    await Player.findByIdAndUpdate(playerId, { team: team._id });
    
    // Add player to team
    await Team.findByIdAndUpdate(req.params.id, {
      $addToSet: { players: playerId }
    });

    // Update user's team reference
    await User.findByIdAndUpdate(player.user, { team: team._id });

    const updatedTeam = await Team.findById(req.params.id)
      .populate('coach', 'name email')
      .populate('players', 'name position jerseyNumber stats isActive');

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Add player to team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Remove player from team
// @route   DELETE /api/teams/:id/players/:playerId
// @access  Private (Admin/Coach - only team's coach)
router.delete('/:id/players/:playerId', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team's coach or admin
    if (req.user.role !== 'admin' && team.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this team'
      });
    }

    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Remove player from team
    await Team.findByIdAndUpdate(req.params.id, {
      $pull: { players: req.params.playerId }
    });

    // Update player's team to null
    await Player.findByIdAndUpdate(req.params.playerId, { team: null });
    
    // Update user's team reference to null
    await User.findByIdAndUpdate(player.user, { team: null });

    const updatedTeam = await Team.findById(req.params.id)
      .populate('coach', 'name email')
      .populate('players', 'name position jerseyNumber stats isActive');

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Remove player from team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Admin/Coach - only team's coach)
router.delete('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team's coach or admin
    if (req.user.role !== 'admin' && team.coach.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this team'
      });
    }

    // Remove team from all players
    await Player.updateMany(
      { team: team._id },
      { $unset: { team: 1 } }
    );

    // Remove team from coach's managed teams
    await User.findByIdAndUpdate(team.coach, {
      $pull: { managedTeams: team._id }
    });

    // Remove team from all users' team references
    await User.updateMany(
      { team: team._id },
      { $unset: { team: 1 } }
    );

    await Team.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;



