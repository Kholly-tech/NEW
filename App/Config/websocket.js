const io = require('socket.io')();
const User = require("../Models/UserModel");
const { updateOnlineStatus, updateOfflineStatus } = require("../Helper/onlineStatusHelper");
const { getChats, saveMessage, updateChat, deleteChat } = require("../Controller/ChatController");

let connectedUsers = [];

module.exports = function(io) {
    // Listen for socket connections
    io.on('connection', (socket) => {
        console.log(`User ${socket.id} connected`);

        // Handle user online/offline events
        socket.on('user_online', async(userId) => {
            connectedUsers.push(userId);


            try {
                const user = await User.findById(userId);
                if (!user) {
                    console.log(`User ${userId} not found`);
                    return;
                }

                // Broadcast user online status to other connected users
                socket.broadcast.emit(`${user.username} is online.`);

                // Update user's online status in the database
                await updateOnlineStatus(userId, true);
            } catch (err) {
                console.error('Error updating online status:', err);
            }
            console.log(connectedUsers);
        });

        socket.on('user_offline', async(userId) => {
            connectedUsers = connectedUsers.filter((id) => id !== userId);

            try {
                const user = await User.findById(userId);
                if (!user) {
                    return;
                }

                // Broadcast user offline status to other connected users
                socket.broadcast.emit(`${user.username} has gone offline.`);
                // Update user's online status in the database
                await updateOfflineStatus(userId, false);
            } catch (err) {
                console.error('Error updating offline status:', err);
            }
            console.log(connectedUsers);
        });

        // Listen for user Message events
        socket.on('message', async(data) => {
            console.log('Received message data:', data);

            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Error parsing message data:', e);
                    return;
                }
            }

            const { message, senderId, receiverId } = data;

            if (!message || !senderId || !receiverId) {
                console.error('Missing required fields in message data');
                return;
            }

            try {
                const savedMessage = await saveMessage(message, senderId, receiverId);
                console.log('Saved message:', savedMessage);

                // Emit the message to the sender and receiver
                socket.emit('message', savedMessage);
                socket.to(receiverId).emit('message', savedMessage);
            } catch (err) {
                console.error('Error processing message:', err);
            }
        });

        socket.on('edit', async(data) => {
            // console.log('Received edit data:', data);

            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Error parsing edit data:', e);
                    return;
                }
            }

            const { message, chatId, senderId } = data;

            if (!message || !chatId || !senderId) {
                console.error('Missing required fields in edit data');
                return;
            }

            try {
                const editedMessage = await updateChat(message, chatId, senderId);
                // console.log('Edited message:', editedMessage);

                // Emit the message to the sender and receiver
                socket.emit('edit', editedMessage);
                socket.to(editedMessage.receiverId).emit('edit', editedMessage);
            } catch (err) {
                console.error('Error processing edit:', err);
            }
        });

        socket.on('delete', async(data) => {
            // console.log('Received delete data:', data);
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Error parsing delete data:', e);
                    return;
                }
            }

            const { chatId, senderId } = data;
            if (!chatId || !senderId) {
                console.error('Missing required fields in delete data');
                return;
            }

            try {
                const deletedMessage = await deleteChat(chatId, senderId);
                // console.log('Deleted message:', deletedMessage);

                // Emit the message to the sender and receiver
                socket.emit('delete', deletedMessage);
                socket.to(deletedMessage.receiverId).emit('delete', deletedMessage);
            } catch (err) {
                console.error('Error processing delete:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.id} disonnected`);
        });
    });
}