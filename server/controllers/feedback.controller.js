import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Feedback } from '../models/feedback.model.js';
import sgMail from '@sendgrid/mail';
import { User } from '../models/user.model.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const submitFeedback = asyncHandler(async (req, res) => {
  const { feedbackType, message } = req.body;
  const userId = req.user?._id; 

  if (!feedbackType || !message) {
    throw new ApiError(400, "Feedback type and message are required.");
  }

   await Feedback.create({
     userId,
     feedbackType,
     message,
    });
    
    let userDetails = "Anonymous User";
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userDetails = `
        <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Swap Credits:</strong> ${user.swapCredits}</p>
        <p><strong>Report Count:</strong> ${user.reportCount}</p>
      `;
    }
  }
  
  const emailMsg = {
    to: 'anishshetty124@gmail.com',
    from: 'codex.5342@gmail.com', 
    subject: `New Feedback Received: [${feedbackType.toUpperCase()}]`,
    html: `
      <h2>New Feedback Submitted</h2>
      <hr>
      <h3>User Details:</h3>
      ${userDetails}
      <hr>
      <h3>Message:</h3>
      <p>${message}</p>
    `,
  };
  try {
    await sgMail.send(emailMsg);
  } catch (error) {
    console.error("SendGrid Error (Feedback):", error);
  }

  return res.status(201).json(new ApiResponse(201, {}, "Thank you for your feedback!"));
});

export { submitFeedback };