const mongoose = require('mongoose');
const AppError = require('../middleware/AppError');
const User = require('../models/User');
const Post = require('../models/Post');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

function safeUserProfile(userDoc) {
  return {
    id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    profilePic: userDoc.profilePic,
    bio: userDoc.bio,
    followers: userDoc.followers.length,
    following: userDoc.following.length,
    isPrivate: Boolean(userDoc.isPrivate),
    // Used by the frontend to render "Follow"/"Following" state.
    // Stores only ids (not full user docs) to keep payload small.
    followingIds: userDoc.following.map((id) => String(id)),
    followRequestIds: (userDoc.followRequests || []).map((id) => String(id)),
  };
}

function asMiniUser(user) {
  return {
    _id: user._id,
    username: user.username,
    profilePic: user.profilePic,
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getMyProfile(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);
  return res.status(200).json({ user: safeUserProfile(user) });
}

async function updateMyProfile(req, res) {
  const me = await User.findById(req.user.id);
  if (!me) throw new AppError('User not found', 404);

  const { username, email, bio, isPrivate } = req.body || {};
  const updates = {};

  if (typeof username === 'string' && username.trim()) {
    const nextUsername = username.trim();
    const exists = await User.findOne({
      username: nextUsername,
      _id: { $ne: req.user.id },
    });
    if (exists) throw new AppError('Username already in use', 409);
    updates.username = nextUsername;
  }

  if (typeof email === 'string' && email.trim()) {
    const nextEmail = email.trim().toLowerCase();
    const exists = await User.findOne({
      email: nextEmail,
      _id: { $ne: req.user.id },
    });
    if (exists) throw new AppError('Email already in use', 409);
    updates.email = nextEmail;
  }

  if (typeof bio === 'string') {
    updates.bio = bio.trim().slice(0, 160);
  }

  if (typeof isPrivate !== 'undefined') {
    const parsed = String(isPrivate).toLowerCase();
    updates.isPrivate = parsed === 'true' || parsed === '1';
  }

  if (req.file) {
    const profilePicUrl = await uploadToCloudinary({
      localFilePath: req.file.path,
      mimetype: req.file.mimetype,
      folder: 'instagram_clone/profile_pics',
      resourceType: 'image',
    });
    updates.profilePic = profilePicUrl.trim();
  }

  const updated = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    message: 'Profile updated successfully',
    user: safeUserProfile(updated),
  });
}

async function getUserProfile(req, res) {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return res.status(200).json({ user: safeUserProfile(user) });
}

async function follow(req, res) {
  const userId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;

  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);
  if (String(userId) === String(currentUserId)) {
    throw new AppError('You cannot follow yourself', 400);
  }

  const me = await User.findById(currentUserId);
  if (!me) throw new AppError('User not found', 404);

  const target = await User.findById(userId);
  if (!target) throw new AppError('User not found', 404);

  const alreadyFollowing = me.following.some((id) => String(id) === String(userId));
  if (alreadyFollowing) {
    return res.status(200).json({
      message: 'Already following',
      user: safeUserProfile(target),
    });
  }

  // Private accounts receive requests unless already followed.
  if (target.isPrivate) {
    await User.updateOne(
      { _id: userId },
      { $addToSet: { followRequests: currentUserId } }
    );
    const updatedTarget = await User.findById(userId);
    return res.status(200).json({
      message: 'Follow request sent',
      requested: true,
      user: safeUserProfile(updatedTarget),
    });
  }

  await User.updateOne(
    { _id: currentUserId },
    { $addToSet: { following: userId } }
  );
  await User.updateOne(
    { _id: userId },
    { $addToSet: { followers: currentUserId } }
  );

  const updatedTarget = await User.findById(userId);
  return res.status(200).json({
    message: 'Followed',
    user: safeUserProfile(updatedTarget),
  });
}

async function unfollow(req, res) {
  const userId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;

  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);
  if (String(userId) === String(currentUserId)) {
    throw new AppError('You cannot unfollow yourself', 400);
  }

  const me = await User.findById(currentUserId);
  if (!me) throw new AppError('User not found', 404);

  const target = await User.findById(userId);
  if (!target) throw new AppError('User not found', 404);

  // Also clear pending request while unfollowing/canceling.
  await User.updateOne(
    { _id: userId },
    { $pull: { followRequests: currentUserId } }
  );

  await User.updateOne(
    { _id: currentUserId },
    { $pull: { following: userId } }
  );
  await User.updateOne(
    { _id: userId },
    { $pull: { followers: currentUserId } }
  );

  const updatedTarget = await User.findById(userId);
  return res.status(200).json({
    message: 'Unfollowed',
    user: safeUserProfile(updatedTarget),
  });
}

async function requestFollow(req, res) {
  const userId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;
  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);
  if (String(userId) === String(currentUserId)) {
    throw new AppError('You cannot request yourself', 400);
  }

  const target = await User.findById(userId);
  if (!target) throw new AppError('User not found', 404);
  if (!target.isPrivate) {
    throw new AppError('Target account is public, use follow endpoint', 400);
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { followRequests: currentUserId } }
  );
  const updatedTarget = await User.findById(userId);
  return res.status(200).json({
    message: 'Follow request sent',
    requested: true,
    user: safeUserProfile(updatedTarget),
  });
}

