const mongoose = require('mongoose');

const { Schema } = mongoose;

const highlightSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    stories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Story',
        default: [],
      },
    ],
    coverImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, versionKey: false }
);

highlightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Highlight', highlightSchema);
