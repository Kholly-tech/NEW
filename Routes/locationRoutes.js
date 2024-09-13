const express = require("express");
const router = express.Router();

const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");
const { createLocation } = require("../App/Controller/LocationController");


router.post("/", authenticateSession, createLocation);

module.exports = router;