const express = require("express");
const router = express.Router();
const Message = require("../schemas/messages");

//////////////////////////////////////////////////

router.get("/:userID", async (req, res) => {
  try {
    const currentUser = req.user.id;
    const otherUser = req.params.userID;

    const messages = await Message.find({
      $or: [
        { from: currentUser, to: otherUser },
        { from: otherUser, to: currentUser },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//////////////////////////////////////////////////

router.post("/:userID", async (req, res) => {
  try {
    const currentUser = req.user.id;
    const toUser = req.params.userID;

    let messageContent;

    if (req.body.file) {
      messageContent = {
        type: "file",
        text: req.body.file,
      };
    } else {
      messageContent = {
        type: "text",
        text: req.body.text,
      };
    }

    const newMessage = new Message({
      from: currentUser,
      to: toUser,
      messageContent,
    });

    await newMessage.save();

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const currentUser = req.user.id;

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ from: currentUser }, { to: currentUser }],
        },
      },
      {
        $addFields: {
          user: {
            $cond: [
              { $eq: ["$from", currentUser] },
              "$to",
              "$from",
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          lastMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;