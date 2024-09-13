const mongoose = require("mongoose");
const { Schema } = mongoose;

const forumSchema = new Schema({
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["public", "private"],
        default: "public",
        required: true,
    },
    topics: [{
        type: mongoose.Types.ObjectId,
        ref: "Topic",
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
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
}, { timestamps: true });

const Forum = mongoose.model("Forum", forumSchema);

module.exports = Forum;