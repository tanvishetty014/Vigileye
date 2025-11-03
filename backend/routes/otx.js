const express = require('express');
const Joi = require('joi');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const otx = require('../services/otxService');

const router = express.Router();

const overviewSchema = Joi.object({
  days: Joi.number().integer().min(1).max(90).default(7)
});

router.get('/overview', optionalAuth, async (req, res) => {
  try {
    const { error, value } = overviewSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    if (!process.env.OTX_API_KEY) {
      logger.warn('OTX_API_KEY not configured; attempting public endpoints');
    }
    const result = await otx.getOverview(value.days);
    res.json(result);
  } catch (err) {
    logger.error('OTX overview error:', err);
    res.status(502).json({ success: false, message: 'Failed to fetch OTX analytics' });
  }
});

module.exports = router;