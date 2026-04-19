const mongoose = require('mongoose');
const AppError = require('../middleware/AppError');
const Reel = require('../models/Reel');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parsePagination(value, defaultValue, maxValue) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;
  if (maxValue && parsed > maxValue) return maxValue;
  return parsed;
}

async function uploadReel(req, res) {
  const { caption } = req.body || {};
  const file = req.file;
  if (!file) throw new AppError('Media file is required (field name: media)', 400);

  const safeCaption =
    typeof caption === 'string'
      ? caption.trim().slice(0, 1000)
      : '';

  const mediaUrl = await uploadToCloudinary({
    localFilePath: file.path,
    mimetype: file.mimetype,
  });

  const reel = await Reel.create({
    userId: req.user.id,
    caption: safeCaption,
    mediaUrl: mediaUrl.trim(),
  });

  const populated = await reel.populate('userId', 'username profilePic bio');
  return res.status(201).json({ reel: populated });
}

async function likeReel(req, res) {
  const { reelId } = req.params;
  if (!isValidObjectId(reelId)) throw new AppError('Invalid reel id', 400);

  const reel = await Reel.findByIdAndUpdate(
    reelId,
    { $addToSet: { likes: req.user.id } },
    { new: true }
  );

  if (!reel) throw new AppError('Reel not found', 404);

  const populated = await reel.populate('userId', 'username profilePic bio');
  return res.status(200).json({ message: 'Reel liked', reel: populated });
}

async function commentReel(req, res) {
  const { reelId } = req.params;
  if (!isValidObjectId(reelId)) throw new AppError('Invalid reel id', 400);

  const { text } = req.body || {};
  if (typeof text !== 'string' || text.trim() === '') {
    throw new AppError('Comment text is required', 400);
  }

  const trimmed = text.trim();
  if (trimmed.length > 500) throw new AppError('Comment text too long', 400);

  const updated = await Reel.findByIdAndUpdate(
    reelId,
    {
      $push: {
        comments: { userId: req.user.id, text: trimmed },
      },
    },
    { new: true }
  );

  if (!updated) throw new AppError('Reel not found', 404);

  const populated = await updated.populate('userId', 'username profilePic bio');
  return res.status(201).json({ message: 'Comment added', reel: populated });
}

async function getReelsFeed(req, res) {
  const page = parsePagination(req.query.page, 1);
  const limit = parsePagination(req.query.limit, 20, 50);

  // We show reels from people you follow + yourself (same rule as posts feed).
  // `following` is stored as an array of userIds.
  const me = await User.findById(req.user.id).select('following');
  if (!me) {
    // Should be rare if auth is valid.
    throw new AppError('User not found', 404);
  }

  const authorIds = [...me.following, me._id];

  const reels = await Reel.find({ userId: { $in: authorIds } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId', 'username profilePic bio');

  return res.status(200).json({ reels, page, limit });
}

module.exports = { uploadReel, likeReel, commentReel, getReelsFeed };

