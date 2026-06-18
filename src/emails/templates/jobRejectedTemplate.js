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

function jobRejectedTemplate({
    employerName = "there",
    companyName = "",
    jobTitle = "Job post",
    location = "",
    jobType = "",
    salaryText = "",
    reviewedAt = new Date(),
    reason = "",
    requiredAction = "",
    editJobUrl = "https://dubaijobzone.com/dashboard/employer/jobs",
    dashboardJobUrl = "https://dubaijobzone.com/dashboard/employer/jobs",
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeEmployerName = escapeHtml(employerName);
    const safeCompanyName = escapeHtml(companyName);
    const safeJobTitle = escapeHtml(jobTitle);
    const safeLocation = escapeHtml(location);
    const safeJobType = escapeHtml(jobType);
    const safeSalaryText = escapeHtml(salaryText);
    const safeReviewedAt = escapeHtml(formatDate(reviewedAt));
    const safeReason = escapeHtml(reason).replace(/\n/g, "<br />");
    const safeRequiredAction = escapeHtml(requiredAction).replace(/\n/g, "<br />");
    const safeEditJobUrl = escapeHtml(editJobUrl);
    const safeDashboardJobUrl = escapeHtml(dashboardJobUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject = `Your job post needs changes: ${jobTitle}`;

    const text = `
Hi ${employerName},

Your job post on Dubai Job Zone could not be approved at this time.

Job: ${jobTitle}
${companyName ? `Company: ${companyName}` : ""}
${location ? `Location: ${location}` : ""}
${jobType ? `Job type: ${jobType}` : ""}
${salaryText ? `Salary: ${salaryText}` : ""}
Reviewed at: ${formatDate(reviewedAt)}

${reason ? `Reason:\n${reason}` : "Reason: Your job post needs additional review or updated information before it can be published."}

${requiredAction ? `Required action:\n${requiredAction}` : "Required action: Please review your job title, description, salary, location, and application details, then submit the job again."}

Edit job:
${editJobUrl}

Manage jobs:
${dashboardJobUrl}

If you believe this was a mistake, contact us at ${supportEmail}.

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
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#eef3f8;opacity:0;">
    Your job post ${safeJobTitle} needs changes before it can be published on Dubai Job Zone.
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
                Job review update • Changes required
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#fff7ed;border:1px solid #fed7aa;color:#c2410c;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Changes required
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Your job post needs changes
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeEmployerName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                We reviewed your job post <strong>${safeJobTitle}</strong>${safeCompanyName ? ` for <strong>${safeCompanyName}</strong>` : ""}. At this time, we cannot publish it on <strong>Dubai Job Zone</strong> until the required information is corrected or reviewed again.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#c2410c;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Review status
                    </div>

                    <div style="margin-top:8px;font-size:24px;line-height:32px;color:#0f172a;font-weight:900;letter-spacing:-0.4px;">
                      Not approved yet
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#9a3412;">
                      Reviewed on ${safeReviewedAt}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Job details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Job:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeJobTitle}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Company:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCompanyName || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeLocation || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Type:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;text-transform:capitalize;">
                          ${safeJobType || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Salary:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                          ${safeSalaryText || "Not provided"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #fed7aa;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#9a3412;font-weight:900;">
                      Reason
                    </p>

                    <div style="font-size:15px;line-height:25px;color:#334155;">
                      ${safeReason || "Your job post needs additional review or updated information before it can be published."}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      What you should do next
                    </p>

                    <div style="font-size:15px;line-height:25px;color:#475569;">
                      ${safeRequiredAction || "Please review your job title, description, salary, location, and application details. After updating the job, submit it again for review."}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Publishing checklist
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Use a clear job title without spammy words or misleading claims.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Add accurate salary, location, job type, and application method.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Avoid asking candidates for improper fees or unsafe personal details.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Make the job description specific, professional, and easy for candidates to understand.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeEditJobUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Edit Job Post
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeDashboardJobUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Manage Jobs
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeEditJobUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeEditJobUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#1e40af;font-weight:900;">
                      Need help?
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#1e40af;">
                      If you believe this decision was made by mistake, contact Dubai Job Zone support at
                      <a href="mailto:${safeSupportEmail}" style="color:#1d4ed8;text-decoration:none;font-weight:800;">${safeSupportEmail}</a>.
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
                Automated Dubai Job Zone job review notification.
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
    jobRejectedTemplate,
};