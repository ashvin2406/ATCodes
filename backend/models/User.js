/**
 * User Mongoose Model
 * Manages students and teacher accounts with bcrypt hashing and status tracking.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: {
        values: ['teacher', 'student'],
        message: '{VALUE} is not a valid role'
      },
      default: 'student'
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['pending', 'active', 'suspended'],
        message: '{VALUE} is not a valid account status'
      },
      default: 'pending'
    },
    profileImage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Never return passwordHash or __v in JSON output
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe profile view helper
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    mobile: this.mobile,
    role: this.role,
    accountStatus: this.accountStatus,
    profileImage: this.profileImage,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

// Indexes for fast querying
userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
