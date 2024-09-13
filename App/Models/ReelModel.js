const mongoose = require("mongoose");
const { Schema } = mongoose;

const reelSchema = new Schema({
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
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Reel = mongoose.model("Reel", reelSchema);

module.exports = Reel;