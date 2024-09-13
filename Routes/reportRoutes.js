const express = require("express");
const router = express.Router();
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");
const { createReport } = require("../App/Controller/ReportController");


router.post("/", authenticateSession, createReport);

module.exports = router;