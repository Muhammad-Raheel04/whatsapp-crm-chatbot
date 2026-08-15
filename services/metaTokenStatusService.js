import axios from "axios";
import { getMetaWaToken } from "./metaWaTokenService.js";

export const getMetaTokenStatus = async () => {
    const token = await getMetaWaToken();

    try {
        await axios.get(`https://graph.facebook.com/v22.0/me`, {
            params: { access_token: token }
        });

        return {
            valid: true,
            message: "Meta access token is valid."
        };
    } catch (error) {
        const errorData = error.response?.data?.error;
        const isAuthError = errorData?.code === 190 || errorData?.type === "OAuthException";

        return {
            valid: !isAuthError,
            message: isAuthError
                ? "Meta access token has expired or is invalid."
                : "Could not verify Meta access token (non-auth error)."
        };
    }
};