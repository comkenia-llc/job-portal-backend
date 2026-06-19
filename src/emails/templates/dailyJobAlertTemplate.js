"use strict";

const { renderEmailHeader } = require("./_shared/renderEmailHeader");

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const formatDate = (value = new Date()) => {
    try {
        return new Date(value).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return String(value);
    }
};

const formatSalary = ({ salaryMin, salaryMax, currency = "AED", salaryText = "" } = {}) => {
    if (salaryText) return salaryText;
    if (!salaryMin && !salaryMax) return "Salary not disclosed";
    if (salaryMin && salaryMax) return `${currency} ${salaryMin} - ${salaryMax}`;
    if (salaryMin) return `From ${currency} ${salaryMin}`;
    return `Up to ${currency} ${salaryMax}`;
};

const renderJobCards = (jobs = []) => {
    if (!Array.isArray(jobs) || jobs.length === 0) {
        return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:24px 22px;text-align:center;">
            <p style="margin:0 0 8px;font-size:16px;line-height:24px;color:#0f172a;font-weight:900;">
              No fresh matches today
            </p>
            <p style="margin:0;font-size:14px;line-height:22px;color:#64748b;">
              We did not find new jobs matching this alert today. Keep your alert active and we’ll keep checking.
            </p>
          </td>
        </tr>
      </table>
    `;
    }

    return jobs
        .slice(0, 8)
        .map((job) => {
            const safeTitle = escapeHtml(job.title || "Untitled job");
            const safeCompany = escapeHtml(job.companyName || job.company || "Company not provided");
            const safeLocation = escapeHtml(job.location || "Dubai, UAE");
            const safeType = escapeHtml(job.type || job.jobType || "");
            const safeSalary = escapeHtml(formatSalary(job));
            const safeUrl = escapeHtml(job.url || job.jobUrl || "#");
            const safePostedAt = job.postedAt ? escapeHtml(formatDate(job.postedAt)) : "";
            const safeBadge = escapeHtml(job.badge || job.category || "New match");

            return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;">
          <tr>
            <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:top;">
                    <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:5px 10px;font-size:12px;line-height:16px;font-weight:900;">
                      ${safeBadge}
                    </div>

                    <h2 style="margin:13px 0 7px;font-size:20px;line-height:28px;color:#0f172a;font-weight:900;letter-spacing:-0.3px;">
                      ${safeTitle}
                    </h2>

                    <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#475569;">
                      <strong style="color:#0f172a;">${safeCompany}</strong>
                      ${safeLocation ? ` • ${safeLocation}` : ""}
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;line-height:20px;color:#64748b;">
                          ${safeType ? `<strong style="color:#334155;">Type:</strong> ${safeType}` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;line-height:20px;color:#64748b;">
                          <strong style="color:#334155;">Salary:</strong> ${safeSalary}
                        </td>
                      </tr>
                      ${safePostedAt
                    ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;line-height:20px;color:#64748b;">
                          <strong style="color:#334155;">Posted:</strong> ${safePostedAt}
                        </td>
                      </tr>
                      `
                    : ""
                }
                    </table>

                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0 0;">
                      <tr>
                        <td align="center" bgcolor="#2563eb" style="border-radius:12px;">
                          <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:12px 18px;font-size:14px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:12px;background:#2563eb;">
                            View Job
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
        })
        .join("");
};

