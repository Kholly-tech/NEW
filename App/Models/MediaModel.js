const { Schema, default: mongoose } = require("mongoose");

const mediaSchema = new Schema({
    url: String,
    key: String,
    type: String
});

const media = mongoose.model("Media", mediaSchema);

module.exports = media;