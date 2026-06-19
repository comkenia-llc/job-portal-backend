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

const formatSalary = ({
    salaryText = "",
    salaryMin = "",
    salaryMax = "",
    currency = "AED",
} = {}) => {
    if (salaryText) return salaryText;

    if (salaryMin && salaryMax) {
        return `${currency} ${salaryMin} - ${salaryMax}`;
    }

    if (salaryMin) {
        return `From ${currency} ${salaryMin}`;
    }

    if (salaryMax) {
        return `Up to ${currency} ${salaryMax}`;
    }

    return "";
};

const renderJobCards = (jobs = []) => {
    if (!Array.isArray(jobs) || jobs.length === 0) {
        return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:24px 22px;text-align:center;">
            <div style="font-size:18px;line-height:26px;color:#0f172a;font-weight:900;">
              No featured jobs to show right now
            </div>
            <div style="margin-top:8px;font-size:14px;line-height:22px;color:#64748b;">
              Browse Dubai Job Zone to see the latest UAE job opportunities.
            </div>
          </td>
        </tr>
      </table>
    `;
    }

    return jobs
        .slice(0, 10)
        .map((job) => {
            const safeTitle = escapeHtml(job.title || "Job opportunity");
            const safeCompanyName = escapeHtml(job.companyName || job.company || "");
            const safeLocation = escapeHtml(job.location || "");
            const safeJobType = escapeHtml(job.jobType || job.type || "");
            const safeSalary = escapeHtml(formatSalary(job));
            const safePostedAt = job.postedAt ? escapeHtml(formatDate(job.postedAt)) : "";
            const safeDeadline = job.deadline ? escapeHtml(formatDate(job.deadline)) : "";
            const safeUrl = escapeHtml(job.url || job.jobUrl || "https://dubaijobzone.com/jobs");
            const safeBadge = escapeHtml(job.badge || job.category || job.industry || "");

            return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;">
          <tr>
            <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:20px;box-shadow:0 10px 28px rgba(15,23,42,0.06);">
              ${safeBadge
                    ? `
                    <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:5px 10px;font-size:12px;line-height:17px;font-weight:900;margin-bottom:12px;">
                      ${safeBadge}
                    </div>
                  `
                    : ""
                }

              <div style="font-size:20px;line-height:28px;color:#0f172a;font-weight:900;letter-spacing:-0.3px;">
                ${safeTitle}
              </div>

              <div style="margin-top:8px;font-size:14px;line-height:22px;color:#475569;">
                ${safeCompanyName || "Company not provided"}${safeLocation ? ` • ${safeLocation}` : ""}
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                    ${safeJobType ? `<strong style="color:#0f172a;">Type:</strong> ${safeJobType}` : ""}
                    ${safeJobType && safeSalary ? " &nbsp;•&nbsp; " : ""}
                    ${safeSalary ? `<strong style="color:#0f172a;">Salary:</strong> ${safeSalary}` : ""}
                  </td>
                </tr>

                ${safePostedAt || safeDeadline
                    ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                        ${safePostedAt ? `<strong style="color:#0f172a;">Posted:</strong> ${safePostedAt}` : ""}
                        ${safePostedAt && safeDeadline ? " &nbsp;•&nbsp; " : ""}
                        ${safeDeadline ? `<strong style="color:#b45309;">Deadline:</strong> ${safeDeadline}` : ""}
                      </td>
                    </tr>
                    `
                    : ""
                }
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
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
      `;
        })
        .join("");
};

const renderTopCategories = (categories = []) => {
    if (!Array.isArray(categories) || categories.length === 0) return "";

    return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
            Popular job categories this week
          </p>

          ${categories
            .slice(0, 8)
            .map((item) => {
                const safeLabel = escapeHtml(item.label || item.name || "Job category");
                const safeCount = escapeHtml(item.count || item.total || "");
                const safeUrl = escapeHtml(item.url || "https://dubaijobzone.com/jobs");

                return `
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding:9px 0;border-top:1px solid #e2e8f0;">
                      <a href="${safeUrl}" target="_blank" style="font-size:14px;line-height:22px;color:#2563eb;text-decoration:none;font-weight:900;">
                        ${safeLabel}
                      </a>
                    </td>
                    <td align="right" style="padding:9px 0;border-top:1px solid #e2e8f0;font-size:13px;line-height:20px;color:#64748b;font-weight:800;">
                      ${safeCount ? `${safeCount} jobs` : ""}
                    </td>
                  </tr>
                </table>
              `;
            })
            .join("")}
        </td>
      </tr>
    </table>
  `;
};

