const express = require('express');
const { body, validationResult } = require('express-validator');
const FeedPost = require('../models/FeedPost');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/feed
// @desc    Create a new feed post
// @access  Private
router.post('/', [
  body('type').isIn(['update', 'tip', 'event', 'question', 'achievement', 'help']).withMessage('Valid post type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('title').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('content').notEmpty().withMessage('Content is required'),
  body('content').isLength({ max: 2000 }).withMessage('Content must be less than 2000 characters'),
  body('tags').optional().isArray(),
  body('relatedGarden').optional().isMongoId(),
  body('relatedCrop').optional().isMongoId()
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postData = {
      ...req.body,
      author: req.user._id
    };

    const post = new FeedPost(postData);
    await post.save();

    await post.populate([
      { path: 'author', select: 'username firstName lastName profileImage' },
      { path: 'relatedGarden', select: 'name location' },
      { path: 'relatedCrop', select: 'name images' }
    ]);

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/feed
// @desc    Get feed posts with optional filters
// @access  Public
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      tags,
      lat,
      lng,
      radius = 50, // km
      author,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true };

    // Type filter
    if (type) query.type = type;

    // Author filter
    if (author) query.author = author;

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location-based filtering
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const posts = await FeedPost.find(query)
      .populate('author', 'username firstName lastName profileImage')
      .populate('relatedGarden', 'name location')
      .populate('relatedCrop', 'name images')
      .populate('likes.user', 'username firstName lastName')
      .populate('comments.author', 'username firstName lastName profileImage')
      .populate('shares.user', 'username firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
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
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/feed/:id
// @desc    Get feed post by ID
// @access  Public
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id)
      .populate('author', 'username firstName lastName profileImage')
      .populate('relatedGarden', 'name location')
      .populate('relatedCrop', 'name images')
      .populate('likes.user', 'username firstName lastName')
      .populate('comments.author', 'username firstName lastName profileImage')
      .populate('comments.likes.user', 'username firstName lastName')
      .populate('shares.user', 'username firstName lastName')
      .populate('eventDetails.attendees.user', 'username firstName lastName profileImage');

    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/feed/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = post.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
      await post.save();
      res.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      post.likes.push({ user: req.user._id });
      await post.save();

      // Create notification for post author (if not self)
      if (post.author.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          user: post.author,
          type: 'like',
          title: 'Post Liked',
          message: `${req.user.firstName} ${req.user.lastName} liked your post`,
          data: {
            postId: post._id,
            senderId: req.user._id
          }
        });
        await notification.save();
      }

      res.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/feed/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', [
  body('content').notEmpty().withMessage('Comment content is required'),
  body('content').isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await FeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: req.user._id,
      content: req.body.content
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.author', 'username firstName lastName profileImage');

    const newComment = post.comments[post.comments.length - 1];

    // Create notification for post author (if not self)
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        user: post.author,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.firstName} ${req.user.lastName} commented on your post`,
        data: {
          postId: post._id,
          senderId: req.user._id
        }
      });
      await notification.save();
    }

    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/feed/:id/share
// @desc    Share a post
// @access  Private
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already shared
    const existingShare = post.shares.find(
      share => share.user.toString() === req.user._id.toString()
    );

    if (!existingShare) {
      post.shares.push({ user: req.user._id });
      await post.save();

      // Create notification for post author (if not self)
      if (post.author.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          user: post.author,
          type: 'share',
          title: 'Post Shared',
          message: `${req.user.firstName} ${req.user.lastName} shared your post`,
          data: {
            postId: post._id,
            senderId: req.user._id
          }
        });
        await notification.save();
      }
    }

    res.json({ message: 'Post shared successfully' });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/feed/:id/attend
// @desc    Attend an event
// @access  Private
router.post('/:id/attend', authMiddleware, async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);

    if (!post || post.type !== 'event') {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already attending
    const existingAttendee = post.eventDetails.attendees.find(
      attendee => attendee.user.toString() === req.user._id.toString()
    );

    if (existingAttendee) {
      return res.status(400).json({ message: 'You are already attending this event' });
    }

    // Check if event is full
    if (post.eventDetails.maxAttendees && 
        post.eventDetails.attendees.length >= post.eventDetails.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    post.eventDetails.attendees.push({ user: req.user._id });
    await post.save();

    res.json({ message: 'Successfully registered for event' });
  } catch (error) {
    console.error('Attend event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/feed/:id
// @desc    Update feed post
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const allowedUpdates = [
      'title', 'content', 'images', 'tags', 'relatedGarden', 
      'relatedCrop', 'location', 'eventDetails'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedPost = await FeedPost.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'author', select: 'username firstName lastName profileImage' },
      { path: 'relatedGarden', select: 'name location' },
      { path: 'relatedCrop', select: 'name images' }
    ]);

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/feed/:id
// @desc    Delete feed post
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await FeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
