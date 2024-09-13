const Notification = require("../Models/NotificationModel");

const saveNotification = async(userId, description, title, link) => {
    console.log(userId, description, title, link);
    const newNotification = new Notification({
        userId,
        description,
        title,
        link
    });
    await newNotification.save();
    return newNotification;
};

module.exports = { saveNotification }