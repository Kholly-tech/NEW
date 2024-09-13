const express = require("express");
const {
    createPost,
    getPostById,
    updatePostById,
    deletePostById,
    getUserPosts,
    getFollowingPosts,
    likePost,
    unlikePost,
    savePost,
    getSavedPosts,
    getSavedPostById,
    getAllPosts,
    unsavePost,
    deleteScheduledPost,
    savePollAnswer,
    getAllScheduledPosts,
    hidePost,
    getAllThePosts
    // deleteMany
} = require("../App/Controller/PostController");
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");

const router = express.Router();

// Get All Post
router.get("/", authenticateSession, getAllThePosts);
// router.get("/all", authenticateSession, getAllThePosts);

// router.delete("/", deleteMany);

// Create a new post
router.post("/", authenticateSession, createPost);

// Save a post by ID
router.post("/:id", authenticateSession, savePost);

// Unsave a post by ID
router.put("/saved/:id", authenticateSession, unsavePost);

// Get Saved Posts
router.get("/saved", authenticateSession, getSavedPosts);

// Get a Saved Post by ID
router.get("/saved/:id", authenticateSession, getSavedPostById);

// Get posts from users the current user is following
router.get("/following", authenticateSession, getFollowingPosts);

// Get a post by ID
router.get("/:id", authenticateSession, getPostById);

// Get all posts by a user
router.get("/user/:username", authenticateSession, getUserPosts);

// Update a post by ID
router.put("/:id", authenticateSession, updatePostById);

// like a post by ID
router.put("/:id/like", authenticateSession, likePost);
// unlike a post by ID
router.put("/:id/unlike", authenticateSession, unlikePost);

// Delete a post by ID
router.delete("/:id", authenticateSession, deletePostById);

// Get All Scheduled Posts
router.get("/scheduled", authenticateSession, getAllScheduledPosts);

// Delete a scheduled post by ID
router.delete("/scheduled/:id", authenticateSession, deleteScheduledPost);

// Hide a post by ID
router.put("/:id/hide", authenticateSession, hidePost);

// Save a poll answer
router.put("/p/poll", authenticateSession, savePollAnswer);

module.exports = router;