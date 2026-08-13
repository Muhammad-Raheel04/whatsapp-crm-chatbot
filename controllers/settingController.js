import { prisma } from "../config/prisma.js";

export const setDelay = async (req, res) => {
    try {
        const { delay } = req.params;
        const delayValue = Number(delay);

        if (!delay || isNaN(delayValue) || delayValue < 0) {
            return res.status(400).json({
                success: false,
                message: "Delay must be a valid positive number",
            })
        }
        await prisma.settings.upsert({
            where: {
                id: 1
            },
            create: {
                id: 1,
                responseDelay: delayValue
            },
            update: {
                responseDelay: delayValue
            }
        })

        return res.status(200).json({
            success: true,
            message: "Response Delay Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getDelay = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings.responseDelay) {
            return res.status(404).json({
                success: false,
                message: "Delay not configured"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Delay fetched successfully",
            delay: settings.responseDelay,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const setMetaWhatsAppToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "WA token is required"
            })
        }

        await prisma.settings.upsert({
            where: {
                id: 1,
            },
            create: {
                id: 1,
                metaWhatsAppToken: (token).trim(),
            },
            update: {
                metaWhatsAppToken: (token).trim()
            }
        })

        return res.status(200).json({
            success: true,
            message: "Whatsapp Token Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getMetaWhatsAppToken = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings.metaWhatsAppToken) {
            return res.status(404).json({
                success: false,
                message: "WhatsApp Token not configured"
            });
        }
        return res.status(200).json({
            success: true,
            message: "WhatsApp Access Token fetched Successfully",
            whatsAppAccessToken: settings.metaWhatsAppToken,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const setSystemPrompt = async (req, res) => {
    try {
        const { systemPrompt } = req.body;

        if (!systemPrompt) {
            return res.status(400).json({
                success: false,
                message: "System Prompt is required"
            })
        }

        await prisma.settings.upsert({
            where: {
                id: 1,
            },
            create: {
                id: 1,
                systemPrompt: systemPrompt.trim(),
            },
            update: {
                systemPrompt: systemPrompt.trim(),
            }
        })

        return res.status(200).json({
            success: true,
            message: "System Prompt Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getSystemPrompt = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst()

        return res.status(200).json({
            success: true,
            message: "System Prompt Updated Successfully",
            systemPrompt: settings.systemPrompt,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const togggleGlobalAIMode = async (req, res) => {
    try {
        const { value } = req.body;

        if (value === undefined || typeof value !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "Required field is missing",
            })
        }

        await prisma.settings.upsert({
            where: {
                id: 1
            },
            create: {
                id: 1,
                aiEnabled: value,
            },
            update: {
                aiEnabled: value,
            }
        })

        return res.status(200).json({
            success: true,
            message: `AI ${value ? 'enabled' : 'disabled'} successfully`
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getGlobalAiMode = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        return res.status(200).json({
            success: true,
            message: "AI mode fetched successfully",
            globalAiMode: settings.aiEnabled
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const setgroqOpenAiKey = async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: "Groq Open AI Key is required"
            })
        }

        await prisma.settings.upsert({
            where: {
                id: 1,
            },
            create: {
                id: 1,
                groqOpenAiKey: (key).trim(),
            },
            update: {
                groqOpenAiKey: (key).trim()
            }
        })

        return res.status(200).json({
            success: true,
            message: "Groq Open AI Key Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getgroqOpenAiKey = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings.groqOpenAiKey) {
            return res.status(404).json({
                success: false,
                message: "Groq Open AI Key not configured"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Groq Open AI Key fetched Successfully",
            groqOpenAiKey: settings.groqOpenAiKey,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const setgroqApiKey  = async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: "Groq API Key is required"
            })
        }

        await prisma.settings.upsert({
            where: {
                id: 1,
            },
            create: {
                id: 1,
                groqApiKey: (key).trim(),
            },
            update: {
                groqApiKey: (key).trim()
            }
        })

        return res.status(200).json({
            success: true,
            message: "Groq API Key Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}

export const getgroqApiKey  = async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();

        if (!settings.groqApiKey) {
            return res.status(404).json({
                success: false,
                message: "Groq Api Key not configured"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Groq Api Key fetched Successfully",
            groqApiKey: settings.groqApiKey,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
}
