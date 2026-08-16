export class TokenUnavailableError extends Error {
    constructor(message = "Meta access token is unavailable, expired, or rate-limited.") {
        super(message);
        this.name = "TokenUnavailableError";
    }
}
