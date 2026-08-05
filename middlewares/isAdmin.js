export const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role === 'ADMIN') {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Admins Only",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}