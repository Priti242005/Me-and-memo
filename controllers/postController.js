const mongoose = require('mongoose');
const AppError = require('../middleware/AppError');
const Post = require('../models/Post');
const User = require('../models/User');
const FlaggedComment = require('../models/FlaggedComment');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');
const { populatePost } = require('../utils/postPopulate');
const { parseUnlockSchedule } = require('../utils/parseUnlockSchedule');
const { containsToxicLanguage } = require('../utils/toxicWords');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parsePagination(value, defaultValue, maxValue) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;
  if (maxValue && parsed > maxValue) return maxValue;
  return parsed;
}

async function createPost(req, res) {
  const {
    caption,
    collaboratorUsernames,
    unlockDate,
    unlockTime,
    unlockAmPm,
  } = req.body || {};
  const file = req.file;
  if (!file) throw new AppError('Media file is required (field name: media)', 400);

  const safeCaption =
    typeof caption === 'string'
      ? caption.trim().slice(0, 1000)
      : '';

  const schedule = parseUnlockSchedule({
    dateStr: unlockDate,
    timeStr: unlockTime,
    amPm: unlockAmPm,
  });
  if (schedule.error) {
    throw new AppError(schedule.error, 400);
  }

  const now = new Date();
  let unlockAt = schedule.unlockDate;
  let isLocked = false;
  if (unlockAt) {
    isLocked = unlockAt > now;
  }

  const mediaUrl = await uploadToCloudinary({
    localFilePath: file.path,
    mimetype: file.mimetype,
  });

  const post = await Post.create({
    userId: req.user.id,
    caption: safeCaption,
    mediaUrl: mediaUrl.trim(),
    unlockDate: unlockAt || null,
    isLocked,
  });

  // Optional initial collaborators (comma-separated usernames string).
  const usernames = (() => {
    if (!collaboratorUsernames) return [];
    if (Array.isArray(collaboratorUsernames)) return collaboratorUsernames;
    return String(collaboratorUsernames).split(',').map((s) => s.trim()).filter(Boolean);
  })();

  if (usernames.length > 0) {
    const users = await User.find(
      { username: { $in: usernames } },
      { _id: 1 }
    );
    const ids = Array.from(new Set(users.map((u) => String(u._id)))).filter(
      (id) => String(id) !== String(req.user.id)
    );
    post.collaborators = ids.map((id) => ({
      userId: id,
      status: 'pending',
    }));
    await post.save();
  }

  await populatePost(post);
  const populated = post;
  return res.status(201).json({ post: populated });
}

async function likePost(req, res) {
  const postId = req.params.postId || req.params.id;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const existing = await Post.findById(postId).select('isLocked');
  if (!existing) throw new AppError('Post not found', 404);
  if (existing.isLocked) {
    throw new AppError('This post is scheduled and not visible yet', 403);
  }

  const post = await Post.findByIdAndUpdate(
    postId,
    { $addToSet: { likes: req.user.id } },
    { new: true }
  );

  await populatePost(post);
  const populated = post;
  return res.status(200).json({
    message: 'Post liked',
    post: populated,
  });
}

async function unlikePost(req, res) {
  const postId = req.params.postId || req.params.id;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const existing = await Post.findById(postId).select('isLocked');
  if (!existing) throw new AppError('Post not found', 404);
  if (existing.isLocked) {
    throw new AppError('This post is scheduled and not visible yet', 403);
  }

  const post = await Post.findByIdAndUpdate(
    postId,
    { $pull: { likes: req.user.id } },
    { new: true }
  );

  await populatePost(post);
  const populated = post;
  return res.status(200).json({
    message: 'Post unliked',
    post: populated,
  });
}

async function commentPost(req, res) {
  const postId = req.params.postId || req.params.id;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const targetPost = await Post.findById(postId).select('isLocked');
  if (!targetPost) throw new AppError('Post not found', 404);
  if (targetPost.isLocked) {
    throw new AppError('This post is scheduled and not visible yet', 403);
  }

  const { text } = req.body || {};
  if (typeof text !== 'string' || text.trim() === '') {
    throw new AppError('Comment text is required', 400);
  }
  const trimmed = text.trim();
  if (trimmed.length > 500) throw new AppError('Comment text too long', 400);

  if (containsToxicLanguage(trimmed)) {
    try {
      await FlaggedComment.create({
        postId,
        userId: req.user.id,
        text: trimmed,
      });
    } catch {
      // Still block the comment even if audit log fails.
    }
    throw new AppError(
      '⚠️ Hateful, abusive, or vulgar language isn’t allowed',
      400
    );
  }

  const updated = await Post.findByIdAndUpdate(
    postId,
    {
      $push: {
        comments: { userId: req.user.id, text: trimmed },
      },
    },
    { new: true }
  );

  if (!updated) throw new AppError('Post not found', 404);

  await populatePost(updated);
  const populated = updated;
  return res.status(201).json({
    message: 'Comment added',
    post: populated,
  });
}

async function deletePost(req, res) {
  const postId = req.params.id || req.params.postId;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  if (String(post.userId) !== String(req.user.id)) {
    throw new AppError('Only owner can delete this post', 403);
  }

  await Post.deleteOne({ _id: postId });
  return res.status(200).json({ message: 'Post deleted' });
}

async function getPostLikes(req, res) {
  const postId = req.params.id || req.params.postId;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);
  const post = await Post.findById(postId).populate('likes', 'username profilePic');
  if (!post) throw new AppError('Post not found', 404);

  const likes = (post.likes || []).map((user) => ({
    userId: user._id,
    username: user.username,
    profilePic: user.profilePic,
  }));
  return res.status(200).json({ likes });
}

async function getPostComments(req, res) {
  const postId = req.params.id || req.params.postId;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);
  const post = await Post.findById(postId).populate('comments.userId', 'username profilePic');
  if (!post) throw new AppError('Post not found', 404);

  const comments = (post.comments || []).map((comment) => ({
    text: comment.text,
    createdAt: comment.createdAt,
    user: comment.userId
      ? {
          userId: comment.userId._id,
          username: comment.userId.username,
          profilePic: comment.userId.profilePic,
        }
      : null,
  }));
  return res.status(200).json({ comments });
}

async function getFeed(req, res) {
  const page = parsePagination(req.query.page, 1);
  const limit = parsePagination(req.query.limit, 20, 50);

  const me = await User.findById(req.user.id).select('following');
  if (!me) throw new AppError('User not found', 404);

  const authorIds = [...me.following, me._id];

  const posts = await Post.find({
    userId: { $in: authorIds },
    isLocked: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  await Post.populate(posts, [
    { path: 'userId', select: 'username profilePic bio' },
    { path: 'collaborators.userId', select: 'username profilePic' },
    { path: 'comments.userId', select: 'username profilePic' },
  ]);

  return res.status(200).json({ posts, page, limit });
}

module.exports = {
  createPost,
  likePost,
  unlikePost,
  commentPost,
  getFeed,
  deletePost,
  getPostLikes,
  getPostComments,
};

