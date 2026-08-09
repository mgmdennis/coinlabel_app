const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  numistaId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  username: { type: String },
  email: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coin' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);