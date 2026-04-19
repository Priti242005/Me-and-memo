const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(searchController.searchUsers));

module.exports = router;
