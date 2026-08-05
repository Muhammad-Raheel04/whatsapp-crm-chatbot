import { prisma } from '../config/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All feilds are required',
            });
        }

        const existingUser = await prisma.users.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Account for this email already exist',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        return res.status(201).json({
            success: true,
            message: 'User Created Successfully',
            user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing',
            });
        }

        const user = await prisma.users.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Password',
            });
        }
        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN, {
            expiresIn: '1h',
        });
        const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN, {
            expiresIn: '1w',
        });

        await prisma.sessions.create({
            data: {
                refreshToken,
                user_id: user.id,
            },
        }),


            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

        return res.status(200).json({
            success: true,
            message: 'Login Successfully',
            user,
            accessToken
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(404).json({
                success: false,
                message: 'Refresh Token is Required',
            });
        }

        await prisma.sessions.delete({
            where: {
                refreshToken,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Logged Out Successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh Token is required',
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Expired Refresh Token',
            });
        }

        const session = await prisma.sessions.findUnique({
            where: {
                refreshToken,
            },
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session Not Found',
            });
        }

        const newAccessToken = jwt.sign(
            { id: decoded.id },
            process.env.ACCESS_TOKEN,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Session Refreshed Successfully',
            accessToken: newAccessToken,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};