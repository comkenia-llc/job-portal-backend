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

function employerSignupReceivedTemplate({
    employerName = "there",
    companyName = "",
    companyIndustry = "",
    companyLocation = "",
    submittedAt = new Date(),
    expectedReviewTime = "24 to 48 hours",
    dashboardUrl = "https://dubaijobzone.com/dashboard/employer",
    companyProfileUrl = "https://dubaijobzone.com/dashboard/employer/company",
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeEmployerName = escapeHtml(employerName);
    const safeCompanyName = escapeHtml(companyName);
    const safeCompanyIndustry = escapeHtml(companyIndustry);
    const safeCompanyLocation = escapeHtml(companyLocation);
    const safeSubmittedAt = escapeHtml(formatDate(submittedAt));
    const safeExpectedReviewTime = escapeHtml(expectedReviewTime);
    const safeDashboardUrl = escapeHtml(dashboardUrl);
    const safeCompanyProfileUrl = escapeHtml(companyProfileUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject = "We received your Dubai Job Zone employer signup";

    const text = `
Hi ${employerName},

Thanks for signing up as an employer on Dubai Job Zone.

${companyName ? `Company: ${companyName}` : ""}
${companyIndustry ? `Industry: ${companyIndustry}` : ""}
${companyLocation ? `Location: ${companyLocation}` : ""}
Submitted at: ${formatDate(submittedAt)}

Your employer account has been received and is now waiting for review. Our team usually reviews employer accounts within ${expectedReviewTime}.

While your account is being reviewed, you can check your dashboard and make sure your company details are accurate.

Employer dashboard:
${dashboardUrl}

Company profile:
${companyProfileUrl}

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
    Your Dubai Job Zone employer signup has been received and is waiting for review.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

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

          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#172554 48%,#075985 100%);padding:34px 34px 32px;">
              <div style="font-size:25px;line-height:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                Dubai Job Zone
              </div>
              <div style="margin-top:8px;font-size:14px;line-height:22px;color:#c7d2fe;">
                Employer signup received • Dubai hiring platform
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Signup received
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Your employer signup is under review
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeEmployerName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                Thanks for signing up as an employer on <strong>Dubai Job Zone</strong>${safeCompanyName ? ` for <strong>${safeCompanyName}</strong>` : ""}. We’ve received your request and our team will review your employer account before enabling full hiring access.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Review status
                    </div>

                    <div style="margin-top:8px;font-size:22px;line-height:30px;color:#0f172a;font-weight:900;letter-spacing:-0.3px;">
                      Pending review
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#1e40af;">
                      Submitted on ${safeSubmittedAt}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Account status
                            </div>
                            <div style="margin-top:7px;font-size:18px;line-height:26px;color:#0f172a;font-weight:900;">
                              Pending
                            </div>
                          </div>
                        </td>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Review time
                            </div>
                            <div style="margin-top:7px;font-size:16px;line-height:24px;color:#0f172a;font-weight:900;">
                              ${safeExpectedReviewTime}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Employer details received
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
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCompanyLocation || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
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

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      What happens next?
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Our team checks employer details to protect job seekers.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ You’ll receive another email once your account is approved or if changes are needed.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ You can review and improve your company profile while waiting.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeDashboardUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Open Employer Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeCompanyProfileUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Review Company Profile
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeDashboardUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeDashboardUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Before approval
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Make sure your company name, industry, location, website, and contact details are accurate. Clear employer information helps your job posts perform better.
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
                Automated Dubai Job Zone employer account notification.
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
    employerSignupReceivedTemplate,
};