function weeklyJobDigestTemplate({
    name = "there",
    weekLabel = "This week",
    jobs = [],
    topCategories = [],
    totalNewJobs = 0,
    totalWalkInInterviews = 0,
    totalCompaniesHiring = 0,
    recommendedLocation = "Dubai",
    recommendedRole = "",
    jobsUrl = "https://dubaijobzone.com/jobs",
    walkInUrl = "https://dubaijobzone.com/walk-in-interviews",
    companiesUrl = "https://dubaijobzone.com/companies",
    jobAlertsUrl = "https://dubaijobzone.com/dashboard/job-alerts",
    digestSettingsUrl = "https://dubaijobzone.com/dashboard/email-preferences",
    unsubscribeUrl = "https://dubaijobzone.com/unsubscribe",
    sentAt = new Date(),
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
    logoUrl = "",
}) {
    const safeName = escapeHtml(name);
    const safeWeekLabel = escapeHtml(weekLabel);
    const safeTotalNewJobs = escapeHtml(totalNewJobs || jobs.length || 0);
    const safeTotalWalkInInterviews = escapeHtml(totalWalkInInterviews);
    const safeTotalCompaniesHiring = escapeHtml(totalCompaniesHiring);
    const safeRecommendedLocation = escapeHtml(recommendedLocation);
    const safeRecommendedRole = escapeHtml(recommendedRole);
    const safeJobsUrl = escapeHtml(jobsUrl);
    const safeWalkInUrl = escapeHtml(walkInUrl);
    const safeCompaniesUrl = escapeHtml(companiesUrl);
    const safeJobAlertsUrl = escapeHtml(jobAlertsUrl);
    const safeDigestSettingsUrl = escapeHtml(digestSettingsUrl);
    const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
    const safeSentAt = escapeHtml(formatDate(sentAt));
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const shownJobsCount = Array.isArray(jobs) ? Math.min(jobs.length, 10) : 0;

    const subject =
        shownJobsCount > 0
            ? `Weekly job digest: ${shownJobsCount} UAE job picks for you`
            : "Your weekly Dubai Job Zone job digest";

    const textJobs = Array.isArray(jobs)
        ? jobs
            .slice(0, 10)
            .map((job, index) => {
                const salary = formatSalary(job);
                return `
${index + 1}. ${job.title || "Job opportunity"}
${job.companyName || job.company ? `Company: ${job.companyName || job.company}` : ""}
${job.location ? `Location: ${job.location}` : ""}
${job.jobType || job.type ? `Type: ${job.jobType || job.type}` : ""}
${salary ? `Salary: ${salary}` : ""}
${job.deadline ? `Deadline: ${formatDate(job.deadline)}` : ""}
${job.url || job.jobUrl ? `View: ${job.url || job.jobUrl}` : ""}
`;
            })
            .join("\n")
        : "";

    const textCategories = Array.isArray(topCategories)
        ? topCategories
            .slice(0, 8)
            .map((item, index) => `${index + 1}. ${item.label || item.name || "Job category"}${item.count || item.total ? ` - ${item.count || item.total} jobs` : ""}`)
            .join("\n")
        : "";

    const text = `
Hi ${name},

Here is your weekly Dubai Job Zone job digest.

Week: ${weekLabel}
${recommendedRole ? `Role focus: ${recommendedRole}` : ""}
Location focus: ${recommendedLocation}
New jobs: ${totalNewJobs || jobs.length || 0}
Walk-in interviews: ${totalWalkInInterviews}
Companies hiring: ${totalCompaniesHiring}
Sent at: ${formatDate(sentAt)}

Featured jobs:
${textJobs || "Open Dubai Job Zone to view the latest jobs."}

${textCategories ? `Popular categories:\n${textCategories}` : ""}

Browse latest jobs:
${jobsUrl}

View walk-in interviews:
${walkInUrl}

Browse companies:
${companiesUrl}

Manage job alerts:
${jobAlertsUrl}

Email preferences:
${digestSettingsUrl}

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
    Your weekly Dubai Job Zone digest is ready with fresh UAE job opportunities.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          ${renderEmailHeader({
            logoUrl,
            theme: "digest",
            subtitle: "A weekly roundup of jobs, hiring trends, and opportunities worth opening",
        })}

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                ${safeWeekLabel}
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Your weekly job digest is ready
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                Here are fresh job opportunities and hiring updates from <strong>Dubai Job Zone</strong>${safeRecommendedRole ? ` for <strong>${safeRecommendedRole}</strong>` : ""} in <strong>${safeRecommendedLocation}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:22px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="33.33%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #dbeafe;border-radius:16px;padding:16px;text-align:center;">
                            <div style="font-size:26px;line-height:34px;color:#0f172a;font-weight:900;">
                              ${safeTotalNewJobs}
                            </div>
                            <div style="margin-top:5px;font-size:12px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:0.7px;">
                              New jobs
                            </div>
                          </div>
                        </td>

                        <td width="33.33%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #dbeafe;border-radius:16px;padding:16px;text-align:center;">
                            <div style="font-size:26px;line-height:34px;color:#0f172a;font-weight:900;">
                              ${safeTotalWalkInInterviews}
                            </div>
                            <div style="margin-top:5px;font-size:12px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:0.7px;">
                              Walk-ins
                            </div>
                          </div>
                        </td>

                        <td width="33.33%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ffffff;border:1px solid #dbeafe;border-radius:16px;padding:16px;text-align:center;">
                            <div style="font-size:26px;line-height:34px;color:#0f172a;font-weight:900;">
                              ${safeTotalCompaniesHiring}
                            </div>
                            <div style="margin-top:5px;font-size:12px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:0.7px;">
                              Companies
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top:12px;font-size:14px;line-height:22px;color:#1e40af;text-align:center;">
                      Digest sent on ${safeSentAt}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Your digest focus
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      ${safeRecommendedRole
            ? `
                          <tr>
                            <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                              Role:
                            </td>
                            <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                              ${safeRecommendedRole}
                            </td>
                          </tr>
                          `
            : ""
        }

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeRecommendedLocation}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Period:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeWeekLabel}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h2 style="margin:30px 0 14px;font-size:22px;line-height:30px;color:#0f172a;font-weight:900;letter-spacing:-0.5px;">
                Featured jobs this week
              </h2>

              ${renderJobCards(jobs)}

              ${renderTopCategories(topCategories)}

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Smart job search moves for this week
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Apply early to fresh jobs before applications pile up.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Check walk-in interviews if you are already in the UAE and ready to attend.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Keep your CV clear, current, and matched to the role you apply for.
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
                      Browse Latest Jobs
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeWalkInUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      View Walk-in Interviews
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeCompaniesUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Browse Companies
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeJobAlertsUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Manage Job Alerts
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
                      Do not pay recruiters or employers for job offers. Real employers should not ask for bank OTPs, improper fees, or sensitive documents before a genuine hiring process.
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
                You received this email because weekly job digest emails are enabled for your Dubai Job Zone account.
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                <a href="${safeDigestSettingsUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Email preferences</a>
                &nbsp;•&nbsp;
                <a href="${safeUnsubscribeUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Unsubscribe</a>
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
                Automated Dubai Job Zone weekly job digest.
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
    weeklyJobDigestTemplate,
};
