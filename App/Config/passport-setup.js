require("dotenv").config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../Models/UserModel');
const {
    generateToken,
    verifyToken,
    sendMail,
    generateUsername,
} = require("../Helper");

passport.use(
    new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.CALLBACK_URL}/auth/google/callback`, // ${process.env.LOCAL_URL}/auth/google/callback
            scope: ['profile', 'email']
        },
        async function(accessToken, refreshToken, profile, cb) {
            try {
                let token, user;
                const email = profile._json.email;
                console.log(email);
                const existingEmail = await User.findOne({ email })
                if (existingEmail) {
                    console.log("User already exists");
                    // token = generateToken({ userId: existingEmail._id });
                    user = existingEmail;
                } else {
                    console.log(profile._json)
                    first_name = profile._json.given_name;
                    last_name = profile._json.family_name || "None";

                    let tempUsername = first_name + last_name;
                    const newUsername = await generateUsername(tempUsername);

                    const userPin = Math.floor(1000 + Math.random() * 9000).toString();
                    const hashedUserPin = await bcrypt.hash(userPin, 10);

                    user = await User.create({
                        email,
                        first_name,
                        last_name,
                        picture: profile._json.picture,
                        googleId: profile.id,
                        username: newUsername,
                        securePin: hashedUserPin,
                        verified: true,
                    });
                    // token = generateToken({ userId: user._id });
                }

                // Prepare user data to send back
                const userData = {
                    id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    cover: user.cover,
                    username: user.username,
                    picture: user.picture,
                };
                console.log(userData, );
                return cb(null, { user: userData });
            } catch (error) {
                return cb(error, null);
            }
        }
    ));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});