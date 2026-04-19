const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      // recipient
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['post_collaboration'],
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorUsername: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

module.exports = mongoose.model('Notification', notificationSchema);

