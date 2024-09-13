const express = require("express");
const router = express.Router();

const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");
const { uploadMedia, uploadToAws } = require("../App/Controller/UploadController");
const { uploadMediaMiddleware } = require("../App/Middleware/uploadMiddleware");

// Define routes
router.post("/", authenticateSession, uploadMediaMiddleware, uploadMedia);
// router.post("/aws", authenticateSession, uploadMediaMiddleware, uploadToAws);

module.exports = router;