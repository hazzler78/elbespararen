#!/usr/bin/env node

/**
 * Checks whether the provided email addresses exist as subscribers in MailerLite.
 *
 * Usage examples:
 *   node scripts/mailerlite-check-subscribers.js --input=emails.txt
 *   node scripts/mailerlite-check-subscribers.js alice@example.com bob@example.com
 *   cat emails.txt | node scripts/mailerlite-check-subscribers.js
 *
 * Options:
 *   --input=<path>   Read newline-separated emails from a file.
 *   --json           Output machine-readable JSON instead of human-readable text.
 *
 * The script loads environment variables from .env.local/.env (without overriding existing process.env values).
 */

const fs = require("node:fs");
const path = require("node:path");

const HELP_TEXT = `
MailerLite subscriber lookup
----------------------------

Examples:
  node scripts/mailerlite-check-subscribers.js --input=emails.txt
  node scripts/mailerlite-check-subscribers.js alice@example.com bob@example.com
  cat emails.txt | node scripts/mailerlite-check-subscribers.js

Options:
  --input=<path>   Read newline-separated emails from file
  --json           Output JSON instead of text
  --help           Show this help text
`.trim();

function loadEnvFiles() {
  const envFiles = [".env.local", ".env"];

  for (const fileName of envFiles) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;

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
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;

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
    outputJson: false,
    emails: [],
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--json") {
      options.outputJson = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=", 2);
      if (key === "input") {
        options.inputFile = value;
      } else {
        console.warn(`[mailerlite] Ignoring unknown option: --${key}`);
      }
      continue;
    }
    options.emails.push(arg);
  }

  return options;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function parseEmailsFromText(text) {
  const separators = /[\r\n;,]+/;
  const raw = text
    .split(separators)
    .map(normalizeEmail)
    .filter(Boolean);
  return Array.from(new Set(raw));
}

async function readEmails(options) {
  let emails = [];

  if (options.inputFile) {
    const filePath = path.resolve(process.cwd(), options.inputFile);
    const contents = fs.readFileSync(filePath, "utf8");
    emails = emails.concat(parseEmailsFromText(contents));
  }

  if (options.emails.length > 0) {
    emails = emails.concat(parseEmailsFromText(options.emails.join("\n")));
  }

  if (emails.length === 0 && !process.stdin.isTTY) {
    const stdinData = await new Promise((resolve, reject) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        data += chunk;
      });
      process.stdin.on("end", () => resolve(data));
      process.stdin.on("error", (err) => reject(err));
    });

    emails = emails.concat(parseEmailsFromText(stdinData));
  }

  emails = emails.map(normalizeEmail).filter(Boolean);
  return Array.from(new Set(emails));
}

async function fetchSubscriber(email, apiKey) {
  const endpoint = `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return { email, exists: false };
  }

  const bodyText = await response.text();
  if (!response.ok) {
    return {
      email,
      exists: false,
      error: `Request failed (${response.status} ${response.statusText}): ${bodyText}`,
    };
  }

  let payload = undefined;
  try {
    payload = bodyText ? JSON.parse(bodyText) : undefined;
  } catch (err) {
    return {
      email,
      exists: true,
      status: "unknown",
      note: "Subscriber returned but response was not JSON",
    };
  }

  const status = payload?.data?.status ?? payload?.status ?? payload?.data?.attributes?.status;
  return {
    email,
    exists: true,
    status: status ?? "unknown",
    raw: payload,
  };
}

async function main() {
  loadEnvFiles();
  const options = parseArgs();

  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error("MAILERLITE_API_KEY is missing. Set it in your environment or .env file.");
    process.exitCode = 1;
    return;
  }

  let emails;
  try {
    emails = await readEmails(options);
  } catch (err) {
    console.error(`[mailerlite] Failed to read emails: ${String(err)}`);
    process.exitCode = 1;
    return;
  }

  if (emails.length === 0) {
    console.error("No email addresses provided. Use --input=<file>, pass emails as arguments, or pipe via stdin.");
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (const email of emails) {
    try {
      const lookup = await fetchSubscriber(email, apiKey);
      results.push(lookup);
    } catch (err) {
      results.push({
        email,
        exists: false,
        error: `Lookup failed: ${String(err)}`,
      });
    }
  }

  const total = results.length;
  const existing = results.filter((r) => r.exists).length;
  const missing = total - existing;
  const withErrors = results.filter((r) => r.error).length;

  if (options.outputJson) {
    console.log(
      JSON.stringify(
        {
          summary: {
            total,
            existing,
            missing,
            errors: withErrors,
          },
          results: results.map(({ raw, ...rest }) => rest),
        },
        null,
        2
      )
    );
    return;
  }

  console.log("📬 MailerLite subscriber lookup");
  console.log(`  total checked:  ${total}`);
  console.log(`  found:          ${existing}`);
  console.log(`  missing:        ${missing}`);
  if (withErrors > 0) {
    console.log(`  errors:         ${withErrors}`);
  }
  console.log("");

  for (const item of results) {
    if (item.exists) {
      console.log(`✅ ${item.email} (${item.status})`);
    } else if (item.error) {
      console.log(`⚠️  ${item.email} (error: ${item.error})`);
    } else {
      console.log(`❌ ${item.email} (not found)`);
    }
  }
}

main().catch((err) => {
  console.error("[mailerlite] Unexpected error:", err);
  process.exitCode = 1;
});




