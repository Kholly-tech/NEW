const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    link: {
        type: String,
        default: null
    },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;