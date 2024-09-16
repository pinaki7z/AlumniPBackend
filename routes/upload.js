const express = require("express");
const upload = require("../services/upload");

const uploadRoutes = express.Router();



uploadRoutes.post('/image', upload.single('image'), (req, res) => {
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.send(fileUrl);
});

module.exports = uploadRoutes