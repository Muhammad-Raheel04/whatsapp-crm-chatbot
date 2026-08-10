import { prisma } from "../config/prisma.js";

export const addProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;

        if (!name || !category || !description?.trim() || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            })
        }

        const normalizedCategory = category.trim().toUpperCase();
        const existingCategory = await prisma.category.findUnique({
            where: {
                name: normalizedCategory,
            }
        })

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: `Plz add ${category} category first`,
            })
        }
        const exisitingProduct = await prisma.product.findFirst({
            where: {
                name: {
                    equals: name.trim(),
                    mode: "insensitive"
                },
                categoryId: existingCategory.id
            }
        })

        if (exisitingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product already exist",
            })
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: Number(price),
                categoryId: existingCategory.id,
            }
        })
        return res.status(201).json({
            success: true,
            message: "Product Created",
            product,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "ProductId is required",
            })
        }

        const exisitingProduct = await prisma.product.findUnique({
            where: {
                id: Number(productId)
            }
        })

        if (!exisitingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product doesn't exist",
            })
        }

        await prisma.product.delete({
            where: {
                id: Number(productId)
            }
        })

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "ProductId is required",
            })
        }

        const product = await prisma.product.findUnique({
            where: {
                id: Number(productId)
            }
        })

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product doesn't exist",
            })
        }

        return res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            product,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();

        return res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            products,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const addKeywords = async (req, res) => {
    try {
        const { keywords } = req.body;
        const { productId } = req.params;

        if (!productId || !keywords) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            })
        }

        const exisitingProduct = await prisma.product.findUnique({
            where: {
                id: Number(productId)
            },
            include: {
                keywords: true,
            }
        })

        if (!exisitingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product doesn't exist",
            })
        }

        let keywordArray = [];

        if (keywords) {
            try {
                keywordArray = typeof keywords === 'string' ? JSON.parse(keywords) : keywords
            } catch {
                keywordArray = keywords.split(",").map(k => k.trim());
            }
        }

        const exisitingKeywords = exisitingProduct.keywords.map((item) => item.keyword.toLowerCase());
        const newKeywords = keywordArray.filter(keyword => !exisitingKeywords.includes(keyword.toLowerCase()));

        if (newKeywords.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No new keywords to add"
            });
        }

        const keywordData = newKeywords.map(keyword => ({
            keyword,
            productId: Number(productId)
        }));

        await prisma.productKeyword.createMany({
            data: keywordData
        })

        return res.status(200).json({
            success: true,
            message: "Keywords added successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const getProductKeywords = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "ProductId is required",
            })
        }

        const product = await prisma.product.findUnique({
            where: {
                id: Number(productId)
            },
        })

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product doesn't exist",
            })
        }

        const productKeywords = await prisma.productKeyword.findMany({
            where: {
                productId: Number(productId),
            }
        })

        return res.status(200).json({
            success: true,
            message: "Fetched product keywords successfully",
            productKeywords,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const addMedia = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product Id is required",
            })
        }

        const exisitingProduct = await prisma.product.findUnique({
            where: {
                id: Number(productId)
            }
        })

        if (!exisitingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product doesn't exist",
            })
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Images uploaded",
            })
        }
        let type;

        const mediaData = req.files.map((file) => {

            if (file.mimetype.startsWith("image/")) {
                type = "IMAGE";
            }
            else if (file.mimetype.startsWith("video/")) {
                type = "VIDEO";
            }
            else if (file.mimetype.startsWith("audio/")) {
                type = "AUDIO";
            }


            return {
                type,
                filePath: file.path,
                productId: Number(productId),
            };
        })

        await prisma.productMedia.createMany({
            data: mediaData
        })

        return res.status(201).json({
            success: true,
            message: type.length > 1 ? `${type.toLowerCase()} uploaded successfully` : `${type.toLowerCase()}s uploaded successfully`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}