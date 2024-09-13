const express = require("express");
const {
    editProfile,
    changePassword,
    changeEmail,
    changeNumber,
    verifyEmail,
    lockProfile,
    updateSettings,
    updateLanguage,
    deletAccount,
} = require("../App/Controller/SettingsController");
const { authenticateSession, } = require("../App/Middleware/authenticationMiddleWare");
const router = express.Router();

// Edit Profile
router.put("/", authenticateSession, editProfile);

// Change Password
router.put("/change-password", authenticateSession, changePassword);

// Change Email Address
router.put("/change-email", authenticateSession, changeEmail);

// Verify Email
router.put("/verify-email", authenticateSession, verifyEmail);

// Change Phone Number
router.put("/change-number", authenticateSession, changeNumber);

// Lock Profile
router.post("/lock", authenticateSession, lockProfile);

// Update Data & Privacy
router.put("/data-and-privacy", authenticateSession, updateSettings);

// Update Language
router.put("/language-and-display", authenticateSession, updateLanguage);

// Delet Account
router.delete("/delete", authenticateSession, deletAccount);

module.exports = router