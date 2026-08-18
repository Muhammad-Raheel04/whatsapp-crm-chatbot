import client from "../config/brevo.js";
import otpEmailTemplate from "../templates/otpTemplate.js";

export const sendOtpEmail = async (name, email, otp) => {
    await client.transactionalEmails.sendTransacEmail({
        sender: {
            name: process.env.BREVO_SENDER_NAME,
            email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email, name }],
        subject: "Password Reset OTP",
        htmlContent: otpEmailTemplate(name,otp),
    })
}