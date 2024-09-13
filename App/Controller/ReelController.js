const { downloadFile, deleteFile } = require("../Helper/storageService");
const Reel = require("../Models/ReelModel");
const User = require("../Models/UserModel");

exports.createReel = async(req, res) => {
    try {
        const { content, media } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const reel = new Reel({
            user: userId,
            content,
            media,
        });
        await reel.save();

        user.reels.push(reel._id);
        await user.save();

        await reel.populate({
            path: "user",
            select: "first_name last_name _id picture username",
            populate: {
                path: "picture",
            }
        });
        await reel.populate("media");

        res.status(201).json({ message: "Reel created successfully.", reel });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getReels = async(req, res) => {
    const userId = req.user._id;
    try {
        const user = await User.findById(userId);
        const userFollowingIds = user.following;

        const followingReels = await Promise.all(
            userFollowingIds.map(async(followingId) => {
                const reels = await Reel.find({ user: followingId })
                    .populate({
                        path: "user",
                        select: "first_name last_name _id picture username",
                        populate: {
                            path: "picture",
                            // select: "url"
                        }
                    })
                    .populate("media");
                return reels;
            })
        );

        const userReels = await Reel.find({ user: userId })
            .populate({
                path: "user",
                select: "first_name last_name _id picture username",
                populate: {
                    path: "picture",
                    // select: "url"
                }
            })
            .populate("media");

        const reels = [
            ...followingReels.flat(),
            ...userReels,
        ].sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json(reels);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


exports.deleteReel = async(req, res) => {
    try {
        const userId = req.user._id;
        const { reelId } = req.params;
        const reel = await Reel.findById(reelId)
            .populate("media", "_id key");
        const user = await User.findById(userId);

        if (!reel) {
            return res.status(404).json({ message: "Reel not found." });
        }

        if (reel.user.toString() !== userId.toString()) {
            return res
                .status(403)
                .json({ message: "You are not authorized to delete this reel." });
        }
        const deleteReelMedia = await deleteFile(reel.media.key);
        if (deleteReelMedia) {
            console.log("Reel media deleted successfully.");
            user.reels.pull(reelId);

            await reel.deleteOne({ _id: reelId });
            // user.reels = user.reels.filter(
            //     (reel) => reel.toString() !== reelId.toString()
            // );
            await user.save();

        }
        res.status(200).json({ message: "Reel deleted successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUserReels = async(req, res) => {
    try {
        const userId = req.params.userId;
        // const user = await User.findById(userId)
        //     .populate("reels");
        const reels = await Reel.find({ user: userId })
            .populate({
                path: "user",
                select: "first_name last_name _id picture username",
                populate: {
                    path: "picture",
                    // select: "url"
                }
            })
            .populate("media");

        res.status(200).json(reels);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateLike = async(req, res) => {
    try {
        const like = req.body;
        const reelId = req.params.reelId;
        console.log(reelId, like);

        const reel = await Reel.findById(reelId);
        if (!reel) {
            return res.status(404).json({ message: "Reel not found." });
        }

        reel.likes = like;
        await reel.save();
        res.status(200).json({ message: "Reel updated successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};