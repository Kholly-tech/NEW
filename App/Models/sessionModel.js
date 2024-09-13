const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    accessToken: { type: String, required: true },
    deviceFingerprint: { type: String, required: true },
    refreshToken: { type: String, required: true },
    refreshTokenExpiresAt: { type: Date, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "1h"
    },
    expiresAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);