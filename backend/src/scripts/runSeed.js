// Seed runner script
// Run with: npm run seed

require('dotenv').config();
const seedDatabase = require('./seedDb');

seedDatabase()
  .then(() => {
    console.log('✓ Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  });