async function acceptFollowRequest(req, res) {
  const userId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;
  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);
  if (String(userId) === String(currentUserId)) {
    throw new AppError('Invalid request', 400);
  }

  const me = await User.findById(currentUserId);
  if (!me) throw new AppError('User not found', 404);

  const requester = await User.findById(userId);
  if (!requester) throw new AppError('User not found', 404);

  const hasRequest = me.followRequests.some((id) => String(id) === String(userId));
  if (!hasRequest) throw new AppError('Follow request not found', 404);

  await User.updateOne(
    { _id: currentUserId },
    {
      $pull: { followRequests: userId },
      $addToSet: { followers: userId },
    }
  );
  await User.updateOne(
    { _id: userId },
    { $addToSet: { following: currentUserId } }
  );

  const updated = await User.findById(currentUserId);
  return res.status(200).json({
    message: 'Follow request accepted',
    user: safeUserProfile(updated),
  });
}

async function rejectFollowRequest(req, res) {
  const userId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;
  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);

  const me = await User.findById(currentUserId);
  if (!me) throw new AppError('User not found', 404);

  const hasRequest = me.followRequests.some((id) => String(id) === String(userId));
  if (!hasRequest) throw new AppError('Follow request not found', 404);

  await User.updateOne(
    { _id: currentUserId },
    { $pull: { followRequests: userId } }
  );
  const updated = await User.findById(currentUserId);
  return res.status(200).json({
    message: 'Follow request rejected',
    user: safeUserProfile(updated),
  });
}

/**
 * GET /api/users/follow-requests
 * Users who requested to follow the current user (private account inbox).
 */
async function getFollowRequests(req, res) {
  const me = await User.findById(req.user.id).populate(
    'followRequests',
    'username profilePic'
  );
  if (!me) throw new AppError('User not found', 404);

  const users = (me.followRequests || []).map(asMiniUser);
  return res.status(200).json({ users });
}

/**
 * GET /api/users/suggested
 * Real users from DB: exclude self and already-followed accounts.
 */
async function addCloseFriend(req, res) {
  const targetId = req.params.id;
  if (!isValidObjectId(targetId)) throw new AppError('Invalid user id', 400);
  if (String(targetId) === String(req.user.id)) {
    throw new AppError('Invalid target', 400);
  }

  const target = await User.findById(targetId);
  if (!target) throw new AppError('User not found', 404);

  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { closeFriends: targetId } }
  );
  const me = await User.findById(req.user.id);
  return res.status(200).json({ message: 'Added to close friends', user: safeUserProfile(me) });
}

async function removeCloseFriend(req, res) {
  const targetId = req.params.id;
  if (!isValidObjectId(targetId)) throw new AppError('Invalid user id', 400);

  await User.updateOne(
    { _id: req.user.id },
    { $pull: { closeFriends: targetId } }
  );
  const me = await User.findById(req.user.id);
  return res.status(200).json({ message: 'Removed from close friends', user: safeUserProfile(me) });
}

async function getSuggestedUsers(req, res) {
  const me = await User.findById(req.user.id).select('following');
  if (!me) throw new AppError('User not found', 404);

  const excludeIds = [req.user.id, ...(me.following || [])];

  const users = await User.find(
    {
      _id: { $nin: excludeIds },
    },
    { username: 1, profilePic: 1 }
  )
    .limit(10)
    .lean();

  return res.status(200).json({ users });
}

async function getFollowers(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new AppError('Invalid user id', 400);
  const user = await User.findById(id).populate('followers', 'username profilePic');
  if (!user) throw new AppError('User not found', 404);
  return res.status(200).json({
    users: (user.followers || []).map(asMiniUser),
  });
}

async function getFollowing(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new AppError('Invalid user id', 400);
  const user = await User.findById(id).populate('following', 'username profilePic');
  if (!user) throw new AppError('User not found', 404);
  return res.status(200).json({
    users: (user.following || []).map(asMiniUser),
  });
}

async function getUserPosts(req, res) {
  const { userId } = req.params;
  const { page = '1', limit = '20' } = req.query || {};

  if (!isValidObjectId(userId)) throw new AppError('Invalid user id', 400);

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));

  const profileOwner = await User.findById(userId).select('isPrivate followers');
  if (!profileOwner) throw new AppError('User not found', 404);

  const isOwner = String(req.user.id) === String(userId);
  const isFollower = (profileOwner.followers || []).some(
    (id) => String(id) === String(req.user.id)
  );
  if (profileOwner.isPrivate && !isOwner && !isFollower) {
    return res.status(200).json({
      posts: [],
      page: parsedPage,
      limit: parsedLimit,
      private: true,
      message: 'This account is private',
    });
  }

  // Author's posts + posts where this user is an accepted collaborator (Instagram-style).
  const visibility = {
    $or: [
      { userId },
      {
        collaborators: {
          $elemMatch: { userId, status: 'accepted' },
        },
      },
    ],
  };

  // Visitors only see unlocked posts; profile owner sees scheduled (locked) posts too.
  const query = isOwner
    ? visibility
    : { $and: [visibility, { isLocked: { $ne: true } }] };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((parsedPage - 1) * parsedLimit)
    .limit(parsedLimit)
    .populate('userId', 'username profilePic bio')
    .populate('comments.userId', 'username profilePic')
    .populate('collaborators.userId', 'username profilePic');

  return res.status(200).json({ posts, page: parsedPage, limit: parsedLimit });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  getUserPosts,
  follow,
  unfollow,
  requestFollow,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowRequests,
  getSuggestedUsers,
  addCloseFriend,
  removeCloseFriend,
  getFollowers,
  getFollowing,
};

