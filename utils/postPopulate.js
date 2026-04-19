/**
 * Standard populate chain for Post documents (DRY).
 */
async function populatePost(doc) {
  if (!doc) return null;
  await doc.populate('userId', 'username profilePic bio');
  await doc.populate('collaborators.userId', 'username profilePic');
  await doc.populate('comments.userId', 'username profilePic');
  return doc;
}

module.exports = { populatePost };
