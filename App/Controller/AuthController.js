const {
    generateTokens,
    verifyToken,
    sendMail,
    sendSMS,
    sendSMSWithSefan,
    generateUsername,
    generateQrCode,
    verify,
} = require("../Helper");
// const jwt = require("jsonwebtoken");
const { createSession, refreshSession } = require('../Helper/sessionStore');
const { generateDeviceFingerprint } = require('../Helper/deviceFingerprint');
const { saveNotification } = require("../Helper/notificationHelper");
const Session = require('../Models/sessionModel');
const {
    validateEmail,
    validatePhoneNumber,
} = require("../Helper/validationHelper");
const { activationMail, findAccountOTP } = require("../Mail/authMails");
const { User, OTP } = require("../Models/index");
const speakeasy = require("speakeasy");
const requestIp = require('request-ip');
const passport = require("passport");
const bcrypt = require("bcryptjs");

// Register user
// Recive the user details
// end point /auth/register

const register = async(req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            phone_number,
            gender,
            bYear,
            bMonth,
            bDay,
        } = req.body;

        // Validate the received data
        const errors = {};
        if (!email) errors.email = "Your email is required";
        if (!first_name) errors.first_name = "Your first name is required";
        if (!last_name) errors.last_name = "Your last name is required";
        if (!password) errors.password = "Your password is required";
        if (!phone_number) errors.phone_number = "Your phone number is required";
        if (!gender) errors.gender = "Your gender is required";
        if (!bYear) errors.bYear = "Your birth year is required";
        if (!bMonth) errors.bMonth = "Your birth month is required";
        if (!bDay) errors.bDay = "Your birth day is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        // Check if the email already exists in the database
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            errors.email = "Email already exists";
        }

        // Validate the email format
        if (!validateEmail(email)) {
            errors.email = "Enter a valid email address";
        }

        // Check if the phone number already exists in the database
        const existingPhoneNumber = await User.findOne({ phone_number });
        if (existingPhoneNumber) {
            errors.phone_number = "Phone number already exists";
        }

        // Validate the phone number format
        if (!validatePhoneNumber(phone_number)) {
            errors.phone_number = "Enter a valid phone number";
        }

        // generate User name
        // Creating the user name
        let tempUsername = first_name + last_name;
        const newUsername = await generateUsername(tempUsername);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // generate 4 digit pin for master verification  & encrypt it
        const userPin = Math.floor(1000 + Math.random() * 9000).toString();

        // Hash the master pin
        const hashedUserPin = await bcrypt.hash(userPin, 10);

        // Save the user data to the database
        const newUser = new User({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            phone_number,
            gender,
            bYear,
            bMonth,
            bDay,
            securePin: hashedUserPin,
            username: newUsername,
            refreshToken: [],
        });
        // Save the user data
        await newUser.save();

        // Generate token
        let deviceFingerprint = await generateDeviceFingerprint(req);
        deviceFingerprint = await bcrypt.hash(deviceFingerprint, 10);
        const { accessToken, refreshToken } = generateTokens({ userId: newUser._id });
        newUser.refreshToken.push(refreshToken);
        await newUser.save();


        // Remove sensitive information
        newUser.password = undefined;
        newUser.securePin = undefined;
        newUser.twoFactorSecret = undefined;
        newUser.phraseKey = undefined;

        // Send token and user data back to the client
        res.cookie("srft_token", refreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        // Send the token and user data back to the client
        res.status(201).json({ token: accessToken, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login COntroller
// Recive the identofier and the apassword
// end point auth/login

const login = async(req, res) => {
    try {
        const { identifier, password } = req.body;
        const userAgent = req.headers['user-agent'];
        console.log("Uer Agent:", userAgent);
        const clientIp = requestIp.getClientIp(req);

        console.log(clientIp);
        // await sendMail('kolawoleakintayok@gmail.com', 'IP Discovery', `The Ip Address and User Agent for ${identifier} is ${clientIp} and ${userAgent} respectively!`, process.env.NOREPLY_MAIL);


        // Check if identifier and password are provided
        if (!identifier || !password) {
            return res
                .status(400)
                .json({ message: "Email/phone and password are required" });
        }

        // Find user by email or phone number
        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { phone_number: identifier }],
        }).populate("picture").populate("cover");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if password is correct
        if (!user.password) {
            return res.status(401).json({ message: "Invalid User" });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        // Generate device fingerprint
        let deviceFingerprint = await generateDeviceFingerprint(req);
        const hashedDeviceFingerprint = await bcrypt.hash(deviceFingerprint, 10);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens({ userId: user._id, deviceFingerprint: hashedDeviceFingerprint });

        // Save refresh token and hashed device fingerprint
        user.refreshToken.push({ token: refreshToken, deviceFingerprint: hashedDeviceFingerprint });
        await user.save();

        // Remove sensitive information
        user.password = undefined;
        user.securePin = undefined;
        user.twoFactorSecret = undefined;
        user.phraseKey = undefined;

        // Set refresh token cookie
        res.cookie("srft_token", refreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        res.status(200).json({ token: accessToken, userData: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Forget Password
// Find account
// Recive the users email
const findAccount = async(req, res) => {
    try {
        const { identifier } = req.body;
        console.log(identifier);

        // Check if email exists in the database
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone_number: identifier }],
        }).populate("picture");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userDetails = {
            id: user._id,
            picture: user.picture.url,
            name: user.first_name + " " + user.last_name,
            phone: user.phone_number,
            email: user.email,
        };
        console.log(userDetails);

        res.status(200).json(userDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const sendOtpMail = async(req, res) => {
    try {
        const { phone, email, option, reason } = req.body;
        console.log("Received Email & phone:", email, phone);
        if (option !== "phone" && option !== "email") {
            return res.status(400).json({ message: "Invalid option" });
        }
        const user = await User.findOne({
            email: email,
            phone_number: phone,
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("Email from User query:", user.email);

        // Check if there's an existing OTP record for the user and reason "passwordReset"
        let otpRecord = await OTP.findOne({
            userEmail: email,
            reason: reason,
        });

        // Generate random 6-digit code
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // If OTP record exists, update it with the new code; otherwise, create a new record
        if (otpRecord) {
            otpRecord.code = verificationCode;
        } else {
            otpRecord = new OTP({
                userEmail: email,
                code: verificationCode,
                reason: reason,
            });
        }

        await otpRecord.save();

        if (option === "phone") {
            // Send the verification code to the user's phone number
            const message = `Your verification code is: ${verificationCode}`;

            //Send SMS to User.
            const sendResponse = await sendSMS(phone, message);
            console.log("Send Response:", sendResponse);
            if (sendResponse === false || sendResponse === undefined) {
                return res.status(400).json({
                    message: `Failed to send verification code to ${phone}`,
                });
            }
            return res
                .status(200)
                .json({ message: "Verification code sent successfully", phone: phone });
        } else {
            // Send the verification code to the user's email

            try {
                const subject = "Forget Password OTP";
                const mailRecipient = user.email;
                const mailSender = process.env.NOREPLY_MAIL;
                const mailContent = findAccountOTP({
                    first_name: user.first_name,
                    code: verificationCode,
                });
                console.log("Mail Recipient:", mailRecipient);
                const info = await sendMail(
                    mailRecipient,
                    subject,
                    mailContent,
                    mailSender
                );
                console.log("Info", info);
            } catch (error) {
                console.log("Error sending forget password otp email:", error);
            }
            return res.status(200).json({
                message: `Verification code sent successfully to ${user.email}`,
                email: user.email,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Confirm the verification code sent the the user
// recive the email and the user opt code
// retun the token
const confirmVerificationCode = async(req, res) => {
    try {
        const { phone, email, code, reason } = req.body;
        let otpRecord;
        // Check if the verification code exists with the email and the reason is "passwordReset"
        otpRecord = await OTP.findOne({
            userEmail: email,
            code,
            reason: reason,
        });
        if (!otpRecord) {
            return res.status(404).json({ message: "Invalid verification code" });
        }

        // Check if the verification code is expired
        const now = new Date();
        const diff = now - otpRecord.updatedAt;
        const diffMinutes = diff / 1000 / 60;
        console.log(diffMinutes);
        // Expiration time is 10 minutes
        if (diffMinutes > 10) {
            return res.status(400).json({ message: "Verification Code has expired" });
        }

        if (reason === "verification") {
            const user = await User.findOne({
                $or: [{ email: email }, { phone_number: phone }],
            });
            if (!user) {
                res.status(500).json({ message: "User not found" });
            }
            user.verified = true;
            await user.save();

            return res.status(200).json({
                message: "Account Verified Successfully!!",
            });
        }

        // Generate a token for changing the password
        const token = generateAccessToken({ userEmail: otpRecord.userEmail }, { expiresIn: "15m" }); // Token expires in 15 minutes

        res.status(200).json({ message: "Verification code confirmed", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const savePhraseKey = async(req, res) => {
    const userId = req.user._id;
    const { phraseKey } = req.body;
    console.log(phraseKey);

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log(user.first_name + " " + user.last_name);

        // Ensure phraseKey is an array
        if (!Array.isArray(phraseKey)) {
            return res.status(400).json({ message: "Phrase key must be an array" });
        }

        // Save the phraseKey
        user.phraseKey = phraseKey;
        await user.save();

        // Check if the phraseKey was saved correctly
        if (user.phraseKey && user.phraseKey.length > 0) {
            console.log("Saved phrase key:", user.phraseKey);
            return res.status(200).json({ message: "Phrase key saved successfully" });
        } else {
            return res.status(400).json({ message: "Phrase key not saved" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const phraseKeyAuth = async(req, res) => {
    const userId = req.user._id;
    const { phrase } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const savedPhraseKey = user.phraseKey;
        console.log("Saved Phrase Key:", savedPhraseKey);
        console.log("Provided Phrase:", phrase);

        if (!Array.isArray(savedPhraseKey)) {
            return res.status(500).json({ message: "Invalid phraseKey format" });
        }

        if (savedPhraseKey.includes(phrase)) {
            user.phraseKey = savedPhraseKey.filter((key) => key !== phrase);
            await user.save();

            console.log("Updated Phrase Key:", user.phraseKey);
            return res.status(200).json({ message: "User Verified Successfully" });
        } else {
            return res.status(400).json({ message: "Invalid Phrase provided" });
        }
    } catch (error) {
        console.error("Error in phraseKeyAuth:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const enable2fa = async(req, res) => {
    const userId = req.user._id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(500).json({ message: "User not Found" });
        }
        console.log("Loading 1");
        const result = await generateQrCode(user);

        console.log("Loading 5");
        console.log("Result", result);

        user.twoFactorSecret = result.secret;
        await user.save();
        res.status(200).json({ qrCode: result.data_url, secret: result.secret });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const verify2fa = async(req, res) => {
    const userId = req.user._id;
    const { token } = req.body;
    try {
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const storedSecret = user.twoFactorSecret;
        console.log("User:", user._id);
        console.log("Received Token:", token);
        console.log("Stored Secret:", storedSecret);

        // const now = Math.floor(Date.now() / 1000);
        // console.log("Current timestamp:", now);
        // const generatedToken = speakeasy.totp({
        //     secret: storedSecret,
        //     encoding: "base32",
        //     time: now,
        // });
        // console.log("Generated token from stored secret:", generatedToken);

        const verified = await verify(storedSecret, token);
        console.log("Verification Status:", verified);

        if (verified) {
            return res.status(200).json({ message: "2FA verified successfully" });
        } else {
            return res.status(400).json({ message: "Invalid 2FA token" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const reset2FA = async(req, res) => {
    const userId = req.user._id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Generate a new secret
        const newSecret = speakeasy.generateSecret({ length: 32 });

        // Save the new secret to the user's record
        user.twoFactorSecret = newSecret.base32;
        await user.save();

        // Generate a QR code URL
        const otpauthUrl = speakeasy.otpauthURL({
            secret: newSecret.ascii,
            label: encodeURIComponent(`Skopoos:${user.email}`),
            algorithm: "sha1",
        });

        res.json({
            message: "2FA has been reset. Please set up your authenticator app with the new secret.",
            secret: newSecret.base32,
            otpauthUrl: otpauthUrl,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const test = async(req, res) => {
    try {
        const testSecret = speakeasy.generateSecret({ length: 32 });
        const testToken = speakeasy.totp({
            secret: testSecret.base32,
            encoding: "base32",
        });
        console.log(testToken);
        const testVerified = speakeasy.totp.verify({
            secret: testSecret.base32,
            encoding: "base32",
            token: testToken,
        });
        console.log("Test verification:", testVerified);
        return res.status(200).json({ message: "Token is verified" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Chenge the password
// recive the new password and the token

const changePassword = async(req, res) => {
    try {
        const { token, new_password } = req.body;

        // Verify the token
        if (!new_password)
            return res.status(401).json({ message: "Your password is required." });
        const tokenPayload = verifyToken(token);
        if (!tokenPayload) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const { userEmail } = tokenPayload;

        // Find the user by userId
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Delete the OTP record (if it exists)
        await OTP.findOneAndDelete({ userEmail, reason: "passwordReset" });

        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Log out user no function yest for that

const logout = async(req, res) => {
    const userId = req.user._id;
    try {
        const session = await Session.findOneAndDelete({ userId });
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        const user = await User.findByIdAndUpdate({
            _id: userId,
            $set: {
                online: false
            }
        });
        res.cookie("sessionId", "", {
            httpOnly: true,
            sameSite: "strict",
            secure: true,
            maxAge: 1,
        });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// send activation mails
const sendActivationMail = async(req, res) => {
    try {
        const { email } = req.user;

        //Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not Found" });
        }
        //Generate Token with user Id
        const activationToken = generateAccessToken(user._id);

        // Construct activation link
        const activationLink = `
                            $ { process.env.BASE_URL }
                            /activate?token=${activationToken}`;

        // Send activation email
        try {
            const subject = "Account Activation";
            const mailRecipient = user.email;
            const mailSender = "noreply@skopoos.com";
            const mailContent = activationMail({
                first_name: user.first_name,
                activation_link: activationLink,
            });
            await sendMail(mailRecipient, subject, mailContent, mailSender);
        } catch (error) {
            console.log("Error sending activation email:", error);
        }

        await sendMail(mailRecipient, title, mailContent);
        console.log("Activation email sent successfully");

        res.status(200).json({ message: "Activation email sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

const activateAccount = async(req, res) => {
    try {
        const { token } = req.body;

        // Verify activation token
        const tokenPayload = verifyToken(token);
        if (!tokenPayload) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const { userId } = tokenPayload;

        // Find user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Activate the user's account
        user.verified = true;
        await user.save();

        res.status(200).json({ message: "Account activated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    register,
    login,
    logout,
    findAccount,
    changePassword,
    confirmVerificationCode,
    sendActivationMail,
    activateAccount,
    sendOtpMail,
    savePhraseKey,
    enable2fa,
    verify2fa,
    test,
    reset2FA,
    phraseKeyAuth,
};