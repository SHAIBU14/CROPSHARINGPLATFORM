const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Garden = require('../models/Garden');
const Crop = require('../models/Crop');
const FeedPost = require('../models/FeedPost');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGardens,
      activeGardens,
      totalCrops,
      activeCrops,
      totalPosts,
      activePosts,
      totalMessages,
      recentUsers,
      recentGardens,
      recentCrops
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Garden.countDocuments(),
      Garden.countDocuments({ isActive: true }),
      Crop.countDocuments(),
      Crop.countDocuments({ isActive: true }),
      FeedPost.countDocuments(),
      FeedPost.countDocuments({ isActive: true }),
      Message.countDocuments(),
      User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('username firstName lastName createdAt'),
      Garden.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).populate('owner', 'username firstName lastName'),
      Crop.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).populate('owner', 'username firstName lastName')
    ]);

    res.json({
      statistics: {
        users: { total: totalUsers, active: activeUsers },
        gardens: { total: totalGardens, active: activeGardens },
        crops: { total: totalCrops, active: activeCrops },
        posts: { total: totalPosts, active: activePosts },
        messages: { total: totalMessages }
      },
      recent: {
        users: recentUsers,
        gardens: recentGardens,
        crops: recentCrops
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      isActive, 
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Status filters
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin)
// @access  Private (Admin only)
router.put('/users/:id', [
  body('isActive').optional().isBoolean(),
  body('isVerified').optional().isBoolean(),
  body('isAdmin').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = ['isActive', 'isVerified', 'isAdmin'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin)
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Soft delete
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.username = `deleted_${Date.now()}_${user.username}`;
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/gardens
// @desc    Get all gardens with admin filters
// @access  Private (Admin only)
router.get('/gardens', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      isActive, 
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') },
        { 'location.state': new RegExp(search, 'i') }
      ];
    }

    // Status filters
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const gardens = await Garden.find(query)
      .populate('owner', 'username firstName lastName email')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Garden.countDocuments(query);

    res.json({
      gardens,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get gardens error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/gardens/:id
// @desc    Update garden (admin)
// @access  Private (Admin only)
router.put('/gardens/:id', [
  body('isActive').optional().isBoolean(),
  body('isPublic').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = ['isActive', 'isPublic'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const garden = await Garden.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'username firstName lastName email');

    if (!garden) {
      return res.status(404).json({ message: 'Garden not found' });
    }

    res.json({
      message: 'Garden updated successfully',
      garden
    });
  } catch (error) {
    console.error('Update garden error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/posts
// @desc    Get all feed posts with admin filters
// @access  Private (Admin only)
router.get('/posts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      isActive, 
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Status filters
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (type) query.type = type;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const posts = await FeedPost.find(query)
      .populate('author', 'username firstName lastName email')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await FeedPost.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/posts/:id
// @desc    Update post (admin)
// @access  Private (Admin only)
router.put('/posts/:id', [
  body('isActive').optional().isBoolean(),
  body('isPinned').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = ['isActive', 'isPinned'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const post = await FeedPost.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get reported content
// @access  Private (Admin only)
router.get('/reports', async (req, res) => {
  try {
    // This would integrate with a reporting system
    // For now, return empty array
    res.json({ reports: [] });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      newUsers,
      newGardens,
      newCrops,
      newPosts,
      newMessages
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Garden.countDocuments({ createdAt: { $gte: startDate } }),
      Crop.countDocuments({ createdAt: { $gte: startDate } }),
      FeedPost.countDocuments({ createdAt: { $gte: startDate } }),
      Message.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    res.json({
      period,
      analytics: {
        newUsers,
        newGardens,
        newCrops,
        newPosts,
        newMessages
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
