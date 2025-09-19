const mongoose = require('mongoose');

const scanReportSchema = new mongoose.Schema({
  scan_id: {
    type: String,
    required: [true, 'Scan ID is required'],
    unique: true,
    index: true
  },
  target: {
    type: String,
    required: [true, 'Target is required']
  },
  scan_type: {
    type: String,
    enum: ['vulnerability', 'network', 'web', 'malware', 'compliance'],
    required: [true, 'Scan type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  start_time: {
    type: Date,
    default: Date.now
  },
  end_time: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  findings: [{
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    cve_id: String,
    cvss_score: Number,
    recommendation: String,
    references: [String],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  summary: {
    total_findings: {
      type: Number,
      default: 0
    },
    critical_count: {
      type: Number,
      default: 0
    },
    high_count: {
      type: Number,
      default: 0
    },
    medium_count: {
      type: Number,
      default: 0
    },
    low_count: {
      type: Number,
      default: 0
    },
    info_count: {
      type: Number,
      default: 0
    }
  },
  ai_analysis: {
    risk_assessment: {
      overall_risk: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      risk_score: Number,
      reasoning: String
    },
    prioritization: [{
      finding_id: String,
      priority_score: Number,
      reason: String
    }],
    recommendations: [{
      category: String,
      recommendation: String,
      impact: String,
      effort: String
    }]
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
scanReportSchema.index({ scan_type: 1, status: 1 });
scanReportSchema.index({ start_time: -1 });
scanReportSchema.index({ 'findings.severity': 1 });
scanReportSchema.index({ created_by: 1 });

// Middleware to update the updated_at field and calculate duration
scanReportSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  if (this.end_time && this.start_time) {
    this.duration = Math.floor((this.end_time - this.start_time) / 1000);
  }
  
  next();
});

// Method to calculate summary statistics
scanReportSchema.methods.calculateSummary = function() {
  const summary = {
    total_findings: this.findings.length,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    info_count: 0
  };

  this.findings.forEach(finding => {
    switch (finding.severity) {
      case 'critical':
        summary.critical_count++;
        break;
      case 'high':
        summary.high_count++;
        break;
      case 'medium':
        summary.medium_count++;
        break;
      case 'low':
        summary.low_count++;
        break;
      case 'info':
        summary.info_count++;
        break;
    }
  });

  this.summary = summary;
  return summary;
};

// Static method to get reports by date range
scanReportSchema.statics.getByDateRange = function(startDate, endDate, scanType = null) {
  const query = {
    start_time: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (scanType) {
    query.scan_type = scanType;
  }
  
  return this.find(query).sort({ start_time: -1 });
};

// Static method to get scan statistics
scanReportSchema.statics.getStatistics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        start_time: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$scan_type',
        totalScans: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        totalFindings: { $sum: '$summary.total_findings' },
        criticalFindings: { $sum: '$summary.critical_count' },
        highFindings: { $sum: '$summary.high_count' },
        mediumFindings: { $sum: '$summary.medium_count' },
        lowFindings: { $sum: '$summary.low_count' }
      }
    }
  ]);
};

module.exports = mongoose.model('ScanReport', scanReportSchema);
