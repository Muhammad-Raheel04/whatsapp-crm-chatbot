import axios from 'axios';
import { getMetaWaToken } from './metaWaTokenService.js';

export const sendWhatsAppMessage = async ({ to, message }) => {
    const url = `https://graph.facebook.com/v22.0/${process.env.META_WA_PHONE_NUMBER_ID}/messages`;
    const metaWaAccessToken = await getMetaWaToken();
    try {
        const response = await axios.post(url,
            {
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: {
                    body: message
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${metaWaAccessToken}`,
                    "Content-Type": "application/json"
                }
            }
        )

        return response.data;
    } catch (error) {
        console.error("Graph Api Error", error.message)
    }

}