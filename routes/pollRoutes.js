const express = require("express");
const Poll = require("../models/poll");

const pollRoutes = express.Router();

pollRoutes.post("/createPoll", async (req, res) => {
  const { userId, question, userName, options, profilePicture,groupID } = req.body;

  if (!question || !options) {
    return res
      .status(400)
      .json({ error: "Poll question and at least 2 options are required." });
  }

  try {
    const newPoll = new Poll({
      userId,
      question,
      userName,
      options,
      type: "poll",
      profilePicture,
      groupID,
      archive: false
    });

    const savedPoll = await newPoll.save();
    res.status(201).json(savedPoll);
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: "Server error" });
  }
});

pollRoutes.get("/", async (req, res) => {
  try {
    const polls = await Poll.find();
    res.status(200).json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ message: "Error fetching polls" });
  }
});

pollRoutes.put("/:_id", async (req, res) => {
  try {
    const { userId, optionId, userName, profilePicture } = req.body;
    const pollId = req.params._id;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(404).json({ message: "Option not found" });
    }

    const userAlreadyVoted = poll.options.some((option) =>
      option.votes.some((vote) => vote.userId === userId)
    );

    if (userAlreadyVoted) {
      return res
        .status(400)
        .json({ message: "User has already voted for this option" });
    }

    option.votes.push({ userId, userName, profilePicture });

    await poll.save();

    res.status(200).json({ message: "Vote submitted successfully", poll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

pollRoutes.put("/:_id/editPoll", async (req, res) => {
  const { userId, question, userName, options, profilePicture, groupID } = req.body;
  const pollId = req.params._id;

  try {
    const poll = await Poll.findById(pollId);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    
    if (poll.userId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to edit this poll" });
    }


    poll.question = question;
    poll.userName = userName;
    poll.options = options;
    poll.profilePicture = profilePicture;
    poll.groupID = groupID;


    const updatedPoll = await poll.save();

    return res.status(200).json({ message: "Poll updated successfully", poll: updatedPoll });
  } catch (error) {
    console.error("Error updating poll:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pollRoutes.put('/:_id/archive', async (req, res) => {
  const { _id } = req.params;

  try {
  
      const poll = await Poll.findById(_id);

      if (!poll) {
          return res.status(404).json({ message: 'Poll not found' });
      }

      
      if (typeof poll.archive === 'undefined') {
        poll.archive = true;
    } else {
        poll.archive = !poll.archive;
    }


      await poll.save();

    
      res.status(200).json(poll);
  } catch (error) {
      console.error('Error archiving/unarchiving post:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = pollRoutes;
