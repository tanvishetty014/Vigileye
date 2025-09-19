const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Breach = require('../models/Breach');
const AnalyticsData = require('../models/AnalyticsData');
const logger = require('./logger');

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Seed Users
    await seedUsers();
    
    // Seed Breaches
    await seedBreaches();
    
    // Seed Analytics Data
    await seedAnalyticsData();

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

/**
 * Seed initial users
 */
async function seedUsers() {
  const existingAdmin = await User.findOne({ email: 'admin@vigil.com' });
  if (!existingAdmin) {
    const admin = new User({
      username: 'admin',
      email: 'admin@vigil.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        department: 'IT Security'
      },
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          criticalAlerts: true
        },
        dashboard: {
          defaultView: 'overview'
        }
      },
      isActive: true,
      emailVerified: true
    });

    await admin.save();
    logger.info('Admin user created: admin@vigil.com / admin123');
  }

  const existingAnalyst = await User.findOne({ email: 'analyst@vigil.com' });
  if (!existingAnalyst) {
    const analyst = new User({
      username: 'analyst',
      email: 'analyst@vigil.com',
      password: 'analyst123',
      role: 'analyst',
      profile: {
        firstName: 'Security',
        lastName: 'Analyst',
        department: 'Security Operations'
      },
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          criticalAlerts: true
        },
        dashboard: {
          defaultView: 'breaches'
        }
      },
      isActive: true,
      emailVerified: true
    });

    await analyst.save();
    logger.info('Analyst user created: analyst@vigil.com / analyst123');
  }

  const existingViewer = await User.findOne({ email: 'viewer@vigil.com' });
  if (!existingViewer) {
    const viewer = new User({
      username: 'viewer',
      email: 'viewer@vigil.com',
      password: 'viewer123',
      role: 'viewer',
      profile: {
        firstName: 'Read',
        lastName: 'Only',
        department: 'Management'
      },
      preferences: {
        theme: 'auto',
        notifications: {
          email: false,
          push: false,
          criticalAlerts: true
        },
        dashboard: {
          defaultView: 'overview'
        }
      },
      isActive: true,
      emailVerified: true
    });

    await viewer.save();
    logger.info('Viewer user created: viewer@vigil.com / viewer123');
  }
}

/**
 * Seed sample breaches
 */
async function seedBreaches() {
  const breachCount = await Breach.countDocuments();
  if (breachCount > 0) {
    logger.info('Breaches already exist, skipping seed');
    return;
  }

  const sampleBreaches = [
    {
      account_identifier: 'john.doe@company.com',
      company: 'TechCorp Inc.',
      breach_date: new Date('2024-01-15'),
      attack_type: 'phishing',
      leaked_data: ['email', 'password', 'phone_number'],
      severity: 'high',
      records_affected: 50000,
      description: 'Large-scale phishing campaign targeting employees resulted in credential theft and unauthorized access to corporate systems.',
      source: 'security_incident',
      verified: true,
      ai_analysis: {
        risk_score: 85,
        threat_level: 'high',
        recommendations: [
          'Implement multi-factor authentication',
          'Conduct security awareness training',
          'Update password policies'
        ],
        keywords: ['phishing', 'credential', 'unauthorized', 'access'],
        sentiment: 'negative'
      }
    },
    {
      account_identifier: 'admin@sensitivecorp.com',
      company: 'SensitiveCorp Ltd.',
      breach_date: new Date('2024-01-20'),
      attack_type: 'ransomware',
      leaked_data: ['email', 'credit_card', 'ssn'],
      severity: 'critical',
      records_affected: 150000,
      description: 'Ransomware attack encrypted critical systems and exfiltrated sensitive customer data including financial information.',
      source: 'external_report',
      verified: true,
      ai_analysis: {
        risk_score: 95,
        threat_level: 'critical',
        recommendations: [
          'Immediate incident response activation',
          'Notify affected customers',
          'Implement data encryption at rest',
          'Enhance backup and recovery procedures'
        ],
        keywords: ['ransomware', 'encrypted', 'exfiltrated', 'sensitive', 'financial'],
        sentiment: 'negative'
      }
    },
    {
      account_identifier: 'user@startup.com',
      company: 'StartupXYZ',
      breach_date: new Date('2024-01-25'),
      attack_type: 'unsecured_database',
      leaked_data: ['email', 'name'],
      severity: 'medium',
      records_affected: 5000,
      description: 'Unsecured database containing user information was discovered exposed to the internet without proper authentication.',
      source: 'security_researcher',
      verified: true,
      ai_analysis: {
        risk_score: 60,
        threat_level: 'medium',
        recommendations: [
          'Secure database with proper authentication',
          'Implement network security controls',
          'Regular security assessments'
        ],
        keywords: ['unsecured', 'database', 'exposed', 'authentication'],
        sentiment: 'negative'
      }
    },
    {
      account_identifier: 'employee@bigcorp.com',
      company: 'BigCorp Enterprises',
      breach_date: new Date('2024-02-01'),
      attack_type: 'insider_threat',
      leaked_data: ['email', 'address', 'phone_number'],
      severity: 'high',
      records_affected: 25000,
      description: 'Malicious insider accessed and leaked customer contact information for personal gain.',
      source: 'internal_investigation',
      verified: true,
      ai_analysis: {
        risk_score: 75,
        threat_level: 'high',
        recommendations: [
          'Review and strengthen access controls',
          'Implement user behavior analytics',
          'Conduct background checks for sensitive roles',
          'Enhance monitoring of data access'
        ],
        keywords: ['insider', 'malicious', 'leaked', 'personal', 'gain'],
        sentiment: 'negative'
      }
    },
    {
      account_identifier: 'customer@smallbiz.com',
      company: 'SmallBiz Solutions',
      breach_date: new Date('2024-02-05'),
      attack_type: 'malware',
      leaked_data: ['email', 'password'],
      severity: 'low',
      records_affected: 1000,
      description: 'Malware infection on customer support system led to unauthorized access to customer credentials.',
      source: 'antivirus_detection',
      verified: false,
      ai_analysis: {
        risk_score: 45,
        threat_level: 'low',
        recommendations: [
          'Update antivirus software',
          'Implement endpoint detection and response',
          'Regular system updates and patches'
        ],
        keywords: ['malware', 'infection', 'unauthorized', 'credentials'],
        sentiment: 'negative'
      }
    }
  ];

  for (const breachData of sampleBreaches) {
    const breach = new Breach(breachData);
    await breach.save();
  }

  logger.info(`${sampleBreaches.length} sample breaches created`);
}

