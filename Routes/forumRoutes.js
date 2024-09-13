const express = require("express");
const router = express.Router();
const forumController = require("../App/Controller/ForumController");
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");

// Get all forums in a community
router.get("/:communityId", forumController.getAllForums);

// Create a new forum in a community
router.post("/:communityId/create", authenticateSession, forumController.createForum);

// Get a specific forum by ID
router.get("/f/:forumId", forumController.getForum);

// Update a forum
router.put("/:forumId", authenticateSession, forumController.updateForum);

// Delete a forum
router.delete("/:forumId", authenticateSession, forumController.deleteForum);

// Join a forum
router.post("/:forumId/join", authenticateSession, forumController.joinForum);

// Leave a forum
router.post("/:forumId/leave", authenticateSession, forumController.leaveForum);

// Get forums the user is a member of
router.get("/get/user-forums", authenticateSession, forumController.getUserForums);

// Search for forums in a community
router.post("/:communityId/search", forumController.searchForum);

// Create a new forum post
router.post("/:forumId/posts", authenticateSession, forumController.createForumPost);

// Get forum posts
router.get("/:forumId/posts", forumController.getForumPosts);

// Get a forum post by ID
router.get("/:forumId/posts/:postId", forumController.getForumPostbyId);

// Update a forum post
router.put("/:forumId/posts/:postId", authenticateSession, forumController.updateForumPost);

// Delete a forum post
router.delete("/:forumId/posts/:postId", authenticateSession, forumController.deleteForumPost);

// Get comments for a forum post
router.get("/:forumId/posts/:postId/comments", forumController.getPostComments);

// Get a comment by ID
router.get("/comments/:commentId", forumController.getCommentById);

// Add a comment to a forum post
router.post("/comments", authenticateSession, forumController.addComment);

// Edit a comment
router.put("/comments/:commentId", authenticateSession, forumController.editComment);

// Delete a comment
router.delete("/comments/:commentId", authenticateSession, forumController.deleteComment);

// Add a reaction to a comment
router.post("/comments/:commentId/react", authenticateSession, forumController.addReaction);

// Remove a reaction from a comment
router.delete("/comments/:commentId/react", authenticateSession, forumController.removeReaction);

// Add a reply to a comment
router.post("/:commentId/reply", authenticateSession, forumController.addReply);

// Edit a reply
router.put("/reply/:replyId", authenticateSession, forumController.editReply);

// Delete a reply
router.delete("/reply/:replyId", authenticateSession, forumController.deleteReply);


module.exports = router;