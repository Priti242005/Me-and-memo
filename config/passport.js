const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function getGoogleConfig() {
  const clientID = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const callbackURL = (process.env.GOOGLE_CALLBACK_URL || '').trim();
  return { clientID, clientSecret, callbackURL };
}

/**
 * Stateless Passport setup (no sessions). Only configures Google OAuth.
 */
function configurePassport() {
  const { clientID, clientSecret, callbackURL } = getGoogleConfig();
  if (!clientID || !clientSecret || !callbackURL) {
    // Google login remains disabled until env vars are set.
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = String(profile.id || '');
          const email =
            profile.emails && profile.emails[0] && profile.emails[0].value
              ? String(profile.emails[0].value).trim().toLowerCase()
              : '';
          const displayName = String(profile.displayName || '').trim();
          const photo =
            profile.photos && profile.photos[0] && profile.photos[0].value
              ? String(profile.photos[0].value)
              : '';

          if (!googleId) return done(null, false);
          if (!email) return done(null, false);

          let user = await User.findOne({
            $or: [{ googleId }, { email }],
          });

          if (!user) {
            const baseUsername = email.split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 18) || 'user';
            let username = baseUsername;
            let suffix = 0;
            // Ensure unique username
            // eslint-disable-next-line no-await-in-loop
            while (await User.findOne({ username })) {
              suffix += 1;
              username = `${baseUsername}${suffix}`.slice(0, 30);
            }

            user = await User.create({
              name: displayName.slice(0, 60),
              username,
              email,
              googleId,
              profilePic: photo,
              isVerified: true,
              password: undefined,
            });
          } else {
            // Link Google ID if needed; mark verified.
            let changed = false;
            if (!user.googleId) {
              user.googleId = googleId;
              changed = true;
            }
            if (user.isVerified === false) {
              user.isVerified = true;
              changed = true;
            }
            if (!user.profilePic && photo) {
              user.profilePic = photo;
              changed = true;
            }
            if (!user.name && displayName) {
              user.name = displayName.slice(0, 60);
              changed = true;
            }
            if (changed) await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

module.exports = { configurePassport };

