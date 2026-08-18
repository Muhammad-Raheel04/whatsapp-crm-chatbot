import validator from 'validator';
import redisConnection from '../config/redis.js';

export const validateOTP = async (req, res, next) => {
    const { email, otp } = req.body;

    if (!otp || !email) {
        return res.status(400).json({
            success: false,
            message: "All field are required",
        })
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Email Format"
        })
    }

    const storedOtp = await redisConnection.get(`otp:${email}`);
    if (!storedOtp) {
        return res.status(400).json({
            success: false,
            message: "otp expired or not found",
        })
    }

    if (storedOtp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP",
        })
    }

    await redisConnection.del(`otp:${email}`);
    
    next();
}