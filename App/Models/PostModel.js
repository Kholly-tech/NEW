const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "text",
        trim: true,
        enum: ["audio", "poll", "text", "media", "location"],
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
        required: function() {
            return this.collection.collectionName === "communityposts";
        },
    },
    anonymous: {
        type: Boolean,
        default: false,
        required: function() {
            return this.collection.collectionName === "communityposts";
        },
    },
    text: {
        type: String,
        trim: true,
        default: null,
    },
    medias: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    schedulePost: {
        type: Date,
        default: null,
    },
    background: { type: String, default: null },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
    },
    audio: {
        media: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
        }
    },
    poll: {
        question: {
            text: String,
            media: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Media",
            },
        },
        options: [{
            text: String,
            media: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Media",
            },
        }, ],
        answers: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            option: Number,
        }, ],
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],
    visibility: {
        type: String,
        enum: ["Everyone", "Friends", "Hidden"],
        default: "Everyone",
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],
    edited: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model("Post", postSchema);
const CommunityPost = mongoose.model("communityPost", postSchema);

module.exports = { Post, CommunityPost };
// module.exports = { Post, CommunityPost };