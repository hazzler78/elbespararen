/**
 * Cancel ready EB campaigns, refresh responsive HTML, keep From, re-schedule.
 *
 *   node scripts/mailerlite-refresh-campaign-html.js --execute
 */

const fs = require("node:fs");
const path = require("node:path");
const { buildNewsletterHtml } = require("./lib/newsletter-html");

function loadEnv(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env");
loadEnv(".env.local");

const EXECUTE = process.argv.includes("--execute");
const KEY = process.env.MAILERLITE_API_KEY;
const BASE = "https://connect.mailerlite.com/api";
const FROM = "info@elbespararen.se";
const FROM_NAME = "Elbespararen";
const TIMEZONE_ID = 363;

const series = JSON.parse(
  fs.readFileSync(path.resolve("scripts/data/newsletter-24-weeks.json"), "utf8")
);

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekNum(name) {
  const m = String(name || "").match(/EB V(\d+)/i);
  return m ? Number(m[1]) : null;
}

const headers = {
  Authorization: `Bearer ${KEY}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  if (!KEY) {
    console.error("Missing MAILERLITE_API_KEY");
    process.exit(1);
  }

  await api("PUT", "/account", { show_powered_by: false });

  const ready = await api("GET", "/campaigns?limit=100&filter[status]=ready");
  const draft = await api("GET", "/campaigns?limit=100&filter[status]=draft");
  const all = [...(ready.json.data || []), ...(draft.json.data || [])].filter(
    (c) => String(c.name || "").startsWith("EB V")
  );
  const byId = new Map();
  for (const c of all) byId.set(c.id, c);
  const campaigns = [...byId.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );

  console.log(`${EXECUTE ? "EXECUTE" : "DRY-RUN"} · ${campaigns.length} campaigns`);

  let ok = 0;
  let fail = 0;

  for (const c of campaigns) {
    const n = weekNum(c.name);
    const week = series.weeks.find((w) => w.n === n);
    if (!week) {
      console.error("NO_WEEK_DATA", c.name);
      fail++;
      continue;
    }
    const date =
      (c.scheduled_for && String(c.scheduled_for).slice(0, 10)) ||
      addDays(series.startDate, (n - 1) * 7);
    const html = buildNewsletterHtml(week);
    console.log(`\n${c.name} → ${date}`);

    if (!EXECUTE) continue;

    if (c.status === "ready") {
      const cancel = await api("POST", `/campaigns/${c.id}/cancel`, {});
      if (!cancel.ok) {
        console.error("CANCEL_FAIL", cancel.status);
        fail++;
        continue;
      }
    }

    const put = await api("PUT", `/campaigns/${c.id}`, {
      name: c.name,
      emails: [
        {
          subject: week.subject,
          from_name: FROM_NAME,
          from: FROM,
          reply_to: FROM,
          content: html,
        },
      ],
    });
    if (!put.ok) {
      console.error("UPDATE_FAIL", put.status, JSON.stringify(put.json).slice(0, 300));
      fail++;
      continue;
    }
    console.log("html updated (responsive)");

    const sched = await api("POST", `/campaigns/${c.id}/schedule`, {
      delivery: "scheduled",
      schedule: {
        date,
        hours: "08",
        minutes: "30",
        timezone_id: TIMEZONE_ID,
      },
    });
    if (!sched.ok) {
      console.error("SCHEDULE_FAIL", sched.status, JSON.stringify(sched.json).slice(0, 300));
      fail++;
      continue;
    }
    console.log("re-scheduled OK");
    ok++;
    await new Promise((r) => setTimeout(r, 350));
  }

  if (EXECUTE) console.log(`\nDone. ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
