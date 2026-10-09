const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const backendDir = path.resolve(__dirname, "..");

function runService(source, testBody) {
  const script = `
    const assert = require('node:assert/strict');
    const Module = require('node:module');
    const originalLoad = Module._load;
    const calls = [];
    const prisma = {
      tip: {
        create: async (args) => { calls.push(['tip.create', args]); return args.data; },
        findUnique: async (args) => { calls.push(['tip.findUnique', args]); return global.__tipFindUnique === undefined ? { id: args.where.id, status: 'PENDING', outcome: 'PENDING', settledAt: null } : global.__tipFindUnique; },
        update: async (args) => { calls.push(['tip.update', args]); return args.data; },
        updateMany: async (args) => { calls.push(['tip.updateMany', args]); return { count: global.__updatedCount ?? 0 }; },
        count: async (args) => { calls.push(['tip.count', args]); return global.__count ?? 0; },
        findMany: async (args) => { calls.push(['tip.findMany', args]); return global.__tips ?? []; },
      },
      tipPublication: {
        findUnique: async (args) => { calls.push(['tipPublication.findUnique', args]); return global.__publication ?? null; },
        upsert: async (args) => { calls.push(['tipPublication.upsert', args]); return args.create; },
        update: async (args) => { calls.push(['tipPublication.update', args]); return args.data; },
      },
      product: {
        findUnique: async (args) => { calls.push(['product.findUnique', args]); return global.__product ?? null; },
        create: async (args) => { calls.push(['product.create', args]); return args.data; },
        update: async (args) => { calls.push(['product.update', args]); return args.data; },
        findMany: async (args) => { calls.push(['product.findMany', args]); return []; },
      },
      user: { findUnique: async (args) => { calls.push(['user.findUnique', args]); return global.__users ? (global.__users[args.where.id] ?? null) : (global.__user ?? null); } },
      accessToken: {
        findUnique: async (args) => { calls.push(['accessToken.findUnique', args]); return global.__tokenMissing ? null : { id: args.where.id, status: 'ACTIVE', expiresAt: null, tokenPrefix: 'prefix', productId: 'prod-1', assignedUserId: 'user-1', product: { id: 'prod-1', name: 'VIP', slug: 'vip', type: 'VIP' }, assignedUser: { id: 'user-1', email: 'user@example.test', username: 'user' }, createdAt: new Date(), usedAt: null, notes: null }; },
        findFirst: async (args) => { calls.push(['accessToken.findFirst', args]); return global.__accessToken ?? null; },
        create: async (args) => { calls.push(['accessToken.create', args]); return { ...args.data, id: 'token-1' }; },
        update: async (args) => { calls.push(['accessToken.update', args]); return { id: args.where.id, ...args.data }; },
        delete: async (args) => { calls.push(['accessToken.delete', args]); return { id: args.where.id }; },
      },
    };
    Module._load = function(request, parent, isMain) {
      if (request === '../lib/prisma' && parent?.filename.endsWith(${JSON.stringify(source.split('/').at(-1) + '.js')})) return prisma;
      if (request === 'bcrypt') return { hash: async (value) => 'hashed:' + value, compare: async () => true };
      if (request === 'jsonwebtoken') return { sign: () => 'test-jwt' };
      return originalLoad.call(this, request, parent, isMain);
    };
    (async () => {
      const service = require(${JSON.stringify(source)});
      ${testBody}
    })().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
  `;
  const result = spawnSync(process.execPath, ["-e", script], { cwd: backendDir, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

runService("./services/tips.service", `
  await assert.rejects(service.createTip(null, {}), (error) => error.status === 401);
  await assert.rejects(service.updateTip('tip-1', null, { selection: 'X' }), (error) => error.status === 401);
  await assert.rejects(service.updateTipResult('tip-1', null, { outcome: 'WON' }), (error) => error.status === 401);
  await assert.rejects(service.deleteTip('tip-1', null), (error) => error.status === 401);
  assert.equal(calls.filter(([name]) => name.startsWith('tip.')).length, 0, 'unauthenticated mutation must not reach tip persistence');

  global.__tipFindUnique = { id: 'tip-1', status: 'PENDING', outcome: 'PENDING', settledAt: null };
  await assert.rejects(service.updateTip('tip-1', 'admin-1', { status: 'NOT_A_STATUS' }), (error) => error.status === 400);
  assert.equal(calls.filter(([name]) => name === 'tip.update').length, 0);

  await service.updateTip('tip-1', 'admin-1', { selection: 'Updated', status: 'PUBLISHED' });
  const update = calls.find(([name]) => name === 'tip.update')[1].data;
  assert.equal(update.selection, 'Updated');
  assert.equal(update.publishedById, 'admin-1');
  assert.ok(update.publishedAt instanceof Date);

  await service.updateTipResult('tip-1', 'admin-1', { outcome: 'WON', result: '2-0' });
  const settlement = calls.filter(([name]) => name === 'tip.update').at(-1)[1].data;
  assert.equal(settlement.status, 'SETTLED');
  assert.equal(settlement.outcome, 'WON');
  assert.equal(settlement.result, '2-0');
  assert.ok(settlement.settledAt instanceof Date);

  assert.deepEqual(service.validateTipIds(['a', 'a', 'b']), ['a', 'b']);
  assert.throws(() => service.validateTipIds([]), (error) => error.status === 400);
  assert.throws(() => service.validateTipIds('not-an-array'), (error) => error.status === 400);
`);

runService("./services/admin.service", `
  global.__users = {
    'ordinary-user': { id: 'ordinary-user', role: 'USER', status: 'ACTIVE' },
    'suspended-admin': { id: 'suspended-admin', role: 'ADMIN', status: 'SUSPENDED' },
    'admin-1': { id: 'admin-1', role: 'ADMIN', status: 'ACTIVE' },
    'user-1': { id: 'user-1', status: 'ACTIVE' },
    'suspended-user': { id: 'suspended-user', status: 'SUSPENDED' },
  };
  global.__product = { id: 'prod-1', status: 'ACTIVE' };
  global.__user = { id: 'user-1', status: 'ACTIVE' };
  await assert.rejects(service.createTip({ source: 'cli', sport: 'Football', market: 'Result', selection: 'Home' }), (error) => error.status === 401);
  await assert.rejects(service.createTip({ source: 'cli', sport: 'Football', market: 'Result', selection: 'Home' }, 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.updateTip('tip-1', { selection: 'Changed' }, 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.publishTip('tip-1', 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.unpublishTip('tip-1', 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.updateTipsBulk(['tip-1'], { outcome: 'WON' }, 'ordinary-user'), (error) => error.status === 403);
  assert.equal(calls.filter(([name]) => /^(tip\.|tipPublication\.)/.test(name) && !name.endsWith('.findUnique')).length, 0, 'unauthorized admin mutations must not write');

  await assert.rejects(service.createAccessToken({ productId: 'prod-1' }), (error) => error.status === 401);
  await assert.rejects(service.createAccessToken({ productId: 'prod-1' }, 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.createAccessToken({ productId: 'prod-1' }, 'suspended-admin'), (error) => error.status === 403);
  await assert.rejects(service.createAccessToken({ productId: 'prod-1' }, 'admin-1'), (error) => error.status === 400);
  assert.equal(calls.filter(([name]) => name === 'accessToken.create').length, 0);
  await assert.rejects(service.createAccessToken({ productId: 'prod-1', assignedUserId: 'user-1' }, 'ordinary-user'), (error) => error.status === 403);

  global.__users['user-1'] = { id: 'user-1', status: 'SUSPENDED' };
  await assert.rejects(service.createAccessToken({ productId: 'prod-1', assignedUserId: 'user-1' }, 'admin-1'), (error) => error.status === 400);
  assert.equal(calls.filter(([name]) => name === 'accessToken.create').length, 0);

  global.__users['user-1'] = { id: 'user-1', status: 'ACTIVE' };
  const issued = await service.createAccessToken({ productId: 'prod-1', assignedUserId: 'user-1' }, 'admin-1');
  assert.equal(issued.accessToken.assignedUserId, 'user-1');
  const createCall = calls.find(([name]) => name === 'accessToken.create')[1];
  assert.equal(createCall.data.assignedUserId, 'user-1');
  assert.ok(createCall.data.tokenHash);
  assert.notEqual(createCall.data.tokenHash, issued.token);

  await assert.rejects(service.updateAccessToken('token-1', { assignedUserId: 'user-2' }, 'admin-1'), (error) => error.status === 400);
  await assert.rejects(service.updateAccessToken('token-1', { status: 'NOT_A_STATUS' }, 'admin-1'), (error) => error.status === 400);
  await assert.rejects(service.deleteAccessToken('token-1'), (error) => error.status === 401);
  await assert.rejects(service.deleteAccessToken('token-1', 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.revokeAccessToken('token-1', 'ordinary-user'), (error) => error.status === 403);
  await assert.rejects(service.updateAccessToken('token-1', { notes: 'x' }, 'ordinary-user'), (error) => error.status === 403);

  // Revoke keeps the record; delete removes it. They must stay distinct.
  const revoked = await service.revokeAccessToken('token-1', 'admin-1');
  assert.equal(revoked.status, 'REVOKED');
  assert.equal(calls.filter(([name]) => name === 'accessToken.delete').length, 0, 'revoke must not delete');

  const deleted = await service.deleteAccessToken('token-1', 'admin-1');
  assert.equal(deleted.id, 'token-1');
  assert.ok(calls.some(([name]) => name === 'accessToken.delete'));

  // Deleting a token that does not exist reports 404 through the service.
  const deletesBeforeMissing = calls.filter(([name]) => name === 'accessToken.delete').length;
  global.__tokenMissing = true;
  await assert.rejects(service.deleteAccessToken('missing-token', 'admin-1'), (error) => error.status === 404);
  assert.equal(calls.filter(([name]) => name === 'accessToken.delete').length, deletesBeforeMissing, 'missing token must not reach delete');

  global.__tipFindUnique = {
    id: 'tip-with-selections',
    tips: [{ selection: 'Home Win', odds: 1.8 }, { selection: 'Over 2.5', odds: 2.1 }],
  };
  await assert.rejects(
    service.settleTip('tip-with-selections', 'WON', null, 'admin-1', ['WON']),
    (error) => error.status === 400
  );
  await assert.rejects(
    service.settleTip('tip-with-selections', 'WON', null, 'admin-1', ['WON', 'PENDING']),
    (error) => error.status === 400
  );
  const updatesBeforeSelectionSettlement = calls.filter(([name]) => name === 'tip.update').length;
  await service.settleTip('tip-with-selections', 'WON', 'Home 2-1', 'admin-1', ['WON', 'VOID']);
  assert.equal(calls.filter(([name]) => name === 'tip.update').length, updatesBeforeSelectionSettlement + 1, 'overall and selection outcomes save with one tip update');
  const settledSelections = calls.filter(([name]) => name === 'tip.update').at(-1)[1].data;
  assert.equal(settledSelections.status, 'SETTLED');
  assert.deepEqual(settledSelections.tips.map((selection) => selection.outcome), ['WON', 'VOID']);
  assert.equal(settledSelections.tips[1].selection, 'Over 2.5', 'settling selection outcomes preserves their source data');
`);
