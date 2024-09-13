const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { encrypt, decrypt } = require('./encryption');

const generateTokens = (payload) => {
    // Generate an access token
    function generateAccessToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2m' }); // Increased to 15 minutes
    }

    // Generate a refresh token
    function generateRefreshToken(payload) {
        const initialRefreshToken = {
            crypto: crypto.randomBytes(40).toString('hex'),
            payload
        };
        return jwt.sign(initialRefreshToken, process.env.JWT_SECRET, { expiresIn: '10m' }); // Increased to 7 days
    }

    //Encrypt the access token and refresh token
    const accessToken = encrypt(generateAccessToken(payload));
    const refreshToken = encrypt(generateRefreshToken(payload));

    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
    try {
        const decryptToken = decrypt(token);
        console.log("Decrypted Token:", decryptToken);
        const decodedToken = jwt.verify(decryptToken, process.env.JWT_SECRET);
        return decodedToken;
    } catch (error) {
        console.log("Token verification failed:", error.message);
        return null;
    }
};

const verifyRefreshToken = (encryptedRefreshToken) => {
    try {
        // console.log("Received Refresh Token:", encryptedRefreshToken);
        const decryptRefreshToken = decrypt(encryptedRefreshToken);
        console.log("Decrypted Refresh Token:", decryptRefreshToken);
        const decodedRefreshToken = jwt.verify(decryptRefreshToken, process.env.JWT_SECRET);
        console.log("decodedRefreshToken : ", decodedRefreshToken);
        return decodedRefreshToken;
    } catch (error) {
        console.log("Refresh Token verification failed:", error.message);
        return null;
    }
};

const getNewRefreshTokens = (payload) => {
    try {
        // Generate a new access token and refresh token
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

        return { accessToken, newRefreshToken };
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return null;
    }
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken, getNewRefreshTokens };