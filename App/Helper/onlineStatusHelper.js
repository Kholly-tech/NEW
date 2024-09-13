const User = require("../Models/UserModel");

const updateOnlineStatus = async (userId, status) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      user.online = status;
      await user.save();
      console.log(`User ${user.username} online status updated to ${status}`);
    } catch (err) {
      console.error('Error updating online status:', err);
      throw err;
    }
  };
  
const updateOfflineStatus = updateOnlineStatus;

module.exports = { updateOnlineStatus, updateOfflineStatus }