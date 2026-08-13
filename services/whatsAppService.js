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
        console.error("Graph Api Error", error.response?.data ?? error.message)
    }

}
export const sendWhatsAppMedia = async ({ to, media }) => {
    const url = `https://graph.facebook.com/v22.0/${process.env.META_WA_PHONE_NUMBER_ID}/messages`;

    const metaWaAccessToken = await getMetaWaToken();

    try {
        const mediaData = {
            link: media.filePath,
        };

        if (media.caption && ["image", "video", "document"].includes(media.type)) {
            mediaData.caption = media.caption;
        }

        if (media.type === "document" && media.filename) {
            mediaData.filename = media.filename;
        }
        const response = await axios.post(
            url,
            {
                messaging_product: "whatsapp",
                to,
                type: media.type,
                [media.type]:mediaData
            },
            {
                headers: {
                    Authorization: `Bearer ${metaWaAccessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "Media Graph API Error",
            error.response?.data
        );
        throw error;
    }
};