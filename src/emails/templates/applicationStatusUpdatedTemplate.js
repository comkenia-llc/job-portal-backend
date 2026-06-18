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

const getStatusConfig = (status = "") => {
    const normalized = String(status).toLowerCase().trim();

    const configs = {
        submitted: {
            label: "Application submitted",
            badgeBg: "#eff6ff",
            badgeBorder: "#bfdbfe",
            badgeColor: "#1d4ed8",
            strip: "linear-gradient(90deg,#2563eb 0%,#06b6d4 42%,#22c55e 100%)",
            title: "Your application has been submitted",
            message:
                "Your application has been received and is now available for the employer to review.",
            nextSteps: [
                "Keep your phone and email available for employer updates.",
                "Review your CV and profile for accuracy.",
                "Continue applying to other relevant Dubai jobs.",
            ],
        },

        reviewed: {
            label: "Application reviewed",
            badgeBg: "#f8fafc",
            badgeBorder: "#e2e8f0",
            badgeColor: "#475569",
            strip: "linear-gradient(90deg,#64748b 0%,#2563eb 52%,#06b6d4 100%)",
            title: "Your application has been reviewed",
            message:
                "The employer has reviewed your application. No further action is required right now unless the employer contacts you.",
            nextSteps: [
                "Watch your inbox and phone for employer communication.",
                "Prepare your documents in case the employer requests them.",
                "Keep applying to suitable jobs while you wait.",
            ],
        },

        shortlisted: {
            label: "Shortlisted",
            badgeBg: "#ecfdf5",
            badgeBorder: "#bbf7d0",
            badgeColor: "#15803d",
            strip: "linear-gradient(90deg,#22c55e 0%,#06b6d4 48%,#2563eb 100%)",
            title: "Good news — you’ve been shortlisted",
            message:
                "The employer has shortlisted your application. This means your profile may match what they are looking for.",
            nextSteps: [
                "Keep your phone available for interview calls or WhatsApp messages.",
                "Prepare a short introduction about your experience.",
                "Keep your CV, passport copy, visa status, and certificates ready if needed.",
            ],
        },

        interview: {
            label: "Interview requested",
            badgeBg: "#eff6ff",
            badgeBorder: "#bfdbfe",
            badgeColor: "#1d4ed8",
            strip: "linear-gradient(90deg,#2563eb 0%,#7c3aed 50%,#06b6d4 100%)",
            title: "The employer wants to interview you",
            message:
                "The employer has updated your application status to interview requested. Please check the details and respond quickly if they contact you.",
            nextSteps: [
                "Confirm the interview time as soon as possible.",
                "Research the company before speaking with them.",
                "Prepare your CV, experience details, and expected salary.",
            ],
        },

        rejected: {
            label: "Not selected",
            badgeBg: "#fff7ed",
            badgeBorder: "#fed7aa",
            badgeColor: "#c2410c",
            strip: "linear-gradient(90deg,#f97316 0%,#ef4444 48%,#991b1b 100%)",
            title: "Your application was not selected",
            message:
                "The employer has decided not to move forward with this application. This can happen for many reasons, including experience, timing, location, or role requirements.",
            nextSteps: [
                "Do not stop applying — many candidates get hired after several applications.",
                "Update your CV and profile with stronger work details.",
                "Apply to similar roles while new jobs are still fresh.",
            ],
        },

        hired: {
            label: "Hired",
            badgeBg: "#ecfdf5",
            badgeBorder: "#bbf7d0",
            badgeColor: "#15803d",
            strip: "linear-gradient(90deg,#16a34a 0%,#22c55e 50%,#06b6d4 100%)",
            title: "Congratulations — you’ve been marked as hired",
            message:
                "The employer has updated your application status to hired. Congratulations on this opportunity.",
            nextSteps: [
                "Confirm all offer details directly with the employer.",
                "Never pay a fee for a job offer unless you have verified the process carefully.",
                "Keep records of your offer, salary, work location, and joining date.",
            ],
        },
    };

    return (
        configs[normalized] || {
            label: status || "Application status updated",
            badgeBg: "#eff6ff",
            badgeBorder: "#bfdbfe",
            badgeColor: "#1d4ed8",
            strip: "linear-gradient(90deg,#2563eb 0%,#06b6d4 42%,#22c55e 100%)",
            title: "Your application status has been updated",
            message:
                "There is a new update on your Dubai Job Zone job application. Please review the details below.",
            nextSteps: [
                "Check the application details in your dashboard.",
                "Keep your phone and email available for employer communication.",
                "Continue applying to other suitable jobs.",
            ],
        }
    );
};

