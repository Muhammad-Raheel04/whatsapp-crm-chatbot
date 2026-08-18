const otpEmailTemplate = (name, otp) => {
    return `
        <h2>Hello ${name}</h2>
        <p>Your OTP to reset your password is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
    `;
};

export default otpEmailTemplate;