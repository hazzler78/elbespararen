/**
 * Shared responsive HTML for Elbespararen weekly newsletter campaigns.
 */

const CTA_URLS = {
  analyze: "https://elbespararen.se/upload",
  premium: "https://elbespararen.se/premium?checkout=1",
  contracts: "https://elbespararen.se/contracts",
  tips: "https://elbespararen.se/faq",
};

function utm(url, week) {
  const u = new URL(url);
  u.searchParams.set("utm_source", "mailerlite");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set(
    "utm_campaign",
    `eb_v${String(week.n).padStart(2, "0")}`
  );
  return u.toString();
}

function button(href, label, margin = "24px 0 8px") {
  // Full-width friendly CTA: nested table works better than div in many clients
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:${margin};">
  <tr>
    <td align="center" style="padding:0;">
      <a class="eb-btn" href="${href}" style="display:inline-block;width:100%;max-width:320px;box-sizing:border-box;padding:14px 20px;background-color:#00875a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;text-align:center;">${label} →</a>
    </td>
  </tr>
</table>`;
}

/**
 * @param {object} week - week object from newsletter-24-weeks.json
 * @returns {string} HTML email
 */
function buildNewsletterHtml(week) {
  const primaryHref = utm(CTA_URLS[week.cta] || CTA_URLS.analyze, week);
  const sections = (week.sections || [])
    .map(
      (s) => `<h3 class="eb-h3" style="margin:22px 0 8px;font-size:17px;font-weight:600;color:#1a1a1a;line-height:1.35;">${s.h}</h3>
<p class="eb-p" style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#1a1a1a;">${s.body}</p>`
    )
    .join("\n");

  const ctaPromise = (week.ctaPromise || "").trim();
  const promiseBlock = ctaPromise
    ? `<p class="eb-p" style="margin:22px 0 0;font-size:16px;line-height:1.6;color:#1a1a1a;"><strong>Det du får:</strong> ${ctaPromise}</p>`
    : "";

  // Slightly tighter top margin when a promise sits directly above the button
  const btnMargin = ctaPromise ? "12px 0 8px" : "24px 0 8px";
  let ctaBlock = button(primaryHref, week.ctaLabel || "Läs mer", btnMargin);
  if (week.ctaSecondary) {
    ctaBlock += button(
      utm(CTA_URLS[week.ctaSecondary] || CTA_URLS.contracts, week),
      week.ctaSecondaryLabel || "Se avtal",
      "16px 0 8px"
    );
  }

  return `<!DOCTYPE html>
<html lang="sv" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>${week.title}</title>
<!--[if mso]>
<style type="text/css">
  table, td { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style type="text/css">
  html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; }
  a { word-break: break-word; }
  .eb-wrap { width: 100% !important; max-width: 600px !important; }
  @media only screen and (max-width: 620px) {
    .eb-outer { padding: 12px 8px !important; }
    .eb-wrap { width: 100% !important; max-width: 100% !important; }
    .eb-pad { padding: 20px 16px !important; }
    .eb-pad-sm { padding: 16px !important; }
    .eb-h1 { font-size: 22px !important; line-height: 1.3 !important; }
    .eb-h3 { font-size: 16px !important; }
    .eb-p { font-size: 15px !important; }
    .eb-btn { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
    .eb-pre { font-size: 13px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#fafafa;font-family:Arial,Helvetica,sans-serif;width:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${week.preheader || week.title}</div>
<table role="presentation" class="eb-outer" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fafafa;padding:24px 12px;width:100%;">
<tr>
<td align="center" style="padding:0;">
<!--[if mso]>
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td>
<![endif]-->
<table role="presentation" class="eb-wrap" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr>
<td class="eb-pad" style="background-color:#eef8f3;padding:28px 20px;text-align:center;">
  <div style="display:inline-block;background-color:#d9f0e6;padding:6px 12px;border-radius:9999px;margin-bottom:12px;">
    <span style="font-size:12px;font-weight:600;color:#00875a;">Elbespararen · Vecka ${week.n}/24</span>
  </div>
  <h1 class="eb-h1" style="margin:0;font-size:26px;font-weight:700;color:#1a1a1a;line-height:1.3;">${week.title}</h1>
  <p class="eb-pre" style="margin:10px 0 0;font-size:14px;line-height:1.45;color:#6b7280;">${week.preheader || ""}</p>
</td>
</tr>
<tr>
<td class="eb-pad" style="padding:24px 20px;">
  <p class="eb-p" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1a1a1a;">Hej {$name|default('där')},</p>
  <p class="eb-p" style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#1a1a1a;">${week.hook}</p>
  ${sections}
  ${promiseBlock}
  ${ctaBlock}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p class="eb-p" style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;"><strong>PS:</strong> ${week.ps || ""}</p>
</td>
</tr>
<tr>
<td class="eb-pad-sm" style="padding:16px 20px;background:#f3f4f6;font-size:12px;line-height:1.55;color:#6b7280;text-align:center;">
  Du får detta för att du prenumererar på Elbespararen nyhetsbrev.<br>
  <span style="color:#9ca3af;">Elbespararen · VKNG LTD<br>Gladstonos 12-14, 8046 Pafos, Cyprus</span><br>
  <a href="{$unsubscribe}" style="color:#00875a;">Avprenumerera</a> · <a href="https://elbespararen.se" style="color:#00875a;">elbespararen.se</a>
</td>
</tr>
</table>
<!--[if mso]>
</td></tr></table>
<![endif]-->
</td>
</tr>
</table>
</body>
</html>`;
}

module.exports = {
  buildNewsletterHtml,
  CTA_URLS,
  utm,
};
