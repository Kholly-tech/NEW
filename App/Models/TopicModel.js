const mongoose = require('mongoose');
const { Schema } = mongoose;

const topicSchema = new Schema({
    forum: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Forum',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    medias: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    edited: {
        type: Boolean,
        default: false
    }
});

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;