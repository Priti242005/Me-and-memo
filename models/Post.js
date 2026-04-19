const mongoose = require('mongoose');

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    // Collaboration: pending until accepted; only then shown on collaborator's profile.
    collaborators: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted'],
          default: 'pending',
        },
      },
    ],
    comments: {
      type: [commentSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    /** When set, post unlocks at this instant (time capsule / scheduled post). */
    unlockDate: {
      type: Date,
      default: null,
    },
    /**
     * Hidden from feed until unlocked. Set true when unlockDate is in the future at creation;
     * cron flips to false when unlockDate <= now.
     */
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { versionKey: false }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ isLocked: 1, unlockDate: 1 });

module.exports = mongoose.model('Post', postSchema);

