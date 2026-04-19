const mongoose = require('mongoose');
const AppError = require('../middleware/AppError');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { populatePost } = require('../utils/postPopulate');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseUsernames(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function resolveCollaboratorIds({ collaboratorIds, collaboratorUsernames }) {
  const ids = [];
  const usernames = parseUsernames(collaboratorUsernames);

  if (Array.isArray(collaboratorIds)) {
    for (const id of collaboratorIds) {
      if (isValidObjectId(id)) ids.push(String(id));
    }
  }

  if (usernames.length > 0) {
    const users = await User.find({ username: { $in: usernames } }, { _id: 1 });
    for (const u of users) ids.push(String(u._id));
  }

  return Array.from(new Set(ids));
}

function collaboratorUserId(c) {
  if (!c) return '';
  const uid = c.userId?._id || c.userId;
  return uid ? String(uid) : '';
}

function hasAcceptedCollaborator(post, userId) {
  return (post.collaborators || []).some(
    (c) => collaboratorUserId(c) === String(userId) && c.status === 'accepted'
  );
}

async function addCollaborators(req, res) {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const { collaboratorIds, collaboratorUsernames } = req.body || {};
  if (!collaboratorIds && !collaboratorUsernames) {
    throw new AppError('Provide collaboratorUsernames or collaboratorIds', 400);
  }

  const collaboratorIdStrings = await resolveCollaboratorIds({
    collaboratorIds,
    collaboratorUsernames,
  });

  if (collaboratorIdStrings.length === 0) {
    throw new AppError('No valid collaborators found', 400);
  }

  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const isOwner = String(post.userId) === String(req.user.id);
  const isExistingCollaborator = hasAcceptedCollaborator(post, req.user.id);

  if (!isOwner && !isExistingCollaborator) {
    throw new AppError('Not authorized to update collaborators for this post', 403);
  }

  const existingIds = new Set(
    (post.collaborators || []).map((c) => collaboratorUserId(c)).filter(Boolean)
  );

  const filteredCollaborators = collaboratorIdStrings.filter(
    (id) => String(id) !== String(req.user.id) && !existingIds.has(String(id))
  );

  if (filteredCollaborators.length === 0) {
    const populated = await Post.findById(postId);
    await populatePost(populated);
    return res.status(200).json({
      message: 'Collaborators already set',
      post: populated,
    });
  }

  const newEntries = filteredCollaborators.map((id) => ({
    userId: id,
    status: 'pending',
  }));

  post.collaborators = [...(post.collaborators || []), ...newEntries];
  await post.save();

  const actor = await User.findById(req.user.id, 'username');
  if (!actor) throw new AppError('Actor not found', 404);

  const notifications = [];
  for (const recipientId of filteredCollaborators) {
    const recipientNotification = await Notification.create({
      userId: recipientId,
      type: 'post_collaboration',
      postId: post._id,
      actorId: req.user.id,
      actorUsername: actor.username,
      message: `${actor.username} invited you to collaborate (pending your acceptance).`,
    });
    notifications.push(recipientNotification);
  }

  const io = req.app?.locals?.io;
  if (io && notifications.length > 0) {
    for (const n of notifications) {
      io.to(`user:${n.userId}`).emit('notification', n);
    }
  }

  const populated = await Post.findById(postId);
  await populatePost(populated);

  return res.status(200).json({
    message: 'Collaboration invites sent',
    post: populated,
    notificationsCreated: notifications.length,
  });
}

/**
 * POST /api/posts/:postId/collab/accept
 */
async function acceptCollaboration(req, res) {
  const postId = req.params.postId || req.params.id;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const idx = (post.collaborators || []).findIndex(
    (c) =>
      collaboratorUserId(c) === String(req.user.id) && c.status === 'pending'
  );
  if (idx === -1) {
    throw new AppError('No pending collaboration invite for you on this post', 404);
  }

  post.collaborators[idx].status = 'accepted';
  await post.save();

  const populated = await Post.findById(postId);
  await populatePost(populated);

  return res.status(200).json({
    message: 'Collaboration accepted',
    post: populated,
  });
}

/**
 * POST /api/posts/:postId/collab/reject
 */
async function rejectCollaboration(req, res) {
  const postId = req.params.postId || req.params.id;
  if (!isValidObjectId(postId)) throw new AppError('Invalid post id', 400);

  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const before = (post.collaborators || []).length;
  post.collaborators = (post.collaborators || []).filter(
    (c) =>
      !(collaboratorUserId(c) === String(req.user.id) && c.status === 'pending')
  );
  if (post.collaborators.length === before) {
    throw new AppError('No pending collaboration invite for you on this post', 404);
  }

  await post.save();

  const populated = await Post.findById(postId);
  await populatePost(populated);

  return res.status(200).json({
    message: 'Collaboration declined',
    post: populated,
  });
}

/**
 * GET /api/posts/collab-requests
 * Posts where current user has a pending collaborator invite.
 */
async function getCollabRequests(req, res) {
  const posts = await Post.find({
    collaborators: {
      $elemMatch: { userId: req.user.id, status: 'pending' },
    },
  })
    .sort({ createdAt: -1 })
    .limit(50);

  await Post.populate(posts, [
    { path: 'userId', select: 'username profilePic bio' },
    { path: 'collaborators.userId', select: 'username profilePic' },
  ]);

  return res.status(200).json({ posts });
}

module.exports = {
  addCollaborators,
  acceptCollaboration,
  rejectCollaboration,
  getCollabRequests,
};
