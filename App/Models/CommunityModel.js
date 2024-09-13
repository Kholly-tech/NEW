// models/Community.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const communitySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["public", "private"],
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    forums: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Forum",
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],
    picture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: "66d7ad6170dff3fbea48ed26",
    },

    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: "66d7aece70dff3fbea48ed29",
    },
}, { timestamps: true });

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;