function applicationStatusUpdatedTemplate({
    candidateName = "there",
    status = "updated",
    previousStatus = "",
    jobTitle = "Job application",
    companyName = "",
    location = "",
    applicationUrl = "https://dubaijobzone.com/dashboard/applications",
    jobUrl = "",
    employerMessage = "",
    updatedAt = new Date(),
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
    logoUrl = "",
}) {
    const config = getStatusConfig(status);

    const safeCandidateName = escapeHtml(candidateName);
    const safeStatus = escapeHtml(config.label);
    const safePreviousStatus = escapeHtml(previousStatus);
    const safeJobTitle = escapeHtml(jobTitle);
    const safeCompanyName = escapeHtml(companyName);
    const safeLocation = escapeHtml(location);
    const safeApplicationUrl = escapeHtml(applicationUrl);
    const safeJobUrl = escapeHtml(jobUrl);
    const safeEmployerMessage = escapeHtml(employerMessage).replace(/\n/g, "<br />");
    const safeUpdatedAt = escapeHtml(formatDate(updatedAt));
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);
    const safeLogoUrl = escapeHtml(logoUrl);

    const subject = `Application update: ${config.label} for ${jobTitle}`;

    const text = `
Hi ${candidateName},

Your application status has been updated on Dubai Job Zone.

Job: ${jobTitle}
Company: ${companyName || "Not provided"}
Location: ${location || "Not provided"}
New status: ${config.label}
${previousStatus ? `Previous status: ${previousStatus}` : ""}
Updated at: ${formatDate(updatedAt)}

${config.message}

${employerMessage ? `Message from employer:\n${employerMessage}` : ""}

View application:
${applicationUrl}

${jobUrl ? `View job:\n${jobUrl}` : ""}

Dubai Job Zone
${siteUrl}
Support: ${supportEmail}
`;

    const nextStepsHtml = config.nextSteps
        .map(
            (item) => `
        <tr>
          <td style="padding:6px 0;font-size:14px;line-height:22px;color:#475569;">
            ✓ ${escapeHtml(item)}
          </td>
        </tr>
      `
        )
        .join("");

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
    Your application status for ${safeJobTitle} has been updated to ${safeStatus}.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          <tr>
            <td style="background:#0b1220;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="height:6px;background:${config.strip};font-size:1px;line-height:1px;">
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
                Application update • Dubai jobs and employer opportunities
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:${config.badgeBg};border:1px solid ${config.badgeBorder};color:${config.badgeColor};border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                ${safeStatus}
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                ${escapeHtml(config.title)}
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeCandidateName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                ${escapeHtml(config.message)}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Application
                    </div>

                    <div style="margin-top:8px;font-size:24px;line-height:32px;color:#0f172a;font-weight:900;letter-spacing:-0.4px;">
                      ${safeJobTitle}
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#475569;">
                      ${safeCompanyName || "Company not provided"} ${safeLocation ? `• ${safeLocation}` : ""}
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
                          <div style="background:${config.badgeBg};border:1px solid ${config.badgeBorder};border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:${config.badgeColor};font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              New status
                            </div>
                            <div style="margin-top:7px;font-size:18px;line-height:26px;color:#0f172a;font-weight:900;">
                              ${safeStatus}
                            </div>
                          </div>
                        </td>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Updated
                            </div>
                            <div style="margin-top:7px;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                              ${safeUpdatedAt}
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
                      Application details
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

                      ${safePreviousStatus
            ? `
                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          Previous status:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;">
                          ${safePreviousStatus}
                        </td>
                      </tr>
                      `
            : ""
        }

                      <tr>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#64748b;width:150px;font-weight:800;vertical-align:top;">
                          New status:
                        </td>
                        <td style="padding:8px 0;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                          ${safeStatus}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${safeEmployerMessage
            ? `
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#1e3a8a;font-weight:900;">
                      Message from employer
                    </p>

                    <div style="font-size:15px;line-height:25px;color:#334155;">
                      ${safeEmployerMessage}
                    </div>
                  </td>
                </tr>
              </table>
              `
            : ""
        }

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:18px;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#0f172a;font-weight:900;">
                      Recommended next steps
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      ${nextStepsHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeApplicationUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      View Application
                    </a>
                  </td>
                </tr>
              </table>

              ${safeJobUrl
            ? `
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeJobUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      View Job
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

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Job safety reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Be careful with anyone asking for payment, bank details, or private documents too early. Dubai Job Zone does not ask candidates to pay for job offers.
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
                This is an automated transactional email about your Dubai Job Zone application.
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
    applicationStatusUpdatedTemplate,
};
