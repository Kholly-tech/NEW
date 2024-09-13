const Chat = require("../Models/ChatModel");

exports.saveMessage = async (
  message,
  senderId,
  receiverId
) => {
  console.log("Saving message:", {
    message,
    senderId,
    receiverId,
  });

  if (!message || !senderId || !receiverId) {
    console.error("Missing required fields:", {
      message,
      senderId,
      receiverId,
    });
    throw new Error("Missing required fields");
  }

  const chat = new Chat({
    message,
    sender: senderId,
    receiver: receiverId,
  });

  try {
    const savedMessage = await chat.save();
    console.log(
      "Message saved successfully:",
      savedMessage
    );
    return savedMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    throw new Error("Error saving message");
  }
};


// getChats

exports.getChats = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { senderId, receiverId } = req.params;

  try {
    const chats = await Chat.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    })
      .populate(
        "sender",
        "_id username first_name last_name"
      )
      .populate(
        "receiver",
        "_id username first_name last_name"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .lean()
      .exec();

    const totalChats = await Chat.countDocuments({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    res.status(200).json({
      chats,
      totalChats,
      currentPage: page,
      totalPages: Math.ceil(totalChats / limit),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error getting chats" });
  }
};

exports.updateChat = async (message, chatId, senderId) => {
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      sender: senderId,
    });
    if (!chat) {
      throw new Error("Message not found");
    }
    if (chat.sender.toString() !== senderId) {
      throw new Error("Unauthorized");
    }

    await Chat.findByIdAndUpdate(chatId, {
      $set: { message },
    });
    const updatedMessage = await Chat.findById(chatId);

    console.log(
      "Message updated successfully:",
      updatedMessage
    );
    return updatedMessage;
  } catch (error) {
    console.error("Error Updating message:", error);
    throw new Error("Error saving message");
  }
};

exports.deleteChat = async (chatId, senderId) => {
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      sender: senderId,
    });
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.sender.toString() !== senderId) {
      throw new Error("Unauthorized");
    }

    await Chat.deleteOne({ _id: chatId });
    const deletedMessage = await Chat.findById(chatId);

    console.log(
      "Message deleted successfully:",
      deletedMessage
    );
    return deletedMessage;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw new Error("Error deleting message");
  }
};
