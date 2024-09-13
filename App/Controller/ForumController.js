const Forum = require("../Models/ForumModel");
const { ForumPost } = require("../Models/PostModel");
const Comment = require("../Models/CommentModel");
const Notification = require("../Models/NotificationModel");
const { saveNotification } = require("../Helper/notificationHelper");
const Community = require("../Models/CommunityModel");
const Topic = require("../Models/TopicModel");

// Fetch all Forums in a Community
exports.getAllForums = async(req, res) => {
    try {
        // Find all forums belonging to the specified community
        const forums = await Forum.find({
                community: req.params.communityId
            })
            // Populate the owner, admins, and members fields with user details
            .select('name description type owner admins members picture createdAt updatedAt')
            .populate("owner", "username first_name last_name picture")
            .populate("admins", "username first_name last_name picture")
            .populate("members", "username first_name last_name picture")
            .populate("picture")
            .lean();

        // Map over the forums and extract only the date from the createdAt field
        const forumsWithTopicCount = await Promise.all(forums.map(async(forum) => {
            const topicCount = await Topic.countDocuments({ forum: forum._id });
            return {
                ...forum,
                topicCount,
                createdAt: forum.createdAt.toDateString(),
                updatedAt: forum.updatedAt.toDateString()
            };
        }));

        res.status(200).send(forumsWithTopicCount);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get a specific forum by ID
exports.getForum = async(req, res) => {
    try {
        const { forumId } = req.params;

        // Find the forum by its ID
        const forum = await Forum.findOne({
                _id: forumId
            })
            .select('name description type owner admins members picture createdAt updatedAt')
            .populate("owner", "username first_name last_name picture")
            .populate("admins", "username first_name last_name picture")
            .populate("members", "username first_name last_name picture")
            .populate("picture", "_id url")
            .lean();

        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        // Get the topic count for the forum
        const topicCount = await Topic.countDocuments({ forum: forum._id });

        // Format the forum data
        const formattedForum = {
            ...forum,
            topicCount,
        };

        res.status(200).json(formattedForum);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Create a new forum in a community
exports.createForum = async(req, res) => {
    try {
        // Extract forum details from the request body
        const { name, description, type, picture } = req.body;
        const communityId = req.params.communityId;
        const owner = req.user._id; // Assuming the user is authenticated and their ID is available

        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        // Check if a forum with the same name already exists in the community
        const forum = await Forum.findOne({
            name,
            community: communityId
        });

        if (forum) {
            return res.status(400).json({
                message: "A forum with the same name already exists in this community!"
            });
        }

        // Create a new forum instance
        const newForum = new Forum({
            name,
            description,
            community: communityId,
            type,
            owner,
            admins: [owner], // Owner is also an admin
            members: [owner],
            picture,
        });

        // Save the new forum to the database
        const savedForum = await newForum.save();
        community.forums.push(savedForum._id);
        await community.save();
        res.status(200).json({ message: " Forum has been created successfully!", savedForum });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Update a forum
exports.updateForum = async(req, res) => {
    try {
        const { forumId } = req.params;
        const { name, description, type, picture } = req.body;
        const userId = req.user._id.toString();

        // Find the forum by its ID
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        // Check if the user is authorized to update the forum
        if (forum.owner.toString() !== userId || !forum.admins.includes(userId)) {
            return res.status(403).json({
                message: "Only the owner or admins can update the forum"
            });
        }

        // Update the forum details
        forum.name = name || forum.name;
        forum.description = description || forum.description;
        forum.type = type || forum.type;
        forum.picture = picture || forum.picture;

        // Save the updated forum
        await forum.save();
        res.status(200).json({
            message: "Forum updated successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Delete a forum
exports.deleteForum = async(req, res) => {
    try {
        const { forumId } = req.params;
        const userId = req.user._id.toString();

        // Find the forum by its ID
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        // Check if the user is authorized to delete the forum
        if (forum.owner.toString() !== userId || !forum.admins.includes(userId)) {
            return res.status(403).json({
                message: "Only the owner or admins can delete the forum"
            });
        }

        // Delete the forum
        await Forum.deleteOne({ _id: forumId });
        res.status(200).json({
            message: "Forum deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Join a forum
exports.joinForum = async(req, res) => {
    try {
        const { forumId } = req.params;
        const userId = req.user._id;

        // Find the forum by its ID
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        // Check if the forum is private
        if (forum.type === "private") {
            return res.status(403).json({
                message: "Request to join must be approved by an admin"
            });
        }

        // Add the user to the forum members
        if (!forum.members.includes(userId)) {
            forum.members.push(userId);
            await forum.save();
        }

        res.status(200).json({ message: "Joined forum successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Leave a forum
exports.leaveForum = async(req, res) => {
    try {
        const { forumId } = req.params;
        const userId = req.user._id;

        // Find the forum by its ID
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        // Check if the user is a member of the forum
        if (!forum.members.includes(userId)) {
            return res.status(403).json({
                message: "You are not a member of this forum"
            });
        }

        // Remove the user from the forum members
        forum.members = forum.members.filter(
            (member) => member.toString() !== userId.toString()
        );
        await forum.save();

        res.status(200).json({ message: "Left forum successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get forums the user is a member of
exports.getUserForums = async(req, res) => {
    const userId = req.user._id;

    try {
        // Find all forums where the user is a member
        const forums = await Forum.find({ members: userId })
            .select('name description type owner admins members picture createdAt updatedAt')
            .populate("owner", "username first_name last_name picture")
            .populate("admins", "username first_name last_name picture")
            .populate("members", "username first_name last_name picture")
            .populate("picture", "_id url")
            .lean(); // Convert the result to plain JavaScript objects

        // Map over the forums and extract only the date from the createdAt field
        const forumsWithDate = forums.map(forum => ({
            ...forum,
            createdAt: forum.createdAt.toDateString()
        }));

        res.status(200).json(forumsWithDate);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Search for forums in a community
exports.searchForum = async(req, res) => {
    try {
        const { communityId } = req.params;
        const { q } = req.body;

        // Find forums in the specified community that match the search query
        const forums = await Forum.find({
                name: { $regex: q, $options: "i" },
                community: communityId,
            })
            .populate("owner", "username first_name last_name picture")
            .populate("picture", "_id url");

        res.status(200).json(forums);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getAccessibleForums = async(req, res) => {
    try {

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Create a new forum post
exports.createForumPost = async(req, res) => {
    try {
        const { forumId } = req.params;
        const userId = req.user._id;

        // Find the forum by its ID
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        // Check if the user is the owner of the forum
        if (forum.owner.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Only the owner can create a post"
            });
        }

        // Create a new forum post
        const forumPost = new ForumPost({
            ...req.body,
            forum: forumId,
            user: userId
        });
        await forumPost.save();
        console.log(forumPost.tags);

        // Save notifications for each tagged user
        const taggedUserIds = forumPost.tags;
        taggedUserIds.forEach(async(userId) => {
            await saveNotification(userId, `${req.user.username} tagged you and ${taggedUserIds.length - 1} others in a post in a Community`, "You were tagged in a post", `forums/${forumId}/posts/${forumPost._id}`);
        });

        res.status(200).send(forumPost);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get forum posts
exports.getForumPosts = async(req, res) => {
    try {
        const { forumId } = req.params;
        const { page = 1, limit = 10 } = req.query; // Get pagination parameters from query
        const currentTime = Date.now();

        // Find forum posts for the specified forum
        const posts = await ForumPost.find({
                forum: forumId,
                $or: [
                    { schedulePost: { $lte: currentTime } }, // Include posts where schedulePost is less than or equal to the current time
                    { schedulePost: null }, // Include posts without a schedulePost value
                ]
            })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio", // Select specific fields
            })
            .populate("tags", "username first_name last_name picture")
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        if (posts.length === 0) {
            return res.status(404).json({
                message: "No posts found"
            });
        }

        // Get total count of posts for pagination
        const count = await ForumPost.countDocuments({ forum: forumId });

        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get a forum post by ID
exports.getForumPostbyId = async(req, res) => {
    const currentTime = Date.now();

    try {
        const post = await ForumPost.findOne({
                _id: req.params.postId,
                forum: req.params.forumId,
                $or: [
                    { schedulePost: { $lte: currentTime } }, // Include posts where schedulePost is less than or equal to the current time
                    { schedulePost: null }, // Include posts without a schedulePost value
                ]
            })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio", // Select specific fields
            })
            .populate("tags", "username first_name last_name picture")
            .exec();

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.status(200).send(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Update a forum post
exports.updateForumPost = async(req, res) => {
    let post;
    try {
        const { forumId, postId } = req.params;
        const userId = req.user._id;

        // Find the forum post by its ID and forum ID
        post = await ForumPost.findOne({
            _id: postId,
            forum: forumId
        });

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Check if the user is authorized to update the post
        if (post.user.toString() !== userId.toString()) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Update the forum post
        post = await ForumPost.findByIdAndUpdate(postId, req.body, {
            new: true,
            runValidators: true
        }).populate("user");

        res.status(200).send(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Delete a forum post
exports.deleteForumPost = async(req, res) => {
    let post;
    try {
        const { forumId, postId } = req.params;
        const userId = req.user._id;

        // Find the forum post by its ID and forum ID
        post = await ForumPost.findOne({
            _id: postId,
            forum: forumId
        });

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Check if the user is authorized to delete the post
        if (post.user.toString() !== userId.toString()) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Delete the forum post 
        post = await ForumPost.findByIdAndDelete(postId);

        res.status(200).send({ post, message: "Post deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get comments for a forum post
exports.getPostComments = async(req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10 } = req.query; // Get pagination parameters from query

        // Find comments for the specified post
        const comments = await Comment.find({
                post: postId,
                parentComment: null
            })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio", // Select specific fields
            })
            .populate({
                path: "replies",
                populate: {
                    path: "user",
                    select: "username picture first_name last_name",
                },
            })
            .populate("tags", "username picture first_name last_name")
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order

        res.json({
            comments,
            currentPage: page,
            totalPages: Math.ceil(comments.length / limit)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get a comment by ID
exports.getCommentById = async(req, res) => {
    try {
        // Find the comment by its ID
        const comment = await Comment.findOne({
                _id: req.params.commentId
            })
            // Populate the user field with specific fields
            .populate("user", "username picture first_name last_name")
            // Populate the replies field and populate the user field within each reply
            .populate({
                path: "replies",
                populate: {
                    path: "user",
                    select: "username picture first_name last_name",
                },
            });

        // If the comment is not found, return a 404 error
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Return the comment
        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Add a comment to a forum post
exports.addComment = async(req, res) => {
    const { text, tags, postId, parentCommentId } = req.body;
    const userId = req.user._id;

    try {
        // Create a new comment
        const comment = new Comment({
            text,
            tags,
            user: userId,
            post: postId,
            onModel: "ForumPost",
            parentComment: parentCommentId || null,
        });

        // Save the comment
        await comment.save();

        // Populate the comment with user details after saving
        const populatedComment = await Comment.findById(comment._id).populate(
            "user",
            "username picture first_name last_name"
        );

        // Return the populated comment
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
        // Find the comment by its ID
        const comment = await Comment.findById(commentId);

        // If the comment is not found, return a 404 error
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user is authorized to edit the comment
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Update the comment text
        comment.text = req.body.text;

        // Save the updated comment
        await comment.save();

        // Return the updated comment
        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Delete a comment
exports.deleteComment = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    try {
        // Find the comment by its ID
        const comment = await Comment.findById(commentId);

        // If the comment is not found, return a 404 error
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user is authorized to delete the comment
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete the comment
        await comment.deleteOne({ _id: commentId });

        // Return a success message
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
        // Find the comment by its ID
        const comment = await Comment.findById(commentId);

        // If the comment is not found, return a 404 error
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user has already reacted
        const hasReacted = comment.reactions.some(
            (reaction) => reaction.user.toString() === userId.toString()
        );

        // If the user has not reacted, add their reaction
        if (!hasReacted) {
            comment.reactions.push({ user: userId });
            await comment.save();
        }

        // Return the updated comment
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: "Failed to add reaction" });
    }
};

// Remove a reaction from a comment
exports.removeReaction = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    try {
        // Find the comment by its ID
        const comment = await Comment.findById(commentId);

        // If the comment is not found, return a 404 error
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Remove the user's reaction from the comment
        comment.reactions = comment.reactions.filter(
            (reaction) => reaction.user.toString() !== userId.toString()
        );

        // Save the updated comment
        await comment.save();

        // Return the updated comment
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