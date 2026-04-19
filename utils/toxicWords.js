/**
 * Keyword-based hate / abuse / vulgar detection (case-insensitive).
 * Matches whole words + selected multi-word phrases. Extend lists for your community.
 */

/** Single-token blocklist (lowercase). Include common misspellings (e.g. nonsence). */
const TOXIC_WORDS = [
  // Demo / test entries
  'badword',
  'spamslur',
  'hateword',

  // Harassment / insults
  'idiot',
  'idiots',
  'idiotic',
  'moron',
  'morons',
  'stupid',
  'stupidity',
  'dumb',
  'dumbest',
  'dumber',
  'loser',
  'losers',
  'pathetic',
  'worthless',
  'ugly',
  'trash',
  'garbage',
  'rubbish',
  'scum',
  'freak',
  'freaks',
  'psycho',
  'nazi',
  'terrorist',

  // Dismissive / attacking (often used in toxic comments)
  'nonsense',
  'nonsence',
  'baseless',
  'ridiculous',
  'fake',
  'fraud',
  'liar',
  'liars',
  'lying',
  'scam',
  'scammer',

  // Profanity (common)
  'fuck',
  'fucking',
  'fucked',
  'fucker',
  'shit',
  'shitty',
  'bitch',
  'bitches',
  'bastard',
  'asshole',
  'assholes',
  'damn',
  'crap',
  'piss',
  'pissed',
  'slut',
  'sluts',
  'whore',
  'whores',
  'dick',
  'dicks',
  'cock',
  'pussy',
  'retard',
  'retarded',

  // Violence / severe (avoid generic "kill"/"die"/"hate" alone — use phrases below)
  'suicide',
  'kys',
  'racist',
  'sexist',
  'homophobic',
  'nigger',
  'nigga',
  'niggas',
  'faggot',
  'fag',
  'chink',
  'spic',
  'wetback',
];

/**
 * Phrases matched against normalized whitespace (substring). Keep lowercase, deduped.
 */
const TOXIC_PHRASES_RAW = [
  'shut up',
  'shut your',
  'fuck off',
  'fuck you',
  'go die',
  'kill yourself',
  'kill urself',
  'die already',
  'hope you die',
  'neck yourself',
  'kys',
  'stfu',
  'gtfo',
  'piece of shit',
  'dumb ass',
  'dumbass',
  'mother fucker',
  'motherfucker',
  'son of a bitch',
  'go to hell',
  'burn in hell',
  'hate you',
  'hate this',
  'hate u',
  'so stupid',
  'so dumb',
  'you idiot',
  'you moron',
  'you stupid',
  'ur stupid',
  'youre stupid',
  "you're stupid",
  'complete nonsense',
  'complete nonsence',
  'utter nonsense',
  'completely baseless',
];

const TOXIC_PHRASES = [...new Set(TOXIC_PHRASES_RAW)];

const toxicSet = new Set(TOXIC_WORDS.map((w) => w.toLowerCase()));

function normalizePhraseText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text into loose tokens (letters/digits) for whole-word checks.
 */
function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter(Boolean);
}

/**
 * @param {string} text
 * @returns {boolean} true if text should be blocked
 */
function containsToxicLanguage(text) {
  if (typeof text !== 'string' || text.trim() === '') return false;

  const normalized = normalizePhraseText(text);

  for (const phrase of TOXIC_PHRASES) {
    if (normalized.includes(phrase)) return true;
  }

  const tokens = tokenize(text);
  for (const t of tokens) {
    if (toxicSet.has(t)) return true;
    // Simple plural / suffix: "idiots" already in list; "fakes" -> check stem
    if (t.length > 4 && t.endsWith('s')) {
      const singular = t.slice(0, -1);
      if (toxicSet.has(singular)) return true;
    }
  }

  return false;
}

module.exports = {
  TOXIC_WORDS,
  TOXIC_PHRASES,
  containsToxicLanguage,
};
