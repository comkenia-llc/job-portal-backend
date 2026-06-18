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

function adminNewEmployerTemplate({
    employerName = "Unknown employer",
    employerEmail = "",
    employerPhone = "",
    companyName = "",
    companyIndustry = "",
    companyWebsite = "",
    companyLocation = "",
    companySize = "",
    registeredAt = new Date(),
    verificationStatus = "pending",
    employerStatus = "pending",
    reviewUrl = "https://dubaijobzone.com/admin/employers",
    adminDashboardUrl = "https://dubaijobzone.com/admin",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeEmployerName = escapeHtml(employerName);
    const safeEmployerEmail = escapeHtml(employerEmail);
    const safeEmployerPhone = escapeHtml(employerPhone);
    const safeCompanyName = escapeHtml(companyName);
    const safeCompanyIndustry = escapeHtml(companyIndustry);
    const safeCompanyWebsite = escapeHtml(companyWebsite);
    const safeCompanyLocation = escapeHtml(companyLocation);
    const safeCompanySize = escapeHtml(companySize);
    const safeRegisteredAt = escapeHtml(formatDate(registeredAt));
    const safeVerificationStatus = escapeHtml(verificationStatus);
    const safeEmployerStatus = escapeHtml(employerStatus);
    const safeReviewUrl = escapeHtml(reviewUrl);
    const safeAdminDashboardUrl = escapeHtml(adminDashboardUrl);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject = `New employer registered: ${companyName || employerName}`;

    const text = `
New employer registration on Dubai Job Zone.

Employer name: ${employerName}
Employer email: ${employerEmail || "Not provided"}
Employer phone: ${employerPhone || "Not provided"}

Company name: ${companyName || "Not provided"}
Industry: ${companyIndustry || "Not provided"}
Website: ${companyWebsite || "Not provided"}
Location: ${companyLocation || "Not provided"}
Company size: ${companySize || "Not provided"}

Employer status: ${employerStatus}
Verification status: ${verificationStatus}
Registered at: ${formatDate(registeredAt)}

Review employer:
${reviewUrl}

Admin dashboard:
${adminDashboardUrl}

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
  <title>${escapeHtml(subject)}</title>
</head>

<body style="margin:0;padding:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <!-- Hidden preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef3f8;opacity:0;">
    New employer registration from ${safeCompanyName || safeEmployerName} on Dubai Job Zone.
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
                      Admin notification • New employer registration
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main -->
          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#ecfdf5;border:1px solid #bbf7d0;color:#15803d;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                New employer signup
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                A new employer registered
              </h1>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                A new employer account has been created on Dubai Job Zone. Review the company details and approve, reject, or request changes from the admin dashboard.
              </p>

              <!-- Status Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Employer status
                            </div>
                            <div style="margin-top:7px;font-size:18px;line-height:26px;color:#0f172a;font-weight:900;text-transform:capitalize;">
                              ${safeEmployerStatus}
                            </div>
                          </div>
                        </td>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Verification
                            </div>
                            <div style="margin-top:7px;font-size:18px;line-height:26px;color:#0f172a;font-weight:900;text-transform:capitalize;">
                              ${safeVerificationStatus}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Employer Details -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#1e3a8a;font-weight:900;">
                      Employer contact
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Name:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeEmployerName}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Email:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeEmployerEmail
            ? `<a href="mailto:${safeEmployerEmail}" style="color:#2563eb;text-decoration:none;font-weight:800;">${safeEmployerEmail}</a>`
            : "Not provided"
        }
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Phone:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeEmployerPhone || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Registered:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeRegisteredAt}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Company Details -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Company details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Company:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeCompanyName || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Industry:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCompanyIndustry || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Website:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;word-break:break-all;">
                          ${safeCompanyWebsite
            ? `<a href="${safeCompanyWebsite}" target="_blank" style="color:#2563eb;text-decoration:none;font-weight:800;">${safeCompanyWebsite}</a>`
            : "Not provided"
        }
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCompanyLocation || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Size:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCompanySize || "Not provided"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Review Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Admin action required
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Review this employer before allowing full access to job posting features. Check company legitimacy, contact details, website, and listing quality.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeReviewUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Review Employer
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeReviewUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeReviewUrl}
                </a>
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
                Dubai Job Zone Admin
              </p>

              <p style="margin:0 0 14px;font-size:13px;line-height:21px;color:#64748b;">
                This email was generated automatically because a new employer registered on Dubai Job Zone.
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                <a href="${safeAdminDashboardUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Admin Dashboard</a>
                &nbsp;•&nbsp;
                <a href="${safeSiteUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Dubai Job Zone</a>
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
    adminNewEmployerTemplate,
};