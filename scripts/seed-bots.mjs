const baseUrl = (process.argv[2] ?? process.env.TYPESHIFT_URL ?? "https://typeshift.elfeel.me").replace(/\/$/, "");
const accountToken = process.env.ACCOUNT_TOKEN;
const seedToken = process.env.BOT_SEED_TOKEN;

if (!accountToken || !seedToken) {
  console.error("ACCOUNT_TOKEN and BOT_SEED_TOKEN are required.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/v1/admin/seed-bots`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${accountToken}`,
    "x-bot-seed-token": seedToken,
  },
  body: JSON.stringify({ botCount: 12 }),
});

const body = await response.text();
if (!response.ok) {
  console.error(body);
  process.exit(1);
}

console.log(body);
