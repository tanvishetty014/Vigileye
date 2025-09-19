const express = require('express');
const Joi = require('joi');
const ScanReport = require('../models/ScanReport');
const Breach = require('../models/Breach');
const { authenticate, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const scanReportSchema = Joi.object({
  scan_id: Joi.string().required(),
  target: Joi.string().required(),
  scan_type: Joi.string().valid('vulnerability', 'network', 'web', 'malware', 'compliance').required(),
  findings: Joi.array().items(Joi.object({
    severity: Joi.string().valid('info', 'low', 'medium', 'high', 'critical').required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    cve_id: Joi.string().optional(),
    cvss_score: Joi.number().min(0).max(10).optional(),
    recommendation: Joi.string().optional(),
    references: Joi.array().items(Joi.string()).optional(),
    metadata: Joi.object().optional()
  })).optional(),
  created_by: Joi.string().optional()
});

const updateReportSchema = Joi.object({
  target: Joi.string().optional(),
  scan_type: Joi.string().valid('vulnerability', 'network', 'web', 'malware', 'compliance').optional(),
  status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled').optional(),
  findings: Joi.array().items(Joi.object({
    severity: Joi.string().valid('info', 'low', 'medium', 'high', 'critical').required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    cve_id: Joi.string().optional(),
    cvss_score: Joi.number().min(0).max(10).optional(),
    recommendation: Joi.string().optional(),
    references: Joi.array().items(Joi.string()).optional(),
    metadata: Joi.object().optional()
  })).optional()
});

/**
 * @route   GET /api/reports
 * @desc    Get all scan reports with filtering and pagination
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      scan_type,
      status,
      target,
      start_date,
      end_date,
      sort = '-start_time'
    } = req.query;

    // Build filter object
    const filter = {};

    if (scan_type) {
      filter.scan_type = scan_type;
    }

    if (status) {
      filter.status = status;
    }

    if (target) {
      filter.target = { $regex: target, $options: 'i' };
    }

    if (start_date || end_date) {
      filter.start_time = {};
      if (start_date) filter.start_time.$gte = new Date(start_date);
      if (end_date) filter.start_time.$lte = new Date(end_date);
    }

    // Execute query with pagination
    const reports = await ScanReport.find(filter)
      .populate('created_by', 'username email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ScanReport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get scan reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan reports'
    });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get single scan report by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await ScanReport.findById(req.params.id)
      .populate('created_by', 'username email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Scan report not found'
      });
    }

    res.json({
      success: true,
      data: {
        report
      }
    });

  } catch (error) {
    logger.error('Get scan report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan report'
    });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create new scan report
 * @access  Private (Admin/Analyst only)
 */
router.post('/', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { error, value } = scanReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if scan_id already exists
    const existingReport = await ScanReport.findOne({ scan_id: value.scan_id });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Scan report with this ID already exists'
      });
    }

    // Create new report
    const reportData = {
      ...value,
      created_by: req.user.id,
      start_time: new Date(),
      status: 'pending'
    };

    const report = new ScanReport(reportData);
    await report.save();

    // Calculate summary if findings are provided
    if (value.findings && value.findings.length > 0) {
      report.calculateSummary();
      await report.save();
    }

    // Perform AI analysis if findings exist
    if (value.findings && value.findings.length > 0) {
      try {
        const aiAnalysis = await aiService.analyzeThreat({
          type: value.scan_type,
          description: `Scan report with ${value.findings.length} findings`,
          severity: this.getHighestSeverity(value.findings),
          source: 'scan_report',
          timestamp: new Date(),
          metadata: {
            findings: value.findings,
            target: value.target
          }
        });

        report.ai_analysis = {
          risk_assessment: {
            overall_risk: aiAnalysis.threatLevel,
            risk_score: aiAnalysis.riskScore,
            reasoning: aiAnalysis.rawResponse
          },
          recommendations: aiAnalysis.recommendations.map(rec => ({
            category: 'general',
            recommendation: rec,
            impact: 'medium',
            effort: 'medium'
          }))
        };

        await report.save();
      } catch (aiError) {
        logger.error('AI analysis failed for scan report:', aiError);
        // Continue without AI analysis
      }
    }

    logger.info(`New scan report created: ${report.scan_id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Scan report created successfully',
      data: {
        report
      }
    });

  } catch (error) {
    logger.error('Create scan report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scan report'
    });
  }
});

/**
 * @route   PUT /api/reports/:id
 * @desc    Update scan report
 * @access  Private (Admin/Analyst only)
 */
router.put('/:id', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { error, value } = updateReportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const report = await ScanReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Scan report not found'
      });
    }

    // Update report
    Object.assign(report, value);

    // Update end time if status is completed
    if (value.status === 'completed' && report.status !== 'completed') {
      report.end_time = new Date();
    }

    // Recalculate summary if findings are updated
    if (value.findings) {
      report.calculateSummary();
    }

    await report.save();

    logger.info(`Scan report updated: ${report.scan_id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Scan report updated successfully',
      data: {
        report
      }
    });

  } catch (error) {
    logger.error('Update scan report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scan report'
    });
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete scan report
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const report = await ScanReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Scan report not found'
      });
    }

    await ScanReport.findByIdAndDelete(req.params.id);

    logger.info(`Scan report deleted: ${report.scan_id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Scan report deleted successfully'
    });

  } catch (error) {
    logger.error('Delete scan report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scan report'
    });
  }
});

/**
 * @route   GET /api/reports/stats/overview
 * @desc    Get scan report statistics overview
 * @access  Private
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let matchStage = {};
    if (start_date || end_date) {
      matchStage.start_time = {};
      if (start_date) matchStage.start_time.$gte = new Date(start_date);
      if (end_date) matchStage.start_time.$lte = new Date(end_date);
    }

    const stats = await ScanReport.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          completedScans: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedScans: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          runningScans: {
            $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' },
          totalFindings: { $sum: '$summary.total_findings' },
          criticalFindings: { $sum: '$summary.critical_count' },
          highFindings: { $sum: '$summary.high_count' },
          scanTypes: { $push: '$scan_type' }
        }
      },
      {
        $project: {
          totalScans: 1,
          completedScans: 1,
          failedScans: 1,
          runningScans: 1,
          avgDuration: { $round: ['$avgDuration', 2] },
          totalFindings: 1,
          criticalFindings: 1,
          highFindings: 1,
          scanTypeDistribution: {
            $reduce: {
              input: '$scanTypes',
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

    // Get recent reports
    const recentReports = await ScanReport.find(matchStage)
      .sort({ start_time: -1 })
      .limit(5)
      .select('scan_id target scan_type status summary.duration summary.total_findings')
      .lean();

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalScans: 0,
          completedScans: 0,
          failedScans: 0,
          runningScans: 0,
          avgDuration: 0,
          totalFindings: 0,
          criticalFindings: 0,
          highFindings: 0,
          scanTypeDistribution: {}
        },
        recentReports
      }
    });

  } catch (error) {
    logger.error('Get scan report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan report statistics'
    });
  }
});

/**
 * @route   POST /api/reports/:id/analyze
 * @desc    Re-analyze scan report with AI
 * @access  Private (Admin/Analyst only)
 */
router.post('/:id/analyze', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const report = await ScanReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Scan report not found'
      });
    }

    if (!report.findings || report.findings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No findings to analyze'
      });
    }

    // Perform AI analysis
    const aiAnalysis = await aiService.analyzeThreat({
      type: report.scan_type,
      description: `Scan report with ${report.findings.length} findings`,
      severity: this.getHighestSeverity(report.findings),
      source: 'scan_report',
      timestamp: report.start_time,
      metadata: {
        findings: report.findings,
        target: report.target,
        summary: report.summary
      }
    });

    // Update report with AI analysis
    report.ai_analysis = {
      risk_assessment: {
        overall_risk: aiAnalysis.threatLevel,
        risk_score: aiAnalysis.riskScore,
        reasoning: aiAnalysis.rawResponse
      },
      recommendations: aiAnalysis.recommendations.map(rec => ({
        category: 'general',
        recommendation: rec,
        impact: 'medium',
        effort: 'medium'
      }))
    };

    await report.save();

    res.json({
      success: true,
      message: 'Scan report analysis updated successfully',
      data: {
        report,
        analysis: aiAnalysis
      }
    });

  } catch (error) {
    logger.error('Analyze scan report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze scan report'
    });
  }
});

/**
 * @route   GET /api/reports/export/:id
 * @desc    Export scan report
 * @access  Private
 */
router.get('/export/:id', authenticate, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const report = await ScanReport.findById(req.params.id)
      .populate('created_by', 'username email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Scan report not found'
      });
    }

    if (format === 'json') {
      res.json({
        success: true,
        data: {
          report
        }
      });
    } else {
      // Generate text report
      const textReport = this.generateTextReport(report);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="scan_report_${report.scan_id}.txt"`);
      res.send(textReport);
    }

  } catch (error) {
    logger.error('Export scan report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export scan report'
    });
  }
});

