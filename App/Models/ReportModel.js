const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    reportType: {
      type: String,
      required: true,
      enum: ['post', 'user', 'comment', 'communityPost', 'topic', 'reel'],
    },
    reportedItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'reportType',
    },
    reportedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    reasons: [String],
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'rejected'],
      default: 'pending',
    },
    count: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const Report = mongoose.model('Report', reportSchema);
  
  module.exports = Report;