const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');

let admin = null;
try {
  admin = require('firebase-admin');
} catch (error) {
  admin = null;
}

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../data/demo-users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key';

let firebaseAdminAvailable = false;

const hasRealFirebaseCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY') &&
  process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')
);

if (admin && (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS) && hasRealFirebaseCredentials) {
  try {
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
    firebaseAdminAvailable = true;
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error.message);
  }
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  profileImage: user.profileImage || '',
  gardenExperience: user.gardenExperience || 'beginner',
  isVerified: user.isVerified ?? true,
  isAdmin: user.isAdmin ?? false,
  createdAt: user.createdAt
});

const loadUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Could not load demo users file:', error.message);
  }

  return [
    {
      _id: '1',
      username: 'demo',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      password: 'password123',
      gardenExperience: 'intermediate',
      isVerified: true,
      isAdmin: false,
      createdAt: new Date().toISOString()
    }
  ];
};

let demoUsers = loadUsers();

const saveUsers = () => {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(demoUsers, null, 2));
  } catch (error) {
    console.warn('Could not save demo users file:', error.message);
  }
};

const getNextUserId = () => {
  const numericIds = demoUsers
    .map((user) => Number.parseInt(user._id, 10))
    .filter((id) => !Number.isNaN(id));

  const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  return String(nextId);
};

router.post('/firebase', async (req, res) => {
  try {
    const { idToken, uid, email, displayName, photoURL } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required' });
    }

    let decodedToken = null;

    if (firebaseAdminAvailable) {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      decodedToken = {
        uid: uid || `firebase-${Date.now()}`,
        email,
        name: displayName,
        picture: photoURL
      };
    }

    const normalizedEmail = (decodedToken.email || email || '').toLowerCase().trim();
    const firebaseUid = decodedToken.uid || uid || `firebase-${Date.now()}`;
    const baseName = (displayName || '').trim() || (normalizedEmail ? normalizedEmail.split('@')[0] : 'firebase');
    const firstName = baseName.split(' ')[0] || 'Firebase';
    const lastName = baseName.split(' ').slice(1).join(' ') || 'User';
    const usernameBase = (displayName ? displayName.replace(/\s+/g, '').toLowerCase() : normalizedEmail.split('@')[0] || 'firebaseuser').slice(0, 20);
    const username = `${usernameBase}${Math.floor(Math.random() * 900 + 100)}`;

    let user = demoUsers.find((entry) => entry.firebaseUid === firebaseUid || entry.email === normalizedEmail);

    if (!user) {
      user = {
        _id: getNextUserId(),
        username,
        email: normalizedEmail,
        password: '',
        firstName,
        lastName,
        profileImage: photoURL || '',
        gardenExperience: 'beginner',
        isVerified: true,
        isAdmin: false,
        firebaseUid,
        createdAt: new Date().toISOString()
      };

      demoUsers.push(user);
      saveUsers();
    } else {
      user.firebaseUid = firebaseUid;
      user.email = normalizedEmail;
      user.username = user.username || username;
      user.profileImage = photoURL || user.profileImage || '';
      user.firstName = user.firstName || firstName;
      user.lastName = user.lastName || lastName;
      saveUsers();
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Firebase authentication successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ message: 'Server error during Firebase authentication' });
  }
});

router.post('/register', [
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    const existingUser = demoUsers.find(
      (user) => user.email === normalizedEmail || user.username === normalizedUsername
    );

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === normalizedEmail
          ? 'Email already registered'
          : 'Username already taken'
      });
    }

    const newUser = {
      _id: getNextUserId(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gardenExperience: 'beginner',
      isVerified: true,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    demoUsers.push(newUser);
    saveUsers();

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = demoUsers.find((entry) => entry.email === normalizedEmail);
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = demoUsers.find((entry) => entry._id === decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router;
