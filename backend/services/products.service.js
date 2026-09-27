const prisma = require("../lib/prisma");

const getProducts = async () => {
    const products = await prisma.product.findMany({
        where: {
            status: "ACTIVE",
        },
        orderBy: {
            createdAt: "asc",
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            status: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return products;
};

const getProductBySlug = async (slug) => {
    const product = await prisma.product.findUnique({
        where: {
            slug,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            status: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!product) {
        throw new Error("Product not found.");
    }

    return product;
};

const getFreeProduct = async () => {
    return getProductBySlug("free");
};

const getVipProduct = async () => {
    return getProductBySlug("vip");
};

const getMaxbetProduct = async () => {
    return getProductBySlug("maxbet");
};

const getProductById = async (productId) => {
    const product = await prisma.product.findUnique({
        where: {
            id: productId,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            status: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!product) {
        throw new Error("Product not found.");
    }

    return product;
};

const getMyProducts = async (userId) => {
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
        orderBy: {
            createdAt: "asc",
        },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            type: true,
            status: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return products;
};

module.exports = {
    getProducts,
    getFreeProduct,
    getVipProduct,
    getMaxbetProduct,
    getProductById,
    getMyProducts,
};