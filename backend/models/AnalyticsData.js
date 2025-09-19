const mongoose = require('mongoose');

const analyticsDataSchema = new mongoose.Schema({
  metric_name: {
    type: String,
    required: [true, 'Metric name is required'],
    index: true
  },
  value: {
    type: Number,
    required: [true, 'Metric value is required']
  },
  change_percentage: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  category: {
    type: String,
    enum: ['security', 'performance', 'threats', 'users', 'engagement'],
    required: [true, 'Category is required']
  },
  subcategory: {
    type: String,
    default: 'general'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [String],
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
analyticsDataSchema.index({ date: -1, category: 1 });
analyticsDataSchema.index({ metric_name: 1, date: -1 });
analyticsDataSchema.index({ category: 1, subcategory: 1 });

// Middleware to update the updated_at field
analyticsDataSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Static method to get metrics by category
analyticsDataSchema.statics.getByCategory = function(category, startDate, endDate) {
  const query = { category };
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  return this.find(query).sort({ date: -1 });
};

// Static method to get trend data
analyticsDataSchema.statics.getTrendData = function(metricName, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    metric_name: metricName,
    date: { $gte: startDate }
  }).sort({ date: 1 });
};

// Static method to calculate aggregated metrics
analyticsDataSchema.statics.getAggregatedMetrics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          metric_name: '$metric_name'
        },
        totalValue: { $sum: '$value' },
        avgValue: { $avg: '$value' },
        maxValue: { $max: '$value' },
        minValue: { $min: '$value' },
        count: { $sum: 1 },
        avgChangePercentage: { $avg: '$change_percentage' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        metrics: {
          $push: {
            metric_name: '$_id.metric_name',
            totalValue: '$totalValue',
            avgValue: { $round: ['$avgValue', 2] },
            maxValue: '$maxValue',
            minValue: '$minValue',
            count: '$count',
            avgChangePercentage: { $round: ['$avgChangePercentage', 2] }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('AnalyticsData', analyticsDataSchema);
