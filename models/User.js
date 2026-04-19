const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: function passwordRequired() {
        // Email/password users must have a password. Google users may not.
        return !this.googleId;
      },
      select: false, // never returned by default
    },
    googleId: {
      type: String,
      default: '',
      index: true,
    },
    profilePic: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 160,
    },
    /**
     * If false, password login and OTP login are blocked until the user verifies email OTP.
     * Legacy users without this field are treated as verified by controllers.
     */
    isVerified: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      default: '',
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      default: '',
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    followRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    closeFriends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        // Always remove password if it is present for some reason.
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiry;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpiry;
        return ret;
      },
    },
  }
);

// Helper for controllers to compare password during login.
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

