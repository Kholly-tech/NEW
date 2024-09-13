const express = require("express");
const router = express.Router();
const {
    createCommunity,
    joinCommunity,
    unjoinCommunity,
    makeAdmin,
    removeAdmin,
    addMember,
    removeMember,
    approveMembership,
    updateCommunity,
    getCommunity,
    getAllCommunities,
    discoverCommunity,
    getUserCommunities,
    getCreatedCommunities,
    searchCommunities,
    postToCommunity,
    getCommunityPostById,
    updateCommunityPostById,
    deleteCommunityPostById,
    getCommunityPostComments,
    addComment,
    editComment,
    deleteComment,
    addReaction,
    addReply,
    editReply,
    deleteReply,
    removeReaction,
    getCommunityPosts,
    deleteCommunity,
    getCommunityMedia,
} = require("../App/Controller/CommunityController");
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");

router.post("/create", authenticateSession, createCommunity);
router.post("/join/:communityId", authenticateSession, joinCommunity);
router.post("/unjoin/:communityId", authenticateSession, unjoinCommunity); // Add unjoin route
router.put("/make-admin/:communityId/:userId", authenticateSession, makeAdmin);
router.put("/remove-admin/:communityId/:userId", authenticateSession, removeAdmin);
router.put("/add-member/:communityId/:userId", authenticateSession, addMember);
router.put("/remove-member/:communityId/:userId", authenticateSession, removeMember);
router.put(
    "/approve-membership/:communityId/:userId",
    authenticateSession,
    approveMembership
);
router.put("/update/:communityId", authenticateSession, updateCommunity);
router.get("/:communityId", authenticateSession, getCommunity);
router.delete("/:communityId", authenticateSession, deleteCommunity);
router.get("/", getAllCommunities);
router.get("/c/search", searchCommunities);
router.get("/c/user-communities", authenticateSession, getUserCommunities);
router.get("/c/created-communities", authenticateSession, getCreatedCommunities);
// router.get("/c/discover", authenticateSession, discoverCommunity);

// Community Posts
router.post("/:id/post", authenticateSession, postToCommunity); // Post in a community
router.get("/:id/post", authenticateSession, getCommunityPosts); // Get all posts in a community
router.get("/:id/post/:postId", authenticateSession, getCommunityPostById); // Get a post in Community by ID
router.put("/:id/post/:postId", authenticateSession, updateCommunityPostById); // Update a post in a community
router.delete("/:id/post/:postId", authenticateSession, deleteCommunityPostById); // Delete a post in a community

// Comments Routes
router.get("/post/:postId/comments", authenticateSession, getCommunityPostComments); // Get all comments in a post
router.post("/comment", authenticateSession, addComment); // Add a comment to a post
router.put("/comment/:commentId", authenticateSession, editComment); // Edit a comment in a post
router.delete("/comment/:commentId", authenticateSession, deleteComment); // Delete a comment in a post
router.post("/comment/:commentId/react", authenticateSession, addReaction); // Add reaction to Comment
router.delete("/comment/:commentId/react", authenticateSession, removeReaction); // Remove reaction from Comment

// Community Media Routes
router.get("/:id/media", authenticateSession, getCommunityMedia); // Get all media in a community

//Reply Routes
// Add a reply to a comment
router.post("/:commentId/reply", authenticateSession, addReply);

// Edit a reply
router.put("/reply/:replyId", authenticateSession, editReply);

// Delete a reply
router.delete("/reply/:replyId", authenticateSession, deleteReply);

module.exports = router;