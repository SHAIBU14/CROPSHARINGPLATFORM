const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// @route   POST /api/ai/identify-crop
// @desc    Identify crop from image using AI
// @access  Private
router.post('/identify-crop', [
  body('imageUrl').notEmpty().withMessage('Image URL is required'),
  body('imageUrl').isURL().withMessage('Valid image URL is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { imageUrl } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify this plant/crop from the image. Provide the common name, scientific name, category (vegetable, herb, fruit, flower, grain, legume), growing season, and basic care tips. Format your response as JSON with fields: name, scientificName, category, season, careTips, confidence (0-100)."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const aiResponse = response.choices[0].message.content;
    
    try {
      const cropData = JSON.parse(aiResponse);
      res.json({
        success: true,
        cropData
      });
    } catch (parseError) {
      res.json({
        success: true,
        rawResponse: aiResponse
      });
    }
  } catch (error) {
    console.error('Crop identification error:', error);
    res.status(500).json({ 
      message: 'Failed to identify crop',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ai/crop-recommendations
// @desc    Get AI-powered crop recommendations
// @access  Private
router.post('/crop-recommendations', [
  body('location.lat').isNumeric().withMessage('Valid latitude is required'),
  body('location.lng').isNumeric().withMessage('Valid longitude is required'),
  body('season').isIn(['spring', 'summer', 'fall', 'winter']).withMessage('Valid season is required'),
  body('gardenSize').isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Valid garden size is required'),
  body('experience').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Valid experience level is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location, season, gardenSize, experience, preferences = [] } = req.body;

    const prompt = `Based on the following information, recommend 5-8 crops that would be suitable for growing:

Location: Latitude ${location.lat}, Longitude ${location.lng}
Season: ${season}
Garden Size: ${gardenSize}
Experience Level: ${experience}
Preferences: ${preferences.join(', ') || 'None specified'}

Please provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "name": "Crop Name",
      "category": "vegetable/herb/fruit/flower/grain/legume",
      "season": "spring/summer/fall/winter/year-round",
      "difficulty": "easy/medium/hard",
      "description": "Brief description",
      "plantingTips": "Specific planting advice",
      "careRequirements": "Water, sun, soil requirements",
      "harvestTime": "When to harvest",
      "companionPlants": ["plant1", "plant2"],
      "whyRecommended": "Why this crop is good for this situation"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;
    
    try {
      const recommendations = JSON.parse(aiResponse);
      res.json({
        success: true,
        recommendations: recommendations.recommendations
      });
    } catch (parseError) {
      res.json({
        success: true,
        rawResponse: aiResponse
      });
    }
  } catch (error) {
    console.error('Crop recommendations error:', error);
    res.status(500).json({ 
      message: 'Failed to get crop recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ai/garden-tips
// @desc    Get AI-powered gardening tips
// @access  Private
router.post('/garden-tips', [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('experience').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Valid experience level is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, experience, specificQuestions = [] } = req.body;

    const prompt = `Provide comprehensive gardening tips for: ${topic}

Experience Level: ${experience}
Specific Questions: ${specificQuestions.join(', ') || 'None'}

Please provide tips in JSON format with the following structure:
{
  "tips": [
    {
      "title": "Tip Title",
      "description": "Detailed explanation",
      "category": "planting/care/harvesting/troubleshooting",
      "difficulty": "beginner/intermediate/advanced",
      "season": "spring/summer/fall/winter/year-round"
    }
  ],
  "summary": "Brief summary of key points"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000
    });

    const aiResponse = response.choices[0].message.content;
    
    try {
      const tips = JSON.parse(aiResponse);
      res.json({
        success: true,
        tips: tips.tips,
        summary: tips.summary
      });
    } catch (parseError) {
      res.json({
        success: true,
        rawResponse: aiResponse
      });
    }
  } catch (error) {
    console.error('Garden tips error:', error);
    res.status(500).json({ 
      message: 'Failed to get garden tips',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ai/message-suggestions
// @desc    Get AI-powered message suggestions for crop trades
// @access  Private
router.post('/message-suggestions', [
  body('cropName').notEmpty().withMessage('Crop name is required'),
  body('tradeType').isIn(['request', 'offer', 'trade']).withMessage('Valid trade type is required'),
  body('quantity').notEmpty().withMessage('Quantity is required'),
  body('tone').isIn(['friendly', 'professional', 'casual']).withMessage('Valid tone is required')
], authMiddleware, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cropName, tradeType, quantity, tone, additionalContext = '' } = req.body;

    const prompt = `Generate 3 different message suggestions for a ${tradeType} involving ${quantity} of ${cropName}.

Tone: ${tone}
Additional Context: ${additionalContext}

Please provide suggestions in JSON format:
{
  "suggestions": [
    {
      "message": "The actual message text",
      "tone": "friendly/professional/casual",
      "length": "short/medium/long"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500
    });

    const aiResponse = response.choices[0].message.content;
    
    try {
      const suggestions = JSON.parse(aiResponse);
      res.json({
        success: true,
        suggestions: suggestions.suggestions
      });
    } catch (parseError) {
      res.json({
        success: true,
        rawResponse: aiResponse
      });
    }
  } catch (error) {
    console.error('Message suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to get message suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
