"use strict";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const formatDate = (value = new Date()) => {
    try {
        return new Date(value).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
        });
    } catch {
        return String(value);
    }
};

function passwordChangedTemplate({
    name = "there",
    changedAt = new Date(),
    ipAddress = "",
    location = "",
    device = "",
    browser = "",
    accountUrl = "https://dubaijobzone.com/dashboard/account",
    securityUrl = "https://dubaijobzone.com/dashboard/security",
    resetPasswordUrl = "https://dubaijobzone.com/forgot-password",
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeName = escapeHtml(name);
    const safeChangedAt = escapeHtml(formatDate(changedAt));
    const safeIpAddress = escapeHtml(ipAddress);
    const safeLocation = escapeHtml(location);
    const safeDevice = escapeHtml(device);
    const safeBrowser = escapeHtml(browser);
    const safeAccountUrl = escapeHtml(accountUrl);
    const safeSecurityUrl = escapeHtml(securityUrl);
    const safeResetPasswordUrl = escapeHtml(resetPasswordUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject = "Your Dubai Job Zone password was changed";

    const text = `
Hi ${name},

Your Dubai Job Zone account password was changed.

Changed at: ${formatDate(changedAt)}
IP address: ${ipAddress || "Not available"}
Location: ${location || "Not available"}
Device: ${device || "Not available"}
Browser: ${browser || "Not available"}

If you changed your password, no further action is needed.

If you did not make this change, secure your account immediately:
${securityUrl}

Reset your password:
${resetPasswordUrl}

Dubai Job Zone
${siteUrl}
Support: ${supportEmail}
`;

    const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(subject)}</title>
</head>

<body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef3f8;opacity:0;">
    Your Dubai Job Zone password was changed. If this was not you, secure your account immediately.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

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

          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#172554 48%,#075985 100%);padding:34px 34px 32px;">
              <div style="font-size:25px;line-height:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                Dubai Job Zone
              </div>
              <div style="margin-top:8px;font-size:14px;line-height:22px;color:#c7d2fe;">
                Account security notification
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#fff7ed;border:1px solid #fed7aa;color:#c2410c;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Password changed
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Your password was changed
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                We’re confirming that the password for your <strong>Dubai Job Zone</strong> account was changed. If you made this change, your account is updated and no further action is needed.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#c2410c;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Security update
                    </div>

                    <div style="margin-top:8px;font-size:22px;line-height:30px;color:#0f172a;font-weight:900;letter-spacing:-0.3px;">
                      Password changed successfully
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#9a3412;">
                      Changed on ${safeChangedAt}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Change details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Changed at:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeChangedAt}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          IP address:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;word-break:break-all;">
                          ${safeIpAddress || "Not available"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeLocation || "Not available"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Device:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeDevice || "Not available"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Browser:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeBrowser || "Not available"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 0;">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#166534;font-weight:900;">
                      If this was you
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#166534;">
                      You do not need to do anything else. Your Dubai Job Zone password has been updated.
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 0;">
                <tr>
                  <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#991b1b;font-weight:900;">
                      If this was not you
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#991b1b;">
                      Secure your account immediately. Someone may have access to your account or email.
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#dc2626" style="border-radius:14px;">
                    <a href="${safeSecurityUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#dc2626;">
                      Secure My Account
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeResetPasswordUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Reset Password Again
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeAccountUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Account Settings
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeSecurityUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeSecurityUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#1e40af;font-weight:900;">
                      Need help?
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#1e40af;">
                      Contact us at
                      <a href="mailto:${safeSupportEmail}" style="color:#1d4ed8;text-decoration:none;font-weight:800;">${safeSupportEmail}</a>
                      if you did not authorize this password change.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:0 34px;">
              <div style="height:1px;background:#e2e8f0;font-size:1px;line-height:1px;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 34px 34px;background:#ffffff;">
              <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                Dubai Job Zone
              </p>

              <p style="margin:0 0 14px;font-size:13px;line-height:21px;color:#64748b;">
                UAE jobs, walk-in interviews, employer profiles, salary guides and career resources.
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                This security email was sent because your account password changed.
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

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;">
          <tr>
            <td align="center" style="padding:18px 12px 0;">
              <p style="margin:0;font-size:12px;line-height:20px;color:#94a3b8;">
                Automated Dubai Job Zone account security notification.
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
    passwordChangedTemplate,
};