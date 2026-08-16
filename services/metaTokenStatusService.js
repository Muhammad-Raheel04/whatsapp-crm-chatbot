import axios from "axios";
import { getMetaWaToken } from "./metaWaTokenService.js";

const CACHE_TTL_MS = 60 * 1000;
let _cachedStatus = null;
let _cacheTimestamp = 0;

export const getMetaTokenStatus = async (options = {}) => {
    const { force = false } = options;

    if (!force && _cachedStatus !== null && (Date.now() - _cacheTimestamp) < CACHE_TTL_MS) {
        return _cachedStatus;
    }

    const token = await getMetaWaToken();
    let result;

    try {
        await axios.get(`https://graph.facebook.com/v22.0/me`, {
            params: { access_token: token }
        });

        result = {
            valid: true,
            message: "Meta access token is valid."
        };
    } catch (error) {
        const errorData = error.response?.data?.error;
        const isAuthError = errorData?.code === 190 || errorData?.type === "OAuthException";
        const isRateLimited = [4, 17, 32, 613].includes(errorData?.code);

        if (isRateLimited) {
            result = {
                valid: false,
                message: "Meta API rate limit reached. Try again shortly.",
                rateLimited: true
            };
        } else {
            result = {
                valid: !isAuthError,
                message: isAuthError
                    ? "Meta access token has expired or is invalid."
                    : "Could not verify Meta access token (non-auth error)."
            };
        }
    }

    _cachedStatus = result;
    _cacheTimestamp = Date.now();
    return result;
};

export const isTokenUnavailableError = (error) => {
    if (!error) return false;
    if (error.name === "TokenUnavailableError") return true;

    const errorData = error.response?.data?.error;
    if (!errorData) return false;

    if (errorData.code === 190) return true;
    if (errorData.type === "OAuthException") return true;
    if ([4, 17, 32, 613].includes(errorData.code)) return true;
    if (error.response?.status === 401) return true;

    return false;
};
