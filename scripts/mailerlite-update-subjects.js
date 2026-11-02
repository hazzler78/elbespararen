/**
 * Cancel ready EB campaigns whose subject differs from newsletter-24-weeks.json,
 * update subject (keep existing HTML), re-schedule at 08:30 local.
 *
 *   node scripts/mailerlite-update-subjects.js           # dry-run
 *   node scripts/mailerlite-update-subjects.js --execute
 */

const fs = require("node:fs");
const path = require("node:path");

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

  const changes = [];
  let skip = 0;
  let ok = 0;
  let fail = 0;

  console.log(`${EXECUTE ? "EXECUTE" : "DRY-RUN"} · scanning ${campaigns.length} campaigns`);

  for (const c of campaigns) {
    const n = weekNum(c.name);
    const week = series.weeks.find((w) => w.n === n);
    if (!week) {
      console.error("NO_WEEK_DATA", c.name);
      fail++;
      continue;
    }

    const currentSubject = c.emails?.[0]?.subject || "";
    if (currentSubject === week.subject) {
      skip++;
      continue;
    }

    const date =
      (c.scheduled_for && String(c.scheduled_for).slice(0, 10)) || null;
    if (!date) {
      console.error("NO_DATE", c.name);
      fail++;
      continue;
    }

    const row = {
      n,
      name: c.name,
      from: currentSubject,
      to: week.subject,
      date,
      status: c.status,
    };
    changes.push(row);
    console.log(`\n[V${String(n).padStart(2, "0")}] ${date}`);
    console.log(`  OLD: ${currentSubject}`);
    console.log(`  NEW: ${week.subject}`);

    if (!EXECUTE) continue;

    // Fetch full campaign for HTML content (list payload may omit it)
    const full = await api("GET", `/campaigns/${c.id}`);
    const content = full.json?.emails?.[0]?.content;
    if (!full.ok || !content) {
      console.error("GET_CONTENT_FAIL", full.status);
      fail++;
      continue;
    }

    if (c.status === "ready" || full.json?.status === "ready") {
      const cancel = await api("POST", `/campaigns/${c.id}/cancel`, {});
      if (!cancel.ok) {
        console.error("CANCEL_FAIL", cancel.status, JSON.stringify(cancel.json).slice(0, 200));
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
          content,
        },
      ],
    });
    if (!put.ok) {
      console.error("UPDATE_FAIL", put.status, JSON.stringify(put.json).slice(0, 300));
      fail++;
      continue;
    }

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
    console.log("  updated + re-scheduled OK");
    ok++;
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(
    `\n${EXECUTE ? "Done" : "Dry-run"}. change=${changes.length} ok=${ok} skip=${skip} fail=${fail}`
  );
  fs.writeFileSync(
    path.resolve("scripts/data/newsletter-subject-update-result.json"),
    JSON.stringify(
      { when: new Date().toISOString(), execute: EXECUTE, changes, ok, skip, fail },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
