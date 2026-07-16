const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const USERS_FILE = path.join(__dirname, '../data/demo-users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key';

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

const getDemoUserById = (userId) => {
  const user = loadDemoUsers().find((entry) => entry._id === userId);

  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user._id,
    isActive: user.isActive !== false,
    getPublicProfile() {
      const { password, ...publicUser } = user;
      return publicUser;
    }
  };
};

const getUserFromToken = async (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);

  try {
    const dbUser = await User.findById(decoded.userId).select('-password');
    if (dbUser && dbUser.isActive) {
      return dbUser;
    }
  } catch (error) {
    if (error?.name !== 'MongooseError' && error?.name !== 'MongoServerSelectionError') {
      console.warn('Database auth lookup failed, falling back to demo users:', error.message);
    }
  }

  return getDemoUserById(decoded.userId);
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const user = await getUserFromToken(token);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid or user is inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const user = await getUserFromToken(token);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};
