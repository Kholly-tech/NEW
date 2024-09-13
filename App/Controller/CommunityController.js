const Community = require("../Models/CommunityModel");
const { CommunityPost } = require("../Models/PostModel");
const Comment = require("../Models/CommentModel");
const { saveNotification } = require("../Helper/notificationHelper");
const { downloadFile } = require("../Helper/storageService");

// Create a new community
exports.createCommunity = async(req, res) => {
    try {
        const { name, description, type, picture, cover } = req.body;
        const owner = req.user._id; // Assuming the user is authenticated and their ID is available

        const newCommunity = new Community({
            name,
            description,
            type,
            owner,
            admins: [owner], // Owner is also an admin
            members: [owner],
            picture,
            cover,
        });

        const savedCommunity = await newCommunity.save();
        res.status(201).json(savedCommunity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Join a community
exports.joinCommunity = async(req, res) => {
    try {
        const { communityId } = req.params;
        const userId = req.user._id;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (community.type === "private") {
            return res
                .status(403)
                .json({ message: "Request to join must be approved by an admin" });
        }

        if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
        }

        res.status(200).json({ message: "Joined community successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unjoin a community
exports.unjoinCommunity = async(req, res) => {
    try {
        const { communityId } = req.params;
        const userId = req.user._id;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        // Remove user from members list
        community.members = community.members.filter(
            (member) => member.toString() !== userId
        );

        // Remove user from admin list if user is an admin
        if (!community.admins.includes(userId)) {
            community.admins = community.admins.filter(
                (admin) => admin.toString() !== userId
            );
        }
        await community.save();

        res.status(200).json({ message: "Unjoined community successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Make a user an admin
exports.makeAdmin = async(req, res) => {
    try {
        const { communityId, userId } = req.params;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (!community.admins.includes(userId)) {
            community.admins.push(userId);
            await community.save();
        }

        res.status(200).json({ message: "User promoted to admin successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove an admin
exports.removeAdmin = async(req, res) => {
    try {
        const { communityId, userId } = req.params;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        community.admins = community.admins.filter(
            (adminId) => adminId.toString() !== userId
        );
        await community.save();

        res.status(200).json({ message: "Admin removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a member to a private community
exports.addMember = async(req, res) => {
    try {
        const { communityId, userId } = req.params;
        const adminId = req.user._id;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (!community.admins.includes(adminId)) {
            return res.status(403).json({ message: "Only admins can add members" });
        }

        if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
        }

        res.status(200).json({ message: "Member added successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove a member
exports.removeMember = async(req, res) => {
    try {
        const { communityId, userId } = req.params;
        const adminId = req.user._id;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (!community.admins.includes(adminId)) {
            return res
                .status(403)
                .json({ message: "Only admins can remove members" });
        }

        //remove from member
        community.members = community.members.filter(
            (memberId) => memberId.toString() !== userId
        );

        // remove from admins if in admin
        if (community.admins.includes(userId)) {
            community.admins = community.admins.filter(
                (adminId) => adminId.toString() !== userId
            );
        }

        await community.save();

        res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve membership request
exports.approveMembership = async(req, res) => {
    try {
        const { communityId, userId } = req.params;
        const adminId = req.user._id;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        if (!community.admins.includes(adminId)) {
            return res
                .status(403)
                .json({ message: "Only admins can approve membership requests" });
        }

        if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
        }

        res.status(200).json({ message: "Membership request approved" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update community description
exports.updateCommunity = async(req, res) => {
    try {
        const { communityId } = req.params;
        const { name, description, type, picture, cover } = req.body;
        console.log(picture, cover);
        const adminId = req.user._id;

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        console.log(adminId);

        if (!community.admins.includes(adminId) || !community.owner.toString() === adminId.toString()) {
            return res
                .status(403)
                .json({ message: "Only admins or owners can update community details" });
        }

        community.name = name || community.name;
        community.description = description || community.description;
        community.type = type || community.type;
        community.picture = picture || community.picture;
        community.cover = cover || community.cover;

        await community.save();

        res
            .status(200)
            .json({ message: "Community description updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCommunity = async(req, res) => {
    const { communityId } = req.params;
    const userId = req.user._id.toString();
    try {
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        if (community.owner.toString() !== userId || !community.admins.includes(userId)) {
            return res.status(403).json({ message: "Only the owner can delete the community" });
        }
        await Community.deleteOne({ _id: communityId });
        res.status(200).json({ message: "Community deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

// Fetch a specific community
exports.getCommunity = async(req, res) => {
    try {
        const { communityId } = req.params;

        const community = await Community.findOne({ _id: communityId })
            .populate({
                path: "owner",
                select: "username first_name last_name picture",
                populate: { path: "picture" }
            })
            .populate({
                path: "admins",
                select: "username first_name last_name picture _id",
                populate: { path: "picture" }
            })
            .populate({
                path: "members",
                select: "username first_name last_name picture",
                populate: { path: "picture" }
            })
            .populate("forums", "name description owner admin")
            .populate("picture")
            .populate("cover");

        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        const adminIds = community.admins.map((admin) => admin._id);

        const communityData = {
            ...community.toObject(),
            adminIds,
            owner: {
                ...community.owner.toObject(),
                picture: community.owner.picture ? community.owner.picture : null
            },
            admins: community.admins.map(admin => ({
                ...admin.toObject(),
                picture: admin.picture ? admin.picture : null
            })),
            members: community.members.map(member => ({
                ...member.toObject(),
                picture: member.picture ? member.picture : null
            })),
            picture: community.picture ? community.picture : null,
            cover: community.cover ? community.cover : null
        };

        res.status(200).json(communityData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fetch all communities
exports.getAllCommunities = async(req, res) => {
    try {
        const communities = await Community.find()
            .populate("owner", "username first_name last_name picture")
            .populate("admins", "username first_name last_name picture _id")
            .populate("members", "username first_name last_name picture")
            .populate("forums", "name description owner admin")
            .populate("picture")
            .populate("cover");

        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Fetch communities joined by the user
exports.getUserCommunities = async(req, res) => {
    try {
        const userId = req.user._id;

        const communities = await Community.find({ members: userId })
            .populate("owner", "username first_name last_name picture")
            .populate("admins", "username first_name last_name picture _id")
            .populate("members", "username first_name last_name picture")
            .populate("forums", "name description owner admin")
            .populate("picture")
            .populate("cover");

        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fetch communities created by the user
exports.getCreatedCommunities = async(req, res) => {
    try {
        const userId = req.user._id;

        const communities = await Community.find({ owner: userId })
            .populate("owner", "username first_name last_name picture")
            .populate("admins", "username first_name last_name picture _id")
            .populate("members", "username first_name last_name picture")
            .populate("forums", "name description owner admin")
            .populate("picture")
            .populate("cover");

        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search for communities
exports.searchCommunities = async(req, res) => {
    try {
        const { q } = req.query;

        const communities = await Community.find({
                name: { $regex: q, $options: "i" },
            }).populate("owner", "username first_name last_name picture")
            .populate("picture")
            .populate("cover");

        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// exports.discoverCommunity = async (req, res) => {
//   console.log("Erokinh");
//   res.status(200).json({ message: "Erokinh" });
// };

exports.postToCommunity = async(req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const communityPost = new CommunityPost({
            ...req.body,
            community: id,
            user: userId,
        });
        await communityPost.save();

        // save notification for each tagged users
        const taggedUserIds = communityPost.tags;
        taggedUserIds.forEach(async(userId) => {
            await saveNotification(userId, `${req.user.username} tagged you and ${taggedUserIds.length-1} others in a post in a Community`, "You were tagged in a post", `/community/${id}/post/${communityPost._id}`);
        });
        const post = await CommunityPost.findById(communityPost._id).populate("user", "username first_name last_name picture");
        res.status(201).send(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get all Community Posts
exports.getCommunityPosts = async(req, res) => {
    try {
        const communityId = req.params.id;
        const { page = 1, limit = 10 } = req.query; // Get pagination parameters from query
        const currentTime = new Date();
        const posts = await CommunityPost.find({
                community: communityId,
                $or: [
                    { schedulePost: { $lte: currentTime } }, // Include posts where schedulePost is less than or equal to the current time
                    { schedulePost: null }, // Include posts without a schedulePost value,
                ]
            })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio", // Select specific fields
                populate: {
                    path: "picture",
                }
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias", "_id url type")
            .sort({ schedulePost: 1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec(); // Sort by schedulePost (ascending) and createdAt (descending)
        // if(posts.length == 0) {
        //   return res.status(404).json({ message: "No posts found" });
        // }

        // Get total count of posts for pagination
        const count = await CommunityPost.countDocuments({ community: communityId });

        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: error.message });
    }
}

// Get a post by ID
exports.getCommunityPostById = async(req, res) => {
    const currentTime = new Date();
    try {
        const post = await CommunityPost.findOne({
                _id: req.params.postId,
                community: req.params.id,
                $or: [
                    { schedulePost: { $lte: currentTime } }, // Include posts where schedulePost is less than or equal to the current time
                    { schedulePost: null }, // Include posts without a schedulePost value,
                ],
            }).populate("user")
            .populate("tags", "username picture first_name last_name")
            .populate("medias", "_id url type");
        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        res.status(200).send(post);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Update a post by ID
exports.updateCommunityPostById = async(req, res) => {
    try {
        const userId = req.user._id.toString();
        post = await CommunityPost.findById(req.params.postId);
        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }
        if (post.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        post = await CommunityPost.findByIdAndUpdate(req.params.postId, req.body, {
            new: true,
            runValidators: true,
        }).populate("user");
        res.status(200).send(post);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Delete a post by ID
exports.deleteCommunityPostById = async(req, res) => {
    try {
        const userId = req.user._id.toString();
        const postId = req.params.postId;
        const post = await CommunityPost.findById(postId)
            .populate("medias", "key type");
        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }
        if (post.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        // Delete the media files from S3
        const medias = post.medias;
        for (const media of medias) {
            const deletePostMedia = await deleteFile(media.key);
        }

        // Delete the community post 
        await CommunityPost.findByIdAndDelete(postId);

        res.send({ post, message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.getCommunityPostComments = async(req, res) => {
    try {
        const comments = await Comment.find({
                post: req.params.postId,
                parentComment: null
            }).populate("user", "username picture first_name last_name")
            .populate({
                path: "replies",
                populate: {
                    path: "user",
                    select: "username picture first_name last_name",
                },
            })
            .populate("tags", "username picture first_name last_name")
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order;

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCommentById = async(req, res) => {
    try {
        const comment = await Comment.findOne({
                _id: req.params.commentId
            })
            .populate("user", "username picture first_name last_name")
            .populate({
                path: "replies",
                populate: {
                    path: "user",
                    select: "username picture first_name last_name",
                },
            });
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Add a comment
exports.addComment = async(req, res) => {
    const { text, tags, postId, parentCommentId } = req.body;
    const userId = req.user._id;

    try {
        const comment = new Comment({
            text,
            tags,
            user: userId,
            post: postId,
            onModel: "CommunityPost",
            parentComment: parentCommentId || null,
        });

        await comment.save();
        // Populate the comment with user details after saving
        const populatedComment = await Comment.findById(comment._id).populate(
            "user",
            "username picture first_name last_name"
        );

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// Edit a comment
exports.editComment = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        comment.text = req.body.text;
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

// Delete a comment
exports.deleteComment = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await comment.deleteOne({ _id: commentId });
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
};

// Add a reaction to a comment
exports.addReaction = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user has already reacted
        const hasReacted = comment.reactions.some(
            (reaction) => reaction.user.toString() === userId.toString()
        );

        if (!hasReacted) {
            comment.reactions.push({ user: userId });
            await comment.save();
        }

        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: "Failed to add reaction" });
    }
};

// Get all media in a community
exports.getCommunityMedia = async(req, res) => {
    try {
        // Get page and limit from query params
        const { page = 1, limit = 10 } = req.query;
        const communityId = req.params.id;
        console.log(communityId);
        const posts = await CommunityPost.find({
                community: communityId
            }).populate("medias", "_id url type")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        console.log(posts);

        const communityMedia = posts.map(async post => {
            const { medias, _id } = post;

            return medias.map(mediaItem => ({
                ...mediaItem,
                postId: _id
            }));
        }).flat();


        res.status(200).json({
            media: communityMedia,
            totalPages: Math.ceil(posts.length / limit),
            currentPage: page,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Remove a reaction from a comment
exports.removeReaction = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        comment.reactions = comment.reactions.filter(
            (reaction) => reaction.user.toString() !== userId.toString()
        );

        await comment.save();

        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: "Failed to remove reaction" });
    }
};

exports.addReply = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    const { text, tags, onModel } = req.body;

    try {
        // Find the parent comment
        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Create a new reply comment
        const reply = new Comment({
            text,
            user: userId,
            post: parentComment.post,
            onModel: parentComment.onModel,
            parentComment: commentId,
            tags,
        });

        // Save the reply comment
        await reply.save();

        // Populate the reply with user details
        const populatedReply = await Comment.findById(reply._id).populate(
            "user",
            "username picture first_name last_name"
        );

        res.status(201).json(populatedReply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add reply" });
    }
};

exports.editReply = async(req, res) => {
    const { replyId } = req.params;
    const userId = req.user._id.toString();
    const { text } = req.body;

    try {
        const reply = await Comment.findById(replyId);
        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }
        if (reply.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        reply.text = text;
        await reply.save();
        res.status(200).json(reply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to edit reply" });
    }
};

exports.deleteReply = async(req, res) => {
    const { replyId } = req.params;
    const userId = req.user._id.toString();

    try {
        const reply = await Comment.findById(replyId);
        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }
        if (reply.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await reply.deleteOne({ _id: replyId });
        res.json({ message: "Reply deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete reply" });
    }
};