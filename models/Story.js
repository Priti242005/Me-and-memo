const mongoose = require('mongoose');

const { Schema } = mongoose;

const storySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    audioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    audioName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    /** Optional text drawn on story (client-rendered; stored for replay). */
    overlayText: {
      type: String,
      default: '',
      maxlength: 500,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 500,
    },
    audience: {
      type: String,
      enum: ['public', 'close_friends'],
      default: 'public',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    views: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { versionKey: false }
);

// TTL: MongoDB removes document when expiresAt is reached (background job ~60s).
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

storySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
