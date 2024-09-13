require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const passport = require("passport");
const requestIp = require('request-ip');
require("./App/Config/passport-setup");
const cookieSession = require("cookie-session");
const session = require('express-session');
const crypto = require('crypto');

// Import routes
const authRoutes = require("./Routes/authRoutes");
const userRoute = require("./Routes/userRoutes");
const uploadMedia = require("./Routes/uploadRoutes");
const locationRoute = require("./Routes/locationRoutes");
const momentRoute = require("./Routes/momentRoutes");
const postRoute = require("./Routes/postRoutes");
const reportRoute = require("./Routes/reportRoutes");
const commentRoute = require("./Routes/commentRoutes");
const communityRoute = require("./Routes/communityRoutes");
const settingsRoute = require("./Routes/settingsRoutes");
const forumRoute = require("./Routes/forumRoutes");
const topicRoute = require("./Routes/topicRoutes");
const reelRoute = require("./Routes/reelRoutes");
const chatRoute = require("./Routes/chatRoutes");
const mediaRoutes = require("./Routes/mediaRoutes");

// Import Middleware


// Create an instance for express application
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "*", // Be more specific in production
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(morgan("dev"));
app.use(requestIp.mw());
app.use(
    cookieSession({
        name: "session",
        keys: ["skopoos"],
        maxAge: 24 * 60 * 60 * 100,
    })
);
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS for specific origin
app.use(
    cors({
        origin: [
            process.env.CLIENT_URL,
            process.env.TEMP,
        ], //
        credentials: true,
    })
);
app.use(bodyParser.json({ limit: "50mb" }));
// Increase limit for URL-encoded bodies
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// Note that this option available for versions 1.0.0 and newer.
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

// Using Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoute);
app.use("/api/moment", momentRoute);
app.use("/api/uploadMedia", uploadMedia);
app.use("/api/location", locationRoute);
app.use("/api/post", postRoute);
app.use("/api/comment", commentRoute);
app.use("/api/community", communityRoute);
app.use("/api/report", reportRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/forum", forumRoute);
app.use("/api/topic", topicRoute);
app.use("/api/reel", reelRoute);
app.use("/api/chat", chatRoute);
app.use("/api/media", mediaRoutes);

// Replace your existing Socket.IO setup with this:
require("./App/Config/websocket")(io);

// Configuration for database and port connection
const port = process.env.PORT;
mongoose
    .connect(process.env.DATABASE_URL, {})
    .then(() => {
        console.log("Database connection established");
        // console.log("Crypto", crypto.randomBytes(32).toString('hex'));
        http.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log("Error connecting to the database", err.message);
    });