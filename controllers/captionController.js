const AppError = require('../middleware/AppError');
const { generateLocalCaptions } = require('../utils/localCaptionGenerator');

/**
 * POST /api/captions/generate
 * Body: { topic: string }
 * Returns: { captions: string[] } — three short social captions.
 *
 * Uses a free, offline generator (no OpenAI / no billing). Same API shape as before.
 */
async function generateCaptions(req, res) {
  const { topic } = req.body || {};
  if (typeof topic !== 'string' || topic.trim() === '') {
    throw new AppError('Topic or idea text is required', 400);
  }

  const captions = generateLocalCaptions(topic.trim());
  return res.status(200).json({ captions });
}

module.exports = { generateCaptions };
