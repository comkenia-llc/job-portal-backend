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

function adminContactFormTemplate({
    name = "Unknown visitor",
    email = "",
    phone = "",
    subject: messageSubject = "Contact form message",
    message = "",
    submittedAt = new Date(),
    sourcePage = "",
    ipAddress = "",
    userAgent = "",
    adminDashboardUrl = "https://dubaijobzone.com/admin",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessageSubject = escapeHtml(messageSubject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
    const safeSubmittedAt = escapeHtml(formatDate(submittedAt));
    const safeSourcePage = escapeHtml(sourcePage);
    const safeIpAddress = escapeHtml(ipAddress);
    const safeUserAgent = escapeHtml(userAgent);
    const safeAdminDashboardUrl = escapeHtml(adminDashboardUrl);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject = `New contact form message: ${messageSubject}`;

    const text = `
New contact form message received on Dubai Job Zone.

Name: ${name}
Email: ${email || "Not provided"}
Phone: ${phone || "Not provided"}
Subject: ${messageSubject}
Submitted at: ${formatDate(submittedAt)}
Source page: ${sourcePage || "Not provided"}
IP address: ${ipAddress || "Not provided"}

Message:
${message}

Admin dashboard:
${adminDashboardUrl}

Dubai Job Zone
${siteUrl}
`;

    const replyToNote = email
        ? `You can reply directly to this email address: ${safeEmail}`
        : "No reply email was provided by the visitor.";

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
  <!-- Hidden preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef3f8;opacity:0;">
    New contact form message from ${safeName} on Dubai Job Zone.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <!-- Outer Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          <!-- Top Brand Strip -->
          <tr>
            <td style="background:#0b1220;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="height:6px;background:linear-gradient(90deg,#2563eb 0%,#06b6d4 42%,#22c55e 100%);font-size:1px;line-height:1px;">
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
                      Admin notification • Contact form message
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main -->
          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                New contact message
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                A visitor submitted the contact form
              </h1>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                A new message was submitted through the Dubai Job Zone contact form. Review the details below and respond if needed.
              </p>

              <!-- Sender Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Sender details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:130px;font-weight:800;vertical-align:top;">
                          Name:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeName}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:130px;font-weight:800;vertical-align:top;">
                          Email:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeEmail
            ? `<a href="mailto:${safeEmail}" style="color:#2563eb;text-decoration:none;font-weight:800;">${safeEmail}</a>`
            : "Not provided"
        }
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:130px;font-weight:800;vertical-align:top;">
                          Phone:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safePhone || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:130px;font-weight:800;vertical-align:top;">
                          Subject:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                          ${safeMessageSubject}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:130px;font-weight:800;vertical-align:top;">
                          Submitted:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeSubmittedAt}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#1e3a8a;font-weight:900;">
                      Message
                    </p>

                    <div style="font-size:15px;line-height:25px;color:#334155;">
                      ${safeMessage || "No message content provided."}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Reply Note -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 0;">
                <tr>
                  <td style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#166534;font-weight:900;">
                      Response note
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#166534;">
                      ${replyToNote}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeAdminDashboardUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Open Admin Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Technical Details -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Technical details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;line-height:21px;color:#64748b;width:120px;font-weight:800;vertical-align:top;">
                          Source page:
                        </td>
                        <td style="padding:6px 0;font-size:13px;line-height:21px;color:#475569;word-break:break-all;">
                          ${safeSourcePage || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:6px 0;font-size:13px;line-height:21px;color:#64748b;width:120px;font-weight:800;vertical-align:top;">
                          IP address:
                        </td>
                        <td style="padding:6px 0;font-size:13px;line-height:21px;color:#475569;">
                          ${safeIpAddress || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:6px 0;font-size:13px;line-height:21px;color:#64748b;width:120px;font-weight:800;vertical-align:top;">
                          User agent:
                        </td>
                        <td style="padding:6px 0;font-size:13px;line-height:21px;color:#475569;word-break:break-word;">
                          ${safeUserAgent || "Not provided"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

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
                Dubai Job Zone Admin
              </p>

              <p style="margin:0 0 14px;font-size:13px;line-height:21px;color:#64748b;">
                This email was generated automatically from the Dubai Job Zone contact form.
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
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;">
          <tr>
            <td align="center" style="padding:18px 12px 0;">
              <p style="margin:0;font-size:12px;line-height:20px;color:#94a3b8;">
                Admin-only transactional notification.
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
    adminContactFormTemplate,
};