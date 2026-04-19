const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

async function connectDB() {
  // Useful for production robustness (avoid hanging connections).
  mongoose.set('strictQuery', true);

  const autoIndex = process.env.NODE_ENV !== 'production';

  await mongoose.connect(MONGODB_URI, {
    autoIndex,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  // One-time collaborator schema migration (legacy [ObjectId] -> [{ userId, status }]).
  try {
    const { migrateCollaborators } = require('../scripts/migrateCollaborators');
    await migrateCollaborators();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[db] migrateCollaborators skipped:', err.message);
  }

  return mongoose.connection;
}

module.exports = { connectDB };

