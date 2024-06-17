const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const verifyToken = require("../utils");
const checkProfileLevel = require("../middleware/checkProfileLevel");
const Post = require("../models/post");
const Alumni = require("../models/Alumni");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const url = require("url");
const Job = require("../models/job");
const Poll = require("../models/poll");
const Event = require("../models/Events");

const postRoutes = express.Router();

const mergeSortAndPaginate = async (page, size) => {
  const skip = (page - 1) * size;

  const allPosts = await Post.find({ groupID: { $exists: false } }).sort({ createdAt: -1 });
  const allJobs = await Job.find({ groupID: { $exists: false } }).sort({ createdAt: -1 });
  const allPolls = await Poll.find({ groupID: { $exists: false } }).sort({ createdAt: -1 });
  const allEvents = await Event.find().sort({ createdAt: -1 });
  const combinedRecords = [...allPosts, ...allJobs, ...allPolls,...allEvents]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, skip + size);

  const paginatedRecords = combinedRecords.slice(skip, skip + size);
  return paginatedRecords;
};



const mergeSortAndPaginateUser = async (page,size,id) => {
  const skip = (page - 1) * size;
  const allPosts = await Post.find({ userId: id }).sort({ createdAt: -1 });
  const allJobs = await Job.find({ userId: id }).sort({ createdAt: -1 });
  const allPolls = await Poll.find({ userId: id } ).sort({ createdAt: -1 });
  const totalPosts = allPosts + allJobs + allPolls;
  const combinedRecords = [...allPosts, ...allJobs, ...allPolls]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, skip + size); 
    const paginatedRecords = combinedRecords.slice(skip, skip + size);   
    return {paginatedRecords, totalPosts};
}





const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folderName = req.query.folder || "default";
    const uploadPath = path.join(
      "D:/test/AlumniFrontend/New folder/public/uploads",
      folderName
    );
    console.log("uploadpath:", uploadPath);

    try {
      await fs.promises.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    // const uniqueFilename = Date.now() + "-" + file.originalname;
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

postRoutes.post("/create", upload.single("videoPath"), async (req, res) => {
  try {
    const { userId, description,picturePath,groupID,profilePicture } = req.body;
    const folderName= req.query.folder;
    const alumni = await Alumni.findById(userId);
    let videoPath = null;
 
    if (req.file) {
      videoPath = {
        videoPath: `http://localhost:3000/uploads/${folderName}/${req.file.originalname}`,
        name: req.file.filename,
      };
    }

    const newPost = new Post({
      userId,
      firstName: alumni.firstName,
      lastName: alumni.lastName,
      location: alumni.location,
      picturePath,
      profilePicture,
      description,
      videoPath,
      groupID,
      likes: [],
      comments: [],
      type: 'Post'
    });
    await newPost.save();

    const post = await Post.find();
    res.status(201).json(post);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
});

postRoutes.get("/:_id", async (req, res) => {
  try {
    const post = await Post.findById(req.params._id);

    if (!post) {
      console.error("No such post");
      return res.status(404).send("post not found");
    }

    res.status(200).json(post);
  } catch (err) {
    return res.status(400).send(err);
  }
});

postRoutes.get('/', async (req, res) => {
  try {
    const size = parseInt(req.query.size) || 4; 
    const page = parseInt(req.query.page) || 1; 

    const totalPost = await Post.countDocuments();
    const totalJob = await Job.countDocuments();
    const totalPoll = await Poll.countDocuments();
    const totalEvent = await Event.countDocuments();

    const combinedRecords = await mergeSortAndPaginate(page, size);

    res.json({
      records: combinedRecords,
      total: totalPost+totalJob+totalPoll+totalEvent,
      size,
      page,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
});

postRoutes.put("/:_id", async (req, res) => {
  const updatedData = req.body;

  try {
    const post = await Post.findById(req.params._id);

    if (!post) {
      console.error("No such post");
      return res.status(404).send("post not found");
    }
    Object.assign(post, updatedData);
    await post.save();

    return res.status(200).send("post updated successfully");
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).send("Internal Server Error");
  }
});

postRoutes.delete("/:_id", async (req, res) => {
  const { _id } = req.params; 

  try {
    const deletedPost = await Post.findOneAndDelete({ _id });

    if (!deletedPost) {
      console.error("No such Post");
      return res.status(404).send("Post not found");
    }

    return res.status(200).send("Post deleted successfully");
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).send("Internal Server Error");
  }
});

postRoutes.delete("/", async (req, res) => {
  try {
    await Post.deleteMany({});
    res.status(200).json({message: "All posts deleted successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "An error occurred"});
  }
});

postRoutes.patch("/:_id/likes", async (req, res) => {
  try {
    const { _id } = req.params;
    const { userId, userName } = req.body;

    const post = await Post.findById(_id);
    const isLiked = post.likes.some((like) => like.userId === userId);

    if (isLiked) {
      post.likes = post.likes.filter((like) => like.userId !== userId);
    } else {
      post.likes.push({ userId, userName });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      _id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

postRoutes.post("/:_id/comments", async (req, res) => {
  try {
    const { _id } = req.params;
    const { userId, content, userName, parentCommentId,profilePicture } = req.body;

    
    const post = await Post.findById(_id);
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    const newComment = { userId, content, userName,profilePicture };

    
    const findCommentById = (commentId, commentsArray) => {
      for (const comment of commentsArray) {
        if (comment._id.equals(commentId)) {
          return comment;
        }
        if (comment.comments.length > 0) {
          const foundComment = findCommentById(commentId, comment.comments);
          if (foundComment) {
            return foundComment;
          }
        }
      }
      return null;
    };

    if (parentCommentId === null) {
     
      post.comments.push(newComment);
    } else {
      
      const parentComment = findCommentById(parentCommentId, post.comments);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      parentComment.comments.push(newComment);
    }

    
    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRoutes.get("/:_id/comments", async (req, res) => {
  try {
    const postId = req.params._id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ comments: post.comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

postRoutes.delete("/:_id/comments/:comment_id", async (req, res) => {
  try {
    const { _id, comment_id } = req.params;

    // Find the post by ID
    const post = await Post.findById(_id);
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }
    
    const findCommentById = (commentId, commentsArray) => {
      for (let i = 0; i < commentsArray.length; i++) {
        const comment = commentsArray[i];
        if (comment._id.equals(commentId)) {
          return commentsArray.splice(i, 1); 
        }
        if (comment.comments.length > 0) {
          const foundComment = findCommentById(commentId, comment.comments);
          if (foundComment) {
            return foundComment;
          }
        }
      }
      return null;
    };

    
    findCommentById(comment_id, post.comments);

   
    const updatedPost = await post.save();

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

postRoutes.get("/userPosts/:_id", async (req, res) => {
  const { _id } = req.params;
  const size = parseInt(req.query.size) || 4; 
  const page = parseInt(req.query.page) || 1; 

  try {
    const { paginatedRecords, totalPosts } = await mergeSortAndPaginateUser(page,size,_id);

    res.status(200).json({
      records: paginatedRecords,
      total: totalPosts,
      size,
      page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = postRoutes;
