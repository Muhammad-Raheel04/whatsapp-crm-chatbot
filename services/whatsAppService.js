import axios from 'axios';

export const sendWhatsAppMessage = async ({ to, message }) => {
    const url = `https://graph.facebook.com/v22.0/${process.env.META_WA_PHONE_NUMBER_ID}/messages`;
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
                    Authorization: `Bearer ${process.env.META_WA_WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        )

        return response.data;
    }catch(error){
        console.error("Graph Api Error",error)
    }
   
}