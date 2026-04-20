const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { CORS_ORIGIN } = require('./config/env');
const { configurePassport } = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const reelRoutes = require('./routes/reelRoutes');
const searchRoutes = require('./routes/searchRoutes');
const storyRoutes = require('./routes/storyRoutes');
const highlightRoutes = require('./routes/highlightRoutes');
const captionRoutes = require('./routes/captionRoutes');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security defaults
app.use(helmet());
app.use(
  cors({
    origin: (() => {
      if (CORS_ORIGIN === '*') return true;
      return CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
    })(),
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(passport.initialize());
configurePassport();

// HTTP request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
// Convenience alias for OAuth docs (keeps existing `/api/auth/*` intact)
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/captions', captionRoutes);

// 404 + error handling must be last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

