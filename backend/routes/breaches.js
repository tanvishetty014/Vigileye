const express = require('express');
const Joi = require('joi');
const Breach = require('../models/Breach');
const { authenticate, authorize } = require('../middleware/auth');
const nlpService = require('../services/nlpService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const breachSchema = Joi.object({
  account_identifier: Joi.string().required(),
  company: Joi.string().required(),
  breach_date: Joi.date().required(),
  attack_type: Joi.string().valid('phishing', 'malware', 'insider_threat', 'unsecured_database', 'ransomware').required(),
  leaked_data: Joi.array().items(Joi.string().valid('email', 'password', 'phone_number', 'credit_card', 'ssn', 'address', 'name')).optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  records_affected: Joi.number().min(0).optional(),
  description: Joi.string().max(1000).optional(),
  source: Joi.string().optional(),
  verified: Joi.boolean().optional()
});

const updateBreachSchema = Joi.object({
  account_identifier: Joi.string().optional(),
  company: Joi.string().optional(),
  breach_date: Joi.date().optional(),
  attack_type: Joi.string().valid('phishing', 'malware', 'insider_threat', 'unsecured_database', 'ransomware').optional(),
  leaked_data: Joi.array().items(Joi.string().valid('email', 'password', 'phone_number', 'credit_card', 'ssn', 'address', 'name')).optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  records_affected: Joi.number().min(0).optional(),
  description: Joi.string().max(1000).optional(),
  source: Joi.string().optional(),
  verified: Joi.boolean().optional()
});

/**
 * @route   GET /api/breaches
 * @desc    Get all breaches with filtering and pagination
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      attack_type,
      severity,
      company,
      start_date,
      end_date,
      verified,
      sort = '-created_at'
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { account_identifier: { $regex: search, $options: 'i' } }
      ];
    }

    if (attack_type) {
      filter.attack_type = attack_type;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (company) {
      filter.company = { $regex: company, $options: 'i' };
    }

    if (verified !== undefined) {
      filter.verified = verified === 'true';
    }

    if (start_date || end_date) {
      filter.breach_date = {};
      if (start_date) filter.breach_date.$gte = new Date(start_date);
      if (end_date) filter.breach_date.$lte = new Date(end_date);
    }

    // Execute query with pagination
    const breaches = await Breach.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Breach.countDocuments(filter);

    res.json({
      success: true,
      data: {
        breaches,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get breaches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch breaches'
    });
  }
});

/**
 * @route   GET /api/breaches/:id
 * @desc    Get single breach by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const breach = await Breach.findById(req.params.id);

    if (!breach) {
      return res.status(404).json({
        success: false,
        message: 'Breach not found'
      });
    }

    res.json({
      success: true,
      data: {
        breach
      }
    });

  } catch (error) {
    logger.error('Get breach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch breach'
    });
  }
});

/**
 * @route   POST /api/breaches
 * @desc    Create new breach
 * @access  Private (Admin/Analyst only)
 */
router.post('/', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { error, value } = breachSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Perform NLP analysis on description if provided
    let nlpAnalysis = null;
    if (value.description) {
      nlpAnalysis = nlpService.analyzeSecurityText(value.description);
    }

    // Perform AI analysis
    const aiAnalysis = await aiService.analyzeBreach({
      type: value.attack_type,
      description: value.description,
      severity: value.severity,
      source: value.source,
      timestamp: value.breach_date
    });

    // Create breach with AI analysis
    const breachData = {
      ...value,
      ai_analysis: {
        risk_score: aiAnalysis.riskScore,
        threat_level: aiAnalysis.threatLevel,
        recommendations: aiAnalysis.recommendations,
        keywords: nlpAnalysis ? nlpAnalysis.security.keywords : [],
        sentiment: nlpAnalysis ? nlpAnalysis.sentiment.comparative > 0 ? 'positive' : 'negative' : 'neutral'
      }
    };

    const breach = new Breach(breachData);
    await breach.save();

    logger.info(`New breach created: ${breach.company} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Breach created successfully',
      data: {
        breach
      }
    });

  } catch (error) {
    logger.error('Create breach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create breach'
    });
  }
});

/**
 * @route   PUT /api/breaches/:id
 * @desc    Update breach
 * @access  Private (Admin/Analyst only)
 */
router.put('/:id', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { error, value } = updateBreachSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const breach = await Breach.findById(req.params.id);
    if (!breach) {
      return res.status(404).json({
        success: false,
        message: 'Breach not found'
      });
    }

    // Update breach
    Object.assign(breach, value);
    await breach.save();

    logger.info(`Breach updated: ${breach.company} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Breach updated successfully',
      data: {
        breach
      }
    });

  } catch (error) {
    logger.error('Update breach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update breach'
    });
  }
});

