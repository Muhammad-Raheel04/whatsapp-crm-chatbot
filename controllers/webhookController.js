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
        const entry = req.body?.entry?.[0];
        const change = entry?.changes?.[0].value;

        if (!change?.messages) {
            return;
        }

        for (const message of change.messages) {
            await whatsappQueue.add("incoming-messsage", {
                message,
                contact: change.contacts?.[0],
                metadata: change.metadata,
            })
        }
    } catch (error) {
        console.error("Webhook processing error:", err);
    }
}
