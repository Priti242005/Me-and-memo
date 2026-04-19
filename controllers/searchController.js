const User = require('../models/User');

async function searchUsers(req, res) {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(200).json({ users: [] });

  const users = await User.find(
    { username: { $regex: q, $options: 'i' } },
    { username: 1, profilePic: 1 }
  )
    .sort({ username: 1 })
    .limit(15);

  return res.status(200).json({ users });
}

module.exports = { searchUsers };