/**
 * @route   DELETE /api/breaches/:id
 * @desc    Delete breach
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const breach = await Breach.findById(req.params.id);
    if (!breach) {
      return res.status(404).json({
        success: false,
        message: 'Breach not found'
      });
    }

    await Breach.findByIdAndDelete(req.params.id);

    logger.info(`Breach deleted: ${breach.company} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Breach deleted successfully'
    });

  } catch (error) {
    logger.error('Delete breach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete breach'
    });
  }
});

/**
 * @route   GET /api/breaches/stats/overview
 * @desc    Get breach statistics overview
 * @access  Private
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let matchStage = {};
    if (start_date || end_date) {
      matchStage.breach_date = {};
      if (start_date) matchStage.breach_date.$gte = new Date(start_date);
      if (end_date) matchStage.breach_date.$lte = new Date(end_date);
    }

    const stats = await Breach.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBreaches: { $sum: 1 },
          avgRecordsAffected: { $avg: '$records_affected' },
          totalRecordsAffected: { $sum: '$records_affected' },
          attackTypes: { $push: '$attack_type' },
          severities: { $push: '$severity' },
          verifiedBreaches: {
            $sum: { $cond: ['$verified', 1, 0] }
          }
        }
      },
      {
        $project: {
          totalBreaches: 1,
          avgRecordsAffected: { $round: ['$avgRecordsAffected', 0] },
          totalRecordsAffected: 1,
          verifiedBreaches: 1,
          attackTypeDistribution: {
            $reduce: {
              input: '$attackTypes',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          },
          severityDistribution: {
            $reduce: {
              input: '$severities',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    // Get recent breaches
    const recentBreaches = await Breach.find(matchStage)
      .sort({ breach_date: -1 })
      .limit(5)
      .select('company breach_date attack_type severity records_affected')
      .lean();

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalBreaches: 0,
          avgRecordsAffected: 0,
          totalRecordsAffected: 0,
          verifiedBreaches: 0,
          attackTypeDistribution: {},
          severityDistribution: {}
        },
        recentBreaches
      }
    });

  } catch (error) {
    logger.error('Get breach stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch breach statistics'
    });
  }
});

/**
 * @route   POST /api/breaches/:id/analyze
 * @desc    Re-analyze breach with AI/NLP
 * @access  Private (Admin/Analyst only)
 */
router.post('/:id/analyze', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const breach = await Breach.findById(req.params.id);
    if (!breach) {
      return res.status(404).json({
        success: false,
        message: 'Breach not found'
      });
    }

    // Perform fresh AI analysis
    const aiAnalysis = await aiService.analyzeBreach({
      type: breach.attack_type,
      description: breach.description,
      severity: breach.severity,
      source: breach.source,
      timestamp: breach.breach_date
    });

    // Perform NLP analysis if description exists
    let nlpAnalysis = null;
    if (breach.description) {
      nlpAnalysis = nlpService.analyzeSecurityText(breach.description);
    }

    // Update breach with new analysis
    breach.ai_analysis = {
      risk_score: aiAnalysis.riskScore,
      threat_level: aiAnalysis.threatLevel,
      recommendations: aiAnalysis.recommendations,
      keywords: nlpAnalysis ? nlpAnalysis.security.keywords : [],
      sentiment: nlpAnalysis ? nlpAnalysis.sentiment.comparative > 0 ? 'positive' : 'negative' : 'neutral'
    };

    await breach.save();

    res.json({
      success: true,
      message: 'Breach analysis updated successfully',
      data: {
        breach,
        analysis: {
          ai: aiAnalysis,
          nlp: nlpAnalysis
        }
      }
    });

  } catch (error) {
    logger.error('Analyze breach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze breach'
    });
  }
});

/**
 * @route   GET /api/breaches/search/suggestions
 * @desc    Get search suggestions for breaches
 * @access  Private
 */
router.get('/search/suggestions', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const suggestions = await Breach.aggregate([
      {
        $match: {
          $or: [
            { company: { $regex: q, $options: 'i' } },
            { account_identifier: { $regex: q, $options: 'i' } }
          ]
        }
      },
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
          latestBreach: { $max: '$breach_date' }
        }
      },
      {
        $sort: { count: -1, latestBreach: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          company: '$_id',
          count: 1,
          latestBreach: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        suggestions
      }
    });

  } catch (error) {
    logger.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search suggestions'
    });
  }
});

module.exports = router;
