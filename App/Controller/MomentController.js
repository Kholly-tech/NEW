const Moment = require("../Models/MomentModel");
const User = require("../Models/UserModel");

exports.createMoment = async(req, res) => {
    try {
        const { content, media } = req.body;
        const userId = req.user._id.toString();

        const moment = new Moment({
            user: userId,
            content,
            media,
        });

        await moment.save();

        res.status(201).json({ message: "Moment created successfully.", moment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMoments = async(req, res) => {
    try {
        // Fetch moments in descending order of creation date
        const moments = await Moment.find({ user: req.user._id })
            .populate({
                path: "user",
                select: "_id picture username first_name last_name",
                populate: {
                    path: "picture"
                }
            })
            .populate("media")
            .sort({
                createdAt: -1,
            });

        if (moments && moments.length > 0) {
            return res.status(200).json({ moments: moments });
            // return res.status(403).json({ message: "No moments found." });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.deleteMoment = async(req, res) => {
    try {
        const { momentId } = req.params;
        const moment = await Moment.findById(momentId)
            .populate("media", "key");

        if (!moment) {
            return res.status(404).json({ message: "Moment not found." });
        }

        if (moment.user.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "You are not authorized to delete this moment." });
        }
        const deleteMomentMedia = await deleteFile(moment.media.key);
        if (deleteMomentMedia) {
            console.log("Moment media deleted successfully.");
            await moment.remove();
        }



        res.status(200).json({ message: "Moment deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getFollowingMoments = async(req, res) => {
    try {
        const currentUserId = req.user._id.toString();

        // Get the current user
        const currentUser = await User.findById(currentUserId);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Get the list of users the current user is following
        const following = currentUser.following;

        // Find moments from the users the current user is following
        const moments = await Moment.find({ user: { $in: following } })
            .populate({
                path: "user",
                select: "_id picture username first_name last_name",
                populate: {
                    path: "picture"
                }
            }) // Populate user details
            .populate("media") // Populate media details
            .sort({ createdAt: -1 }); // Sort by creation date, most recent first

        if (moments && moments.length > 0) {

            return res.status(200).json({ moments: moments });
            // return res.status(403).json({ message: "No moments found." });
        }
        // res.status(200).json(moments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};