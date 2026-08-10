import { prisma } from "../config/prisma.js";

export const getMetaWaToken = async () => {
    try {
        const settings = await prisma.settings.findUnique({
            where:{
                id:1
            }
        });
        
        return settings.metaWhatsAppToken;
    } catch (error) {
        console.log("Error fetching metaWaAccessToken", error);
    }
}