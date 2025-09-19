const mongoose = require('mongoose');
require('dotenv').config();
const { seedDatabase } = require('../utils/seedData');
const logger = require('../utils/logger');

async function runSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vigil');
    logger.info('Connected to MongoDB for seeding');

    // Run seeding
    await seedDatabase();

    logger.info('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
