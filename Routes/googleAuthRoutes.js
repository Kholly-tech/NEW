const router = require("express").Router();
const passport = require("passport");
const bcrypt = require('bcryptjs');
const { generateDeviceFingerprint } = require("../App/Helper/deviceFingerprint");
const { generateTokens } = require("../App/Helper");
const { createSession } = require("../App/Helper/sessionStore");
//Google Routes

router.get("/login/success", (req, res) => {
    try {
        if (req.user) {
            // console.log(`User: ${req.user}`);
            res.status(200).json({
                error: false,
                message: "Successfully Logged In",
                user: req.user,
            });
        } else {
            res.status(403).json({ error: true, message: "Not Authorized" });
        }
    } catch (error) {
        console.error("Login success error:", error);
        res.status(500).json({ error: true, message: "Internal server error" });
    }
});

router.get("/login/failed", (req, res) => {
    res.status(401).json({
        error: true,
        message: "Log in failure",
    });
});


router.get("/google", passport.authenticate("google", ["profile", "email"]));


router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    async(req, res) => {
        if (!req.user) {
            return res.redirect(`${process.env.CLIENT_URL}/signin?error=AuthenticationFailed`);
        }
        const { user } = req.user;
        // console.log({ user });

        if (!user) {
            console.error("User data missing", { user });
            return res.redirect(`${process.env.CLIENT_URL}/signin?error=MissingData`);
        }
        let deviceFingerprint = await generateDeviceFingerprint(req);
        deviceFingerprint = await bcrypt.hash(deviceFingerprint, 10);
        const { accessToken, refreshToken } = generateTokens({ userId: user.id });
        user.refreshToken.push(refreshToken);
        await user.save();

        // Remove sensitive information
        user.password = undefined;
        user.securePin = undefined;
        user.twoFactorSecret = undefined;
        user.phraseKey = undefined;

        res.cookie("srft_token", refreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.redirect(`${process.env.CLIENT_URL}/auth-callback?token=${accessToken}&&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
);

module.exports = router;