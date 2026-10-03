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

const sourceMetadataKeys = new Set([
    "source",
    "externalid",
    "detailsurl",
    "url",
    "beturl",
    "bookmaker",
    "previewtitle",
    "sourcename",
    "sourceurl",
    "provider",
    "providername",
    "affiliateurl",
]);

const stripSourceMetadata = (value) => {
    if (Array.isArray(value)) return value.map(stripSourceMetadata);
    if (typeof value === "string") return value.replace(/https?:\/\/\S+/gi, "").trim();
    if (!value || typeof value !== "object") return value;
    if (value instanceof Date || value.constructor?.name === "Decimal") return value;

    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => !sourceMetadataKeys.has(key.toLowerCase()))
            .map(([key, nestedValue]) => [key, stripSourceMetadata(nestedValue)])
    );
};

const formatTip = (tip) => {
    if (!tip) {
        return null;
    }

    return {
        ...stripSourceMetadata(tip),
        odds: tip.odds ? Number(tip.odds) : null,
        stakeUnits: tip.stakeUnits ? Number(tip.stakeUnits) : null,
        confidenceIndex: tip.confidenceIndex
            ? Number(tip.confidenceIndex)
            : null,
    };
};

const getTips = async (query = {}) => {
    const { page, limit, skip } = getPagination(query);

    const where = {
        status: {
            not: "CANCELLED",
        },
        publications: {
            some: {
                status: "PUBLISHED",
                product: {
                    status: "ACTIVE",
                    isPublic: true,
                },
            },
        },
    };

    if (query.sport) {
        where.sport = query.sport;
    }

    if (query.outcome) {
        where.outcome = query.outcome;
    }
    addPublishedDayFilter(where, query, new Date().toISOString().slice(0, 10));

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

const addPublishedDayFilter = (where, query, defaultDay = null) => {
    const day = query.day || defaultDay;
    if (!day) return;
    const dateFrom = parseArchiveDate(day);
    const dateTo = parseArchiveDate(day, true);
    where.AND = [{ OR: [
        { scrapedAt: { gte: dateFrom, lte: dateTo } },
        { scrapedAt: null, createdAt: { gte: dateFrom, lte: dateTo } },
    ] }];
};

const getFreeTips = async (query = {}) => {
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
    addPublishedDayFilter(where, query, new Date().toISOString().slice(0, 10));

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

const hasProductAccess = async (userId, productSlug, isAdmin = false) => {
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

    if (product.isPublic || isAdmin) {
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
        const error = new Error("You do not have access to this product.");
        error.status = 403;
        throw error;
    }

    return product;
};

const getProtectedTips = async (userId, productSlug, query = {}, isAdmin = false) => {
    const product = await hasProductAccess(userId, productSlug, isAdmin);
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
    addPublishedDayFilter(where, query, new Date().toISOString().slice(0, 10));

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

const getVipTips = async (userId, query, isAdmin = false) => {
    return getProtectedTips(userId, "vip", query, isAdmin);
};

const getMaxbetTips = async (userId, query, isAdmin = false) => {
    return getProtectedTips(userId, "maxbet", query, isAdmin);
};

const getVisibleProducts = async () => {
    return prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, slug: true, name: true },
    });

    /*
    const where = { status: "ACTIVE" };

    if (isAdmin) {
        return prisma.product.findMany({ where, select: { id: true, slug: true, name: true } });
    }

    const visibleProductConditions = [{ isPublic: true }];
    if (userId) {
        visibleProductConditions.push({
            accessTokens: {
                some: {
                    assignedUserId: userId,
                    status: "ACTIVE",
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
            },
        });
    }

    return prisma.product.findMany({
        where: { ...where, OR: visibleProductConditions },
        select: { id: true, slug: true, name: true },
    });
    */
};

const parseArchiveDate = (value, endOfDay = false) => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const error = new Error("Archive dates must use YYYY-MM-DD format.");
        error.status = 400;
        throw error;
    }

    const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
    if (Number.isNaN(date.getTime())) {
        const error = new Error("Invalid archive date.");
        error.status = 400;
        throw error;
    }
    return date;
};

