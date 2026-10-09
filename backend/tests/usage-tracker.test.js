const test = require("node:test");
const assert = require("node:assert/strict");
const { createUsageTracker } = require("../middleware/usageTracker");

function makeResponse() {
  const listeners = {};
  return {
    statusCode: 200,
    on(event, callback) { listeners[event] = callback; },
    finish() { listeners.finish(); },
  };
}

async function flushWrites() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("usage tracking collapses same-client duplicate route bursts only", async () => {
  let now = 1000;
  const records = [];
  const tracker = createUsageTracker(
    { usageEvent: { create: async ({ data }) => records.push(data) } },
    { now: () => now }
  );

  const request = (clientId, path = "/api/tips", method = "GET") => {
    const req = {
      originalUrl: `${path}?day=today`, method, user: { id: "user-1" },
      get: (name) => name.toLowerCase() === "x-tew-client-id" ? clientId : undefined,
    };
    const res = makeResponse();
    tracker(req, res, () => {});
    res.finish();
  };

  request("browser-a");
  request("browser-a");
  request("browser-b");
  request("browser-a", "/api/stats");
  await flushWrites();
  assert.equal(records.length, 3);

  now += 1500;
  request("browser-a");
  await flushWrites();
  assert.equal(records.length, 4);
  assert.equal(records[0].path, "/api/tips");
  assert.equal(records[0].event, "GET /api/tips");
});

test("usage tracking ignores non-API requests", async () => {
  const records = [];
  const tracker = createUsageTracker({ usageEvent: { create: async ({ data }) => records.push(data) } });
  const req = { originalUrl: "/health", method: "GET", get: () => "browser-a" };
  const res = makeResponse();
  tracker(req, res, () => {});
  res.finish();
  await flushWrites();
  assert.deepEqual(records, []);
});
