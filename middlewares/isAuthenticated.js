import jwt from 'jsonwebtoken';

export const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Headers missing",
            })
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Access Token Expired"
                })
            }
            return res.status(401).json({
                success: false,
                message: "Access Token is missing or Invalid"
            })
        }
        req.user = {
            id: decoded.id
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}