const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const MESSAGES_FILE = path.join(__dirname, '../data/demo-messages.json');
const USERS_FILE = path.join(__dirname, '../data/demo-users.json');

const isDbReady = () => mongoose.connection.readyState === 1;

const loadDemoMessages = () => {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read demo messages:', e.message);
  }
  return [];
};

const saveDemoMessages = (msgs) => {
  try {
    fs.mkdirSync(path.dirname(MESSAGES_FILE), { recursive: true });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2));
  } catch (e) {
    console.warn('Could not save demo messages:', e.message);
  }
};

const loadDemoUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read demo users:', e.message);
  }
  return [];
};

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const currentId = req.user._id ? req.user._id.toString() : (req.user.id || req.user.firebaseUid);

    if (isDbReady()) {
      try {
        const conversations = await Message.aggregate([
          {
            $match: {
              $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
              ],
              isDeleted: false
            }
          },
          {
            $sort: { createdAt: -1 }
          },
          {
            $group: {
              _id: {
                $cond: [
                  { $eq: ['$sender', req.user._id] },
                  '$receiver',
                  '$sender'
                ]
              },
              lastMessage: { $first: '$$ROOT' },
              unreadCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$receiver', req.user._id] },
                        { $eq: ['$isRead', false] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          },
          {
            $project: {
              user: {
                _id: 1,
                username: 1,
                firstName: 1,
                lastName: 1,
                profileImage: 1
              },
              lastMessage: 1,
              unreadCount: 1
            }
          },
          {
            $sort: { 'lastMessage.createdAt': -1 }
          }
        ]);

        return res.json({ conversations });
      } catch (dbErr) {
        console.warn('DB aggregate failed, using demo messages:', dbErr.message);
      }
    }

    // Demo storage fallback
    const allMessages = loadDemoMessages();
    const allUsers = loadDemoUsers();

    const userMsgs = allMessages.filter(
      (m) =>
        (String(m.sender) === currentId || String(m.receiver) === currentId) &&
        !m.isDeleted
    );

    const convMap = new Map();
    userMsgs.forEach((m) => {
      const isSender = String(m.sender) === currentId;
      const partnerId = isSender ? String(m.receiver) : String(m.sender);

      if (!convMap.has(partnerId)) {
        const partner = allUsers.find(
          (u) => String(u._id) === partnerId || u.firebaseUid === partnerId
        ) || {
          _id: partnerId,
          username: `user_${partnerId}`,
          firstName: 'User',
          lastName: partnerId,
          profileImage: '',
        };

        convMap.set(partnerId, {
          _id: partnerId,
          user: {
            _id: partner._id,
            username: partner.username,
            firstName: partner.firstName,
            lastName: partner.lastName,
            profileImage: partner.profileImage || '',
          },
          lastMessage: {
            content: m.content,
            createdAt: m.createdAt,
            isRead: m.isRead,
          },
          unreadCount: (!isSender && !m.isRead) ? 1 : 0,
        });
      } else {
        const conv = convMap.get(partnerId);
        if (!isSender && !m.isRead) {
          conv.unreadCount += 1;
        }
      }
    });

    res.json({ conversations: Array.from(convMap.values()) });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:userId
// @desc    Get messages between current user and another user
// @access  Private
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const currentId = req.user._id ? req.user._id.toString() : (req.user.id || req.user.firebaseUid);
    const targetUserId = req.params.userId;

    if (isDbReady() && mongoose.Types.ObjectId.isValid(targetUserId)) {
      try {
        const skip = (page - 1) * limit;
        const messages = await Message.find({
          $or: [
            { sender: req.user._id, receiver: targetUserId },
            { sender: targetUserId, receiver: req.user._id }
          ],
          isDeleted: false
        })
        .populate('sender', 'username firstName lastName profileImage')
        .populate('receiver', 'username firstName lastName profileImage')
        .populate('relatedCrop', 'name images')
        .populate('relatedGarden', 'name location')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

        // Mark messages as read
        await Message.updateMany(
          {
            sender: targetUserId,
            receiver: req.user._id,
            isRead: false
          },
          {
            isRead: true,
            readAt: new Date()
          }
        );

        return res.json({ messages: messages.reverse() });
      } catch (dbErr) {
        console.warn('DB messages find failed, using demo storage:', dbErr.message);
      }
    }

    // Demo storage fallback
    const allMessages = loadDemoMessages();
    const allUsers = loadDemoUsers();

    const currentUserObj = allUsers.find(
      (u) => String(u._id) === currentId || u.firebaseUid === currentId
    ) || {
      _id: currentId,
      username: req.user.username || 'user',
      firstName: req.user.firstName || 'User',
      lastName: req.user.lastName || '',
      profileImage: req.user.profileImage || '',
    };

    const targetUserObj = allUsers.find(
      (u) => String(u._id) === targetUserId || u.firebaseUid === targetUserId
    ) || {
      _id: targetUserId,
      username: `seller_${targetUserId}`,
      firstName: 'Crop',
      lastName: 'Seller',
      profileImage: '',
    };

    const filtered = allMessages.filter(
      (m) =>
        ((String(m.sender) === currentId && String(m.receiver) === targetUserId) ||
         (String(m.sender) === targetUserId && String(m.receiver) === currentId)) &&
        !m.isDeleted
    );

    // Mark messages as read in demo
    filtered.forEach((m) => {
      if (String(m.receiver) === currentId) {
        m.isRead = true;
        m.readAt = new Date().toISOString();
      }
    });
    saveDemoMessages(allMessages);

    const populated = filtered.map((m) => ({
      ...m,
      sender: String(m.sender) === currentId ? currentUserObj : targetUserObj,
      receiver: String(m.receiver) === currentId ? currentUserObj : targetUserObj,
    }));

    res.json({ messages: populated });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:userId
// @desc    Send message to user
// @access  Private
router.post('/:userId', [
  body('content').notEmpty().withMessage('Message content is required'),
  body('content').isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
  body('type').optional().isIn(['text', 'image', 'crop-request', 'trade-offer', 'system']),
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type = 'text', relatedCrop, relatedGarden, attachments } = req.body;
    const receiverId = req.params.userId;
    const currentId = req.user._id ? req.user._id.toString() : (req.user.id || req.user.firebaseUid);

    // Prevent sending message to self
    if (receiverId === currentId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    if (isDbReady() && mongoose.Types.ObjectId.isValid(receiverId)) {
      try {
        const receiver = await User.findById(receiverId);
        if (receiver && receiver.isActive) {
          const message = new Message({
            sender: req.user._id,
            receiver: receiverId,
            content,
            type,
            relatedCrop,
            relatedGarden,
            attachments
          });

          await message.save();

          await message.populate([
            { path: 'sender', select: 'username firstName lastName profileImage' },
            { path: 'receiver', select: 'username firstName lastName profileImage' },
            { path: 'relatedCrop', select: 'name images' },
            { path: 'relatedGarden', select: 'name location' }
          ]);

          // Create notification for receiver
          try {
            const notification = new Notification({
              user: receiverId,
              type: 'message',
              title: 'New Message',
              message: `${req.user.firstName} ${req.user.lastName} sent you a message`,
              data: {
                messageId: message._id,
                senderId: req.user._id
              }
            });
            await notification.save();
          } catch (notifErr) {
            console.warn('Notification save warning:', notifErr.message);
          }

          return res.status(201).json({
            message: 'Message sent successfully',
            messageData: message
          });
        }
      } catch (dbErr) {
        console.warn('DB message create failed, using demo storage:', dbErr.message);
      }
    }

    // Demo storage fallback
    const allMessages = loadDemoMessages();
    const allUsers = loadDemoUsers();

    const senderObj = allUsers.find(
      (u) => String(u._id) === currentId || u.firebaseUid === currentId
    ) || {
      _id: currentId,
      username: req.user.username || 'user',
      firstName: req.user.firstName || 'User',
      lastName: req.user.lastName || '',
      profileImage: req.user.profileImage || '',
    };

    const receiverObj = allUsers.find(
      (u) => String(u._id) === receiverId || u.firebaseUid === receiverId
    ) || {
      _id: receiverId,
      username: `seller_${receiverId}`,
      firstName: 'Crop',
      lastName: 'Seller',
      profileImage: '',
    };

    const newMsg = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: currentId,
      receiver: receiverId,
      content,
      type,
      attachments: attachments || [],
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    allMessages.push(newMsg);
    saveDemoMessages(allMessages);

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: {
        ...newMsg,
        sender: senderObj,
        receiver: receiverObj
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    if (isDbReady() && mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      const message = await Message.findById(req.params.messageId);
      if (message) {
        message.isRead = true;
        message.readAt = new Date();
        await message.save();
        return res.json({ message: 'Message marked as read' });
      }
    }

    const allMessages = loadDemoMessages();
    const msg = allMessages.find((m) => m._id === req.params.messageId);
    if (msg) {
      msg.isRead = true;
      msg.readAt = new Date().toISOString();
      saveDemoMessages(allMessages);
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    if (isDbReady() && mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      const message = await Message.findById(req.params.messageId);
      if (message) {
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();
        return res.json({ message: 'Message deleted successfully' });
      }
    }

    const allMessages = loadDemoMessages();
    const msg = allMessages.find((m) => m._id === req.params.messageId);
    if (msg) {
      msg.isDeleted = true;
      msg.deletedAt = new Date().toISOString();
      saveDemoMessages(allMessages);
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const currentId = req.user._id ? req.user._id.toString() : (req.user.id || req.user.firebaseUid);

    if (isDbReady()) {
      try {
        const count = await Message.countDocuments({
          receiver: req.user._id,
          isRead: false,
          isDeleted: false
        });
        return res.json({ unreadCount: count });
      } catch (dbErr) {
        console.warn('DB count failed, using demo storage:', dbErr.message);
      }
    }

    const allMessages = loadDemoMessages();
    const count = allMessages.filter(
      (m) => String(m.receiver) === currentId && !m.isRead && !m.isDeleted
    ).length;

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
