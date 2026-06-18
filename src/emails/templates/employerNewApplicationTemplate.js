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

function employerNewApplicationTemplate({
    employerName = "there",
    companyName = "",
    candidateName = "Candidate",
    candidateEmail = "",
    candidatePhone = "",
    jobTitle = "Job post",
    location = "",
    applicationStatus = "New",
    appliedAt = new Date(),
    candidateSummary = "",
    experience = "",
    currentLocation = "",
    expectedSalary = "",
    noticePeriod = "",
    applicationUrl = "https://dubaijobzone.com/dashboard/employer/applications",
    jobUrl = "",
    candidateProfileUrl = "",
    dashboardUrl = "https://dubaijobzone.com/dashboard/employer",
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
    logoUrl = "",
}) {
    const safeEmployerName = escapeHtml(employerName);
    const safeCompanyName = escapeHtml(companyName);
    const safeCandidateName = escapeHtml(candidateName);
    const safeCandidateEmail = escapeHtml(candidateEmail);
    const safeCandidatePhone = escapeHtml(candidatePhone);
    const safeJobTitle = escapeHtml(jobTitle);
    const safeLocation = escapeHtml(location);
    const safeApplicationStatus = escapeHtml(applicationStatus);
    const safeAppliedAt = escapeHtml(formatDate(appliedAt));
    const safeCandidateSummary = escapeHtml(candidateSummary).replace(/\n/g, "<br />");
    const safeExperience = escapeHtml(experience);
    const safeCurrentLocation = escapeHtml(currentLocation);
    const safeExpectedSalary = escapeHtml(expectedSalary);
    const safeNoticePeriod = escapeHtml(noticePeriod);
    const safeApplicationUrl = escapeHtml(applicationUrl);
    const safeJobUrl = escapeHtml(jobUrl);
    const safeCandidateProfileUrl = escapeHtml(candidateProfileUrl);
    const safeDashboardUrl = escapeHtml(dashboardUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);
    const safeLogoUrl = escapeHtml(logoUrl);

    const subject = `New application received for ${jobTitle}`;

    const text = `
Hi ${employerName},

You received a new application on Dubai Job Zone.

Job: ${jobTitle}
Company: ${companyName || "Not provided"}
Location: ${location || "Not provided"}
Application status: ${applicationStatus}
Applied at: ${formatDate(appliedAt)}

Candidate:
Name: ${candidateName}
Email: ${candidateEmail || "Not provided"}
Phone: ${candidatePhone || "Not provided"}
Current location: ${currentLocation || "Not provided"}
Experience: ${experience || "Not provided"}
Expected salary: ${expectedSalary || "Not provided"}
Notice period: ${noticePeriod || "Not provided"}

${candidateSummary ? `Candidate summary:\n${candidateSummary}` : ""}

View application:
${applicationUrl}

${candidateProfileUrl ? `View candidate profile:\n${candidateProfileUrl}` : ""}
${jobUrl ? `View job:\n${jobUrl}` : ""}

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
    New application received for ${safeJobTitle} from ${safeCandidateName}.
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
              ${safeLogoUrl
            ? `<img src="${safeLogoUrl}" alt="Dubai Job Zone" style="display:block;height:40px;width:auto;max-width:220px;" />`
            : `<div style="font-size:25px;line-height:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Dubai Job Zone</div>`
        }
              <div style="margin-top:8px;font-size:14px;line-height:22px;color:#c7d2fe;">
                Employer notification • New candidate application
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#ecfdf5;border:1px solid #bbf7d0;color:#15803d;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                New application
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                You received a new candidate
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeEmployerName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                A candidate has applied for <strong>${safeJobTitle}</strong>${safeCompanyName ? ` at <strong>${safeCompanyName}</strong>` : ""}. Review the application while it is fresh and contact the candidate if they match your hiring needs.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Candidate
                    </div>

                    <div style="margin-top:8px;font-size:24px;line-height:32px;color:#0f172a;font-weight:900;letter-spacing:-0.4px;">
                      ${safeCandidateName}
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#475569;">
                      Applied for ${safeJobTitle}${safeLocation ? ` • ${safeLocation}` : ""}
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
                          <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#15803d;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Status
                            </div>
                            <div style="margin-top:7px;font-size:18px;line-height:26px;color:#0f172a;font-weight:900;">
                              ${safeApplicationStatus}
                            </div>
                          </div>
                        </td>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Applied
                            </div>
                            <div style="margin-top:7px;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                              ${safeAppliedAt}
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
                      Candidate details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Name:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeCandidateName}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Email:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;word-break:break-all;">
                          ${safeCandidateEmail
            ? `<a href="mailto:${safeCandidateEmail}" style="color:#2563eb;text-decoration:none;font-weight:800;">${safeCandidateEmail}</a>`
            : "Not provided"
        }
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Phone:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCandidatePhone || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Current location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCurrentLocation || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Experience:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeExperience || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Expected salary:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                          ${safeExpectedSalary || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Notice period:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeNoticePeriod || "Not provided"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${safeCandidateSummary
            ? `
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#1e3a8a;font-weight:900;">
                      Candidate summary
                    </p>

                    <div style="font-size:15px;line-height:25px;color:#334155;">
                      ${safeCandidateSummary}
                    </div>
                  </td>
                </tr>
              </table>
              `
            : ""
        }

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Job details
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Job:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeJobTitle}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Company:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeCompanyName || "Not provided"}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Location:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safeLocation || "Not provided"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Hiring reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Contact candidates through clear, professional communication. Never ask candidates for improper fees or sensitive documents before a legitimate hiring step.
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeApplicationUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Review Application
                    </a>
                  </td>
                </tr>
              </table>

              ${safeCandidateProfileUrl
            ? `
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeCandidateProfileUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      View Candidate Profile
                    </a>
                  </td>
                </tr>
              </table>
              `
            : ""
        }

              ${safeJobUrl
            ? `
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeJobUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      View Job Post
                    </a>
                  </td>
                </tr>
              </table>
              `
            : ""
        }

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${safeApplicationUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${safeApplicationUrl}
                </a>
              </p>

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
                <a href="${safeDashboardUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Employer Dashboard</a>
                &nbsp;•&nbsp;
                <a href="mailto:${safeSupportEmail}" style="color:#64748b;text-decoration:none;">Support</a>
                &nbsp;•&nbsp;
                <a href="${safeSiteUrl}" target="_blank" style="color:#64748b;text-decoration:none;">Dubai Job Zone</a>
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
                Automated Dubai Job Zone employer application notification.
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
    employerNewApplicationTemplate,
};
