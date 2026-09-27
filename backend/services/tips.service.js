const prisma = require("../lib/prisma");

const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(Number.parseInt(query.limit, 10) || 20, 1),
        100
    );

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const formatTip = (tip) => {
    if (!tip) {
        return null;
    }

    return {
        ...tip,
        odds: tip.odds ? Number(tip.odds) : null,
        stakeUnits: tip.stakeUnits ? Number(tip.stakeUnits) : null,
        confidenceIndex: tip.confidenceIndex
            ? Number(tip.confidenceIndex)
            : null,
    };
};

const getTips = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const where = {
        status: {
            not: "CANCELLED",
        },
    };

    if (query.sport) {
        where.sport = query.sport;
    }

    if (query.source) {
        where.source = query.source;
    }

    if (query.outcome) {
        where.outcome = query.outcome;
    }

    const [tips, total] = await Promise.all([
        prisma.tip.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                kickoff: "asc",
            },
        }),
        prisma.tip.count({
            where,
        }),
    ]);

    return {
        data: tips.map(formatTip),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

const getFreeTips = async (query) => {
    const { page, limit, skip } = getPagination(query);

    const freeProduct = await prisma.product.findUnique({
        where: {
            slug: "free",
        },
    });

    if (!freeProduct) {
        throw new Error("Free product not found.");
    }

    const where = {
        status: {
            not: "CANCELLED",
        },
        publications: {
            some: {
                productId: freeProduct.id,
                status: "PUBLISHED",
            },
        },
    };

    if (query.sport) {
        where.sport = query.sport;
    }

    if (query.outcome) {
        where.outcome = query.outcome;
    }

    const [tips, total] = await Promise.all([
        prisma.tip.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                kickoff: "asc",
            },
        }),
        prisma.tip.count({
            where,
        }),
    ]);

    return {
        data: tips.map(formatTip),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

const hasProductAccess = async (userId, productSlug) => {
    const product = await prisma.product.findUnique({
        where: {
            slug: productSlug,
        },
        select: {
            id: true,
            isPublic: true,
        },
    });

    if (!product) {
        throw new Error("Product not found.");
    }

    if (product.isPublic) {
        return product;
    }

    const accessToken = await prisma.accessToken.findFirst({
        where: {
            productId: product.id,
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
        },
        select: {
            id: true,
        },
    });

    if (!accessToken) {
        throw new Error("You do not have access to this product.");
    }

    return product;
};

const getProtectedTips = async (userId, productSlug, query) => {
    const product = await hasProductAccess(userId, productSlug);
    const { page, limit, skip } = getPagination(query);

    const where = {
        status: {
            not: "CANCELLED",
        },
        publications: {
            some: {
                productId: product.id,
                status: "PUBLISHED",
            },
        },
    };

    if (query.sport) {
        where.sport = query.sport;
    }

    if (query.outcome) {
        where.outcome = query.outcome;
    }

    const [tips, total] = await Promise.all([
        prisma.tip.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                kickoff: "asc",
            },
        }),
        prisma.tip.count({
            where,
        }),
    ]);

    return {
        data: tips.map(formatTip),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

const getVipTips = async (userId, query) => {
    return getProtectedTips(userId, "vip", query);
};

const getMaxbetTips = async (userId, query) => {
    return getProtectedTips(userId, "maxbet", query);
};

const getTipById = async (tipId) => {
    const tip = await prisma.tip.findUnique({
        where: {
            id: tipId,
        },
        include: {
            publications: {
                where: {
                    status: "PUBLISHED",
                },
                select: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            type: true,
                        },
                    },
                    publishedAt: true,
                },
            },
        },
    });

    if (!tip) {
        throw new Error("Tip not found.");
    }

    return formatTip(tip);
};

