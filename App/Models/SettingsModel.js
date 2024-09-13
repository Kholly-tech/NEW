const mongoose = require("mongoose");

const settingsSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    notifications: {
        
    },
    dataAndPrivacy: {
        profileVisibility: {
            type: String,
            default: "Public",
            enum: ["Public", "Private"],
        },
        timelineAndTagging: {
            type: String,
            default: "Public",
            enum: ["Public", "Private"],
        },
        mediaVisibility: {
            type: String,
            default: "Public",
            enum: ["Public", "Private"],
        },
        lockProfile: {
            type: Boolean,
            default: false,
        },
        messaging: {
            type: String,
            default: "Public",
            enum: ["Public", "Private"],
        },
        locationPreference: {
            type: String,
            default: "Public",
            enum: ["Public", "Private"],
        },
        postVisibility: {
            type: String,
            default: "Public",
            enum: ["Public", "Private"],
        },
        dataUsage: {
            dataSaver : {type: Boolean, default: false},
            mediaQuality: {
                type: String,
                default: "Standard Quality",
                enum: ["Standard Quality", "HD Quality"],
            },
            autoDownload: {
                photo: String,
                video: String,
                audio: String,
                document: String,
                allMedia: String,
            }
        }
    },
    security: {

    },
    languageAndDisplay: {
        language: String,
        theme: String,
        accessibility: {
            camera: Boolean,
            microphone: Boolean,
            contacts: Boolean,
            media: Boolean,
            notifications: Boolean,
        },
    }
});

const Setting = mongoose.model("Setting", settingsSchema);

module.exports = Setting;