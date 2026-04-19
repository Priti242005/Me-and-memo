/**
 * One-time migration: legacy collaborators were [ObjectId].
 * New schema: [{ userId, status }].
 */
const mongoose = require('mongoose');
const Post = require('../models/Post');

async function migrateCollaborators() {
  const raw = await Post.collection.find({ collaborators: { $exists: true, $ne: [] } }).toArray();

  let updated = 0;
  for (const doc of raw) {
    const arr = doc.collaborators;
    if (!Array.isArray(arr) || arr.length === 0) continue;

    const first = arr[0];
    if (first && typeof first === 'object' && first.userId) continue;

    const newCollabs = arr.map((id) => ({
      userId: id,
      status: 'accepted',
    }));

    await Post.collection.updateOne({ _id: doc._id }, { $set: { collaborators: newCollabs } });
    updated += 1;
  }

  if (updated > 0) {
    // eslint-disable-next-line no-console
    console.log(`[migrateCollaborators] Updated ${updated} posts`);
  }
}

module.exports = { migrateCollaborators };
