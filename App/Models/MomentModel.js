const mongoose = require("mongoose");

const momentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        trim: true,
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "24h", // TTL (Time To Live) index to delete the document after 24 hours
    },
});

module.exports = mongoose.model("Moment", momentSchema);