const express = require("express");
const router = express.Router();
const momentsController = require("../App/Controller/MomentController");
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");


router.post("/", authenticateSession, momentsController.createMoment);
router.get("/", authenticateSession, momentsController.getMoments);
router.delete(
    "/:momentId",
    authenticateSession,
    momentsController.deleteMoment
);
router.get(
    "/following",
    authenticateSession,
    momentsController.getFollowingMoments
);

module.exports = router;