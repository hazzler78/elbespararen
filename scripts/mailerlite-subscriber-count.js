#!/usr/bin/env node

/**
 * Fetches the MailerLite subscriber count.
 *
 * Usage:
 *   MAILERLITE_API_KEY=xxx node scripts/mailerlite-subscriber-count.js [groupId]
 *
 *   Optional flags:
 *     --group=<id>          Specify a group to filter subscribers.
 *     --status=<status>     Filter by subscriber status (active, unsubscribed, unconfirmed, bounced, junk, unverified).
 *     --limit=<number>      Limit the number of records returned (default: 1 for minimal payload).
 *
 * The script prints the total subscriber count as reported by MailerLite.
 *
 * Requires Node.js 18+ for the built-in fetch implementation.
 */

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 1000;
const MAX_PAGES = 1000;

const HELP_TEXT = `
Mailerlite subscriber count
---------------------------

Examples:
  MAILERLITE_API_KEY=xxx node scripts/mailerlite-subscriber-count.js
  MAILERLITE_API_KEY=xxx node scripts/mailerlite-subscriber-count.js --group=169680723602572313
  MAILERLITE_API_KEY=xxx node scripts/mailerlite-subscriber-count.js --status=active

Available flags:
  --group=<id>      Filter subscribers by group ID
  --status=<value>  Filter by status (active, unsubscribed, unconfirmed, bounced, junk, unverified)
  --limit=<number>  Page size while counting (default: 100, max: 1000)
  --help            Show this help text
`.trim();

function loadEnvFiles() {
  const envFiles = [
    ".env.local",
    ".env",
  ];

  for (const fileName of envFiles) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    let contents;
    try {
      contents = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      console.warn(`[mailerlite] Failed to read ${fileName}: ${String(err)}`);
      continue;
    }

    const lines = contents.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env) && key) {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: DEFAULT_PAGE_SIZE,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }

    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=", 2);
      if (key === "group") {
        options.groupId = value;
      } else if (key === "status") {
        options.status = value;
      } else if (key === "limit") {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          options.limit = Math.min(parsed, MAX_PAGE_SIZE);
        } else {
          console.warn(`[mailerlite] Ignoring invalid limit value: ${value}`);
        }
      } else {
        console.warn(`[mailerlite] Ignoring unknown flag: --${key}`);
      }
    } else if (!options.groupId) {
      // Support positional argument for group id
      options.groupId = arg;
    } else {
      console.warn(`[mailerlite] Ignoring unexpected argument: ${arg}`);
    }
  }

  return options;
}

async function fetchSubscriberCount(options) {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Please use Node.js 18+ or enable experimental fetch.");
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    const msg = "MAILERLITE_API_KEY is missing. Set it in your environment (e.g. via .env or before the command).";
    throw new Error(msg);
  }

  const url = new URL("https://connect.mailerlite.com/api/subscribers");
  const pageSize = Math.min(Math.max(Number(options.limit || DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
  let nextCursor = undefined;
  let requestCount = 0;
  let totalDurationMs = 0;
  let aggregatedCount = 0;
  let totalFromMeta = undefined;
  const seenCursors = new Set();

  do {
    url.search = "";
    url.searchParams.set("limit", String(pageSize));

    if (options.groupId) {
      url.searchParams.set("filter[group_id]", options.groupId);
    }

    if (options.status) {
      url.searchParams.set("filter[status]", options.status);
    }

    if (nextCursor) {
      url.searchParams.set("cursor", nextCursor);
    }

    const start = Date.now();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const durationMs = Date.now() - start;
    requestCount += 1;
    totalDurationMs += durationMs;

    let bodyText;
    try {
      bodyText = await response.text();
    } catch (err) {
      throw new Error(`Failed to read MailerLite response: ${String(err)}`);
    }

    if (!response.ok) {
      throw new Error(
        `MailerLite request failed (${response.status} ${response.statusText}) in ${durationMs}ms\n` +
          `URL: ${url.toString()}\n` +
          `Response: ${bodyText}`
      );
    }

    let payload;
    try {
      payload = bodyText ? JSON.parse(bodyText) : {};
    } catch (err) {
      throw new Error(`MailerLite response is not valid JSON: ${String(err)}\nPayload: ${bodyText}`);
    }

    if (typeof payload?.meta?.total === "number" && typeof totalFromMeta !== "number") {
      totalFromMeta = payload.meta.total;
    }

    const dataLength = Array.isArray(payload?.data) ? payload.data.length : 0;
    aggregatedCount += dataLength;

    nextCursor = payload?.meta?.next_cursor;

    if (!nextCursor || dataLength === 0) {
      return {
        total: typeof totalFromMeta === "number" ? totalFromMeta : aggregatedCount,
        requestMs: totalDurationMs,
        requests: requestCount,
        aggregatedCount,
        pageSize,
      };
    }

    if (seenCursors.has(nextCursor)) {
      throw new Error("Detected repeating cursor from MailerLite response. Aborting to avoid a loop.");
    }
    seenCursors.add(nextCursor);

    if (requestCount >= MAX_PAGES) {
      throw new Error(`Exceeded maximum number of pages (${MAX_PAGES}). Aborting.`);
    }
  } while (true);
}

async function main() {
  loadEnvFiles();
  const options = parseArgs();

  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  try {
    const result = await fetchSubscriberCount(options);

    const lines = [
      "📬 MailerLite subscribers",
      `  total:          ${result.total}`,
      `  aggregated:     ${result.aggregatedCount}`,
      `  api requests:   ${result.requests}`,
      `  page size:      ${result.pageSize}`,
      `  request time:   ${result.requestMs}ms`,
    ];

    if (options.groupId) {
      lines.push(`  group filter:   ${options.groupId}`);
    }

    if (options.status) {
      lines.push(`  status filter:  ${options.status}`);
    }

    console.log(lines.join("\n"));
  } catch (error) {
    console.error("[mailerlite] Failed to fetch subscriber count.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[mailerlite] Unexpected error:", err);
  process.exitCode = 1;
});


