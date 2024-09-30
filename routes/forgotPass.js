const bcrypt = require('bcryptjs');
const Alumni = require('../models/Alumni'); // Assuming this is the Alumni model
const sendEmail = require('../email/emailConfig');
const express = require('express');
const router = express.Router();

router.post("/", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await Alumni.findOne({ email }); 

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a bcrypt hashed token using user's email
    const salt = await bcrypt.genSalt(10);
    const resetToken = await bcrypt.hash(user.email, salt);

    // Encode the reset token to be URL-friendly
    const encodedToken = encodeURIComponent(resetToken);

    // Create the reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${user._id}/${encodedToken}`;

    // Send email with the reset link
    await sendEmail(user.email, 'FORGET_PASS', { name: user.firstName, resetLink }, 'Password Reset Request');

    res.status(200).json({ success: true, message: 'Password reset email sent!',resetLink });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
