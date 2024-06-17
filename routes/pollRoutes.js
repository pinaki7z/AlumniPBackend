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
      groupID
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

module.exports = pollRoutes;
