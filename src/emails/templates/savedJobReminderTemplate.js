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

const renderSavedJobCards = (jobs = []) => {
    if (!Array.isArray(jobs) || jobs.length === 0) {
        return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:24px 22px;text-align:center;">
            <div style="font-size:18px;line-height:26px;color:#0f172a;font-weight:900;">
              No saved jobs to show right now
            </div>
            <div style="margin-top:8px;font-size:14px;line-height:22px;color:#64748b;">
              Browse Dubai Job Zone and save jobs you want to apply for later.
            </div>
          </td>
        </tr>
      </table>
    `;
    }

    return jobs
        .slice(0, 8)
        .map((job) => {
            const safeTitle = escapeHtml(job.title || "Job opportunity");
            const safeCompanyName = escapeHtml(job.companyName || job.company || "");
            const safeLocation = escapeHtml(job.location || "");
            const safeJobType = escapeHtml(job.jobType || job.type || "");
            const safeSavedAt = job.savedAt ? escapeHtml(formatDate(job.savedAt)) : "";
            const safeDeadline = job.deadline ? escapeHtml(formatDate(job.deadline)) : "";
            const safeSalary = escapeHtml(formatSalary(job));
            const safeUrl = escapeHtml(job.url || job.jobUrl || "https://dubaijobzone.com/jobs");
            const safeBadge = escapeHtml(job.badge || job.category || "");

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

                ${safeSavedAt || safeDeadline
                    ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                        ${safeSavedAt ? `<strong style="color:#0f172a;">Saved:</strong> ${safeSavedAt}` : ""}
                        ${safeSavedAt && safeDeadline ? " &nbsp;•&nbsp; " : ""}
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

function savedJobsReminderTemplate({
    name = "there",
    jobs = [],
    totalSavedJobs = 0,
    savedJobsUrl = "https://dubaijobzone.com/dashboard/saved-jobs",
    jobsUrl = "https://dubaijobzone.com/jobs",
    jobAlertsUrl = "https://dubaijobzone.com/dashboard/job-alerts",
    sentAt = new Date(),
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeName = escapeHtml(name);
    const safeTotalSavedJobs = escapeHtml(totalSavedJobs || jobs.length || 0);
    const safeSavedJobsUrl = escapeHtml(savedJobsUrl);
    const safeJobsUrl = escapeHtml(jobsUrl);
    const safeJobAlertsUrl = escapeHtml(jobAlertsUrl);
    const safeSentAt = escapeHtml(formatDate(sentAt));
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const shownJobsCount = Array.isArray(jobs) ? Math.min(jobs.length, 8) : 0;
    const subject =
        shownJobsCount > 0
            ? `Reminder: ${shownJobsCount} saved job${shownJobsCount === 1 ? "" : "s"} waiting for you`
            : "Reminder: check your saved jobs on Dubai Job Zone";

    const textJobs = Array.isArray(jobs)
        ? jobs
            .slice(0, 8)
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

    const text = `
Hi ${name},

You have saved jobs waiting in your Dubai Job Zone account.

Total saved jobs: ${totalSavedJobs || jobs.length || 0}
Reminder sent at: ${formatDate(sentAt)}

${textJobs || "Open your saved jobs page to review roles you saved earlier."}

View saved jobs:
${savedJobsUrl}

Browse latest jobs:
${jobsUrl}

Create job alerts:
${jobAlertsUrl}

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
    You have saved jobs waiting in your Dubai Job Zone account.
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
                Saved jobs reminder • UAE career opportunities
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Saved jobs reminder
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Your saved jobs are waiting
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                You saved job opportunities on <strong>Dubai Job Zone</strong>. Review them now while the roles are still open and application deadlines have not passed.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Saved jobs
                    </div>

                    <div style="margin-top:8px;font-size:38px;line-height:46px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                      ${safeTotalSavedJobs}
                    </div>

                    <div style="margin-top:12px;font-size:14px;line-height:22px;color:#1e40af;">
                      Reminder sent on ${safeSentAt}
                    </div>
                  </td>
                </tr>
              </table>

              ${renderSavedJobCards(jobs)}

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Smart next steps
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Apply early if the job matches your skills and location.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Update your CV before sending applications.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Create job alerts so similar Dubai jobs reach you faster.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeSavedJobsUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      View Saved Jobs
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeJobsUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Browse Latest Jobs
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeJobAlertsUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Create Job Alerts
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeSavedJobsUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeSavedJobsUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Job safety reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Do not pay recruiters or employers for job offers. Genuine employers should not ask for improper fees, bank OTPs, or sensitive personal documents before a real hiring process.
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
                You received this email because you saved jobs on Dubai Job Zone.
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
                Automated Dubai Job Zone saved jobs reminder.
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
    savedJobsReminderTemplate,
};