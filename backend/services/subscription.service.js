const crypto = require("crypto");

const prisma = require("../lib/prisma");

const hashAccessToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

const getActiveTokenWhere = (userId) => {
    return {
        assignedUserId: userId,
        status: "ACTIVE",
        OR: [
            {
                expiresAt: null,
            },
            {
                expiresAt: {
                    gt: new Date(),
                },
            },
        ],
    };
};

const formatSubscription = (accessToken) => {
    if (!accessToken) {
        return null;
    }

    return {
        id: accessToken.id,
        product: accessToken.product,
        status: accessToken.status,
        expiresAt: accessToken.expiresAt,
        usedAt: accessToken.usedAt,
        createdAt: accessToken.createdAt,
        notes: accessToken.notes,
    };
};

const getMySubscriptions = async (userId) => {
    const accessTokens = await prisma.accessToken.findMany({
        where: {
            assignedUserId: userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    return accessTokens.map(formatSubscription);
};

const getActiveSubscription = async (userId) => {
    const accessToken = await prisma.accessToken.findFirst({
        where: getActiveTokenWhere(userId),
        orderBy: {
            expiresAt: "asc",
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    return formatSubscription(accessToken);
};

const getSubscriptionHistory = async (userId) => {
    const accessTokens = await prisma.accessToken.findMany({
        where: {
            assignedUserId: userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    return accessTokens.map(formatSubscription);
};

const redeemAccessToken = async (userId, token) => {
    if (!token || typeof token !== "string") throw new Error("Access token is required.");
    const tokenHash = hashAccessToken(token);

    const accessToken = await prisma.accessToken.findUnique({
        where: {
            tokenHash,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    if (!accessToken) {
        throw new Error("Invalid access token.");
    }

    if (accessToken.status !== "ACTIVE") {
        throw new Error("This access token is no longer available.");
    }

    if (accessToken.assignedUserId && userId && accessToken.assignedUserId !== userId) {
        throw new Error("This access token is linked to another registered user.");
    }

    if (accessToken.assignedUserId && !userId) {
        return {
            accessToken: {
                id: accessToken.id,
                product: accessToken.product,
                status: accessToken.status,
                expiresAt: accessToken.expiresAt,
                usedAt: accessToken.usedAt,
            },
            sessionAccessToken: token,
        };
    }

    if (
        accessToken.expiresAt &&
        accessToken.expiresAt <= new Date()
    ) {
        throw new Error("This access token has expired.");
    }

    const updatedToken = await prisma.accessToken.update({
        where: {
            id: accessToken.id,
        },
        data: {
            ...(userId ? { assignedUserId: userId } : {}),
            usedAt: new Date(),
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    return {
        accessToken: {
            id: updatedToken.id,
            product: updatedToken.product,
            status: updatedToken.status,
            expiresAt: updatedToken.expiresAt,
            usedAt: updatedToken.usedAt,
        },
    };
};

const getAccessByToken = async (token, productSlug) => {
    if (!token) return false;
    const accessToken = await prisma.accessToken.findUnique({
        where: { tokenHash: hashAccessToken(token) },
        select: {
            productId: true,
            status: true,
            expiresAt: true,
            product: { select: { slug: true } },
        },
    });
    return Boolean(accessToken && accessToken.status === "ACTIVE" && accessToken.product.slug === productSlug && (!accessToken.expiresAt || accessToken.expiresAt > new Date()));
};

const verifyAccessToken = async (token) => {
    const tokenHash = hashAccessToken(token);

    const accessToken = await prisma.accessToken.findUnique({
        where: {
            tokenHash,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    if (!accessToken) {
        throw new Error("Invalid access token.");
    }

    const expired =
        accessToken.expiresAt &&
        accessToken.expiresAt <= new Date();

    return {
        valid:
            accessToken.status === "ACTIVE" &&
            !accessToken.assignedUserId &&
            !expired,
        product: accessToken.product,
        status: accessToken.status,
        assigned: Boolean(accessToken.assignedUserId),
        expiresAt: accessToken.expiresAt,
    };
};

const getMyAccess = async (userId) => {
    const now = new Date();

    const products = await prisma.product.findMany({
        where: {
            status: "ACTIVE",
            OR: [
                {
                    isPublic: true,
                },
                {
                    accessTokens: {
                        some: {
                            assignedUserId: userId,
                            status: "ACTIVE",
                            OR: [
                                {
                                    expiresAt: null,
                                },
                                {
                                    expiresAt: {
                                        gt: now,
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        },
        select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            description: true,
            isPublic: true,
        },
    });

    return products;
};

const cancelSubscription = async (userId, accessTokenId) => {
    const accessToken = await prisma.accessToken.findFirst({
        where: {
            id: accessTokenId,
            assignedUserId: userId,
        },
    });

    if (!accessToken) {
        throw new Error("Access not found.");
    }

    if (accessToken.status !== "ACTIVE") {
        throw new Error("This access is no longer active.");
    }

    await prisma.accessToken.update({
        where: {
            id: accessToken.id,
        },
        data: {
            status: "REVOKED",
        },
    });

    return {
        message: "Access cancelled successfully.",
    };
};

const renewSubscription = async (
    userId,
    accessTokenId,
    renewalData
) => {
    const accessToken = await prisma.accessToken.findFirst({
        where: {
            id: accessTokenId,
            assignedUserId: userId,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    if (!accessToken) {
        throw new Error("Access not found.");
    }

    if (accessToken.status !== "ACTIVE") {
        throw new Error("This access cannot be renewed.");
    }

    const days = Number.parseInt(
        renewalData.days,
        10
    );

    if (!days || days <= 0) {
        throw new Error("Renewal days must be greater than zero.");
    }

    const now = new Date();

    const currentExpiry =
        accessToken.expiresAt &&
        accessToken.expiresAt > now
            ? accessToken.expiresAt
            : now;

    const newExpiry = new Date(currentExpiry);

    newExpiry.setDate(
        newExpiry.getDate() + days
    );

    const updatedToken = await prisma.accessToken.update({
        where: {
            id: accessToken.id,
        },
        data: {
            expiresAt: newExpiry,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    return {
        message: "Access renewed successfully.",
        access: {
            id: updatedToken.id,
            product: updatedToken.product,
            status: updatedToken.status,
            expiresAt: updatedToken.expiresAt,
        },
    };
};

const getSubscriptionById = async (
    userId,
    accessTokenId
) => {
    const accessToken = await prisma.accessToken.findFirst({
        where: {
            id: accessTokenId,
            assignedUserId: userId,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                },
            },
        },
    });

    if (!accessToken) {
        throw new Error("Access not found.");
    }

    return formatSubscription(accessToken);
};

module.exports = {
    getMySubscriptions,
    getActiveSubscription,
    getSubscriptionHistory,
    redeemAccessToken,
    verifyAccessToken,
    getAccessByToken,
    getMyAccess,
    cancelSubscription,
    renewSubscription,
    getSubscriptionById,
};