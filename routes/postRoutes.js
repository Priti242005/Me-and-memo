const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');
const collaborationController = require('../controllers/collaborationController');
const { uploadPostMedia } = require('../middleware/uploadMedia');

const router = express.Router();

// All post actions are protected so only authenticated users can create/engage.
router.use(requireAuth);

router.post('/', uploadPostMedia, asyncHandler(postController.createPost));
router.get('/feed', asyncHandler(postController.getFeed));

// Must be registered before dynamic `/:id` routes
router.get('/collab-requests', asyncHandler(collaborationController.getCollabRequests));
router.post('/:postId/collab/accept', asyncHandler(collaborationController.acceptCollaboration));
router.post('/:postId/collab/reject', asyncHandler(collaborationController.rejectCollaboration));

router.post('/:postId/like', asyncHandler(postController.likePost));
router.post('/:postId/unlike', asyncHandler(postController.unlikePost));
router.post('/:postId/comments', asyncHandler(postController.commentPost));
router.post('/:id/comment', asyncHandler(postController.commentPost));
router.delete('/:id', asyncHandler(postController.deletePost));
router.get('/:id/likes', asyncHandler(postController.getPostLikes));
router.get('/:id/comments', asyncHandler(postController.getPostComments));

// Collaborate on a post: add multiple collaborators by usernames (comma-separated).
// Body: { collaboratorUsernames?: string|string[], collaboratorIds?: string|string[] }
router.post(
  '/:postId/collaborators',
  asyncHandler(collaborationController.addCollaborators)
);

module.exports = router;

