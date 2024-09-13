const express = require("express");
const {
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
} = require("../App/Controller/CommentController");
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");

const router = express.Router();

// Add a comment
router.post("/", authenticateSession, addComment);

// Get comments for a post
router.get("/:postId", getComments);

// Get a comment by ID
router.get("/c/:commentId", getCommentById);

// Add a reaction to a comment
router.post("/:commentId/react", authenticateSession, addReaction);

// Edit a comment
router.put("/:commentId", authenticateSession, editComment);

// Remove a reaction from a comment
router.delete("/:commentId/react", authenticateSession, removeReaction);

// Delete a comment
router.delete("/:commentId", authenticateSession, deleteComment);

// Add a reply to a comment
router.post("/:commentId/reply", authenticateSession, addReply);

// Edit a reply
router.put("/reply/:replyId", authenticateSession, editReply);

// Delete a reply
router.delete("/reply/:replyId", authenticateSession, deleteReply);

module.exports = router;