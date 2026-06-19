"use strict";

const { renderEmailHeader } = require("./_shared/renderEmailHeader");

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

function emailVerificationCodeTemplate({
    name = "there",
    code,
    expiresInMinutes = 10,
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
    logoUrl = "",
}) {
    const safeName = escapeHtml(name);
    const safeCode = escapeHtml(code);
    const safeExpiresInMinutes = escapeHtml(expiresInMinutes);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject = `${safeCode} is your Dubai Job Zone verification code`;

    const text = `
Hi ${name},

Your Dubai Job Zone verification code is:

${code}

This code will expire in ${expiresInMinutes} minutes.

For your security, do not share this code with anyone. Dubai Job Zone will never ask for your verification code by phone, WhatsApp, or email.

If you did not create a Dubai Job Zone account, you can safely ignore this email.

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
  <title>${subject}</title>
</head>

<body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <!-- Hidden preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef3f8;opacity:0;">
    Use ${safeCode} to verify your Dubai Job Zone account. This code expires in ${safeExpiresInMinutes} minutes.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <!-- Outer Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          ${renderEmailHeader({
            logoUrl,
            theme: "trust",
            subtitle: "Secure account verification for your Dubai Job Zone access",
        })}

          <!-- Main -->
          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Account verification
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Verify your email address
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                Use the verification code below to activate your <strong>Dubai Job Zone</strong> account. This helps us keep your profile secure and protect the platform from fake signups.
              </p>

              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td align="center" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:28px 20px;">
                    <div style="font-size:13px;line-height:18px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:1.3px;">
                      Your verification code
                    </div>

                    <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:44px;line-height:52px;font-weight:900;letter-spacing:10px;color:#0f172a;">
                      ${safeCode}
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#64748b;">
                      This code expires in <strong style="color:#0f172a;">${safeExpiresInMinutes} minutes</strong>.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Security reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Do not share this code with anyone. Dubai Job Zone will never ask for your verification code by phone, WhatsApp, email, or social media.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Trust Section -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      What happens after verification?
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:5px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Access your Dubai Job Zone account
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Save jobs and manage your profile
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Receive important job and account updates
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 0;font-size:14px;line-height:23px;color:#64748b;">
                If you did not create a Dubai Job Zone account, you can safely ignore this email. No account will be verified unless this code is entered.
              </p>

            </td>
          </tr>

          <!-- Footer -->
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
                This is an automated transactional email sent because a Dubai Job Zone account was created using this email address.
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
    emailVerificationCodeTemplate,
};
