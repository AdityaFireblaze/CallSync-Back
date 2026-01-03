const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    phone: String,
    role: { type: String, enum: ['admin', 'user'], default: 'user' },

    isDisabled: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
