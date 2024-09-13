// models/otp.js
const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);

