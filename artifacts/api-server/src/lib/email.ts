import { Resend } from "resend";
import { logger } from "./logger.js";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn({ email, token }, "RESEND_API_KEY not set. Simulate sending reset email.");
    return;
  }

  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: "Elite Da Parfum <noreply@elitedaparfum.com>",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; max-w-2xl; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Elite Da Parfum</h1>
          <p>Hello,</p>
          <p>You requested a password reset for your account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #d4af37; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="color: #666; font-size: 12px; text-align: center;">Elite Da Parfum</p>
        </div>
      `,
    });
    logger.info({ email }, "Password reset email sent");
  } catch (err) {
    logger.error({ err, email }, "Failed to send password reset email");
    throw err;
  }
}
