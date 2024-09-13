const express = require('express');
const router = express.Router();
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");
const {
    getAllTopics,
    createTopic,
    getTopic,
    updateTopic,
    deleteTopic,
    addComment,
    editComment,
    deleteComment,
    addDiscussion,
    updateDiscussion,
    deleteDiscussion,
    replyToDiscussion,
    addReaction,
    removeReaction,
} = require("../App/Controller/TopicController");

router.get("/:forumId", getAllTopics); // Get All Topics
router.post("/:forumId", authenticateSession, createTopic); // Create a new topic
router.get("/:forumId/:topicId", getTopic); // Get a topic by ID
router.put("/:forumId/:topicId", authenticateSession, updateTopic); // Update a topic by ID
router.delete("/:forumId/:topicId", authenticateSession, deleteTopic); // Delete a topic by ID
router.post('/:forumId/:topicId/comment', authenticateSession, addComment); // Add a comment to a topic
router.put('/c/comment/:commentId', authenticateSession, editComment); // Edit a comment
router.delete('/c/:topicId/:commentId', authenticateSession, deleteComment); // Delete a comment
router.post('/:topicId/comment/:commentId/discussion', authenticateSession, addDiscussion); // Add a discussion to a comment
router.put('/d/discussion/:discussionId', authenticateSession, updateDiscussion); // Update a discussion
router.delete('/d/discussion/:discussionId', authenticateSession, deleteDiscussion); // Delete a discussion
router.post('/discussion/:discussionId/reply', authenticateSession, replyToDiscussion); // Reply to a discussion
router.post('/discussion/:discussionId/reaction', authenticateSession, addReaction); // Add a reaction to a discussion
router.delete('/discussion/:discussionId/reaction', authenticateSession, removeReaction); // Remove a reaction from a discussion


module.exports = router;