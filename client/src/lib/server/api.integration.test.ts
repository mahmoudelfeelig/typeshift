import assert from "node:assert/strict";
import test from "node:test";
import { resetMemoryState } from "./memory-state";
import { handleApiRequest } from "./api";

const env = {
  JWT_SESSION_SECRET: "integration-test-secret-1234567890",
  NEXTJS_ENV: "test",
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const url = new URL(path, "https://typeshift.test/api/v1/");
  const routePath = url.pathname.replace(/^\/api\/v1\//, "").split("/").filter(Boolean);
  const request = new Request(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      "user-agent": "TypeShift Integration Test",
      "cf-connecting-ip": "127.0.0.1",
      ...(init?.headers ?? {}),
    },
  });
  const response = await handleApiRequest(request, routePath, env);
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

test.beforeEach(() => {
  resetMemoryState();
});

test("leaderboard session flow submits and lists a score", async () => {
  const init = await requestJson<{ sessionId: string; token: string }>("session/init", {
    method: "POST",
    body: JSON.stringify({ mode: "time" }),
  });
  assert.equal(init.status, 201);

  const username = `pilot${Date.now().toString().slice(-6)}`;
  const submit = await requestJson<{ ok: true }>("leaderboard/submit", {
    method: "POST",
    headers: {
      authorization: `Bearer ${init.body.token}`,
    },
    body: JSON.stringify({
      sessionId: init.body.sessionId,
      mode: "time",
      username,
      wpm: 92,
      raw: 101,
      accuracy: 96,
      errors: 8,
      streak: 31,
      durationMs: 60_000,
      certified: false,
    }),
  });
  assert.equal(submit.status, 201);

  const board = await requestJson<{ entries: Array<{ username: string; wpm: number }> }>(
    "leaderboard?mode=time&limit=10",
  );
  assert.equal(board.status, 200);
  assert.ok(board.body.entries.some((entry) => entry.username === username && entry.wpm === 92));
});

test("challenge flow accepts a valid daily score and exposes it on the board", async () => {
  const daily = await requestJson<{ challenge: { date: string; mode: string; durationSec: number } }>(
    "challenge/daily",
  );
  assert.equal(daily.status, 200);

  const init = await requestJson<{ sessionId: string; token: string }>("session/init", {
    method: "POST",
    body: JSON.stringify({ mode: daily.body.challenge.mode }),
  });
  assert.equal(init.status, 201);

  const username = `daily${Date.now().toString().slice(-6)}`;
  const submit = await requestJson<{ ok: true; points: number }>("challenge/submit", {
    method: "POST",
    headers: {
      authorization: `Bearer ${init.body.token}`,
    },
    body: JSON.stringify({
      sessionId: init.body.sessionId,
      challengeDate: daily.body.challenge.date,
      mode: daily.body.challenge.mode,
      username,
      wpm: 81,
      raw: 90,
      accuracy: 95,
      errors: 6,
      streak: 24,
      durationMs: daily.body.challenge.durationSec * 1000,
    }),
  });
  assert.equal(submit.status, 201);
  assert.ok(submit.body.points > 0);

  const board = await requestJson<{ entries: Array<{ username: string }> }>(
    `challenge/leaderboard?date=${daily.body.challenge.date}&limit=10`,
  );
  assert.equal(board.status, 200);
  assert.ok(board.body.entries.some((entry) => entry.username === username));
});

