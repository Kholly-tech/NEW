const Location = require("../Models/LocationModel");
const { saveNotification } = require("../Helper/notificationHelper");

const createLocation = async (req, res) => {
    try {
        const location = new Location({
            ...req.body,
            userId: req.user._id
        });
        await location.save();
        const notification = await saveNotification(req.user._id, Date.now(), `${req.user.username} created a new location`, "New Location", `/locations/${location._id}`);
        // console.log(notification);
        res.status(201).send(location._id);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

module.exports = {
    createLocation
}