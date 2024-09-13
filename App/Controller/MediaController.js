const Media = require('../Models/MediaModel');

exports.getMedia = async(req, res) => {
    try {
        const mediaId = req.params.id;
        const media = await Media.findById(mediaId);
        if (!media) return res.status(404).json({ message: 'Media Not Found!!' });

        res.status(200).json(media)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};