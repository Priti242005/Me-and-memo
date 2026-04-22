const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function getGoogleConfig() {
  const clientID = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

  // 🔥 Remove trailing slash (VERY IMPORTANT)
  let callbackURL = (process.env.GOOGLE_CALLBACK_URL || '').trim();
  callbackURL = callbackURL.replace(/\/$/, '');

  console.log("🔵 Google OAuth Config:");
  console.log("CLIENT_ID:", clientID ? "✅ Present" : "❌ Missing");
  console.log("CALLBACK_URL USED:", callbackURL);

  return { clientID, clientSecret, callbackURL };
}

function configurePassport() {
  const { clientID, clientSecret, callbackURL } = getGoogleConfig();

  if (!clientID || !clientSecret || !callbackURL) {
    console.log("❌ Google OAuth not configured properly");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,

        // 🔥 Required for Render / proxies
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          const displayName = profile.displayName || '';
          const photo = profile.photos?.[0]?.value || '';

          if (!googleId || !email) {
            return done(null, false);
          }

          let user = await User.findOne({
            $or: [{ googleId }, { email }],
          });

          if (!user) {
            const baseUsername =
              email.split('@')[0]
                .replace(/[^a-z0-9_]/gi, '')
                .slice(0, 18) || 'user';

            let username = baseUsername;
            let suffix = 0;

            while (await User.findOne({ username })) {
              suffix++;
              username = `${baseUsername}${suffix}`.slice(0, 30);
            }

            user = await User.create({
              name: displayName.slice(0, 60),
              username,
              email,
              googleId,
              profilePic: photo,
              isVerified: true,
            });
          } else {
            let changed = false;

            if (!user.googleId) {
              user.googleId = googleId;
              changed = true;
            }

            if (!user.isVerified) {
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
          console.error("❌ Google Auth Error:", err);
          return done(err);
        }
      }
    )
  );
}

module.exports = { configurePassport };