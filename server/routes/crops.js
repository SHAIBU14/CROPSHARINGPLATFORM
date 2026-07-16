const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const CropModel = require('../models/Crop');
const GardenModel = require('../models/Garden');
const User = require('../models/User');

const router = express.Router();

// Demo mode - use JSON file storage
const CROPS_FILE = path.join(__dirname, '../data/demo-crops.json');
const GARDENS_FILE = path.join(__dirname, '../data/demo-gardens.json');
const USERS_FILE = path.join(__dirname, '../data/demo-users.json');

const isDbReady = () => mongoose.connection.readyState === 1;

const loadCropsFromStorage = async () => {
  try {
    const data = await fs.readFile(CROPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const readCrops = loadCropsFromStorage;

const writeCropsToStorage = async (crops) => {
  await fs.writeFile(CROPS_FILE, JSON.stringify(crops, null, 2));
};

const loadGardensFromStorage = async () => {
  try {
    const data = await fs.readFile(GARDENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const findGardenReference = async (gardenField) => {
  if (!gardenField) return null;

  if (typeof gardenField === 'string') {
    if (isDbReady() && mongoose.Types.ObjectId.isValid(gardenField)) {
      const garden = await GardenModel.findById(gardenField).lean();
      if (garden) return garden;
    }

    const gardens = await loadGardensFromStorage();
    return gardens.find(g => g._id === gardenField || g.name.toLowerCase() === gardenField.toLowerCase()) || null;
  }

  return null;
};

// @route   POST /api/crops
// @desc    Create a new crop listing
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Crop name is required'),
  body('category').isIn(['vegetable', 'herb', 'fruit', 'flower', 'grain', 'legume']).withMessage('Valid category is required'),
  body('quantity.amount').isNumeric().withMessage('Quantity amount must be a number'),
  body('quantity.unit').isIn(['kg', 'lbs', 'pieces', 'bunches', 'bags', 'containers']).withMessage('Valid unit is required'),
  body('harvestDate').notEmpty().withMessage('Valid harvest date is required'),
  body('season').isIn(['spring', 'summer', 'fall', 'winter', 'year-round']).withMessage('Valid season is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const users = await readUsers();
    const demoUser = users.find(u => u._id === req.user._id);
    const owner = demoUser || req.user;

    const gardenRef = await findGardenReference(req.body.garden);
    const gardenInfo = gardenRef ? {
      _id: gardenRef._id,
      name: gardenRef.name,
      location: gardenRef.location || { city: 'Unknown', state: 'Unknown', coordinates: req.body.location?.coordinates || { lat: 0, lng: 0 } }
    } : {
      _id: req.body.garden || 'default-garden',
      name: req.body.gardenName || 'My Garden',
      location: {
        city: owner.location?.city || 'Unknown',
        state: owner.location?.state || 'Unknown',
        coordinates: req.body.location?.coordinates || { lat: 0, lng: 0 }
      }
    };

    const cropData = {
      name: req.body.name,
      variety: req.body.variety || '',
      description: req.body.description || '',
      category: req.body.category,
      quantity: {
        amount: Number(req.body.quantity?.amount) || 0,
        unit: req.body.quantity?.unit || 'kg'
      },
      harvestDate: new Date(req.body.harvestDate),
      season: req.body.season,
      isFree: req.body.isFree === true || req.body.isFree === 'true',
      price: Number(req.body.price || 0),
      availability: req.body.availability || 'available',
      growingMethod: req.body.growingMethod || 'conventional',
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      images: Array.isArray(req.body.images) ? req.body.images : [],
      garden: gardenInfo,
      owner: {
        _id: owner._id,
        username: owner.username || 'unknown',
        firstName: owner.firstName || 'Unknown',
        lastName: owner.lastName || '',
        profileImage: owner.profileImage || ''
      },
      sellerId: owner._id,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (isDbReady()) {
      const newCrop = new CropModel({
        name: cropData.name,
        variety: cropData.variety,
        description: cropData.description,
        category: cropData.category,
        quantity: cropData.quantity,
        harvestDate: cropData.harvestDate,
        season: cropData.season,
        isFree: cropData.isFree,
        price: cropData.price,
        availability: cropData.availability,
        growingMethod: cropData.growingMethod,
        tags: cropData.tags,
        images: cropData.images,
        garden: gardenInfo._id,
        owner: owner._id,
        sellerId: owner._id,
        isActive: true
      });

      await newCrop.save();
      await newCrop.populate('garden').populate('owner');
      return res.status(201).json({ message: 'Crop listing created successfully', crop: newCrop });
    }

    const crops = await loadCropsFromStorage();
    const newCrop = {
      _id: Date.now().toString(),
      ...cropData
    };

    crops.unshift(newCrop);
    await writeCropsToStorage(crops);

    res.status(201).json({ message: 'Crop listing created successfully', crop: newCrop });
  } catch (error) {
    console.error('Create crop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/crops
// @desc    Get all crops with optional filters
// @access  Public
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { category, availability = 'available', season, isFree, search } = req.query;

    let crops = [];

    if (isDbReady()) {
      const query = { isActive: true };
      if (availability && availability !== 'all') query.availability = availability;
      if (category && category !== 'all') query.category = category;
      if (season && season !== 'all') query.season = season;
      if (isFree === 'true') query.isFree = true;

      if (search) {
        const searchRegExp = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegExp },
          { variety: searchRegExp },
          { description: searchRegExp },
          { tags: searchRegExp }
        ];
      }

      crops = await CropModel.find(query)
        .populate('garden', 'name location')
        .populate('owner', 'username firstName lastName profileImage upiId phoneNumber')
        .lean();
    } else {
      crops = await readCrops();

      if (availability && availability !== 'all') {
        crops = crops.filter(crop => crop.availability === availability);
      }

      if (category && category !== 'all') {
        crops = crops.filter(crop => crop.category === category);
      }

      if (season && season !== 'all') {
        crops = crops.filter(crop => crop.season === season);
      }

      if (isFree === 'true') {
        crops = crops.filter(crop => crop.isFree === true);
      }

      if (search) {
        const searchLower = String(search).toLowerCase();
        crops = crops.filter(crop =>
          crop.name.toLowerCase().includes(searchLower) ||
          (crop.variety && crop.variety.toLowerCase().includes(searchLower)) ||
          (crop.description && crop.description.toLowerCase().includes(searchLower)) ||
          (crop.tags && crop.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }

      crops = crops.filter(crop => crop.isActive !== false);
    }

    res.json({ crops });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/crops/my-crops
// @desc    Get current user's crops
// @access  Private
router.get('/my-crops', authMiddleware, async (req, res) => {
  try {
    if (isDbReady()) {
      const crops = await CropModel.find({ owner: req.user._id, isActive: true })
        .populate('garden', 'name location')
        .populate('owner', 'username firstName lastName profileImage upiId phoneNumber')
        .lean();
      return res.json({ crops });
    }

    const crops = await readCrops();
    const userCrops = crops.filter(crop => crop.owner?._id === req.user._id && crop.isActive !== false);
    return res.json({ crops: userCrops });
  } catch (error) {
    console.error('Get my crops error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/crops/:id
// @desc    Get crop by ID
// @access  Public
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    let crop = null;

    if (isDbReady()) {
      crop = await CropModel.findById(req.params.id)
        .populate('garden', 'name location')
        .populate('owner', 'username firstName lastName profileImage upiId phoneNumber')
        .lean();
    } else {
      const crops = await readCrops();
      crop = crops.find(c => c._id === req.params.id);
    }

    if (!crop || crop.isActive === false) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.json({ crop });
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/crops/:id/purchase
// @desc    Purchase or reserve a crop listing
// @access  Private
router.post('/:id/purchase', [
  body('paymentMethod').isIn(['cod', 'online']).withMessage('Payment method must be COD or online'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const quantity = Number(req.body.quantity || 1);
    const { paymentMethod } = req.body;
    let crop;
    let remainingQuantity = null;

    if (isDbReady()) {
      const cropDoc = await CropModel.findById(req.params.id)
        .populate('owner', 'username firstName lastName profileImage upiId phoneNumber');

      if (!cropDoc || cropDoc.isActive === false) {
        return res.status(404).json({ message: 'Crop not found' });
      }

      if (quantity > cropDoc.quantity.amount) {
        return res.status(400).json({ message: `Only ${cropDoc.quantity.amount} ${cropDoc.quantity.unit} available for purchase.` });
      }

      cropDoc.quantity.amount -= quantity;
      if (cropDoc.quantity.amount <= 0) {
        cropDoc.availability = 'sold out';
      }

      await cropDoc.save();
      crop = cropDoc.toObject();
      remainingQuantity = cropDoc.quantity.amount;
    } else {
      const crops = await readCrops();
      const cropIndex = crops.findIndex(c => c._id === req.params.id);

      if (cropIndex === -1 || crops[cropIndex].isActive === false) {
        return res.status(404).json({ message: 'Crop not found' });
      }

      crop = crops[cropIndex];
      if (quantity > crop.quantity.amount) {
        return res.status(400).json({ message: `Only ${crop.quantity.amount} ${crop.quantity.unit} available for purchase.` });
      }

      crops[cropIndex].quantity.amount = Math.max(0, Number(crop.quantity.amount) - quantity);
      if (crops[cropIndex].quantity.amount <= 0) {
        crops[cropIndex].availability = 'sold out';
      }

      remainingQuantity = crops[cropIndex].quantity.amount;
      await writeCropsToStorage(crops);
    }

    const order = {
      _id: Date.now().toString(),
      cropId: req.params.id,
      cropName: crop.name,
      buyer: {
        _id: req.user._id,
        username: req.user.username || 'unknown',
        firstName: req.user.firstName || '',
        lastName: req.user.lastName || ''
      },
      seller: {
        _id: crop.owner?._id || null,
        username: crop.owner?.username || 'seller',
        firstName: crop.owner?.firstName || '',
        lastName: crop.owner?.lastName || ''
      },
      paymentMethod,
      quantity,
      totalPrice: crop.isFree ? 0 : Number(crop.price || 0) * quantity,
      status: paymentMethod === 'cod' ? 'pending' : 'processing',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ message: 'Checkout successful', order, remainingQuantity });
  } catch (error) {
    console.error('Purchase crop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/crops/:id
// @desc    Update crop listing
// @access  Private
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Crop name is required'),
  body('category').optional().isIn(['vegetable', 'herb', 'fruit', 'flower', 'grain', 'legume']).withMessage('Valid category is required'),
  body('quantity.amount').optional().isNumeric().withMessage('Quantity amount must be a number'),
  body('quantity.unit').optional().isIn(['kg', 'lbs', 'pieces', 'bunches', 'bags', 'containers']).withMessage('Valid unit is required'),
  body('harvestDate').optional().isISO8601().withMessage('Valid harvest date is required'),
  body('season').optional().isIn(['spring', 'summer', 'fall', 'winter', 'year-round']).withMessage('Valid season is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const allowedFields = ['name', 'variety', 'description', 'category', 'season', 'availability', 'growingMethod', 'isFree', 'price', 'tags'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.quantity) {
      updates.quantity = {
        amount: Number(req.body.quantity.amount ?? 0),
        unit: req.body.quantity.unit || 'kg'
      };
    }

    if (req.body.harvestDate) {
      updates.harvestDate = new Date(req.body.harvestDate);
    }

    if (req.body.images && Array.isArray(req.body.images)) {
      updates.images = req.body.images;
    }

    if (req.body.garden) {
      const gardenRef = await findGardenReference(req.body.garden);
      if (gardenRef) {
        updates.garden = gardenRef._id;
      }
    }

    if (isDbReady()) {
      const crop = await CropModel.findById(req.params.id);
      if (!crop || crop.isActive === false) {
        return res.status(404).json({ message: 'Crop not found' });
      }

      // if (crop.owner.toString() !== req.user._id.toString()) {
      //   return res.status(403).json({ message: 'Not authorized to update this crop' });
      // }

      Object.assign(crop, updates);
      await crop.save();
      await crop.populate('garden', 'name location');
      await crop.populate('owner', 'username firstName lastName profileImage upiId phoneNumber');

      return res.json({ message: 'Crop updated successfully', crop });
    }

    const crops = await readCrops();
    const cropIndex = crops.findIndex(c => c._id === req.params.id);
    if (cropIndex === -1 || crops[cropIndex].isActive === false) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // if (cropIndex !== -1 && crops[cropIndex].owner !== req.user._id.toString()) {
    //   return res.status(403).json({ message: 'Not authorized to update this crop' });
    // }

    crops[cropIndex] = {
      ...crops[cropIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await writeCropsToStorage(crops);
    res.json({ message: 'Crop updated successfully', crop: crops[cropIndex] });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/crops/:id
// @desc    Delete crop
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (isDbReady()) {
      const crop = await CropModel.findById(req.params.id);
      if (!crop || crop.isActive === false) {
        return res.status(404).json({ message: 'Crop not found' });
      }

      // if (crop.owner.toString() !== req.user._id.toString()) {
      //   return res.status(403).json({ message: 'Not authorized to delete this crop' });
      // }

      crop.isActive = false;
      await crop.save();
      return res.json({ message: 'Crop deleted successfully' });
    }

    const crops = await loadCropsFromStorage();
    const cropIndex = crops.findIndex(c => c._id === req.params.id);

    if (cropIndex === -1) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // if (crops[cropIndex].owner._id !== req.user._id) {
    //   return res.status(403).json({ message: 'Not authorized to delete this crop' });
    // }

    crops[cropIndex].isActive = false;
    await writeCropsToStorage(crops);

    res.json({ message: 'Crop deleted successfully' });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
