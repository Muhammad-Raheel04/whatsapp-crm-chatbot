import { prisma } from '../config/prisma.js';

export const createGroup = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is missing",
            })
        }

        const exisitingGroup = await prisma.contactGroup.findUnique({
            where: {
                name,
            }
        })

        if (exisitingGroup) {
            return res.status(409).json({
                success: false,
                message: `${name} group already exists`,
            })
        }

        const group = await prisma.contactGroup.create({
            data: {
                name,
            }
        })

        return res.status(201).json({
            success: true,
            message: `${name} group created successfully`,
            group,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group id is missing",
            })
        }

        const exisitingGroup = await prisma.contactGroup.findUnique({
            where: {
                id: Number(groupId),
            }
        })

        if (!exisitingGroup) {
            return res.status(404).json({
                success: false,
                message: `Group doesn't exist`,
            })
        }

        await prisma.contactGroup.delete({
            where: {
                id: Number(groupId),
            }
        })

        return res.status(201).json({
            success: true,
            message: `Group deleted successfully`,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const addContactToGroup = async (req, res) => {
    try {
        const { contactId, groupName } = req.body;

        if (!contactId || !groupName) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            })
        }

        const existingGroup = await prisma.contactGroup.findUnique({
            where: {
                name: groupName.trim()
            }
        })

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        const existingContact = await prisma.contact.findUnique({
            where: {
                id: Number(contactId),
            }
        })

        if (!existingContact) {
            return res.status(404).json({
                success: false,
                message: "Contac doesn't exist"
            })
        }


        if (existingContact.groupId === existingGroup.id) {
            return res.status(409).json({
                success: false,
                message: `${existingContact.name || "Contact"} is already a member`
            })
        }
        await prisma.contact.update({
            where: {
                id: Number(contactId)
            },
            data: {
                groupId: existingGroup.id,
            }
        })

        return res.status(200).json({
            success: true,
            message: `${existingContact?.name || "Contact"} added successfully to ${existingGroup.name}`,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}