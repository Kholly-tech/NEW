const express = require("express");
const route = express.Router();
const userController = require("../App/Controller/UserController");
const friendsController = require("../App/Controller/FriendsController")
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");

// Get current user
route.get("/", authenticateSession, userController.getCurrentUser);

// Update User Profile
route.put("/", authenticateSession, userController.updateUser);

// Get all users
route.get("/all", userController.getAllUsers);

// Get user online status
route.get("/:id/online", userController.getUserOnlineStatus);

// Get user by username
route.get("/:username", userController.getUserByUsername);

// Get user followers
route.get("/:id/followers", userController.getUserFollowers);

// Get user following
route.get("/:id/following", userController.getUserFollowing);

// Suggest Friends to follow
route.get("/u/suggest", authenticateSession, userController.suggestFriends);

// Follow and unfollow user
route.post(
    "/follow/:targetUserId",
    authenticateSession,
    friendsController.followUser
);
route.post(
    "/unfollow/:targetUserId",
    authenticateSession,
    friendsController.unfollowUser
);

module.exports = route;