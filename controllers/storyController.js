const mongoose = require('mongoose');
const AppError = require('../middleware/AppError');
const Story = require('../models/Story');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

function minUser(u) {
  if (!u) return null;
  return {
    _id: u._id,
    username: u.username,
    profilePic: u.profilePic || '',
  };
}

function canSeeStoryContent(story, viewerId) {
  const owner = story.userId;
  if (!owner) return false;
  if (String(owner._id) === String(viewerId)) return true;

  if (story.audience === 'close_friends') {
    const closeIds = (owner.closeFriends || []).map((id) => String(id));
    return closeIds.includes(String(viewerId));
  }

  return true;
}

function canSeeUserStories(owner, viewerId) {
  if (!owner) return false;
  const ownerId = String(owner._id);
  if (ownerId === String(viewerId)) return true;
  if (!owner.isPrivate) return true;
  const followers = (owner.followers || []).map((id) => String(id));
  return followers.includes(String(viewerId));
}

function groupStoriesByUser(stories, viewerId) {
  const map = new Map();
  for (const s of stories) {
    const owner = s.userId;
    if (!owner) continue;
    if (!canSeeUserStories(owner, viewerId)) continue;
    if (!canSeeStoryContent(s, viewerId)) continue;

    const uid = String(owner._id);
    if (!map.has(uid)) {
      map.set(uid, {
        user: minUser(owner),
        stories: [],
      });
    }
    map.get(uid).stories.push(s);
  }

  for (const g of map.values()) {
    g.stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    if (String(a.user._id) === String(viewerId)) return -1;
    if (String(b.user._id) === String(viewerId)) return 1;
    return 0;
  });

  return groups;
}

async function createStory(req, res) {
  const file = req.files?.media?.[0] || req.file;
  const audioFile = req.files?.audio?.[0] || null;
  if (!file) throw new AppError('Media file is required (field name: media)', 400);

  const {
    caption = '',
    overlayText = '',
    audience = 'public',
  } = req.body || {};

  const aud =
    String(audience).toLowerCase() === 'close_friends' ? 'close_friends' : 'public';

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[story] create', { userId: req.user.id, audience: aud });
  }

  const mediaUrl = await uploadToCloudinary({
    localFilePath: file.path,
    mimetype: file.mimetype,
    folder: 'instagram_clone/stories',
  });

  let audioUrl = '';
  let audioName = '';
  if (audioFile) {
    audioUrl = await uploadToCloudinary({
      localFilePath: audioFile.path,
      mimetype: audioFile.mimetype,
      folder: 'instagram_clone/story_audio',
      resourceType: 'video',
    });
    audioName = String(audioFile.originalname || 'Track').trim().slice(0, 160);
  }

  const story = await Story.create({
    userId: req.user.id,
    mediaUrl: mediaUrl.trim(),
    audioUrl: audioUrl.trim(),
    audioName,
    caption: String(caption).slice(0, 500),
    overlayText: String(overlayText).slice(0, 500),
    audience: aud,
  });

  await story.populate('userId', 'username profilePic isPrivate followers closeFriends');

  return res.status(201).json({ story });
}

async function getStoriesFeed(req, res) {
  const me = await User.findById(req.user.id).select('following');
  if (!me) throw new AppError('User not found', 404);

  const followedIds = (me.following || []).map((id) => String(id));
  const idsToFetch = [...followedIds, String(req.user.id)];

  const now = new Date();
  const stories = await Story.find({
    userId: { $in: idsToFetch },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'username profilePic isPrivate followers closeFriends');

  const groups = groupStoriesByUser(stories, req.user.id);

  return res.status(200).json({ groups });
}

async function getMyStories(req, res) {
  const now = new Date();
  const stories = await Story.find({
    userId: req.user.id,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'username profilePic closeFriends');

  const groups = groupStoriesByUser(stories, req.user.id);
  return res.status(200).json({ groups, stories });
}

async function getUserStories(req, res) {
  const { userId } = req.params;
  const owner = await User.findById(userId).select('isPrivate followers closeFriends');
  if (!owner) throw new AppError('User not found', 404);

  const isOwner = String(owner._id) === String(req.user.id);
  const isFollower = (owner.followers || []).some(
    (id) => String(id) === String(req.user.id)
  );
  if (owner.isPrivate && !isOwner && !isFollower) {
    return res.status(200).json({ groups: [], stories: [] });
  }

  const now = new Date();
  const stories = await Story.find({
    userId,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'username profilePic isPrivate followers closeFriends');

  const groups = groupStoriesByUser(stories, req.user.id);
  return res.status(200).json({ groups, stories });
}

async function recordStoryView(req, res) {
  const storyId = req.params.id || req.params.storyId;
  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    throw new AppError('Invalid story id', 400);
  }

  const story = await Story.findById(storyId).populate(
    'userId',
    'username profilePic isPrivate followers closeFriends'
  );
  if (!story) throw new AppError('Story not found', 404);
  if (new Date(story.expiresAt) <= new Date()) {
    throw new AppError('Story expired', 410);
  }

  if (!canSeeUserStories(story.userId, req.user.id)) {
    throw new AppError('Not allowed to view this story', 403);
  }
  if (!canSeeStoryContent(story, req.user.id)) {
    throw new AppError('Not allowed to view this story', 403);
  }

  const already = (story.views || []).some((id) => String(id) === String(req.user.id));
  if (!already) {
    await Story.updateOne(
      { _id: storyId },
      { $addToSet: { views: req.user.id } }
    );
  }

  return res.status(200).json({ message: 'View recorded', viewed: true });
}

async function getStoryViewers(req, res) {
  const storyId = req.params.id || req.params.storyId;
  if (!mongoose.Types.ObjectId.isValid(storyId)) {
    throw new AppError('Invalid story id', 400);
  }

  const story = await Story.findById(storyId).populate('views', 'username profilePic');
  if (!story) throw new AppError('Story not found', 404);
  if (String(story.userId) !== String(req.user.id)) {
    throw new AppError('Only the story owner can see viewers', 403);
  }

  const viewers = (story.views || []).map((u) => ({
    _id: u._id,
    username: u.username,
    profilePic: u.profilePic,
  }));

  return res.status(200).json({ viewers, count: viewers.length });
}

module.exports = {
  createStory,
  getStoriesFeed,
  getMyStories,
  getUserStories,
  recordStoryView,
  getStoryViewers,
};
