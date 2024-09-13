const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatSchema = new Schema({
    message: {
        type: String,
        required: true,
    },
    medias: {
        type: Array,
        default: [],
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
}, {
    timestamps: true,
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;