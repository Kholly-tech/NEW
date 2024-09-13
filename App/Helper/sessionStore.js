const crypto = require('crypto');
const Session = require('../Models/sessionModel');
const generateTokens = require('./tokenHelper');

// In-memory session store (use a database in production)
const sessions = new Map();

async function createSession(userId, accessToken, deviceFingerprint) {
    console.log("UserId:", userId);
    console.log("Device Fingerprint:", deviceFingerprint);
    const expiresAt = Date.now() + 20 * 60 * 1000; // 20 minutes in milliseconds
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    const session = new Session({
        userId,
        deviceFingerprint,
        expiresAt,
        accessToken,
        refreshToken,
        refreshTokenExpiresAt,
    });

    await session.save();
    return { dRefreshToken: refreshToken };
}

async function getSession(token) {
    return await Session.findOne({ accessToken: token });
}

async function updateSession(token) {
    const session = await Session.findOne({ accessToken: token });
    if (session) {
        session.expiresAt = Date.now() + 20 * 60 * 1000;
        await session.save();
    }
}

async function deleteSession(token) {
    const session = await Session.findOne({ accessToken: token });
    if (session) {
        await Session.findByIdAndDelete(session._id);
        return true;
    }
}

async function refreshSession(refreshToken, deviceFingerprint) {
    const session = await Session.find({
        refreshToken: refreshToken,
        deviceFingerprint: deviceFingerprint,
    });
    if (session && session.refreshTokenExpiresAt > Date.now()) {
        const { accessToken } = await generateTokens({ userId: session.userId });
        const newSession = await createSession(session.userId, accessToken, deviceFingerprint);
        await deleteSession(session.sessionId);
        return newSession;
    }
    return null;
}

module.exports = { createSession, getSession, updateSession, deleteSession, refreshSession };