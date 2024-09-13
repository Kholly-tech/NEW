const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const generateQrCode = async(user) => {
    try {
        console.log("Loading 2");
        let imageUrl;
        const secret = speakeasy.generateSecret({
            name: user.name,
            email: user.email,
            id: user.id,
        });
        console.log("SECRET", secret);

        console.log("Loading 3");
        const data_url = await qrcode.toDataURL(secret.otpauth_url);
        console.log(data_url);
        console.log("Loading 4");
        return {
            data_url,
            secret: secret.base32,
        };
    } catch (error) {
        throw error;
    }
};

const verify = async(secret, token) => {
    try {
        console.log("Verifying token:", token);
        console.log("Using secret:", secret);

        const verify = speakeasy.totp.verify({
            secret: secret,
            encoding: "base32",
            token: token,
            window: 2, // Increased window to check 2 steps before and after
        });
        console.log("Verification result:", verify);
        return verify;
    } catch (error) {
        throw error;
    }
};

module.exports = { generateQrCode, verify };