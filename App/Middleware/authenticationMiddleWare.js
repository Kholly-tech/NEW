const { verifyAccessToken, verifyRefreshToken, generateTokens, getNewRefreshTokens } = require("../Helper");
const { User } = require("../Models");
const bcrypt = require('bcryptjs');
const { parseCookie } = require("../Helper/parseCookie");
const userAgentParser = require('user-agent-parser');
const deviceDetector = require('device-detector');
const { getSession, updateSession, refreshSession } = require('../Helper/sessionStore');
const { generateDeviceFingerprint } = require('../Helper/deviceFingerprint');

const authenticateSession = async(req, res, next) => {
    let regularUpdatedUser;
    try {
        const authHeader = req.headers;
        const token = authHeader['authorization'];
        const cookies = authHeader['cookie'] && parseCookie(authHeader['cookie']);
        const currentDeviceFingerprint = await generateDeviceFingerprint(req);

        if (token) {
            // Token exists in authorization header
            const decodedToken = verifyAccessToken(token);
            if (decodedToken) {
                const isDeviceFingerprintValid = await bcrypt.compare(currentDeviceFingerprint, decodedToken.deviceFingerprint);
                if (isDeviceFingerprintValid) {
                    // Token is valid and device fingerprint matches
                    const user = await User.findById(decodedToken.userId)
                        .populate("picture")
                        .populate("cover");

                    if (!user) {
                        return res.status(404).json({ message: "User Not Found." });
                    }

                    req.user = user;
                    return next();
                }
            }
            // Token is invalid, expired, or device fingerprint doesn't match
        }

        // No token or invalid token, check for refresh token
        const refreshToken = decodeURIComponent(cookies.srft_token);
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        console.log("refreshToken", refreshToken);
        const foundUser = await User.findOne({ 'refreshToken.token': refreshToken });
        if (!foundUser) {
            // Possible refresh token reuse
            const decodedRefreshToken = verifyRefreshToken(refreshToken);
            if (!decodedRefreshToken) {
                return res.status(403).json({ message: 'Forbidden -1' });
            }
            const hackedUser = await User.findById(decodedRefreshToken.payload.userId);
            hackedUser.refreshToken = [{}];
            await hackedUser.save();
            return res.status(403).json({ message: 'Forbidden -2' });
        }

        const tokenEntry = foundUser.refreshToken.find(rt => rt.token === refreshToken);
        if (!tokenEntry) {
            return res.status(403).json({ message: 'Forbidden - 3' });
        }

        const isDeviceFingerprintValid = await bcrypt.compare(currentDeviceFingerprint, tokenEntry.deviceFingerprint);
        if (!isDeviceFingerprintValid) {
            return res.status(403).json({ message: 'Forbidden - 4' });
        }

        const decodedRefreshToken = verifyRefreshToken(refreshToken);
        if (!decodedRefreshToken || foundUser._id.toString() !== decodedRefreshToken.payload.userId) {
            foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt.token !== refreshToken);
            regularUpdatedUser = await foundUser.save();
            return res.status(403).json({ message: 'Forbidden - 5' });
        }

        // Refresh token is valid, generate new tokens
        const hashedDeviceFingerprint = await bcrypt.hash(currentDeviceFingerprint, 10);
        const refreshResult = getNewRefreshTokens({ userId: foundUser._id, deviceFingerprint: hashedDeviceFingerprint });
        if (!refreshResult) {
            return res.status(403).json({ message: 'Forbidden - Unable to refresh tokens' });
        }
        const { accessToken, newRefreshToken } = refreshResult;

        regularUpdatedUser.refreshToken = regularUpdatedUser.refreshToken.filter(rt => rt.token !== refreshToken);
        regularUpdatedUser.refreshToken.push({ token: newRefreshToken, deviceFingerprint: hashedDeviceFingerprint });
        let result = await regularUpdatedUser.save();

        res.cookie("srft_token", newRefreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        req.user = result;
        req.user.newToken = accessToken;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { authenticateSession };