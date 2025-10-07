import express from 'express';
import { body, validationResult } from 'express-validator';
import Game from '../models/Game.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all games
// @route   GET /api/games
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, team, date } = req.query;
    let query = {};

    if (status) query.status = status;
    if (team) {
      query.$or = [
        { homeTeam: { $regex: team, $options: 'i' } },
        { awayTeam: { $regex: team, $options: 'i' } }
      ];
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.gameDate = { $gte: startDate, $lt: endDate };
    }

    const games = await Game.find(query)
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .populate('gameStats.player', 'name team position')
      .sort({ gameDate: 1 });
    
    res.json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single game
// @route   GET /api/games/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .populate('gameStats.player', 'name team position')
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new game
// @route   POST /api/games
// @access  Private (Admin/Coach)
router.post('/', protect, authorize('admin', 'coach'), [
  body('homeTeam').isMongoId().withMessage('Home team is required'),
  body('awayTeam').isMongoId().withMessage('Away team is required'),
  body('gameDate').isISO8601().withMessage('Valid game date is required'),
  body('venue').optional().isString().withMessage('Venue must be a string')
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

    const game = await Game.create(req.body);

    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Private (Admin/Coach)
router.put('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update game score
// @route   PUT /api/games/:id/score
// @access  Private (Admin/Coach)
router.put('/:id/score', protect, authorize('admin', 'coach'), [
  body('homeScore').isInt({ min: 0 }).withMessage('Home score must be non-negative'),
  body('awayScore').isInt({ min: 0 }).withMessage('Away score must be non-negative')
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

    const { homeScore, awayScore } = req.body;
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      { homeScore, awayScore },
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const io = req.app.get("io");
    io.to(game._id.toString()).emit("gameUpdated",game)

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete game
// @route   DELETE /api/games/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin','coach'), async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
