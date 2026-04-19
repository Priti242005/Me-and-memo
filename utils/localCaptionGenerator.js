/**
 * Offline caption suggestions — no API keys, no billing, no network.
 * Builds three distinct styles from the user's topic/idea text.
 */

const EMOJI = ['✨', '📸', '💭', '🌿', '☀️', '🎯'];

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * @param {string} topic — user’s idea or description
 * @returns {string[]} exactly three caption strings
 */
function generateLocalCaptions(topic) {
  const raw = String(topic || '').trim();
  if (!raw) {
    return [
      'A little moment worth sharing.',
      'Good energy — posting this here.',
      'Something I wanted on the feed today.',
    ];
  }

  const idea = raw.slice(0, 500);
  const short = idea.length > 100 ? `${idea.slice(0, 97)}…` : idea;
  const lower = short.toLowerCase();
  const titled = short.charAt(0).toUpperCase() + short.slice(1);
  const h = hashString(idea);
  const emoji = EMOJI[h % EMOJI.length];

  // Three different tones: warm share, reflective, casual
  return [
    `${titled} — ${emoji} Sharing this with you.`,
    `Mood today: ${lower}. What would you add?`,
    `Posting this for anyone who needed a reminder about ${lower}.`,
  ];
}

module.exports = { generateLocalCaptions };
