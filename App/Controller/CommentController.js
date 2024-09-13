const Comment = require("../Models/CommentModel");
const { Post, CommunityPost } = require("../Models/PostModel");
const Reel = require("../Models/ReelModel");

// Add a comment
const addComment = async(req, res) => {
    const { text, tags, postId, parentCommentId } = req.body;
    const userId = req.user._id;

    try {
        let post, a;
        //Check if the post is a normal or community post.
        a = "Post"
        post = await Post.findOne({ _id: postId });
        if (!post) {
            a = "CommunityPost"
            post = await CommunityPost.findOne({
                _id: postId
            });
            if (!post) {
                a = "Reel"
                post = await Reel.findOne({
                    _id: postId
                });
                if (!post) {
                    return res.status(404).send({ message: "Post not found" });
                }
            }
        }

        const comment = new Comment({
            text,
            tags,
            user: userId,
            post: postId,
            onModel: a,
            parentComment: parentCommentId || null,
        });

        await comment.save();
        // Populate the comment with user details after saving
        const populatedComment = await Comment.findById(comment._id).populate({
            path: "user",
            select: "username picture first_name last_name",
            populate: {
                path: "picture"
            }
        });

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// Edit a comment
const editComment = async(req, res) => {
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
const deleteComment = async(req, res) => {
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

// Get comments for a post, including nested comments
const getComments = async(req, res) => {
    const { postId } = req.params;

    try {
        const comments = await Comment.find({ post: postId, parentComment: null })
            .populate({
                path: "user",
                select: "username picture first_name last_name",
                populate: {
                    path: "picture",
                },
            })
            .populate({
                path: "replies",
                populate: {
                    path: "user",
                    select: "username picture first_name last_name",
                },
            });
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
};

const getCommentById = async(req, res) => {
    const { commentId } = req.params;
    try {
        const comment = await Comment.findById(commentId)
            .populate({
                path: "user",
                select: "username picture first_name last_name",
                populate: {
                    path: "picture",
                },
            })
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

// Add a reaction to a comment
const addReaction = async(req, res) => {
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
        console.error(error);
        res.status(500).json({ error: "Failed to add reaction" });
    }
};

// Remove a reaction from a comment
const removeReaction = async(req, res) => {
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
        console.log(error);
        res.status(500).json({ error: "Failed to remove reaction" });
    }
};

const addReply = async(req, res) => {
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
        const populatedReply = await Comment.findById(reply._id).populate({
            path: "user",
            select: "username picture first_name last_name",
            populate: {
                path: "picture",
            },
        });

        res.status(201).json(populatedReply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add reply" });
    }
};

const editReply = async(req, res) => {
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

const deleteReply = async(req, res) => {
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


module.exports = {
    addComment,
    getComments,
    editComment,
    deleteComment,
    addReaction,
    removeReaction,
    getCommentById,
    addReply,
    editReply,
    deleteReply,
};