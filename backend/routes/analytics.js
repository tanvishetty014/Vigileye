const express = require('express');
const Joi = require('joi');
const AnalyticsData = require('../models/AnalyticsData');
const Breach = require('../models/Breach');
const ScanReport = require('../models/ScanReport');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const analyticsDataSchema = Joi.object({
  metric_name: Joi.string().required(),
  value: Joi.number().required(),
  change_percentage: Joi.number().optional(),
  date: Joi.date().required(),
  category: Joi.string().valid('security', 'performance', 'threats', 'users', 'engagement').required(),
  subcategory: Joi.string().optional(),
  metadata: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

/**
 * @route   GET /api/analytics/metrics
 * @desc    Get analytics metrics with filtering
 * @access  Private
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const {
      category,
      subcategory,
      metric_name,
      start_date,
      end_date,
      page = 1,
      limit = 50,
      sort = '-date'
    } = req.query;

    // Build filter
    const filter = {};

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (metric_name) filter.metric_name = { $regex: metric_name, $options: 'i' };

    if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }

    const metrics = await AnalyticsData.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AnalyticsData.countDocuments(filter);

    res.json({
      success: true,
      data: {
        metrics,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get analytics metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics metrics'
    });
  }
});

/**
 * @route   POST /api/analytics/metrics
 * @desc    Create new analytics metric
 * @access  Private (Admin/Analyst only)
 */
router.post('/metrics', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { error, value } = analyticsDataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const metric = new AnalyticsData(value);
    await metric.save();

    logger.info(`New analytics metric created: ${metric.metric_name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Analytics metric created successfully',
      data: {
        metric
      }
    });

  } catch (error) {
    logger.error('Create analytics metric error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create analytics metric'
    });
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics data
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get aggregated metrics
    const aggregatedMetrics = await AnalyticsData.getAggregatedMetrics(
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Get breach statistics
    const breachStats = await Breach.aggregate([
      {
        $match: {
          breach_date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalBreaches: { $sum: 1 },
          totalRecordsAffected: { $sum: '$records_affected' },
          criticalBreaches: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          highBreaches: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          },
          avgRiskScore: { $avg: '$ai_analysis.risk_score' }
        }
      }
    ]);

    // Get scan report statistics
    const scanStats = await ScanReport.aggregate([
      {
        $match: {
          start_time: {
            $gte: startDate,
            $lte: endDate
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          totalFindings: { $sum: '$summary.total_findings' },
          criticalFindings: { $sum: '$summary.critical_count' },
          highFindings: { $sum: '$summary.high_count' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get trend data for key metrics
    const trendData = await AnalyticsData.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          },
          metric_name: { $in: ['threat_level', 'security_score', 'response_time'] }
        }
      },
      {
        $group: {
          _id: {
            metric_name: '$metric_name',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          avgValue: { $avg: '$value' },
          maxValue: { $max: '$value' },
          minValue: { $min: '$value' }
        }
      },
      {
        $group: {
          _id: '$_id.metric_name',
          data: {
            $push: {
              date: '$_id.date',
              avgValue: { $round: ['$avgValue', 2] },
              maxValue: '$maxValue',
              minValue: '$minValue'
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        aggregatedMetrics: aggregatedMetrics[0] || {},
        breachStatistics: breachStats[0] || {
          totalBreaches: 0,
          totalRecordsAffected: 0,
          criticalBreaches: 0,
          highBreaches: 0,
          avgRiskScore: 0
        },
        scanStatistics: scanStats[0] || {
          totalScans: 0,
          totalFindings: 0,
          criticalFindings: 0,
          highFindings: 0,
          avgDuration: 0
        },
        trendData
      }
    });

  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/trends/:metricName
 * @desc    Get trend data for specific metric
 * @access  Private
 */
router.get('/trends/:metricName', authenticate, async (req, res) => {
  try {
    const { metricName } = req.params;
    const { days = 30 } = req.query;

    const trendData = await AnalyticsData.getTrendData(metricName, parseInt(days));

    // Calculate trend direction
    let trendDirection = 'stable';
    if (trendData.length >= 2) {
      const firstValue = trendData[0].value;
      const lastValue = trendData[trendData.length - 1].value;
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      if (change > 5) trendDirection = 'increasing';
      else if (change < -5) trendDirection = 'decreasing';
    }

    res.json({
      success: true,
      data: {
        metricName,
        period: `${days} days`,
        trendDirection,
        data: trendData,
        summary: {
          currentValue: trendData.length > 0 ? trendData[trendData.length - 1].value : 0,
          averageValue: trendData.length > 0 ? 
            trendData.reduce((sum, item) => sum + item.value, 0) / trendData.length : 0,
          maxValue: trendData.length > 0 ? Math.max(...trendData.map(item => item.value)) : 0,
          minValue: trendData.length > 0 ? Math.min(...trendData.map(item => item.value)) : 0
        }
      }
    });

  } catch (error) {
    logger.error('Get trend data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend data'
    });
  }
});

/**
 * @route   GET /api/analytics/categories
 * @desc    Get analytics by categories
 * @access  Private
 */
router.get('/categories', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let matchStage = {};
    if (start_date || end_date) {
      matchStage.date = {};
      if (start_date) matchStage.date.$gte = new Date(start_date);
      if (end_date) matchStage.date.$lte = new Date(end_date);
    }

    const categoryData = await AnalyticsData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          metrics: {
            $push: {
              metric_name: '$metric_name',
              value: '$value',
              date: '$date',
              change_percentage: '$change_percentage'
            }
          },
          totalMetrics: { $sum: 1 },
          avgValue: { $avg: '$value' },
          maxValue: { $max: '$value' },
          minValue: { $min: '$value' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalMetrics: 1,
          avgValue: { $round: ['$avgValue', 2] },
          maxValue: 1,
          minValue: 1,
          metrics: {
            $slice: ['$metrics', 10] // Limit to 10 most recent metrics per category
          },
          _id: 0
        }
      },
      {
        $sort: { category: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        categories: categoryData
      }
    });

  } catch (error) {
    logger.error('Get category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance analytics
 * @access  Private
 */
router.get('/performance', authenticate, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      default:
        startDate.setHours(endDate.getHours() - 24);
    }

    const performanceData = await AnalyticsData.find({
      category: 'performance',
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    // Calculate performance metrics
    const responseTimeData = performanceData.filter(d => d.metric_name === 'response_time');
    const throughputData = performanceData.filter(d => d.metric_name === 'throughput');
    const errorRateData = performanceData.filter(d => d.metric_name === 'error_rate');

    const performanceMetrics = {
      responseTime: {
        current: responseTimeData.length > 0 ? responseTimeData[0].value : 0,
        average: responseTimeData.length > 0 ? 
          responseTimeData.reduce((sum, item) => sum + item.value, 0) / responseTimeData.length : 0,
        trend: responseTimeData.length >= 2 ? 
          responseTimeData[0].value - responseTimeData[1].value : 0
      },
      throughput: {
        current: throughputData.length > 0 ? throughputData[0].value : 0,
        average: throughputData.length > 0 ? 
          throughputData.reduce((sum, item) => sum + item.value, 0) / throughputData.length : 0,
        trend: throughputData.length >= 2 ? 
          throughputData[0].value - throughputData[1].value : 0
      },
      errorRate: {
        current: errorRateData.length > 0 ? errorRateData[0].value : 0,
        average: errorRateData.length > 0 ? 
          errorRateData.reduce((sum, item) => sum + item.value, 0) / errorRateData.length : 0,
        trend: errorRateData.length >= 2 ? 
          errorRateData[0].value - errorRateData[1].value : 0
      }
    };

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        metrics: performanceMetrics,
        rawData: performanceData
      }
    });

  } catch (error) {
    logger.error('Get performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics'
    });
  }
});

/**
 * @route   DELETE /api/analytics/metrics/:id
 * @desc    Delete analytics metric
 * @access  Private (Admin only)
 */
router.delete('/metrics/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const metric = await AnalyticsData.findById(req.params.id);
    if (!metric) {
      return res.status(404).json({
        success: false,
        message: 'Analytics metric not found'
      });
    }

    await AnalyticsData.findByIdAndDelete(req.params.id);

    logger.info(`Analytics metric deleted: ${metric.metric_name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Analytics metric deleted successfully'
    });

  } catch (error) {
    logger.error('Delete analytics metric error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analytics metric'
    });
  }
});

module.exports = router;
