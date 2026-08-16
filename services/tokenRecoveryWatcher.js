import { whatsappQueue } from "../queues/whatsAppQueue.js";
import { responseQueue } from "../queues/responseQueue.js";
import { getMetaTokenStatus } from "./metaTokenStatusService.js";

const POLL_INTERVAL_MS = 30 * 1000;

let _isPaused = false;
let _pollTimer = null;

const _pauseAll = async () => {
    if (_isPaused) return;
    _isPaused = true;
    try {
        await Promise.all([
            whatsappQueue.pause().catch(() => {}),
            responseQueue.pause().catch(() => {}),
        ]);
        console.log("[tokenRecoveryWatcher] Both queues PAUSED due to token unavailability.");
    } catch (err) {
        console.error("[tokenRecoveryWatcher] Failed to pause queues:", err.message);
    }
};

const _resumeAll = async () => {
    if (!_isPaused) return;
    try {
        await Promise.all([
            whatsappQueue.resume().catch(() => {}),
            responseQueue.resume().catch(() => {}),
        ]);
        _isPaused = false;
        console.log("[tokenRecoveryWatcher] Both queues RESUMED as token is valid again.");
    } catch (err) {
        console.error("[tokenRecoveryWatcher] Failed to resume queues:", err.message);
    }
};

const _pollOnce = async () => {
    try {
        const status = await getMetaTokenStatus({ force: true });
        if (status.valid) {
            await _resumeAll();
            if (_pollTimer) {
                clearInterval(_pollTimer);
                _pollTimer = null;
                console.log("[tokenRecoveryWatcher] Token recovered, poller stopped.");
            }
        } else {
            console.log("[tokenRecoveryWatcher] Token still invalid. Keep waiting...");
        }
    } catch (err) {
        console.error("[tokenRecoveryWatcher] Poll error:", err.message);
    }
};

export const handleTokenFailure = async () => {
    await _pauseAll();
    if (!_pollTimer) {
        _pollTimer = setInterval(_pollOnce, POLL_INTERVAL_MS);
        console.log(`[tokenRecoveryWatcher] Recovery poller started (every ${POLL_INTERVAL_MS / 1000}s).`);
    }
};
