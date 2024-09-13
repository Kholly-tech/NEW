const {
    uploadFile,
    downloadFile,
    listFiles,
    deleteFile,
} = require("../Helper/storageService");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Media = require("../Models/MediaModel");
const { User } = require("../Models");
const uuid = require('uuid');

// Configure Cloudinary to upload
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToAw = async(req, res) => {
    try {
        const { path } = req.body;
        let files = Object.values(req.files).flat();
        let medias = [];
        for (const file of files) {
            let retries = initialRetries = 3; // Number of retry attempts
            while (retries > 0) {
                try {
                    // Upload file to Cloudinary with appropriate resource type
                    const result = await cloudinary.uploader.upload(file.tempFilePath, {
                        folder: path, // Optional folder path in Cloudinary
                        timeout: 600000, // Increase timeout value
                        resource_type: file.mimetype.startsWith("video/") ?
                            "video" : file.mimetype.startsWith("image/") ?
                            "image" : file.mimetype.startsWith("file/") ?
                            "file" : file.mimetype.startsWith("application/") ?
                            "raw" : file.mimetype.startsWith("audio/") ?
                            "video" : "auto", // Set resource type based on file type
                    });

                    // Add metadata to the medias array
                    medias.push({
                        type: file.mimetype.startsWith("video/") ?
                            "video" : file.mimetype.startsWith("image/") ?
                            "image" : file.mimetype.startsWith("file/") ?
                            "file" : file.mimetype.startsWith("application/") ?
                            "raw" : file.mimetype.startsWith("audio/") ?
                            "audio" : "auto",
                        url: result.secure_url,
                    });

                    // Remove temporary file
                    removeTmp(file.tempFilePath);

                    // Break out of retry loop if upload succeeds
                    break;
                } catch (err) {
                    console.log(`Error uploading media: ${err.message}`);
                    retries--; // Decrement retry count
                    if (retries === 0) {
                        throw new Error(
                            `Failed to upload file after ${initialRetries} attempts`
                        );
                    }
                    // Wait for a brief period before retrying
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }
            }
        }

        // Return the uploaded media URLs
        res.status(200).json({ medias: medias });
    } catch (err) {
        console.log(`Error uploading media: ${err.message}`);
        res.status(500).json({ msg: `Error uploading media: ${err.message}` });
    }
};

const uploadMedia = async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not Found' });
        }
        const userId = user._id;
        const { path } = req.body;
        let files = Object.values(req.files).flat();
        let medias = [],
            realMedias = [],
            key;
        for (const file of files) {
            let retries = initialRetries = 5; // Number of retry attempts
            let completeRetries = 0; // Counter for complete retries
            while (retries > 0) {
                let data;
                try {
                    // Upload file to AWS S3
                    const uniqueFilename = `${uuid.v4()}_${Date.now()}.${file.mimetype.split('/')[1]}`;
                    if (path) {
                        key = `${path}/${uniqueFilename}`;
                    } else {
                        key = `${userId}/${uniqueFilename}`;
                    }

                    console.log(key);
                    completeRetries++;
                    await uploadFile(file, key, )
                        .then(result => {
                            data = result;
                            console.log(data);
                        })
                        .catch(err => {
                            console.log(err);
                            throw new Error(
                                `Failed to upload file after ${completeRetries} attempts`
                            );
                        })

                    medias.push({
                        type: file.mimetype.startsWith("video/") ?
                            "video" : file.mimetype.startsWith("image/") ?
                            "image" : file.mimetype.startsWith("file/") ?
                            "file" : file.mimetype.startsWith("application/") ?
                            "raw" : file.mimetype.startsWith("audio/") ?
                            "audio" : "auto",
                        key: key,
                        url: data.myCustomUrl,
                    });

                    // Remove temporary file
                    removeTmp(file.tempFilePath);

                    // Break out of retry loop if upload succeeds
                    break;
                } catch (err) {
                    console.log(`Error uploading media: ${err.message}`);
                    retries--; // Decrement retry count
                    if (retries === 0) {
                        throw new Error(
                            `Failed to upload file after ${initialRetries} attempts`
                        );
                    }
                    // Wait for a brief period before retrying
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }
            }
        }

        for (let med of medias) {
            const newMedia = new Media(med);
            await newMedia.save();
            realMedias.push({ _id: newMedia._id, url: med.url });
        }

        // Return the uploaded media URLs
        res.status(200).json({ medias: realMedias });
    } catch (err) {
        console.log(`Error uploading media: ${err.message}`);
        res.status(500).json({ message: `Error uploading media: ${err.message}` });
    }
}

const removeTmp = (file) => {
    fs.unlink(file, (err) => {
        if (err) throw err;
    });
};







module.exports = {
    uploadMedia,
    // uploadToAws,
};