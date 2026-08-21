import { whatsappQueue } from "../queues/whatsAppQueue.js";
import { responseQueue } from "../queues/responseQueue.js";
import { getMetaTokenStatus } from "./metaTokenStatusService.js";
import { handleTokenFailure } from "./tokenRecoveryWatcher.js";

const reconcileQueueState = async () => {
    try {
        const [waPaused, respPaused] = await Promise.all([
            whatsappQueue.isPaused(),
            responseQueue.isPaused(),
        ]);

        if (waPaused || respPaused) {
            const status = await getMetaTokenStatus({ force: true });
            if (status.valid) {
                console.log("[queueReconciliation] Queues were paused but token is valid — resuming.");
                await Promise.all([whatsappQueue.resume(), responseQueue.resume()]);
            } else {
                console.log("[queueReconciliation] Queues paused and token still invalid — starting recovery poller.");
                await handleTokenFailure();
            }
        } else {
            console.log("[queueReconciliation] Queue state OK, nothing to reconcile.");
        }
    } catch (err) {
        console.error("[queueReconciliation] Failed to reconcile queue state:", err.message);
    }
};

export default reconcileQueueState;