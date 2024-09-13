const route = require('express').Router();
const mediaController = require('../App/Controller/MediaController');
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");

// Get Indeividual Media Files
route.get("/", authenticateSession, mediaController.getMedia);

module.exports = route;