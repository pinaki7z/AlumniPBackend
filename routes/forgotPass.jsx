// Inside your controller or route handler
const sendEmail = require('../email/emailConfig')
const router = express.Router();


router.post("/", async (req, res) => {
    try {
        await sendEmail(
          email,                // Recipient email
          'forgotPassword',     // Template name
          { name, resetLink },  // Dynamic data
          'Password Reset Request' // Subject
        );
        res.status(200).json({ success: true, message: 'Password reset email sent!' });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Error sending email' });
      }
  });

module.exports =router
 