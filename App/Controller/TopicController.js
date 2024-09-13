const Topic = require('../Models/TopicModel');
const Forum = require('../Models/ForumModel');
const Discussion = require('../Models/DiscussionModel');
const Comment = require('../Models/CommentModel');
const { deleteFile } = require('../Helper/storageService');


exports.createTopic = async(req, res) => {
    const { forumId } = req.params;
    const userId = req.user._id;
    try {
        // Check if forum Exists
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                message: "Forum not found"
            });
        }

        if (forum.owner.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to create a topic in this forum"
            });
        }

        // Create a new topic
        const newTopic = new Topic({
            ...req.body,
            forum: forumId,
            user: userId
        });

        await newTopic.save();
        const savedTopic = await Topic.findById(newTopic._id)
            .populate({
                path: "user",
                select: "username first_name last_name picture",
                populate: {
                    path: "picture"
                }
            });
        forum.topics.push(savedTopic._id);
        await forum.save();
        res.status(200).json({
            message: "Topic created successfully",
            topic: savedTopic
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getAllTopics = async(req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const { forumId } = req.params;
        if (!forumId) {
            return res.status(400).json({
                message: "Invalid forum id"
            });
        }
        const topics = await Topic.find({ forum: forumId })
            .populate({
                path: "user",
                select: "username first_name last_name picture",
                populate: {
                    path: "picture"
                }
            })
            .populate("likes")
            .populate("comments")
            .populate("medias")
            .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const sortTopics = topics.sort((a, b) => b.likes.length - a.likes.length);
        const getTopics = sortTopics.map(topic => {
            return {
                _id: topic._id,
                title: topic.title,
                body: topic.body,
                description: topic.description,
                likes: topic.likes.length,
                comments: topic.comments.length,
                user: topic.user,
                createdAt: topic.createdAt.toDateString()
            }
        });
        const topicCount = getTopics.length;

        res.status(200).json({
            topics: getTopics,
            totalPages: Math.ceil(topics.length / limit),
            currentPage: page,
            topicCount: topicCount
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.getTopic = async(req, res) => {
    const { forumId, topicId } = req.params;

    try {
        const topic = await Topic.findOne({
                _id: topicId,
                forum: forumId
            })
            .populate({
                path: "user",
                select: "username first_name last_name picture",
                populate: {
                    path: "picture"
                }
            })
            .populate({
                path: "likes",
                select: "username first_name last_name picture",
                populate: {
                    path: "picture"
                }
            })
            .populate("comments")
            .populate("medias");

        if (!topic) {
            return res.status(404).json({
                message: "Topic not found"
            });
        }

        const topicWithDate = {
            ...topic._doc,
            noOfLikes: topic._doc.likes.length,
            createdAt: topic._doc.createdAt.toDateString()
        };

        res.status(200).json(topicWithDate);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.updateTopic = async(req, res) => {
    const { forumId, topicId } = req.params;
    const userId = req.user._id;

    try {
        // Find the topic to update
        const topic = await Topic.findOne({
            _id: topicId,
            forum: forumId
        });

        if (!topic) {
            return res.status(404).json({
                message: "Topic not found"
            });
        }

        // Check if the user is the owner of the topic
        if (topic.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to update this topic"
            });
        }

        // Update the topic
        await Topic.updateOne({
            _id: topicId,
            forum: forumId
        }, {
            $set: req.body
        });
        topic.edited = true;
        await topic.save();
        const updatedTopic = await Topic.findOne({
                _id: topicId,
                forum: forumId
            })
            .populate({
                path: "user",
                select: "username first_name last_name picture",
                populate: {
                    path: "picture"
                }
            })
            .populate({
                path: "likes",
                select: "username first_name last_name picture",
                populate: {
                    path: "picture"
                }
            })
            .populate("comments");

        const topicWithDate = {
            ...updatedTopic._doc,
            noOfLikes: updatedTopic._doc.likes.length,
            createdAt: updatedTopic._doc.createdAt.toDateString()
        };

        res.status(200).json({
            message: "Topic updated successfully",
            topic: topicWithDate
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.deleteTopic = async(req, res) => {
    const { forumId, topicId } = req.params;
    const userId = req.user._id;

    try {
        // Find the topic to delete
        const topic = await Topic.findOne({
                _id: topicId,
                forum: forumId
            })
            .populate("medias");

        if (!topic) {
            return res.status(404).json({
                message: "Topic not found"
            });
        }

        // Check if the user is the owner of the topic
        if (topic.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this topic"
            });
        }
        let medias = topic.medias
        for (const med in medias) {
            const deleteMedia = await deleteFile(med.key);
        }
        // Delete the topic
        await Topic.deleteOne({
            _id: topicId,
            forum: forumId
        });

        res.status(200).json({
            message: "Topic deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.addComment = async(req, res) => {
    const { forumId, topicId } = req.params;
    const userId = req.user._id;

    try {
        // Find the topic to add comment
        const topic = await Topic.findOne({
            _id: topicId,
            forum: forumId
        });

        if (!topic) {
            return res.status(404).json({
                message: "Topic not found"
            });
        }

        const comment = new Comment({
            user: userId,
            text: req.body.text,
            post: topicId,
            onModel: "Topic",
        });
        topic.comments.push(comment._id);
        await comment.save();
        await topic.save();

        // Populate the comment with user details after saving
        const populatedComment = await Comment.findById(comment._id).populate({
            path: "user",
            select: "username first_name last_name picture",
            populate: {
                path: "picture"
            }
        });

        res.status(201).json(populatedComment);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Edit a comment
exports.editComment = async(req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        comment.text = req.body.text;
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Failed to edit comment" });
    }
};

// Delete a comment
exports.deleteComment = async(req, res) => {
    const { topicId, commentId } = req.params;
    const userId = req.user._id.toString();

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const topic = await Topic.findById(topicId);
        topic.comments.pull(commentId);

        await comment.deleteOne({ _id: commentId });
        await topic.save();
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete comment" });
    }
};

exports.addDiscussion = async(req, res) => {
    const { topicId, commentId } = req.params;
    const userId = req.user._id;
    try {
        // Find the comment to add discussion
        const comment = await Comment.findOne({
            _id: commentId,
            post: topicId,
            onModel: "Topic"
        });
        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        const discussion = new Discussion({
            user: userId,
            text: req.body.text,
            title: commentId,
            tags: req.body.tags,
        });
        await discussion.save();

        // Populate the discussion with user details after saving
        const populatedDiscussion = await Discussion.findById(discussion._id).populate({
            path: "user",
            select: "username first_name last_name picture",
            populate: {
                path: "picture"
            }
        });

        res.status(200).json(populatedDiscussion);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.updateDiscussion = async(req, res) => {
    const { discussionId } = req.params;
    const userId = req.user._id;
    try {
        // Find the discussion to update
        const discussion = await Discussion.findOne({
            _id: discussionId,
            user: userId
        });
        if (!discussion) {
            return res.status(404).json({
                message: "Discussion not found"
            });
        }

        if (discussion.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to edit this discussion"
            });
        }

        discussion.text = req.body.text;
        discussion.edited = true;
        await discussion.save();
        res.status(200).json(discussion);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.deleteDiscussion = async(req, res) => {
    const { discussionId } = req.params;
    const userId = req.user._id;
    try {
        // Find the discussion to delete
        const discussion = await Discussion.findOne({
            _id: discussionId,
            user: userId
        });
        if (!discussion) {
            return res.status(404).json({
                message: "Discussion not found"
            })
        }

        if (discussion.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this discussion"
            });
        }

        await Discussion.deleteOne({
            _id: discussionId
        });
        res.status(200).json({
            message: "Discussion deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.replyToDiscussion = async(req, res) => {
    const { discussionId } = req.params;
    const userId = req.user._id;
    try {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({
                message: "Discussion not found"
            });
        }

        const reply = new Discussion({
            user: userId,
            text: req.body.text,
            tags: req.body.tags,
            parent: discussionId
        });
        await reply.save();

        // Populate the reply with user details after saving
        const populatedReply = await Discussion.findById(reply._id).populate({
            path: "user",
            select: "username first_name last_name picture",
            populate: {
                path: "picture"
            }
        });
        res.status(200).json(populatedReply);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Add a reaction to a discussion
exports.addReaction = async(req, res) => {
    const { discussionId } = req.params;
    const userId = req.user._id;
    try {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({
                message: "Discussion not found"
            });
        }

        // Check if the user has already reacted
        const hasReacted = discussion.reactions.some(
            reaction => reaction._id.toString() === userId.toString()
        );

        if (!hasReacted) {
            discussion.reactions.push(userId);
            await discussion.save();
        }

        res.status(200).json(discussion);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Remove a reaction from a discussion
exports.removeReaction = async(req, res) => {
    const { discussionId } = req.params;
    const userId = req.user._id;

    try {
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({ message: "Discussion not found" });
        }

        discussion.reactions = discussion.reactions.filter(
            (reaction) => reaction._id.toString() !== userId.toString()
        );

        await discussion.save();

        res.json(discussion);
    } catch (error) {
        res.status(500).json({ message: "Failed to remove reaction" });
    }
};