/**
 * Helper method to get highest severity from findings
 */
function getHighestSeverity(findings) {
  const severityOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'info': 1 };
  return findings.reduce((highest, finding) => {
    return severityOrder[finding.severity] > severityOrder[highest] ? finding.severity : highest;
  }, 'info');
}

/**
 * Generate text report
 */
function generateTextReport(report) {
  let textReport = `SCAN REPORT\n`;
  textReport += `============\n\n`;
  textReport += `Scan ID: ${report.scan_id}\n`;
  textReport += `Target: ${report.target}\n`;
  textReport += `Scan Type: ${report.scan_type}\n`;
  textReport += `Status: ${report.status}\n`;
  textReport += `Start Time: ${report.start_time}\n`;
  if (report.end_time) {
    textReport += `End Time: ${report.end_time}\n`;
    textReport += `Duration: ${report.duration} seconds\n`;
  }
  textReport += `\n`;

  if (report.summary) {
    textReport += `SUMMARY\n`;
    textReport += `=======\n`;
    textReport += `Total Findings: ${report.summary.total_findings}\n`;
    textReport += `Critical: ${report.summary.critical_count}\n`;
    textReport += `High: ${report.summary.high_count}\n`;
    textReport += `Medium: ${report.summary.medium_count}\n`;
    textReport += `Low: ${report.summary.low_count}\n`;
    textReport += `Info: ${report.summary.info_count}\n\n`;
  }

  if (report.findings && report.findings.length > 0) {
    textReport += `FINDINGS\n`;
    textReport += `========\n\n`;
    
    report.findings.forEach((finding, index) => {
      textReport += `${index + 1}. ${finding.title}\n`;
      textReport += `   Severity: ${finding.severity.toUpperCase()}\n`;
      textReport += `   Category: ${finding.category}\n`;
      if (finding.cve_id) {
        textReport += `   CVE ID: ${finding.cve_id}\n`;
      }
      if (finding.cvss_score) {
        textReport += `   CVSS Score: ${finding.cvss_score}\n`;
      }
      textReport += `   Description: ${finding.description}\n`;
      if (finding.recommendation) {
        textReport += `   Recommendation: ${finding.recommendation}\n`;
      }
      textReport += `\n`;
    });
  }

  if (report.ai_analysis) {
    textReport += `AI ANALYSIS\n`;
    textReport += `===========\n`;
    textReport += `Overall Risk: ${report.ai_analysis.risk_assessment.overall_risk}\n`;
    textReport += `Risk Score: ${report.ai_analysis.risk_assessment.risk_score}\n`;
    textReport += `Reasoning: ${report.ai_analysis.risk_assessment.reasoning}\n\n`;
    
    if (report.ai_analysis.recommendations && report.ai_analysis.recommendations.length > 0) {
      textReport += `RECOMMENDATIONS\n`;
      textReport += `===============\n`;
      report.ai_analysis.recommendations.forEach((rec, index) => {
        textReport += `${index + 1}. ${rec.recommendation}\n`;
      });
    }
  }

  return textReport;
}

module.exports = router;
