const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const Joi = require('joi');
const { authenticate, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schema
const lookupSchema = Joi.object({
  email: Joi.string().email().required(),
  includeDetails: Joi.boolean().optional(),
  includePastes: Joi.boolean().optional()
});

/**
 * @route   POST /api/breach-lookup/check
 * @desc    Check email for data breaches using real-time API
 * @access  Public (rate limited)
 */
router.post('/check', optionalAuth, async (req, res) => {
  try {
    logger.info('Breach lookup request received:', JSON.stringify(req.body));
    
    const { error, value } = lookupSchema.validate(req.body);
    if (error) {
      logger.error('Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, includeDetails = true, includePastes = true } = value;
    const shouldIncludePastes = includePastes !== undefined ? includePastes : includeDetails;

    logger.info(`Breach lookup requested for: ${email} by ${req.user ? req.user.email : 'anonymous'}`);

    // Call Python script for real-time breach checking
    const pythonScript = path.join(__dirname, '..', 'scripts', 'breach-checker.py');
    
    const pythonProcess = spawn('python', [pythonScript, email]);
    
    let pythonData = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
      pythonData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(pythonData);
          
          if (result.success) {
            // Process and enhance the data
            const breaches = (result.breaches || []).map(breach => ({
              Name: breach.name,
              Title: breach.title,
              Domain: breach.domain,
              BreachDate: breach.breachDate,
              AddedDate: breach.addedDate,
              PwnCount: breach.pwnCount,
              DataClasses: breach.dataClasses,
              Description: stripHtml(breach.description),
              IsVerified: breach.isVerified,
              IsSensitive: breach.isSensitive,
              LogoPath: breach.logoPath
            }));

            const pastes = (result.pastes || []).map(paste => ({
              Id: paste.id,
              Source: paste.source,
              Title: paste.title,
              Date: paste.date,
              EmailCount: paste.emailCount
            }));

            // Calculate summary metrics
            const totalAccounts = breaches.reduce((sum, breach) => sum + (breach.PwnCount || 0), 0);
            const riskScore = calculateRiskScore(breaches, pastes);
            const severity = getRiskLevel(riskScore);
            const lastBreach = breaches.length > 0 ? 
              breaches.slice().sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate))[0].BreachDate : null;

            const processedResult = {
              success: true,
              email: result.email,
              breaches: breaches,
              pastes: shouldIncludePastes ? pastes : [],
              summary: {
                totalBreaches: result.totalBreaches,
                totalPastes: result.totalPastes,
                totalAccounts: totalAccounts,
                severity: severity,
                lastBreach: lastBreach,
                riskScore: riskScore
              },
              checkedAt: result.checkedAt,
              message: result.message
            };

            res.status(result.status || 200).json(processedResult);
          } else {
            const status = result.status || 502;
            const message = result.error || 'Failed to check breach data';
            res.status(status).json({
              success: false,
              message,
              ...(result.retryAfter ? { retryAfter: result.retryAfter } : {})
            });
          }
        } catch (parseError) {
          logger.error('Error parsing Python script output:', parseError);
          res.status(502).json({
            success: false,
            message: 'Invalid response from security provider'
          });
        }
      } else {
        logger.error('Python script error:', pythonError);
        const msg = pythonError ? `Breach check execution error: ${pythonError.trim()}` : 'Failed to execute breach check';
        res.status(500).json({
          success: false,
          message: msg
        });
      }
    });

    // Set timeout for the request
    setTimeout(() => {
      if (!res.headersSent) {
        pythonProcess.kill();
        res.status(408).json({
          success: false,
          message: 'Breach check timed out. Please try again.'
        });
      }
    }, 30000); // 30 second timeout

  } catch (error) {
    logger.error('Breach lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform breach lookup'
    });
  }
});

/**
 * @route   GET /api/breach-lookup/stats
 * @desc    Get breach lookup statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    // This would typically come from a database of lookup history
    // For now, return mock stats
    const stats = {
      success: true,
      data: {
        totalLookups: 1247,
        uniqueEmails: 892,
        breachesFound: 654,
        lastUpdated: new Date().toISOString(),
        topBreaches: [
          { name: 'LinkedIn', count: 164000000, year: '2012' },
          { name: 'Adobe', count: 152000000, year: '2013' },
          { name: 'MySpace', count: 359000000, year: '2008' },
          { name: 'Twitter', count: 330000000, year: '2022' }
        ]
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Helper functions
function getSeverity(breach) {
  let score = 0;
  
  // Check data sensitivity
  const sensitiveData = ['passwords', 'credit cards', 'social security numbers', 'financial'];
  const dataClasses = (breach.dataClasses || []).map(d => d.toLowerCase());
  
  if (dataClasses.some(dc => sensitiveData.some(sd => dc.includes(sd)))) {
    score += 3;
  }
  
  // Check verification status
  if (breach.isVerified) score += 2;
  if (breach.isSensitive) score += 2;
  
  // Check breach size
  if (breach.pwnCount > 100000000) score += 3;
  else if (breach.pwnCount > 10000000) score += 2;
  else if (breach.pwnCount > 1000000) score += 1;
  
  // Determine severity
  if (score >= 7) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function formatNumber(num) {
  if (!num) return '0';
  return num.toLocaleString();
}

function calculateRiskScore(breaches, pastes) {
  let score = 0;
  
  // Base score for having breaches
  score += breaches.length * 1.5;
  
  // Additional score for pastes
  score += pastes.length * 0.5;
  
  // Score based on sensitive data
  breaches.forEach(breach => {
    if (breach.IsSensitive) score += 2;
    if (breach.IsVerified) score += 1;
    
    // High-impact breaches
    if (breach.PwnCount > 100000000) score += 3;
    else if (breach.PwnCount > 10000000) score += 2;
    else if (breach.PwnCount > 1000000) score += 1;
    
    // Sensitive data types
    const sensitiveTypes = ['passwords', 'credit cards', 'financial', 'social security'];
    const dataClasses = (breach.DataClasses || []).map(d => d.toLowerCase());
    if (dataClasses.some(dc => sensitiveTypes.some(st => dc.includes(st)))) {
      score += 2;
    }
  });
  
  return Math.min(Math.round(score), 10);
}

function getRiskLevel(score) {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

module.exports = router;