const getArchive = async (query, userId, isAdmin = false) => {
    const visibleProducts = await getVisibleProducts(userId, isAdmin);
    const visibleTiers = visibleProducts.map(({ slug, name }) => ({ slug, name }));
    const requestedTier = String(query.tier || "").toLowerCase();
    if (requestedTier && !["free", "vip", "maxbet"].includes(requestedTier)) {
        const error = new Error("Unsupported archive tier.");
        error.status = 400;
        throw error;
    }
    if (requestedTier && !visibleProducts.some((product) => product.slug === requestedTier)) {
        const error = new Error("Archive tier not found.");
        error.status = 404;
        throw error;
    }
    const selectedProducts = requestedTier
        ? visibleProducts.filter((product) => product.slug === requestedTier)
        : visibleProducts;
    const visibleProductIds = selectedProducts.map((product) => product.id);
    if (visibleProductIds.length === 0) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, sports: [], tiers: visibleTiers };
    }

    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
    const where = {
        status: { not: "CANCELLED" },
        publications: {
            some: {
                productId: { in: visibleProductIds },
                status: "PUBLISHED",
            },
        },
    };

    if (query.sport) where.sport = query.sport;
    if (query.outcome) {
        const outcomes = ["PENDING", "WON", "LOST", "VOID", "PUSH", "HALF_WON", "HALF_LOST"];
        if (!outcomes.includes(query.outcome.toUpperCase())) {
            const error = new Error("Unsupported archive outcome.");
            error.status = 400;
            throw error;
        }
        where.outcome = query.outcome.toUpperCase();
    }

    if (query.search?.trim()) {
        const term = query.search.trim();
        where.OR = ["homeTeam", "awayTeam", "competition", "league", "selection"].map((field) => ({
            [field]: { contains: term, mode: "insensitive" },
        }));
    }

    const defaultDay = !query.day && !query.from && !query.to
        ? new Date().toISOString().slice(0, 10)
        : null;
    const selectedDay = parseArchiveDate(query.day || defaultDay);
    const dateFrom = selectedDay || parseArchiveDate(query.from);
    const dateTo = selectedDay ? parseArchiveDate(query.day, true) : parseArchiveDate(query.to, true);
    if (dateFrom || dateTo) {
        const range = {};
        if (dateFrom) range.gte = dateFrom;
        if (dateTo) range.lte = dateTo;
        where.AND = [{
            OR: [
                { scrapedAt: range },
                { scrapedAt: null, createdAt: range },
            ],
        }];
    }

    const [tips, total, sports] = await Promise.all([
        prisma.tip.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ scrapedAt: "desc" }, { createdAt: "desc" }],
            include: {
                publications: {
                    where: { productId: { in: visibleProductIds }, status: "PUBLISHED" },
                    select: { product: { select: { name: true, slug: true } } },
                },
            },
        }),
        prisma.tip.count({ where }),
        prisma.tip.groupBy({
            by: ["sport"],
            where: {
                status: { not: "CANCELLED" },
                publications: {
                    some: { productId: { in: visibleProductIds }, status: "PUBLISHED" },
                },
            },
            orderBy: { sport: "asc" },
        }),
    ]);

    const tierSports = {};
    for (const product of visibleProducts) {
        const tierTips = await prisma.tip.findMany({
            where: {
                ...where,
                publications: { some: { productId: product.id, status: "PUBLISHED" } },
            },
            distinct: ["sport"],
            select: { sport: true },
            orderBy: { sport: "asc" },
        });
        tierSports[product.slug] = tierTips.map((tip) => tip.sport);
    }

    return {
        data: tips.map((tip) => {
            const tiers = [...new Set(tip.publications.map((publication) => publication.product.slug))];
            return formatTip({ ...tip, tier: tiers[0] || "free", tiers });
        }),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        sports: sports.map((item) => item.sport),
        tierSports,
        tiers: visibleTiers,
    };
};

const getTipById = async (tipId, userId, isAdmin = false) => {
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

    const visibleProducts = await getVisibleProducts(userId, isAdmin);
    const visibleProductIds = new Set(visibleProducts.map((product) => product.id));
    const visiblePublications = tip.publications.filter((publication) =>
        visibleProductIds.has(publication.product.id)
    );
    if (visiblePublications.length === 0) {
        const error = new Error("Tip not found.");
        error.status = 404;
        throw error;
    }

    tip.publications = visiblePublications;
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
    getArchive,
    getTipById,
    createTip,
    updateTip,
    updateTipResult,
    deleteTip,
};