test("account lifecycle supports sessions, password rotation, export, replay sharing, and deletion", async () => {
  const handle = `pilot${Date.now().toString().slice(-6)}`;
  const register = await requestJson<{ token: string; account: { handle: string } }>("account/register", {
    method: "POST",
    body: JSON.stringify({
      handle,
      password: "TestPassword123",
      locale: "en",
    }),
  });
  assert.equal(register.status, 201);

  const secondLogin = await requestJson<{ token: string }>("account/login", {
    method: "POST",
    body: JSON.stringify({
      handle,
      password: "TestPassword123",
    }),
  });
  assert.equal(secondLogin.status, 200);

  const sessions = await requestJson<{ sessions: Array<{ id: string; isCurrent: boolean }> }>(
    "account/sessions",
    {
      headers: { authorization: `Bearer ${register.body.token}` },
    },
  );
  assert.equal(sessions.status, 200);
  assert.equal(sessions.body.sessions.length, 2);

  const replayShare = await requestJson<{ id: string }>("replay/share", {
    method: "POST",
    headers: { authorization: `Bearer ${register.body.token}` },
    body: JSON.stringify({
      mode: "time",
      title: "Integration replay",
      replay: { samples: [1, 2, 3] },
      isPublic: true,
    }),
  });
  assert.equal(replayShare.status, 201);

  const replayFetch = await requestJson<{ id: string; title: string }>(`replay/share/${replayShare.body.id}`);
  assert.equal(replayFetch.status, 200);
  assert.equal(replayFetch.body.title, "Integration replay");

  const revokeOthers = await requestJson<{ ok: true }>("account/logout-others", {
    method: "POST",
    headers: {
      authorization: `Bearer ${register.body.token}`,
    },
    body: JSON.stringify({}),
  });
  assert.equal(revokeOthers.status, 200);

  const revokedSessionCheck = await requestJson<{ error: string }>("account/me", {
    headers: { authorization: `Bearer ${secondLogin.body.token}` },
  });
  assert.equal(revokedSessionCheck.status, 401);

  const passwordChange = await requestJson<{ ok: true }>("account/password", {
    method: "POST",
    headers: {
      authorization: `Bearer ${register.body.token}`,
    },
    body: JSON.stringify({
      currentPassword: "TestPassword123",
      newPassword: "NewPassword123",
    }),
  });
  assert.equal(passwordChange.status, 200);

  const loginOldPassword = await requestJson<{ error: string }>("account/login", {
    method: "POST",
    body: JSON.stringify({
      handle,
      password: "TestPassword123",
    }),
  });
  assert.equal(loginOldPassword.status, 401);

  const loginNewPassword = await requestJson<{ token: string }>("account/login", {
    method: "POST",
    body: JSON.stringify({
      handle,
      password: "NewPassword123",
    }),
  });
  assert.equal(loginNewPassword.status, 200);

  const exportPayload = await requestJson<Record<string, unknown>>("account/export", {
    headers: { authorization: `Bearer ${loginNewPassword.body.token}` },
  });
  assert.equal(exportPayload.status, 200);
  assert.equal((exportPayload.body.account as { handle?: string } | undefined)?.handle, handle);

  const deletion = await requestJson<{ ok: true; deleted: boolean }>("account", {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${loginNewPassword.body.token}`,
    },
    body: JSON.stringify({ confirmHandle: handle }),
  });
  assert.equal(deletion.status, 200);
  assert.equal(deletion.body.deleted, true);

  const deletedLogin = await requestJson<{ error: string }>("account/login", {
    method: "POST",
    body: JSON.stringify({
      handle,
      password: "NewPassword123",
    }),
  });
  assert.equal(deletedLogin.status, 401);
});

test("privacy analytics aggregates and summarizes events", async () => {
  const first = await requestJson<{ ok: true }>("privacy/analytics", {
    method: "POST",
    body: JSON.stringify({
      event: "page_view",
      page: "play",
      theme: "dark",
      consentVersion: 1,
      telemetry: {
        viewportBucket: "lg",
        reducedMotion: false,
      },
    }),
  });
  assert.equal(first.status, 202);

  const second = await requestJson<{ ok: true }>("privacy/analytics", {
    method: "POST",
    body: JSON.stringify({
      event: "run_finish",
      page: "play",
      mode: "time",
      theme: "dark",
      consentVersion: 1,
      telemetry: {
        viewportBucket: "lg",
        reducedMotion: false,
      },
    }),
  });
  assert.equal(second.status, 202);

  const summary = await requestJson<{ totals: Record<string, number>; rows: Array<{ eventName: string }> }>(
    "privacy/analytics/summary?days=14",
  );
  assert.equal(summary.status, 200);
  assert.equal(summary.body.totals.page_view, 1);
  assert.equal(summary.body.totals.run_finish, 1);
  assert.ok(summary.body.rows.some((row) => row.eventName === "page_view"));
});

test("social routes support friends, duel queues, races, tournaments, and webhooks", async () => {
  const alphaHandle = `alpha${Date.now().toString().slice(-6)}`;
  const betaHandle = `beta${Date.now().toString().slice(-6)}`;
  const alpha = await requestJson<{ token: string; account: { handle: string } }>("account/register", {
    method: "POST",
    body: JSON.stringify({ handle: alphaHandle, password: "TestPassword123" }),
  });
  const beta = await requestJson<{ token: string; account: { handle: string } }>("account/register", {
    method: "POST",
    body: JSON.stringify({ handle: betaHandle, password: "TestPassword123" }),
  });
  assert.equal(alpha.status, 201);
  assert.equal(beta.status, 201);

  const request = await requestJson<{ requestId: string }>("friends/request", {
    method: "POST",
    headers: { authorization: `Bearer ${alpha.body.token}` },
    body: JSON.stringify({ handle: betaHandle }),
  });
  assert.equal(request.status, 201);

  const response = await requestJson<{ status: string }>("friends/respond", {
    method: "POST",
    headers: { authorization: `Bearer ${beta.body.token}` },
    body: JSON.stringify({ requestId: request.body.requestId, accept: true }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "accepted");

  const friends = await requestJson<{ friends: Array<{ handle: string }> }>("friends/list", {
    headers: { authorization: `Bearer ${alpha.body.token}` },
  });
  assert.equal(friends.status, 200);
  assert.ok(friends.body.friends.some((friend) => friend.handle === betaHandle));

  const waiting = await requestJson<{ status: string }>("matchmaking/ranked/enqueue", {
    method: "POST",
    headers: { authorization: `Bearer ${alpha.body.token}` },
    body: JSON.stringify({}),
  });
  assert.equal(waiting.status, 202);

  const matched = await requestJson<{ status: string; duel: { id: string } }>("matchmaking/ranked/enqueue", {
    method: "POST",
    headers: { authorization: `Bearer ${beta.body.token}` },
    body: JSON.stringify({}),
  });
  assert.equal(matched.status, 200);
  assert.equal(matched.body.status, "matched");

  const duelUpdate = await requestJson<{ ok: true; duel: { status: string } }>("duel/update", {
    method: "POST",
    headers: { authorization: `Bearer ${alpha.body.token}` },
    body: JSON.stringify({
      duelId: matched.body.duel.id,
      progress: 100,
      wpm: 88,
      accuracy: 97,
      finished: true,
    }),
  });
  assert.equal(duelUpdate.status, 200);
  assert.equal(duelUpdate.body.ok, true);

  const race = await requestJson<{ roomId: string; playerId: string; room: { status: string } }>("race/create", {
    method: "POST",
    body: JSON.stringify({ mode: "time", name: "Alpha" }),
  });
  assert.equal(race.status, 201);

  const joined = await requestJson<{ playerId: string; room: { players: unknown[] } }>("race/join", {
    method: "POST",
    body: JSON.stringify({ roomId: race.body.roomId, name: "Beta" }),
  });
  assert.equal(joined.status, 201);
  assert.equal(joined.body.room.players.length, 2);

  const started = await requestJson<{ ok: true; room: { status: string } }>("race/start", {
    method: "POST",
    body: JSON.stringify({ roomId: race.body.roomId, playerId: race.body.playerId }),
  });
  assert.equal(started.status, 200);
  assert.equal(started.body.room.status, "running");

  const tournament = await requestJson<{ tournament: { id: string; matches: Array<{ id: string; playerAId: string | null }> } }>(
    "tournament/create",
    {
      method: "POST",
      body: JSON.stringify({ mode: "time", name: "CV Cup", entrants: ["Alpha", "Beta", "Gamma"] }),
    },
  );
  assert.equal(tournament.status, 201);
  assert.ok(tournament.body.tournament.matches.length > 0);

  const webhook = await requestJson<{ id: string; secret: string }>("webhooks/register", {
    method: "POST",
    headers: { authorization: `Bearer ${alpha.body.token}` },
    body: JSON.stringify({ targetUrl: "https://example.com/typeshift-hook", events: ["webhook.test"] }),
  });
  assert.equal(webhook.status, 201);
  assert.ok(webhook.body.secret);

  const webhookTest = await requestJson<{ ok: true }>(`webhooks/test/${webhook.body.id}`, {
    method: "POST",
    headers: { authorization: `Bearer ${alpha.body.token}` },
    body: JSON.stringify({}),
  });
  assert.equal(webhookTest.status, 200);
  assert.equal(webhookTest.body.ok, true);
});
