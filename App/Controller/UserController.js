const UpdateUserProfile = async(req, res) => {};

const { downloadFile } = require("../Helper/storageService");
const User = require("../Models/UserModel");

exports.getCurrentUser = async(req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove sensitive information
        user.password = undefined;
        user.securePin = undefined;
        user.twoFactorSecret = undefined;
        user.phraseKey = undefined;
        // console.log("User", user);

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update user
exports.updateUser = async(req, res) => {
    try {
        const { interests, ...rest } = req.body; // Extract interests and other data


        // Initialize updateData with the rest of the data
        const updateData = {...rest };

        // Parse the interests JSON string back into an array if it's not empty
        if (interests && interests.trim()) {
            const interestsArray = JSON.parse(interests);
            updateData.interests = interestsArray;
        }

        // Convert JSON strings back to objects where necessary
        Object.keys(updateData).forEach((key) => {
            if (
                typeof updateData[key] === "string" &&
                updateData[key].startsWith("{")
            ) {
                updateData[key] = JSON.parse(updateData[key]);
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Updated", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get all users
exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.find()
            .populate("cover")
            .populate("picture");

        for (const user of users) {
            // Remove sensitive information
            user.password = undefined;
            user.securePin = undefined;
            user.twoFactorSecret = undefined;
            user.phraseKey = undefined;
        }

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Online Status
exports.getUserOnlineStatus = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ online: user.online });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single user by ID
exports.getUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("cover")
            .populate("picture");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove sensitive information
        user.password = undefined;
        user.securePin = undefined;
        user.twoFactorSecret = undefined;
        user.phraseKey = undefined;

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserByUsername = async(req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .populate({
                path: "followers",
                select: "username first_name last_name picture cover followers following",
                populate: [
                    { path: "picture" },
                    { path: "cover" }
                ]
            })
            .populate({
                path: "following",
                select: "username first_name last_name picture cover followers following",
                populate: [
                    { path: "picture" },
                    { path: "cover" }
                ]
            })
            .populate("cover")
            .populate("picture");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove sensitive information
        user.password = undefined;
        user.securePin = undefined;
        user.twoFactorSecret = undefined;
        user.phraseKey = undefined;

        // Convert to plain object to allow modifications
        const userObject = user.toObject();

        // Transform followers and following to include picture and cover URLs
        userObject.followers = userObject.followers.map(follower => ({
            ...follower,
            picture: follower.picture ? follower.picture : null,
            cover: follower.cover ? follower.cover : null
        }));

        userObject.following = userObject.following.map(following => ({
            ...following,
            picture: following.picture ? following.picture : null,
            cover: following.cover ? following.cover : null
        }));

        res.status(200).json(userObject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get user followers
exports.getUserFollowers = async(req, res) => {
    try {
        const user = await User.findById(req.params.id).populate({
            path: "followers",
            select: "username first_name last_name picture cover followers following _id",
            populate: [{
                    path: "picture",
                    select: "url"
                },
                {
                    path: "cover",
                    select: "url"
                },
                {
                    path: "followers",
                    select: "picture cover"
                },
                {
                    path: "following",
                    select: "picture cover"
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const followers = user.followers.map(follow => ({
            username: follow.username,
            _id: follow._id,
            first_name: follow.first_name,
            last_name: follow.last_name,
            followers: follow.followers.map(f => ({
                _id: f._id,
                picture: f.picture ? f.picture.url : null,
                cover: f.cover ? f.cover.url : null
            })),
            following: follow.following.map(f => ({
                _id: f._id,
                picture: f.picture ? f.picture.url : null,
                cover: f.cover ? f.cover.url : null
            })),
            picture: follow.picture ? follow.picture.url : null,
            cover: follow.cover ? follow.cover.url : null
        }));

        res.status(200).json(followers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get user following
exports.getUserFollowing = async(req, res) => {
    try {
        const user = await User.findById(req.params.id).populate({
            path: "following",
            select: "username first_name last_name picture cover followers following _id",
            populate: [{
                    path: "picture"
                },
                {
                    path: "cover"
                },
                {
                    path: "followers",
                    select: "picture cover"
                },
                {
                    path: "following",
                    select: "picture cover"
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const following = user.following.map(follow => ({
            username: follow.username,
            _id: follow._id,
            first_name: follow.first_name,
            last_name: follow.last_name,
            followers: follow.followers.map(f => ({
                _id: f._id,
                picture: f.picture ? f.picture.url : null,
                cover: f.cover ? f.cover.url : null
            })),
            following: follow.following.map(f => ({
                _id: f._id,
                picture: f.picture ? f.picture.url : null,
                cover: f.cover ? f.cover.url : null
            })),
            picture: follow.picture ? follow.picture.url : null,
            cover: follow.cover ? follow.cover.url : null
        }));

        res.status(200).json(following);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.suggestFriends = async(req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const currentUser = await User.findById(req.user._id)
            .populate('details.location')
            .populate('followers')
            .populate('following');

        if (!currentUser) {
            console.log("Not Found");
            return res.status(404).json({ message: 'User is not found' });
        }

        const userInterests = currentUser.interests || [];
        // const userLocation = currentUser.details.location ? [currentUser.details.location._id] : [];
        const userFollowers = currentUser.followers.map((follower) => follower._id);
        const userFollowing = currentUser.following.map((following) => following._id);

        const subSuggestedFriends = await User.find({
                _id: { $nin: [...userFollowers, ...userFollowing, req.user._id] },
                $or: [
                    { interests: { $in: userInterests } },
                    // { 'details.location': { $in: userLocation } },
                    { followers: { $in: userFollowers } },
                    { following: { $in: userFollowing } },
                ],
            })
            .select('username first_name last_name picture followers')
            .populate("cover")
            .populate("picture")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const topUsers = await User.find({})
            .sort({ followers: -1 })
            .limit(5)
            .populate('followers')
            .populate("cover")
            .populate("picture")
            .exec();

        const usersWithFollowersCount = await Promise.all(topUsers.map(async user => {
            const followersCount = user.followers ? user.followers.length : 0;

            return {
                id: user._id,
                name: user.first_name + " " + user.last_name,
                // followers: user.followers.length,
                picture: user.picture,
                followersCount,
                reason: 'Top Users'
            };
        }));

        const subSuggested = await Promise.all(subSuggestedFriends.map(async user => {
            const followersCount = user.followers ? user.followers.length : 0;
            const pictureUrl = await downloadFile(user.picture);
            return {
                id: user._id,
                name: user.first_name + " " + user.last_name,
                // followers: user.followers.length,
                picture: user.picture,
                followersCount,
                reason: 'Suggested based on interests'
            };
        }));

        const suggestedFriends = {
            usersWithFollowersCount,
            subSuggested
        }

        res.status(200).json(suggestedFriends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};