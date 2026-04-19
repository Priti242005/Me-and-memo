const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const { generateCaptions } = require('../controllers/captionController');

const router = express.Router();

router.use(requireAuth);
router.post('/generate', asyncHandler(generateCaptions));

module.exports = router;
