import { getMetaTokenStatus } from "../services/metaTokenStatusService.js";

export const getMetaStatus = async (req, res) => {
    try {
        const status = await getMetaTokenStatus()
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({
            valid: false,
            message: "Failed to check token status.",
            error: error.message,
        });
    }
};