const mongoose = require('mongoose');
const AppError = require('../middleware/AppError');
const Highlight = require('../models/Highlight');
const Story = require('../models/Story');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function createHighlight(req, res) {
  const { title, stories = [], coverImage = '' } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    throw new AppError('Title is required', 400);
  }

  const storyIds = Array.isArray(stories) ? stories : [];
  if (storyIds.some((id) => !isValidObjectId(id))) {
    throw new AppError('Invalid story id in stories array', 400);
  }

  const ownedStories = await Story.find({
    _id: { $in: storyIds },
    userId: req.user.id,
  }).select('_id');
  const allowedIds = ownedStories.map((s) => s._id);

  const highlight = await Highlight.create({
    userId: req.user.id,
    title: title.trim().slice(0, 60),
    stories: allowedIds,
    coverImage: String(coverImage || ''),
  });

  await highlight.populate({
    path: 'stories',
    populate: { path: 'userId', select: 'username profilePic' },
  });
  return res.status(201).json({ highlight });
}

async function getHighlightsByUser(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);

  const highlights = await Highlight.find({ userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'stories',
      populate: { path: 'userId', select: 'username profilePic' },
    });

  return res.status(200).json({ highlights });
}

async function addStoryToHighlight(req, res) {
  const { highlightId, storyId } = req.body || {};
  if (!isValidObjectId(highlightId) || !isValidObjectId(storyId)) {
    throw new AppError('Invalid highlight or story id', 400);
  }

  const highlight = await Highlight.findOne({ _id: highlightId, userId: req.user.id });
  if (!highlight) throw new AppError('Highlight not found', 404);

  const story = await Story.findOne({ _id: storyId, userId: req.user.id });
  if (!story) throw new AppError('Story not found', 404);

  await Highlight.updateOne({ _id: highlightId }, { $addToSet: { stories: storyId } });
  const updated = await Highlight.findById(highlightId).populate({
    path: 'stories',
    populate: { path: 'userId', select: 'username profilePic' },
  });

  return res.status(200).json({ highlight: updated });
}

module.exports = {
  createHighlight,
  getHighlightsByUser,
  addStoryToHighlight,
};
