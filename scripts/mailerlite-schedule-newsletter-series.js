/**
 * Create + schedule the Elbespararen 24-week newsletter series.
 *
 * Usage:
 *   node scripts/mailerlite-schedule-newsletter-series.js           # dry-run
 *   node scripts/mailerlite-schedule-newsletter-series.js --execute # create+schedule
 *   node scripts/mailerlite-schedule-newsletter-series.js --execute --from=1 --to=4
 *
 * Reads MAILERLITE_API_KEY from .env / .env.local
 * Audience: Elbespararen nyhetsbrev (group in data file)
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

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const fromArg = args.find((a) => a.startsWith("--from="));
const toArg = args.find((a) => a.startsWith("--to="));
const FROM_N = fromArg ? Number(fromArg.split("=")[1]) : 1;
const TO_N = toArg ? Number(toArg.split("=")[1]) : 24;

const dataPath = path.resolve(
  process.cwd(),
  "scripts/data/newsletter-24-weeks.json"
);
const series = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const API_KEY = process.env.MAILERLITE_API_KEY;
if (!API_KEY) {
  console.error("Missing MAILERLITE_API_KEY");
  process.exit(1);
}

const GROUP_ID = series.groupId || process.env.MAILERLITE_GROUP_NEWSLETTER;
const BASE = "https://connect.mailerlite.com/api";

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const weeks = series.weeks.filter((w) => w.n >= FROM_N && w.n <= TO_N);
  console.log(
    `${EXECUTE ? "EXECUTE" : "DRY-RUN"} · ${weeks.length} campaigns · group ${GROUP_ID}`
  );
  // Default sender for Elbespararen brand (verified on ML account)
  const fromEmail = series.fromEmail || "info@elbespararen.se";
  const replyTo = series.replyTo || "info@elbespararen.se";
  console.log(
    `From: ${series.fromName} <${fromEmail}> · Reply-To: ${replyTo}`
  );

  const results = [];

  for (const week of weeks) {
    const sendDate = addDays(series.startDate, (week.n - 1) * 7);
    const name = `EB V${String(week.n).padStart(2, "0")} · ${week.title}`;
    const html = buildNewsletterHtml(week);

    console.log(`\n[${week.n}] ${sendDate} · ${week.subject}`);

    if (!EXECUTE) {
      results.push({ n: week.n, sendDate, name, dry: true });
      continue;
    }

    const createBody = {
      name,
      type: "regular",
      emails: [
        {
          subject: week.subject,
          from_name: series.fromName,
          from: fromEmail,
          reply_to: replyTo,
          content: html,
        },
      ],
      groups: [String(GROUP_ID)],
    };

    const created = await api("POST", "/campaigns", createBody);
    if (!created.ok) {
      console.error("CREATE_FAIL", created.status, JSON.stringify(created.json).slice(0, 400));
      results.push({ n: week.n, error: "create", detail: created.json });
      continue;
    }

    const campaignId = created.json.data?.id;
    console.log("created", campaignId);

    const scheduled = await api("POST", `/campaigns/${campaignId}/schedule`, {
      delivery: "scheduled",
      schedule: {
        date: sendDate,
        hours: series.sendHour,
        minutes: series.sendMinute,
        timezone_id: series.timezoneId,
      },
    });

    if (!scheduled.ok) {
      console.error(
        "SCHEDULE_FAIL",
        scheduled.status,
        JSON.stringify(scheduled.json).slice(0, 400)
      );
      results.push({
        n: week.n,
        campaignId,
        sendDate,
        error: "schedule",
        detail: scheduled.json,
      });
      continue;
    }

    console.log("scheduled OK", sendDate, `${series.sendHour}:${series.sendMinute}`);
    results.push({ n: week.n, campaignId, sendDate, ok: true });

    // gentle rate limit
    await new Promise((r) => setTimeout(r, 400));
  }

  const outPath = path.resolve(
    process.cwd(),
    "scripts/data/newsletter-24-schedule-result.json"
  );
  fs.writeFileSync(outPath, JSON.stringify({ when: new Date().toISOString(), results }, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(
    EXECUTE
      ? "Done. Review in MailerLite → Campaigns (scheduled)."
      : "Dry-run only. Re-run with --execute to create + schedule."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