/**
 * Seed analytics data
 */
async function seedAnalyticsData() {
  const analyticsCount = await AnalyticsData.countDocuments();
  if (analyticsCount > 0) {
    logger.info('Analytics data already exists, skipping seed');
    return;
  }

  const sampleAnalytics = [];
  const now = new Date();
  
  // Generate 30 days of sample analytics data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Security metrics
    sampleAnalytics.push({
      metric_name: 'threat_level',
      value: Math.floor(Math.random() * 40) + 30, // 30-70
      change_percentage: (Math.random() - 0.5) * 20, // -10 to +10
      date: date,
      category: 'security',
      subcategory: 'threats',
      metadata: { source: 'automated_monitoring' }
    });

    sampleAnalytics.push({
      metric_name: 'security_score',
      value: Math.floor(Math.random() * 30) + 70, // 70-100
      change_percentage: (Math.random() - 0.5) * 10, // -5 to +5
      date: date,
      category: 'security',
      subcategory: 'overall',
      metadata: { source: 'security_assessment' }
    });

    sampleAnalytics.push({
      metric_name: 'response_time',
      value: Math.floor(Math.random() * 200) + 100, // 100-300 seconds
      change_percentage: (Math.random() - 0.5) * 30, // -15 to +15
      date: date,
      category: 'performance',
      subcategory: 'incident_response',
      metadata: { unit: 'seconds' }
    });

    sampleAnalytics.push({
      metric_name: 'active_threats',
      value: Math.floor(Math.random() * 50) + 10, // 10-60
      change_percentage: (Math.random() - 0.5) * 25, // -12.5 to +12.5
      date: date,
      category: 'threats',
      subcategory: 'active',
      metadata: { severity_breakdown: { high: Math.floor(Math.random() * 10) } }
    });

    // Add some weekly patterns
    if (i % 7 === 0) {
      sampleAnalytics.push({
        metric_name: 'weekly_scan_results',
        value: Math.floor(Math.random() * 100) + 50, // 50-150
        change_percentage: (Math.random() - 0.5) * 20,
        date: date,
        category: 'security',
        subcategory: 'vulnerability_scan',
        metadata: { scan_type: 'comprehensive' }
      });
    }
  }

  for (const analyticsData of sampleAnalytics) {
    const analytics = new AnalyticsData(analyticsData);
    await analytics.save();
  }

  logger.info(`${sampleAnalytics.length} sample analytics data points created`);
}

/**
 * Clear all seeded data
 */
async function clearSeededData() {
  try {
    await User.deleteMany({ email: { $in: ['admin@vigil.com', 'analyst@vigil.com', 'viewer@vigil.com'] } });
    await Breach.deleteMany({});
    await AnalyticsData.deleteMany({});
    logger.info('All seeded data cleared');
  } catch (error) {
    logger.error('Error clearing seeded data:', error);
    throw error;
  }
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedBreaches,
  seedAnalyticsData,
  clearSeededData
};
