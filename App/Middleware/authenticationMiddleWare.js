const { verifyAccessToken, verifyRefreshToken, generateTokens, getNewRefreshTokens } = require("../Helper");
const { User } = require("../Models");
const bcrypt = require('bcryptjs');
const { parseCookie } = require("../Helper/parseCookie");
const { generateDeviceFingerprint } = require('../Helper/deviceFingerprint');

const authenticateSession = async(req, res, next) => {
    try {
        const authHeader = req.headers;
        const token = authHeader['authorization'];
        const cookies = authHeader['cookie'] && parseCookie(authHeader['cookie']);
        const currentDeviceFingerprint = await generateDeviceFingerprint(req);

        if (token) {
            const decodedToken = verifyAccessToken(token);
            if (decodedToken) {
                const isDeviceFingerprintValid = await bcrypt.compare(currentDeviceFingerprint, decodedToken.deviceFingerprint);
                if (isDeviceFingerprintValid) {
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
        }

        const refreshToken = decodeURIComponent(cookies.srft_token);
        res.clearCookie('srft_token', { httpOnly: true, sameSite: 'None', secure: true });
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let updatedUser;
        let retries = 5; // Number of retries for optimistic concurrency control

        while (retries > 0) {
            try {
                const foundUser = await User.findOne({ 'refreshToken.token': refreshToken });
                if (!foundUser) {
                    const decodedRefreshToken = verifyRefreshToken(refreshToken);
                    if (!decodedRefreshToken) {
                        return res.status(401).json({ message: 'Unauthorized, Pls Log in' });
                    }
                    const hackedUser = await User.findById(decodedRefreshToken.payload.userId);
                    hackedUser.refreshToken = [];
                    await hackedUser.save();
                    return res.status(401).json({ message: 'Unauthorized, Pls Log in' });
                }

                const tokenEntry = foundUser.refreshToken.find(rt => rt.token === refreshToken);
                if (!tokenEntry || !(await bcrypt.compare(currentDeviceFingerprint, tokenEntry.deviceFingerprint))) {
                    return res.status(401).json({ message: 'Unauthorized, Pls Log in' });
                }

                const decodedRefreshToken = verifyRefreshToken(refreshToken);
                if (!decodedRefreshToken || foundUser._id.toString() !== decodedRefreshToken.payload.userId) {
                    foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt.token !== refreshToken);
                    await foundUser.save();
                    return res.status(401).json({ message: 'Forbidden - 5' });
                }

                const hashedDeviceFingerprint = await bcrypt.hash(currentDeviceFingerprint, 10);
                const refreshResult = getNewRefreshTokens({ userId: foundUser._id, deviceFingerprint: hashedDeviceFingerprint });
                if (!refreshResult) {
                    return res.status(403).json({ message: 'Forbidden - Unable to refresh tokens' });
                }
                const { accessToken, newRefreshToken } = refreshResult;

                // First, remove the old token
                updatedUser = await User.findOneAndUpdate({ _id: foundUser._id }, { $pull: { refreshToken: { token: refreshToken } } }, { new: true });

                if (!updatedUser) {
                    throw new Error('User not found during update');
                }

                // Then, add the new token
                updatedUser = await User.findOneAndUpdate({ _id: foundUser._id }, { $push: { refreshToken: { token: newRefreshToken, deviceFingerprint: hashedDeviceFingerprint } } }, { new: true });

                if (!updatedUser) {
                    throw new Error('User not found during second update');
                }

                // Set the new refresh token in cookies
                res.cookie("srft_token", newRefreshToken, {
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                });

                // Set the new access token in the response header
                res.set('Authorization', `Bearer ${accessToken}`);

                req.user = updatedUser;
                return next();

            } catch (error) {
                if ((error.name === 'VersionError' || error.codeName === 'ConflictingUpdateOperators') && retries > 1) {
                    retries--;
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to update user after multiple retries');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { authenticateSession };