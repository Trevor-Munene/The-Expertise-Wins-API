const DEDUPE_WINDOW_MS = 1500;
const MAX_RECENT_REQUESTS = 5000;

function createUsageTracker(prisma, { now = Date.now } = {}) {
  const recentBrowserRequests = new Map();
  let requestsSincePrune = 0;

  return (req, res, next) => {
    res.on("finish", () => {
      const path = req.originalUrl.split("?")[0];
      if (!path.startsWith("/api")) return;

      // Only GET reads are prone to development-mode duplicate effects.
      // Record writes individually so fast, intentional actions are retained.
      if (req.method !== "GET") return recordUsage(prisma, req, res, path);

      const clientId = req.get?.("x-tew-client-id");
      const timestamp = now();

      // React development Strict Mode can repeat the same page's GET effect.
      // Collapse only the same browser + method + endpoint burst; independent
      // clients and later intentional requests are still recorded normally.
      if (clientId && clientId.length <= 100) {
        const key = `${clientId}:${req.method}:${path}`;
        const previousRequest = recentBrowserRequests.get(key);
        if (previousRequest !== undefined && timestamp - previousRequest < DEDUPE_WINDOW_MS) return;
        recentBrowserRequests.set(key, timestamp);

        requestsSincePrune += 1;
        if (requestsSincePrune >= 100 || recentBrowserRequests.size > MAX_RECENT_REQUESTS) {
          for (const [requestKey, lastSeen] of recentBrowserRequests) {
            if (timestamp - lastSeen >= DEDUPE_WINDOW_MS) recentBrowserRequests.delete(requestKey);
          }
          requestsSincePrune = 0;
        }
      }

      recordUsage(prisma, req, res, path);
    });
    next();
  };
}

function recordUsage(prisma, req, res, path) {
  Promise.resolve()
    .then(() => {
      if (typeof prisma.usageEvent?.create !== "function") return;
      return prisma.usageEvent.create({
        data: {
          event: `${req.method} ${path}`,
          path,
          userId: req.user?.id || null,
          metadata: { statusCode: res.statusCode },
        },
      });
    })
    .catch(() => {});
}

module.exports = { createUsageTracker, DEDUPE_WINDOW_MS };
