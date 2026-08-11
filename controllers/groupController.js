import { prisma } from "../config/prisma.js";

export const createGroup = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is missing",
            })
        }

        const exisitingGroup = await prisma.groups.findUnique({
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

        const group = await prisma.groups.create({
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

        const exisitingGroup = await prisma.groups.findUnique({
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

        await prisma.groups.delete({
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

export const getAllGroups = async (req, res) => {
    try {
        const groups = await prisma.groups.findMany();

        return res.status(200).json({
            success: true,
            message: "Groups fetched successfully",
            groups,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupId || !groupId < 0) {
            return res.status(400).json({
                success: false,
                message: "GroupId is missing or invalid"
            })
        }

        const group = await prisma.groups.findUnique({
            where: {
                id: Number(groupId),
            }
        })

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        return res.status(200).json({
            success: true,
            message: `Successfully fetched ${group.name} group`,
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

export const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupId || !groupId < 0) {
            return res.status(400).json({
                success: false,
                message: "GroupId is missing or invalid"
            })
        }

        const group = await prisma.groups.findUnique({
            where: {
                id: Number(groupId),
            },
            select: {
                contacts: {
                    select: {
                        contact: true
                    }
                }
            }
        })

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        return res.status(200).json({
            success: true,
            message: `Successfully fetched ${group.name} group`,
            group,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
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

        const existingGroup = await prisma.groups.findUnique({
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
                message: "Contact doesn't exist"
            })
        }

        const existingGroupContact = await prisma.groupContact.findUnique({
            where: {
                contactId_groupId: {
                    contactId: Number(contactId),
                    groupId: existingGroup.id,
                }
            }
        })
        if (existingGroupContact) {
            return res.status(409).json({
                success: false,
                message: `${existingContact.name || "Contact"} is already a member`
            })
        }

        await prisma.groupContact.upsert({
            where: {
                contactId_groupId: {
                    contactId: Number(contactId),
                    groupId: existingGroup.id,
                }
            },
            update: {},
            create: {
                contactId: Number(contactId),
                groupId: existingGroup.id,
            }
        })

        return res.status(201).json({
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

export const removeContactFromGroup = async (req, res) => {
    try {
        const { contactId, groupName } = req.body;

        if (!contactId || !groupName) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            })
        }

        const existingGroup = await prisma.groups.findUnique({
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
                message: "Contact doesn't exist"
            })
        }

        const existingGroupMember = await prisma.groupContact.findUnique({
            where: {
                contactId_groupId: {
                    contactId: Number(contactId),
                    groupId: existingGroup.id,
                }
            }
        })
        if (!existingGroupMember) {
            return res.status(400).json({
                success: false,
                message: `${existingContact.name || "Contact"} is not a member`
            })
        }

        await prisma.groupContact.delete({
            where: {
                contactId_groupId: {
                    contactId: Number(contactId),
                    groupId: existingGroup.id
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: `${existingContact?.name || "Contact"} removed successfully from ${existingGroup.name}`,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const setDescription = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { description } = req.body;

        if (!groupId || description === undefined) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            })
        }

        const existingGroup = await prisma.groups.findUnique({
            where: {
                id: Number(groupId)
            }
        })

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        await prisma.groups.update({
            where: {
                id: Number(groupId),
            },
            data: {
                description,
            }
        })

        return res.status(200).json({
            success: true,
            message: "Group description updated successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const deleteDescription = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group id is missing",
            })
        }

        const existingGroup = await prisma.groups.findUnique({
            where: {
                id: Number(groupId)
            }
        })

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        await prisma.groups.update({
            where: {
                id: Number(groupId),
            },
            data: {
                description: null
            }
        })

        return res.status(200).json({
            success: true,
            message: "Group description deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const setGroupPrompt = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { prompt } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group id is missing",
            })
        }

        const normalizedPrompt = prompt.trim();

        if (normalizedPrompt === undefined) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
            })
        }

        const existingGroup = await prisma.groups.findUnique({
            where: {
                id: Number(groupId)
            }
        })

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        await prisma.groups.update({
            where: {
                id: Number(groupId),
            },
            data: {
                prompt: normalizedPrompt,
            }
        })

        return res.status(200).json({
            success: true,
            message: "Group prompt updated successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const deleteGroupPrompt = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group id is missing",
            })
        }

        const existingGroup = await prisma.groups.findUnique({
            where: {
                id: Number(groupId)
            }
        })

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        await prisma.groups.update({
            where: {
                id: Number(groupId),
            },
            data: {
                prompt: null,
            }
        })

        return res.status(200).json({
            success: true,
            message: "Group prompt deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const updateGroupName = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group id is missing",
            })
        }

        const normalizedName = name.trim();

        if (normalizedName === undefined) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
            })
        }

        const existingGroup = await prisma.groups.findUnique({
            where: {
                id: Number(groupId)
            }
        })

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group doesn't exist",
            })
        }

        await prisma.groups.update({
            where: {
                id: Number(groupId),
            },
            data: {
                name: normalizedName
            }
        })

        return res.status(200).json({
            success: true,
            message: "Group name updated successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}