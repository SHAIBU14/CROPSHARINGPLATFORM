const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const GardenModel = require('../models/Garden');
const CropModel = require('../models/Crop');
const User = require('../models/User');

const router = express.Router();

// Demo mode - use JSON file storage
const GARDENS_FILE = path.join(__dirname, '../data/demo-gardens.json');
const USERS_FILE = path.join(__dirname, '../data/demo-users.json');

const isDbReady = () => mongoose.connection.readyState === 1;

const resolveUser = async (user) => {
  if (!isDbReady()) {
    return user;
  }

  try {
    const dbUser = await User.findById(user._id).select('username firstName lastName profileImage').lean();
    return dbUser || user;
  } catch {
    return user;
  }
};

const loadGardensFromStorage = async () => {
  if (!isDbReady()) {
    try {
      const data = await fs.readFile(GARDENS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  return GardenModel.find({ isPublic: true, isActive: true })
    .populate('owner', 'username firstName lastName profileImage')
    .lean();
};

const writeGardensToStorage = async (gardens) => {
  if (!isDbReady()) {
    await fs.writeFile(GARDENS_FILE, JSON.stringify(gardens, null, 2));
  }
};

// Helper functions for demo storage
async function readGardens() {
  try {
    const data = await fs.readFile(GARDENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeGardens(gardens) {
  await fs.writeFile(GARDENS_FILE, JSON.stringify(gardens, null, 2));
}

async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// @route   POST /api/gardens
// @desc    Create a new garden
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Garden name is required'),
  body('description').notEmpty().withMessage('Garden description is required'),
  body('size').isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Valid size is required'),
  body('gardenType').isIn(['vegetable', 'herb', 'fruit', 'flower', 'mixed']).withMessage('Valid garden type is required'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.state').notEmpty().withMessage('State is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (isDbReady()) {
      const newGarden = new GardenModel({
        ...req.body,
        owner: req.user._id,
        images: Array.isArray(req.body.images) ? req.body.images : [],
        isPublic: req.body.isPublic !== false,
        isActive: true,
        averageRating: 0,
        visitors: [],
        ratings: []
      });

      await newGarden.save();
      await newGarden.populate('owner', 'username firstName lastName profileImage');

      return res.status(201).json({
        message: 'Garden created successfully',
        garden: newGarden
      });
    }

    const gardens = await readGardens();
    const users = await readUsers();
    const user = users.find(u => u._id === req.user._id) || req.user;

    const newGarden = {
      _id: Date.now().toString(),
      ...req.body,
      owner: {
        _id: user._id,
        username: user.username || 'unknown',
        firstName: user.firstName || 'Unknown',
        lastName: user.lastName || '',
        profileImage: user.profileImage || ''
      },
      location: {
        address: req.body.location?.address || '',
        city: req.body.location?.city || user.location?.city || 'Unknown',
        state: req.body.location?.state || user.location?.state || 'Unknown',
        zipCode: req.body.location?.zipCode || '',
        coordinates: req.body.location?.coordinates || { lat: 0, lng: 0 }
      },
      isPublic: req.body.isPublic !== false,
      isActive: true,
      averageRating: 0,
      visitors: [],
      ratings: [],
      createdAt: new Date().toISOString()
    };

    gardens.unshift(newGarden);
    await writeGardensToStorage(gardens);

    res.status(201).json({
      message: 'Garden created successfully',
      garden: newGarden
    });
  } catch (error) {
    console.error('Create garden error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gardens
// @desc    Get all gardens with optional filters
// @access  Public
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { city, state, gardenType, size, search } = req.query;

    let gardens = await loadGardensFromStorage();

    if (isDbReady()) {
      gardens = gardens.map(g => ({
        ...g,
        createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt
      }));
    }

    gardens = gardens.filter(garden => garden.isPublic !== false && garden.isActive !== false);

    if (city) {
      gardens = gardens.filter(garden =>
        garden.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (state) {
      gardens = gardens.filter(garden =>
        garden.location.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (gardenType && gardenType !== 'all') {
      gardens = gardens.filter(garden => garden.gardenType === gardenType);
    }

    if (size && size !== 'all') {
      gardens = gardens.filter(garden => garden.size === size);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      gardens = gardens.filter(garden =>
        garden.name.toLowerCase().includes(searchLower) ||
        garden.description.toLowerCase().includes(searchLower) ||
        garden.location.city.toLowerCase().includes(searchLower)
      );
    }

    res.json({ gardens });
  } catch (error) {
    console.error('Get gardens error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gardens/my-gardens
// @desc    Get current user's gardens
// @access  Private
router.get('/my-gardens', authMiddleware, async (req, res) => {
  try {
    if (isDbReady()) {
      const gardens = await GardenModel.find({ owner: req.user._id, isActive: true })
        .populate('owner', 'username firstName lastName profileImage')
        .lean();
      return res.json({ gardens });
    }

    const gardens = await readGardens();
    const userGardens = gardens.filter(garden => garden.owner._id === req.user._id);
    res.json({ gardens: userGardens });
  } catch (error) {
    console.error('Get my gardens error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gardens/:id
// @desc    Get garden by ID
// @access  Public
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    let garden;

    if (isDbReady()) {
      garden = await GardenModel.findById(req.params.id)
        .populate('owner', 'username firstName lastName profileImage')
        .lean();
    } else {
      const gardens = await readGardens();
      garden = gardens.find(g => g._id === req.params.id);
    }

    if (!garden || garden.isActive === false) {
      return res.status(404).json({ message: 'Garden not found' });
    }

    res.json({ garden });
  } catch (error) {
    console.error('Get garden error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/gardens/:id
// @desc    Delete garden
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (isDbReady()) {
      const garden = await GardenModel.findById(req.params.id);

      if (!garden || garden.isActive === false) {
        return res.status(404).json({ message: 'Garden not found' });
      }

      if (garden.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this garden' });
      }

      garden.isActive = false;
      await garden.save();
      return res.json({ message: 'Garden deleted successfully' });
    }

    const gardens = await readGardens();
    const gardenIndex = gardens.findIndex(g => g._id === req.params.id);

    if (gardenIndex === -1) {
      return res.status(404).json({ message: 'Garden not found' });
    }

    if (gardens[gardenIndex].owner._id !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to delete this garden' });
    }

    gardens[gardenIndex].isActive = false;
    await writeGardensToStorage(gardens);

    res.json({ message: 'Garden deleted successfully' });
  } catch (error) {
    console.error('Delete garden error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
