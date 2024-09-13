const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: [true, "First Name is required"],
        trim: true,
    },
    last_name: {
        type: String,
        required: [true, "Last Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email Address is required!"],
        unique: true,
        trim: true,
    },
    username: {
        type: String,
        required: [true, "username is required!"],
        unique: true,
        trim: true,
    },
    phone_number: {
        type: String,
        // required: [true, "Phone Number is required!"],
        unique: true,
        trim: true,
    },
    gender: {
        type: String,
        // required: [true, "Gender is required"],
        trim: true,
    },
    google_id: {
        type: String,
        trim: true,
    },
    bYear: {
        type: Number,
        // required: [true, "Your Birth Year is required"],
    },
    bMonth: {
        type: Number,
        // required: [true, "Your Birth Month is required"],
    },
    bDay: {
        type: Number,
        // required: [true, "Your Birth Day is required"],
    },
    password: {
        type: String,
        // required: [true, "Please Enter Password"],
        trim: true,
        minlength: 8,
    },
    interests: {
        type: [String],
        default: [],
    },
    getStarted: {
        type: Number,
        required: [true, "Your Birth Day is required"],
        default: 0,
    },
    posts: [{
        type: mongoose.Types.ObjectId,
        ref: "Post",
        postedAt: {
            type: Date,
            default: Date.now(),
        },
    }, ],
    savedPosts: [{
        post: { type: mongoose.Schema.Types.ObjectId, refPath: 'savedPosts.kind' },
        kind: { type: String, required: true, enum: ['Post', 'CommunityPost', 'ForumPost'] },
        savedAt: { type: Date, default: Date.now },
    }, ],
    reels: [{
        type: mongoose.Types.ObjectId,
        ref: "Reel",
    }, ],
    logs: [{
        type: mongoose.Types.ObjectId,
        ref: "Log",
    }, ],
    verified: {
        type: Boolean,
        default: false,
    },
    block: {
        type: Boolean,
        default: false,
    },
    followers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },
    following: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },
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
    securePin: {
        type: String,
    },
    online: {
        type: Boolean,
        default: false,
    },
    phraseKey: {
        type: Array,
    },
    twoFactorSecret: {
        type: String,
    },
    refreshToken: [{}],
    details: {
        bio: String,
        workPlace: {
            type: String,
        },
        education: {
            type: Array,
            default: [],
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
        },
        otherName: String,
        homeTown: String,
        relationship: {
            type: String,
        },
        website: {
            type: String,
            validate: {
                validator: function(v) {
                    return /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?/.test(
                        v
                    );
                },
                message: (props) => `${props.value} is not a valid URL!`,
            },
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, );

module.exports = mongoose.model("User", userSchema);