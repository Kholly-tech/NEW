require("dotenv").config();
const express = require("express");
const authController = require("../App/Controller/AuthController.js");
const { authenticateSession } = require("../App/Middleware/authenticationMiddleWare.js");
const router = express.Router();
const passport = require("passport");

// Define routes

router.use("/", require("./googleAuthRoutes.js"));

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/sendCode", authController.sendOtpMail);
router.post("/savePhraseKey", authenticateSession, authController.savePhraseKey);
router.post("/phraseAuth", authenticateSession, authController.phraseKeyAuth);
router.post("/logout", authenticateSession, authController.logout);
router.post("/findAccount", authController.findAccount);
router.post("/changePassword", authController.changePassword);
router.post("/confirmVerificationCode", authController.confirmVerificationCode);
router.post("/sendActivation-mail", authController.sendActivationMail);
router.post("/activateAccount", authController.activateAccount);
router.get("/enable-2fa", authenticateSession, authController.enable2fa);
router.post("/verify2fa", authenticateSession, authController.verify2fa);
router.post("/test", authController.test);
router.post("/reset", authenticateSession, authController.reset2FA);

module.exports = router;