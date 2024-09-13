const {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    getNewRefreshTokens
} = require("./tokenHelper");
const {
    validateEmail,
    validatePassword,
    validatePhoneNumber,
} = require("./validationHelper");
const sendMail = require("./mailSender");
const { sendSMS, sendSMSWithSefan } = require("./smsSender");
const generateUsername = require("./generateUsername");
const { generateQrCode, verify } = require("./googleAuthenticator");

module.exports = {
    validateEmail,
    validatePassword,
    validatePhoneNumber,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    getNewRefreshTokens,
    sendMail,
    sendSMS,
    sendSMSWithSefan,
    generateUsername,
    generateQrCode,
    verify,
};