import { whatsappQueue } from "../queues/whatsAppQueue.js";

export const verifyWhatsAppWebhook = (req, res) => {
    try {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && token === process.env.META_WA_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }

        return res.sendStatus(403);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}

export const handleWhatsAppWebhook = async (req, res) => {
    res.sendStatus(200);

    try {
        const entries = req.body?.entry || [];

        for (const entry of entries) {
            const changes = entry?.changes || [];

            for (const change of changes) {
                const value = change?.value;

                if (!value) {
                    continue;
                }

                if (value.messages) {
                    for (const message of value.messages) {
                        console.log("[webhook] queueing incoming message", {
                            messageId: message?.id,
                            from: message?.from,
                            type: message?.type,
                            contactWaId: value.contacts?.[0]?.wa_id,
                        });
                        await whatsappQueue.add("incoming-message", {
                            message,
                            contact: value.contacts?.[0],
                            metadata: value.metadata,
                        })
                    }
                }

                if (value.statuses) {
                    await whatsappQueue.add("message-status-update", {
                        statuses: value.statuses,
                    })
                }
            }
        }
    } catch (error) {
        console.error("Webhook processing error:", error);
    }
}
