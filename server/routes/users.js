const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../data/demo-users.json');

const loadDemoUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not load demo users file:', error.message);
  }
  return [];
};

const saveDemoUsers = (users) => {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.warn('Could not save demo users file:', error.message);
  }
};

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    let user = req.user.getPublicProfile ? req.user.getPublicProfile() : req.user;
    if (user && user.password) {
      const { password, ...safeUser } = user;
      user = safeUser;
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('gardenExperience').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('location.address').optional().notEmpty(),
  body('location.city').optional().notEmpty(),
  body('location.state').optional().notEmpty(),
  body('location.zipCode').optional().notEmpty(),
  body('location.coordinates.lat').optional().isNumeric(),
  body('location.coordinates.lng').optional().isNumeric()
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'username', 'phoneNumber', 'profileImage',
      'bio', 'gardenExperience', 'location', 'preferences'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      try {
        const user = await User.findByIdAndUpdate(
          req.user._id,
          updates,
          { new: true, runValidators: true }
        );
        if (user) {
          return res.json({ 
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB profile update failed, using demo storage:', dbErr.message);
      }
    }

    // Demo file storage update fallback
    const users = loadDemoUsers();
    const index = users.findIndex(u => String(u._id) === String(req.user._id) || (req.user.firebaseUid && u.firebaseUid === req.user.firebaseUid));
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveDemoUsers(users);
      const { password, ...publicUser } = users[index];
      return res.json({
        message: 'Profile updated successfully',
        user: publicUser
      });
    }

    const updated = {
      ...(req.user.getPublicProfile ? req.user.getPublicProfile() : req.user),
      ...updates
    };
    delete updated.password;
    res.json({
      message: 'Profile updated successfully',
      user: updated
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/password
// @desc    Update user password
// @access  Private
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const user = await User.findById(req.user._id);
      if (user) {
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        return res.json({ message: 'Password updated successfully' });
      }
    }

    // Demo storage password check
    const users = loadDemoUsers();
    const user = users.find(u => String(u._id) === String(req.user._id));
    if (!user || user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    user.updatedAt = new Date().toISOString();
    saveDemoUsers(users);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      try {
        const user = await User.findByIdAndUpdate(
          req.user._id,
          { profileImage: imageUrl },
          { new: true }
        );
        if (user) {
          return res.json({ 
            message: 'Profile image updated successfully',
            user: user.getPublicProfile()
          });
        }
      } catch (err) {
        console.warn('DB profile-image update failed:', err.message);
      }
    }

    const users = loadDemoUsers();
    const index = users.findIndex(u => String(u._id) === String(req.user._id) || (req.user.firebaseUid && u.firebaseUid === req.user.firebaseUid));
    if (index !== -1) {
      users[index].profileImage = imageUrl;
      users[index].updatedAt = new Date().toISOString();
      saveDemoUsers(users);
      const { password, ...publicUser } = users[index];
      return res.json({ message: 'Profile image updated successfully', user: publicUser });
    }

    res.json({
      message: 'Profile image updated successfully',
      user: {
        ...(req.user.getPublicProfile ? req.user.getPublicProfile() : req.user),
        profileImage: imageUrl
      }
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 10, page = 1 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (page - 1) * limit;

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const users = await User.find({
        $and: [
          { isActive: true },
          { _id: { $ne: req.user._id } },
          {
            $or: [
              { username: searchRegex },
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex }
            ]
          }
        ]
      })
      .select('username firstName lastName profileImage location gardenExperience')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ username: 1 });

      const total = await User.countDocuments({
        $and: [
          { isActive: true },
          { _id: { $ne: req.user._id } },
          {
            $or: [
              { username: searchRegex },
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex }
            ]
          }
        ]
      });

      return res.json({
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    }

    // Demo search fallback
    const allUsers = loadDemoUsers();
    const query = q.trim().toLowerCase();
    const filtered = allUsers.filter(u => 
      String(u._id) !== String(req.user._id) &&
      (u.username?.toLowerCase().includes(query) ||
       u.firstName?.toLowerCase().includes(query) ||
       u.lastName?.toLowerCase().includes(query) ||
       u.email?.toLowerCase().includes(query))
    );

    const paginated = filtered.slice(skip, skip + parseInt(limit)).map(u => {
      const { password, ...safe } = u;
      return safe;
    });

    res.json({
      users: paginated,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(filtered.length / limit) || 1,
        total: filtered.length
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const user = await User.findById(req.params.id)
        .select('-password -email')
        .populate('gardens', 'name location images averageRating');

      if (user && user.isActive) {
        return res.json({ user });
      }
    }

    const allUsers = loadDemoUsers();
    const found = allUsers.find(u => String(u._id) === String(req.params.id));
    if (!found || found.isActive === false) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, email, ...safeUser } = found;
    res.json({ user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      await User.findByIdAndUpdate(req.user._id, { 
        isActive: false,
        email: `deleted_${Date.now()}_${req.user.email}`,
        username: `deleted_${Date.now()}_${req.user.username}`
      });
    }

    const allUsers = loadDemoUsers();
    const index = allUsers.findIndex(u => String(u._id) === String(req.user._id));
    if (index !== -1) {
      allUsers[index].isActive = false;
      saveDemoUsers(allUsers);
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
