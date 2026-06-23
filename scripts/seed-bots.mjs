const baseUrl = (process.argv[2] ?? process.env.TYPESHIFT_URL ?? "https://typeshift.elfeel.me").replace(/\/$/, "");
const token = process.env.METRICS_TOKEN;

if (!token) {
  console.error("METRICS_TOKEN is required.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/v1/admin/seed-bots`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-metrics-token": token,
  },
  body: JSON.stringify({ botCount: 12 }),
});

const body = await response.text();
if (!response.ok) {
  console.error(body);
  process.exit(1);
}

console.log(body);