function dailyJobAlertTemplate({
    name = "there",
    alertTitle = "Dubai jobs matching your profile",
    alertKeyword = "",
    alertLocation = "Dubai",
    jobs = [],
    totalMatches = 0,
    jobsUrl = "https://dubaijobzone.com/jobs",
    alertSettingsUrl = "https://dubaijobzone.com/dashboard/job-alerts",
    unsubscribeUrl = "https://dubaijobzone.com/unsubscribe",
    sentAt = new Date(),
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
    logoUrl = "",
}) {
    const safeName = escapeHtml(name);
    const safeAlertTitle = escapeHtml(alertTitle);
    const safeAlertKeyword = escapeHtml(alertKeyword);
    const safeAlertLocation = escapeHtml(alertLocation);
    const safeTotalMatches = escapeHtml(totalMatches || jobs.length || 0);
    const safeJobsUrl = escapeHtml(jobsUrl);
    const safeAlertSettingsUrl = escapeHtml(alertSettingsUrl);
    const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
    const safeSentAt = escapeHtml(formatDate(sentAt));
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const subject =
        jobs.length > 0
            ? `${jobs.length} new Dubai job matches for you`
            : "Your Dubai Job Zone daily job alert";

    const jobsText =
        Array.isArray(jobs) && jobs.length > 0
            ? jobs
                .slice(0, 8)
                .map((job, index) => {
                    const salary = formatSalary(job);
                    return `
${index + 1}. ${job.title || "Untitled job"}
Company: ${job.companyName || job.company || "Not provided"}
Location: ${job.location || "Dubai, UAE"}
Type: ${job.type || job.jobType || "Not provided"}
Salary: ${salary}
Link: ${job.url || job.jobUrl || jobsUrl}
`;
                })
                .join("\n")
            : "No fresh matching jobs were found today.";

    const text = `
Hi ${name},

Here is your daily Dubai Job Zone job alert.

Alert: ${alertTitle}
${alertKeyword ? `Keyword: ${alertKeyword}` : ""}
Location: ${alertLocation}
Total matches: ${totalMatches || jobs.length || 0}
Date: ${formatDate(sentAt)}

${jobsText}

View all matching jobs:
${jobsUrl}

Manage your job alerts:
${alertSettingsUrl}

Unsubscribe:
${unsubscribeUrl}

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
    ${safeTotalMatches} Dubai job matches from your daily Dubai Job Zone alert.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          ${renderEmailHeader({
            logoUrl,
            theme: "digest",
            subtitle: "Today’s strongest matches, picked from fresh UAE hiring activity",
            accentLabel: "Fresh job matches picked for you today",
        })}

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Daily job alert
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                New Dubai job matches for you
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                We found fresh job opportunities from <strong>Dubai Job Zone</strong> based on your saved alert. Review the best matches below and apply early while listings are still fresh.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Matches
                            </div>
                            <div style="margin-top:7px;font-size:24px;line-height:32px;color:#0f172a;font-weight:900;">
                              ${safeTotalMatches}
                            </div>
                          </div>
                        </td>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Alert date
                            </div>
                            <div style="margin-top:7px;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                              ${safeSentAt}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:14px 8px 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:14px;line-height:22px;color:#475569;">
                      <strong style="color:#0f172a;">Alert:</strong> ${safeAlertTitle}
                      ${safeAlertKeyword ? `<br /><strong style="color:#0f172a;">Keyword:</strong> ${safeAlertKeyword}` : ""}
                      ${safeAlertLocation ? `<br /><strong style="color:#0f172a;">Location:</strong> ${safeAlertLocation}` : ""}
                    </div>
                  </td>
                </tr>
              </table>

              ${renderJobCards(jobs)}

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Quick job search tips
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Apply early — employers often review fresh applications first.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Keep your CV, phone number, visa status, and expected salary updated.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Be careful with anyone asking candidates to pay for job offers.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeJobsUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      View All Matching Jobs
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeAlertSettingsUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Manage Alerts
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeJobsUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeJobsUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Job safety reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Dubai Job Zone does not ask candidates to pay for job offers. Be careful with anyone requesting fees, bank details, or sensitive documents too early.
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
                You are receiving this email because you created a job alert on Dubai Job Zone.
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                <a href="${safeAlertSettingsUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Manage alerts</a>
                &nbsp;•&nbsp;
                <a href="${safeUnsubscribeUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Unsubscribe</a>
                &nbsp;•&nbsp;
                <a href="mailto:${safeSupportEmail}" style="color:#64748b;text-decoration:none;">Support</a>
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
                Daily job alert email from Dubai Job Zone.
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
    dailyJobAlertTemplate,
};
