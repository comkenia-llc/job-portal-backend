"use strict";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&amp;")
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

const renderWalkInCards = (interviews = []) => {
    if (!Array.isArray(interviews) || interviews.length === 0) {
        return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:24px 22px;text-align:center;">
            <div style="font-size:18px;line-height:26px;color:#0f172a;font-weight:900;">
              No walk-in interviews to show right now
            </div>
            <div style="margin-top:8px;font-size:14px;line-height:22px;color:#64748b;">
              Browse Dubai Job Zone to find the latest walk-in interviews in Dubai and across the UAE.
            </div>
          </td>
        </tr>
      </table>
    `;
    }

    return interviews
        .slice(0, 8)
        .map((item) => {
            const safeTitle = escapeHtml(item.title || item.jobTitle || "Walk-in interview");
            const safeCompanyName = escapeHtml(item.companyName || item.company || "");
            const safeLocation = escapeHtml(item.location || "");
            const safeVenue = escapeHtml(item.venue || item.interviewVenue || "");
            const safeInterviewDate = item.interviewDate
                ? escapeHtml(formatDate(item.interviewDate))
                : "";
            const safeInterviewTime = escapeHtml(item.interviewTime || item.time || "");
            const safeJobType = escapeHtml(item.jobType || item.type || "");
            const safeSalary = escapeHtml(formatSalary(item));
            const safeExperience = escapeHtml(item.experience || item.experienceLevel || "");
            const safeDocuments = Array.isArray(item.documents)
                ? item.documents.map((doc) => escapeHtml(doc)).join(", ")
                : escapeHtml(item.documents || "");
            const safeUrl = escapeHtml(
                item.url || item.jobUrl || item.walkInUrl || "https://dubaijobzone.com/walk-in-interviews"
            );
            const safeBadge = escapeHtml(item.badge || item.category || "Walk-in");

            return `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;">
          <tr>
            <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:20px;box-shadow:0 10px 28px rgba(15,23,42,0.06);">
              <div style="display:inline-block;background:#ecfdf5;border:1px solid #bbf7d0;color:#15803d;border-radius:999px;padding:5px 10px;font-size:12px;line-height:17px;font-weight:900;margin-bottom:12px;">
                ${safeBadge}
              </div>

              <div style="font-size:20px;line-height:28px;color:#0f172a;font-weight:900;letter-spacing:-0.3px;">
                ${safeTitle}
              </div>

              <div style="margin-top:8px;font-size:14px;line-height:22px;color:#475569;">
                ${safeCompanyName || "Company not provided"}${safeLocation ? ` • ${safeLocation}` : ""}
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;">
                ${safeInterviewDate || safeInterviewTime
                    ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                        ${safeInterviewDate ? `<strong style="color:#0f172a;">Interview date:</strong> ${safeInterviewDate}` : ""}
                        ${safeInterviewDate && safeInterviewTime ? " &nbsp;•&nbsp; " : ""}
                        ${safeInterviewTime ? `<strong style="color:#0f172a;">Time:</strong> ${safeInterviewTime}` : ""}
                      </td>
                    </tr>
                    `
                    : ""
                }

                ${safeVenue
                    ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                        <strong style="color:#0f172a;">Venue:</strong> ${safeVenue}
                      </td>
                    </tr>
                    `
                    : ""
                }

                <tr>
                  <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                    ${safeJobType ? `<strong style="color:#0f172a;">Type:</strong> ${safeJobType}` : ""}
                    ${safeJobType && safeSalary ? " &nbsp;•&nbsp; " : ""}
                    ${safeSalary ? `<strong style="color:#0f172a;">Salary:</strong> ${safeSalary}` : ""}
                  </td>
                </tr>

                ${safeExperience || safeDocuments
                    ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;line-height:20px;color:#64748b;">
                        ${safeExperience ? `<strong style="color:#0f172a;">Experience:</strong> ${safeExperience}` : ""}
                        ${safeExperience && safeDocuments ? " &nbsp;•&nbsp; " : ""}
                        ${safeDocuments ? `<strong style="color:#0f172a;">Bring:</strong> ${safeDocuments}` : ""}
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
                      View Walk-in Details
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

function walkInInterviewAlertTemplate({
    name = "there",
    alertTitle = "Walk-in interviews matching your preferences",
    alertLocation = "Dubai",
    alertRole = "",
    interviews = [],
    totalMatches = 0,
    walkInUrl = "https://dubaijobzone.com/walk-in-interviews",
    jobsUrl = "https://dubaijobzone.com/jobs",
    alertSettingsUrl = "https://dubaijobzone.com/dashboard/job-alerts",
    unsubscribeUrl = "https://dubaijobzone.com/unsubscribe",
    sentAt = new Date(),
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
}) {
    const safeName = escapeHtml(name);
    const safeAlertTitle = escapeHtml(alertTitle);
    const safeAlertLocation = escapeHtml(alertLocation);
    const safeAlertRole = escapeHtml(alertRole);
    const safeTotalMatches = escapeHtml(totalMatches || interviews.length || 0);
    const safeWalkInUrl = escapeHtml(walkInUrl);
    const safeJobsUrl = escapeHtml(jobsUrl);
    const safeAlertSettingsUrl = escapeHtml(alertSettingsUrl);
    const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
    const safeSentAt = escapeHtml(formatDate(sentAt));
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const shownCount = Array.isArray(interviews) ? Math.min(interviews.length, 8) : 0;

    const subject =
        shownCount > 0
            ? `${shownCount} new walk-in interview${shownCount === 1 ? "" : "s"} in ${alertLocation}`
            : `Walk-in interview alert for ${alertLocation}`;

    const textInterviews = Array.isArray(interviews)
        ? interviews
            .slice(0, 8)
            .map((item, index) => {
                const salary = formatSalary(item);
                return `
${index + 1}. ${item.title || item.jobTitle || "Walk-in interview"}
${item.companyName || item.company ? `Company: ${item.companyName || item.company}` : ""}
${item.location ? `Location: ${item.location}` : ""}
${item.venue || item.interviewVenue ? `Venue: ${item.venue || item.interviewVenue}` : ""}
${item.interviewDate ? `Interview date: ${formatDate(item.interviewDate)}` : ""}
${item.interviewTime || item.time ? `Time: ${item.interviewTime || item.time}` : ""}
${item.jobType || item.type ? `Type: ${item.jobType || item.type}` : ""}
${salary ? `Salary: ${salary}` : ""}
${item.experience || item.experienceLevel ? `Experience: ${item.experience || item.experienceLevel}` : ""}
${item.url || item.jobUrl || item.walkInUrl ? `View: ${item.url || item.jobUrl || item.walkInUrl}` : ""}
`;
            })
            .join("\n")
        : "";

    const text = `
Hi ${name},

We found walk-in interviews matching your Dubai Job Zone alert.

Alert: ${alertTitle}
${alertRole ? `Role: ${alertRole}` : ""}
Location: ${alertLocation}
Total matches: ${totalMatches || interviews.length || 0}
Sent at: ${formatDate(sentAt)}

${textInterviews || "Open Dubai Job Zone to view the latest walk-in interviews."}

View walk-in interviews:
${walkInUrl}

Browse latest jobs:
${jobsUrl}

Manage alerts:
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
    New walk-in interviews are available on Dubai Job Zone.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          <tr>
            <td style="background:#0b1220;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="height:6px;background:linear-gradient(90deg,#22c55e 0%,#06b6d4 42%,#2563eb 100%);font-size:1px;line-height:1px;">
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
                Walk-in interview alert • Dubai hiring updates
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#ecfdf5;border:1px solid #bbf7d0;color:#15803d;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Walk-in interview alert
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                New walk-in interviews found
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                We found walk-in interview opportunities on <strong>Dubai Job Zone</strong> matching your alert${safeAlertRole ? ` for <strong>${safeAlertRole}</strong>` : ""} in <strong>${safeAlertLocation}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#15803d;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Matches found
                    </div>

                    <div style="margin-top:8px;font-size:38px;line-height:46px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                      ${safeTotalMatches}
                    </div>

                    <div style="margin-top:12px;font-size:14px;line-height:22px;color:#166534;">
                      Alert sent on ${safeSentAt}
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Alert details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Alert:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeAlertTitle}
                        </td>
                      </tr>

                      ${safeAlertRole
            ? `
                          <tr>
                            <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                              Role:
                            </td>
                            <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                              ${safeAlertRole}
                            </td>
                          </tr>
                          `
            : ""
        }

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:140px;font-weight:800;vertical-align:top;">
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeAlertLocation}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${renderWalkInCards(interviews)}

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Before going to a walk-in interview
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Carry an updated CV, passport copy, visa copy, and recent photo if required.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Confirm the interview date, time, venue, and company details before travelling.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Do not pay improper recruitment fees or share bank OTPs with anyone.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeWalkInUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      View Walk-in Interviews
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
                <a href="${safeWalkInUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeWalkInUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Job safety reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Dubai Job Zone shares hiring information to help job seekers, but you should always verify the employer and interview details before attending. Never pay money for a job offer.
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
                You received this email because you created a walk-in interview alert on Dubai Job Zone.
              </p>

              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#94a3b8;">
                <a href="${safeAlertSettingsUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Manage alerts</a>
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
                Automated Dubai Job Zone walk-in interview alert.
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
    walkInInterviewAlertTemplate,
};