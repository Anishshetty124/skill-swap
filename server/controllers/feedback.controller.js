import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Feedback } from '../models/feedback.model.js';
import sgMail from '@sendgrid/mail';

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

  const emailMsg = {
    to: 'anishshetty124@gmail.com', 
    from: 'codex.5342@gmail.com', 
    subject: `New Feedback Received: [${feedbackType.toUpperCase()}]`,
    html: `
      <h2>New Feedback Submitted</h2>
      <p><strong>User:</strong> ${req.user ? req.user.username : 'Anonymous'}</p>
      <p><strong>Type:</strong> ${feedbackType}</p>
      <hr>
      <p><strong>Message:</strong></p>
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