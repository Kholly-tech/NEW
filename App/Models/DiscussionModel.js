const mongoose = require('mongoose');
const { Schema } = mongoose;

const discussionScema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: mongoose.Types.ObjectId,
        ref: 'Comment',
    },
    parent: {
        type: mongoose.Types.ObjectId,
        ref: 'Discussion',
        default: null
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Boolean,
        default: false
    },
    reactions: [
        {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
        },
    ],
    tags: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
});

discussionScema.virtual("replies", {
    ref: "Discussion",
    localField: "_id",
    foreignField: "parent",
    justOne: false,
});

const Discussion = mongoose.model('Discussion', discussionScema);

module.exports = Discussion;