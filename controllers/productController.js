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
        return res.status(201).json({
            success: true,
            message: "Product Created",
            product,
        });
    }
}