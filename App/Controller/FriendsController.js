const User = require("../Models/UserModel");

exports.followUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id.toString(); // Convert currentUserId to string

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You can't follow yourself." });
    }

    if (user.following.includes(targetUserId)) {
      return res
        .status(400)
        .json({ message: "You are already following this user." });
    }

    user.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: "Followed successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id.toString(); // Convert currentUserId to string

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.following.includes(targetUserId)) {
      return res
        .status(400)
        .json({ message: "You are not following this user." });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You can't unfollow yourself." });
    }

    user.following = user.following.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: "Unfollowed successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
