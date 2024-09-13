const fs = require("fs");

const uploadMediaMiddleware = async(req, res, next) => {
    try {
        console.log(req.files);
        // Check if any file is sent
        if (!req.files || Object.values(req.files).flat().length === 0) {
            return res.status(400).json({ msg: "Media file is required" });
        }

        let files = Object.values(req.files).flat();

        files.forEach((file) => {
            // Check file size
            if (file.size > 1024 * 1024 * 60) {
                removeTmp(file.tempFilePath);
                return res.status(400).json({ msg: "File size is too large" });
            }

            // Check file type
            if (!(
                    file.mimetype.startsWith("image/") ||
                    file.mimetype.startsWith("video/") ||
                    file.mimetype.startsWith("audio/") ||
                    file.mimetype.startsWith("file/") ||
                    file.mimetype.startsWith("application/")
                )) {
                removeTmp(file.tempFilePath);
                return res.status(400).json({ msg: "File format is not supported" });
            }
        });

        next();
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

const removeTmp = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) throw err;
    });
};

module.exports = { uploadMediaMiddleware };