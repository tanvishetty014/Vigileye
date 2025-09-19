const mongoose = require('mongoose');

const breachSchema = new mongoose.Schema({
  account_identifier: {
    type: String,
    required: [true, 'Account identifier is required'],
    index: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    index: true
  },
  breach_date: {
    type: Date,
    required: [true, 'Breach date is required']
  },
  attack_type: {
    type: String,
    enum: ['phishing', 'malware', 'insider_threat', 'unsecured_database', 'ransomware'],
    required: [true, 'Attack type is required']
  },
  leaked_data: [{
    type: String,
    enum: ['email', 'password', 'phone_number', 'credit_card', 'ssn', 'address', 'name']
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  records_affected: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    maxlength: 1000
  },
  source: {
    type: String,
    default: 'external'
  },
  verified: {
    type: Boolean,
    default: false
  },
  ai_analysis: {
    risk_score: Number,
    threat_level: String,
    recommendations: [String],
    keywords: [String],
    sentiment: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
breachSchema.index({ breach_date: -1 });
breachSchema.index({ attack_type: 1 });
breachSchema.index({ severity: 1 });
breachSchema.index({ company: 'text', description: 'text' });

// Middleware to update the updated_at field
breachSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Virtual for formatted breach date
breachSchema.virtual('formatted_date').get(function() {
  return this.breach_date.toISOString().split('T')[0];
});

// Static method to find breaches by date range
breachSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    breach_date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });
};

// Static method to get breach statistics
breachSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalBreaches: { $sum: 1 },
        avgRecordsAffected: { $avg: '$records_affected' },
        attackTypes: { $push: '$attack_type' },
        severities: { $push: '$severity' }
      }
    },
    {
      $project: {
        totalBreaches: 1,
        avgRecordsAffected: { $round: ['$avgRecordsAffected', 0] },
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
};

module.exports = mongoose.model('Breach', breachSchema);
