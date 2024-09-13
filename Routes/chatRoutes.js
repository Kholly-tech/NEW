const express = require('express');
const router = express.Router();
const chatController = require("../App/Controller/ChatController");

// router.post('/send', chatController.saveMessage);
router.get('/:senderId/:receiverId', chatController.getChats);
// router.put('/update', chatController.updateChat);
// router.delete('/delete/:chatId', chatController.deleteChat);

module.exports = router;