const createTip = async (userId, tipData) => {
    const {
        source,
        externalId,
        sport,
        competition,
        league,
        country,
        homeTeam,
        awayTeam,
        kickoff,
        market,
        selection,
        odds,
        stakeUnits,
        previewTitle,
        preview,
        verdict,
        tips,
        analytics,
        confidenceIndex,
        predictedScore,
        detailsUrl,
        extraTips,
        status,
        outcome,
    } = tipData;

    const tip = await prisma.tip.create({
        data: {
            source,
            externalId,
            sport,
            competition,
            league,
            country,
            homeTeam,
            awayTeam,
            kickoff,
            market,
            selection,
            odds,
            stakeUnits,
            previewTitle,
            preview,
            verdict,
            tips,
            analytics,
            confidenceIndex,
            predictedScore,
            detailsUrl,
            extraTips,
            status: status || "PENDING",
            outcome: outcome || "PENDING",
            createdById: userId,
        },
    });

    return formatTip(tip);
};

const updateTip = async (tipId, userId, tipData) => {
    const existingTip = await prisma.tip.findUnique({
        where: {
            id: tipId,
        },
    });

    if (!existingTip) {
        throw new Error("Tip not found.");
    }

    const {
        source,
        externalId,
        sport,
        competition,
        league,
        country,
        homeTeam,
        awayTeam,
        kickoff,
        market,
        selection,
        odds,
        stakeUnits,
        previewTitle,
        preview,
        verdict,
        tips,
        analytics,
        confidenceIndex,
        predictedScore,
        detailsUrl,
        extraTips,
        status,
        outcome,
    } = tipData;

    const tip = await prisma.tip.update({
        where: {
            id: tipId,
        },
        data: {
            source,
            externalId,
            sport,
            competition,
            league,
            country,
            homeTeam,
            awayTeam,
            kickoff,
            market,
            selection,
            odds,
            stakeUnits,
            previewTitle,
            preview,
            verdict,
            tips,
            analytics,
            confidenceIndex,
            predictedScore,
            detailsUrl,
            extraTips,
            status,
            outcome,
            publishedAt:
                status === "PUBLISHED"
                    ? existingTip.publishedAt || new Date()
                    : existingTip.publishedAt,
            publishedById:
                status === "PUBLISHED"
                    ? userId
                    : existingTip.publishedById,
            settledAt:
                outcome &&
                ["WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST", "CANCELLED"].includes(
                    outcome
                )
                    ? new Date()
                    : existingTip.settledAt,
        },
    });

    return formatTip(tip);
};

const updateTipResult = async (tipId, userId, resultData) => {
    const {
        result,
        outcome,
    } = resultData;

    const existingTip = await prisma.tip.findUnique({
        where: {
            id: tipId,
        },
    });

    if (!existingTip) {
        throw new Error("Tip not found.");
    }

    const settledOutcomes = [
        "WON",
        "LOST",
        "VOID",
        "PUSH",
        "HALF_WON",
        "HALF_LOST",
        "CANCELLED",
    ];

    const isSettled = settledOutcomes.includes(outcome);

    const tip = await prisma.tip.update({
        where: {
            id: tipId,
        },
        data: {
            result,
            outcome,
            status: isSettled ? "SETTLED" : existingTip.status,
            settledAt: isSettled ? new Date() : null,
        },
    });

    return formatTip(tip);
};

const deleteTip = async (tipId, userId) => {
    const existingTip = await prisma.tip.findUnique({
        where: {
            id: tipId,
        },
    });

    if (!existingTip) {
        throw new Error("Tip not found.");
    }

    await prisma.tip.update({
        where: {
            id: tipId,
        },
        data: {
            status: "CANCELLED",
            outcome: "CANCELLED",
            settledAt: new Date(),
        },
    });

    return {
        message: "Tip cancelled successfully.",
    };
};

module.exports = {
    getTips,
    getFreeTips,
    getVipTips,
    getMaxbetTips,
    getTipById,
    createTip,
    updateTip,
    updateTipResult,
    deleteTip,
};