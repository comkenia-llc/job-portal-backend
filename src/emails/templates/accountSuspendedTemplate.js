"use strict";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

function accountSuspendedTemplate({
    name = "there",
    accountType = "account",
    reason = "",
    suspendedAt = new Date(),
    appealUrl = "https://dubaijobzone.com/contact",
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeName = escapeHtml(name);
    const safeAccountType = escapeHtml(accountType);
    const safeReason = escapeHtml(reason);
    const safeAppealUrl = escapeHtml(appealUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const formattedDate = new Date(suspendedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const safeFormattedDate = escapeHtml(formattedDate);

    const subject = "Your Dubai Job Zone account has been suspended";

    const text = `
Hi ${name},

Your Dubai Job Zone ${accountType} has been suspended.

Suspension date: ${formattedDate}
${reason ? `Reason: ${reason}` : ""}

While your account is suspended, you may not be able to access some Dubai Job Zone features.

If you believe this was a mistake or you want to request a review, please contact us:

${appealUrl}

You can also email us at ${supportEmail}.

Dubai Job Zone
${siteUrl}
`;

    const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
</head>

<body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <!-- Hidden preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef3f8;opacity:0;">
    Your Dubai Job Zone account has been suspended. You can request a review if you believe this was a mistake.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <!-- Outer Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          <!-- Top Brand Strip -->
          <tr>
            <td style="background:#0b1220;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="height:6px;background:linear-gradient(90deg,#f97316 0%,#ef4444 48%,#991b1b 100%);font-size:1px;line-height:1px;">
                    &nbsp;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#172554 48%,#075985 100%);padding:34px 34px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-size:25px;line-height:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                      Dubai Job Zone
                    </div>
                    <div style="margin-top:8px;font-size:14px;line-height:22px;color:#c7d2fe;">
                      UAE jobs, walk-in interviews, employer profiles and career resources.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main -->
          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#fff7ed;border:1px solid #fed7aa;color:#c2410c;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Account status update
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Your account has been suspended
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                We’re contacting you to let you know that your <strong>Dubai Job Zone ${safeAccountType}</strong> has been suspended. While suspended, your access to some account features may be limited.
              </p>

              <!-- Status Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 10px;font-size:15px;line-height:23px;color:#9a3412;font-weight:900;">
                      Suspension details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#9a3412;width:130px;font-weight:800;">
                          Account type:
                        </td>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#9a3412;">
                          ${safeAccountType}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#9a3412;width:130px;font-weight:800;">
                          Date:
                        </td>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#9a3412;">
                          ${safeFormattedDate}
                        </td>
                      </tr>

                      ${safeReason
            ? `
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#9a3412;width:130px;font-weight:800;vertical-align:top;">
                          Reason:
                        </td>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#9a3412;">
                          ${safeReason}
                        </td>
                      </tr>
                      `
            : ""
        }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Review Message -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Need a review?
                    </p>

                    <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">
                      If you believe this suspension was made by mistake, or you have updated the required information, you can request a manual review from our support team.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeAppealUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Request Account Review
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Policy Note -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#1e40af;font-weight:900;">
                      Account safety
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#1e40af;">
                      Dubai Job Zone reviews account activity to help protect job seekers, employers, and the quality of listings on the platform.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeAppealUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeAppealUrl}
                </a>
              </p>

              <p style="margin:24px 0 0;font-size:14px;line-height:23px;color:#64748b;">
                You can also contact us directly at
                <a href="mailto:${safeSupportEmail}" style="color:#2563eb;text-decoration:none;font-weight:800;">${safeSupportEmail}</a>.
              </p>

            </td>
          </tr>

          <!-- Footer Divider -->
          <tr>
            <td style="padding:0 34px;">
              <div style="height:1px;background:#e2e8f0;font-size:1px;line-height:1px;">&nbsp;</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 34px 34px;background:#ffffff;">
              <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                Dubai Job Zone
              </p>

              <p style="margin:0 0 14px;font-size:13px;line-height:21px;color:#64748b;">
                Find UAE jobs, walk-in interviews, employer profiles, salary guides and career resources.
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                Need help? Contact us at
                <a href="mailto:${safeSupportEmail}" style="color:#2563eb;text-decoration:none;">${safeSupportEmail}</a>
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                <a href="${safeSiteUrl}" target="_blank" style="color:#64748b;text-decoration:none;">${safeSiteUrl}</a>
              </p>

              <p style="margin:0;font-size:12px;line-height:20px;color:#94a3b8;">
                © ${new Date().getFullYear()} Dubai Job Zone. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!-- Bottom Note -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;width:100%;">
          <tr>
            <td align="center" style="padding:18px 12px 0;">
              <p style="margin:0;font-size:12px;line-height:20px;color:#94a3b8;">
                This is an automated transactional email about your Dubai Job Zone account status.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;

    return {
        subject,
        html,
        text: text.trim(),
    };
}

module.exports = {
    accountSuspendedTemplate,
};