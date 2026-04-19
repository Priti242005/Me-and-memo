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

// Reel schema is intentionally similar to Post, but separated so you can optimize
// indexing/media handling independently later.
const reelSchema = new Schema(
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
      // This should point to the video asset (CDN URL, S3 URL, etc.).
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
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
  },
  { versionKey: false }
);

reelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reel', reelSchema);

