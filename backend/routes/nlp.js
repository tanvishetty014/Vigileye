const express = require('express');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');
const nlpService = require('../services/nlpService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const textAnalysisSchema = Joi.object({
  text: Joi.string().required().max(10000),
  analysis_type: Joi.string().valid('security', 'sentiment', 'entities', 'classification', 'summary').optional()
});

const batchAnalysisSchema = Joi.object({
  texts: Joi.array().items(Joi.string().max(10000)).min(1).max(50).required(),
  analysis_type: Joi.string().valid('security', 'sentiment', 'entities', 'classification', 'summary').optional()
});

/**
 * @route   POST /api/nlp/analyze
 * @desc    Analyze text using NLP services
 * @access  Private
 */
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { error, value } = textAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { text, analysis_type = 'security' } = value;

    let result;

    switch (analysis_type) {
      case 'security':
        result = nlpService.analyzeSecurityText(text);
        break;
      case 'sentiment':
        result = {
          sentiment: nlpService.sentiment.analyze(text),
          language: nlpService.detectLanguage(text)
        };
        break;
      case 'entities':
        result = {
          entities: nlpService.extractEntities(text),
          keyPhrases: nlpService.extractKeyPhrases(text)
        };
        break;
      case 'classification':
        result = nlpService.classifySecurityText(text);
        break;
      case 'summary':
        result = {
          summary: nlpService.generateSummary(text),
          keyPhrases: nlpService.extractKeyPhrases(text)
        };
        break;
      default:
        result = nlpService.analyzeSecurityText(text);
    }

    logger.info(`NLP analysis completed for user: ${req.user.email}, type: ${analysis_type}`);

    res.json({
      success: true,
      data: {
        analysis: result,
        metadata: {
          analysisType: analysis_type,
          textLength: text.length,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('NLP analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze text'
    });
  }
});

/**
 * @route   POST /api/nlp/batch-analyze
 * @desc    Analyze multiple texts in batch
 * @access  Private (Admin/Analyst only)
 */
router.post('/batch-analyze', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { error, value } = batchAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { texts, analysis_type = 'security' } = value;

    const results = texts.map((text, index) => {
      try {
        let result;
        
        switch (analysis_type) {
          case 'security':
            result = nlpService.analyzeSecurityText(text);
            break;
          case 'sentiment':
            result = {
              sentiment: nlpService.sentiment.analyze(text),
              language: nlpService.detectLanguage(text)
            };
            break;
          case 'entities':
            result = {
              entities: nlpService.extractEntities(text),
              keyPhrases: nlpService.extractKeyPhrases(text)
            };
            break;
          case 'classification':
            result = nlpService.classifySecurityText(text);
            break;
          case 'summary':
            result = {
              summary: nlpService.generateSummary(text),
              keyPhrases: nlpService.extractKeyPhrases(text)
            };
            break;
          default:
            result = nlpService.analyzeSecurityText(text);
        }

        return {
          index,
          success: true,
          analysis: result,
          metadata: {
            textLength: text.length
          }
        };
      } catch (textError) {
        logger.error(`Error analyzing text ${index}:`, textError);
        return {
          index,
          success: false,
          error: 'Failed to analyze text',
          metadata: {
            textLength: text.length
          }
        };
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`Batch NLP analysis completed: ${successCount} successful, ${failureCount} failed by user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: texts.length,
          successful: successCount,
          failed: failureCount,
          analysisType: analysis_type,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Batch NLP analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch analysis'
    });
  }
});

/**
 * @route   POST /api/nlp/extract-entities
 * @desc    Extract entities from text
 * @access  Private
 */
router.post('/extract-entities', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Text too long. Maximum 10,000 characters allowed.'
      });
    }

    const entities = nlpService.extractEntities(text);
    const keyPhrases = nlpService.extractKeyPhrases(text);

    res.json({
      success: true,
      data: {
        entities,
        keyPhrases,
        metadata: {
          textLength: text.length,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Entity extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract entities'
    });
  }
});

/**
 * @route   POST /api/nlp/sentiment-analysis
 * @desc    Perform sentiment analysis on text
 * @access  Private
 */
router.post('/sentiment-analysis', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Text too long. Maximum 10,000 characters allowed.'
      });
    }

    const sentiment = nlpService.sentiment.analyze(text);
    const language = nlpService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        sentiment,
        language,
        metadata: {
          textLength: text.length,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform sentiment analysis'
    });
  }
});

/**
 * @route   POST /api/nlp/classify
 * @desc    Classify security text
 * @access  Private
 */
router.post('/classify', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Text too long. Maximum 10,000 characters allowed.'
      });
    }

    const classification = nlpService.classifySecurityText(text);

    res.json({
      success: true,
      data: {
        classification,
        metadata: {
          textLength: text.length,
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Text classification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to classify text'
    });
  }
});

/**
 * @route   POST /api/nlp/summarize
 * @desc    Generate summary of text
 * @access  Private
 */
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Text too long. Maximum 10,000 characters allowed.'
      });
    }

    const summary = nlpService.generateSummary(text);
    const keyPhrases = nlpService.extractKeyPhrases(text);

    res.json({
      success: true,
      data: {
        summary,
        keyPhrases,
        metadata: {
          originalLength: text.length,
          summaryLength: summary.length,
          compressionRatio: (summary.length / text.length * 100).toFixed(2) + '%',
          processedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Text summarization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to summarize text'
    });
  }
});

/**
 * @route   GET /api/nlp/keywords
 * @desc    Get available security keywords
 * @access  Private
 */
router.get('/keywords', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        keywords: nlpService.securityKeywords,
        categories: {
          'threats': ['breach', 'hack', 'attack', 'vulnerability', 'exploit', 'malware'],
          'attack_types': ['phishing', 'ransomware', 'ddos', 'intrusion', 'compromise'],
          'data_types': ['data leak', 'unauthorized access', 'security incident'],
          'indicators': ['threat', 'risk', 'alert', 'suspicious', 'anomaly']
        }
      }
    });

  } catch (error) {
    logger.error('Get keywords error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch keywords'
    });
  }
});

/**
 * @route   GET /api/nlp/stats
 * @desc    Get NLP service statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = {
      service: {
        name: 'NLP Service',
        version: '1.0.0',
        status: 'active'
      },
      capabilities: [
        'Security text analysis',
        'Sentiment analysis',
        'Entity extraction',
        'Text classification',
        'Text summarization',
        'Language detection'
      ],
      supportedLanguages: ['en'],
      maxTextLength: 10000,
      maxBatchSize: 50
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    logger.error('Get NLP stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NLP statistics'
    });
  }
});

module.exports = router;
