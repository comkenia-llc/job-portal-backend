"use strict";

const { renderEmailHeader } = require("./_shared/renderEmailHeader");

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

function welcomeEmailTemplate({
    name = "there",
    accountType = "candidate",
    dashboardUrl = "https://dubaijobzone.com/dashboard",
    jobsUrl = "https://dubaijobzone.com/jobs",
    walkInUrl = "https://dubaijobzone.com/walk-in-interviews",
    companiesUrl = "https://dubaijobzone.com/companies",
    jobAlertsUrl = "https://dubaijobzone.com/dashboard/job-alerts",
    profileUrl = "https://dubaijobzone.com/dashboard/profile",
    resumeBuilderUrl = "https://dubaijobzone.com/dashboard/resumes/builder",
    employerDashboardUrl = "https://dubaijobzone.com/dashboard/employer",
    postJobUrl = "https://dubaijobzone.com/dashboard/employer/jobs/new",
    companyProfileUrl = "https://dubaijobzone.com/dashboard/employer/company",
    supportEmail = "support@dubaijobzone.com",
    siteUrl = "https://dubaijobzone.com",
    logoUrl = "",
}) {
    const safeName = escapeHtml(name);
    const safeAccountType = escapeHtml(accountType);
    const safeDashboardUrl = escapeHtml(dashboardUrl);
    const safeJobsUrl = escapeHtml(jobsUrl);
    const safeWalkInUrl = escapeHtml(walkInUrl);
    const safeCompaniesUrl = escapeHtml(companiesUrl);
    const safeJobAlertsUrl = escapeHtml(jobAlertsUrl);
    const safeProfileUrl = escapeHtml(profileUrl);
    const safeResumeBuilderUrl = escapeHtml(resumeBuilderUrl);
    const safeEmployerDashboardUrl = escapeHtml(employerDashboardUrl);
    const safePostJobUrl = escapeHtml(postJobUrl);
    const safeCompanyProfileUrl = escapeHtml(companyProfileUrl);
    const safeSupportEmail = escapeHtml(supportEmail);
    const safeSiteUrl = escapeHtml(siteUrl);

    const isEmployer = String(accountType).toLowerCase() === "employer";

    const subject = "Welcome to Dubai Job Zone";

    const text = `
Hi ${name},

Welcome to Dubai Job Zone. Your account is ready.

${isEmployer ? "You can now manage your employer profile, submit jobs, and track applications from your employer dashboard." : "You can now browse UAE jobs, save opportunities, create job alerts, and apply faster from your dashboard."}

Dashboard:
${isEmployer ? employerDashboardUrl : dashboardUrl}

${isEmployer ? `Post a job:\n${postJobUrl}\n\nCompany profile:\n${companyProfileUrl}` : `Browse jobs:\n${jobsUrl}\n\nWalk-in interviews:\n${walkInUrl}\n\nCreate job alerts:\n${jobAlertsUrl}\n\nBuild your CV:\n${resumeBuilderUrl}`}

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
    Welcome to Dubai Job Zone. Your account is ready.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f8;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:36px 14px;">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">

          ${renderEmailHeader({
            logoUrl,
            theme: "opportunity",
            subtitle: "Fresh opportunities, trusted employers, and career growth across the UAE",
            accentLabel: "Your account is ready for new opportunities",
        })}

          <tr>
            <td style="padding:38px 34px 30px;">

              <div style="display:inline-block;background:#ecfdf5;border:1px solid #bbf7d0;color:#15803d;border-radius:999px;padding:7px 13px;font-size:13px;line-height:18px;font-weight:800;">
                Account ready
              </div>

              <h1 style="margin:20px 0 12px;font-size:30px;line-height:38px;color:#0f172a;font-weight:900;letter-spacing:-0.8px;">
                Welcome to Dubai Job Zone
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#334155;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">
                Your <strong>Dubai Job Zone</strong> account is ready. ${isEmployer
            ? "You can now manage your employer profile, prepare job posts, and track applications from your dashboard."
            : "You can now explore UAE jobs, save opportunities, create job alerts, and use career tools to move faster."
        }
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:22px;padding:24px 22px;">
                    <div style="font-size:13px;line-height:18px;color:#15803d;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                      Account type
                    </div>

                    <div style="margin-top:8px;font-size:24px;line-height:32px;color:#0f172a;font-weight:900;letter-spacing:-0.4px;text-transform:capitalize;">
                      ${safeAccountType}
                    </div>

                    <div style="margin-top:14px;font-size:14px;line-height:22px;color:#166534;">
                      Your email verification is complete and your account is active.
                    </div>
                  </td>
                </tr>
              </table>

              ${isEmployer
            ? `
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Start hiring on Dubai Job Zone
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Complete your company profile with clear business details.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Submit job posts with accurate salary, location, and application instructions.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Track candidates and respond quickly to strong applications.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 14px;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:14px;">
                    <a href="${safeEmployerDashboardUrl}" target="_blank" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:900;color:#ffffff;text-decoration:none;border-radius:14px;background:#2563eb;">
                      Open Employer Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 14px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeCompanyProfileUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Complete Company Profile
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safePostJobUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Post a Job
                    </a>
                  </td>
                </tr>
              </table>
                  `
            : `
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;padding:22px 20px;">
                    <p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#0f172a;font-weight:900;">
                      Start your UAE job search
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Browse the latest UAE and Dubai jobs by role, company, and location.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Save jobs and create alerts so new opportunities reach you faster.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Check walk-in interviews if you are ready to attend interviews in person.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:14px;line-height:22px;color:#475569;">
                          ✓ Build or improve your CV before applying to competitive roles.
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
                    <a href="${safeJobAlertsUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Create Job Alerts
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#f8fafc" style="border-radius:14px;border:1px solid #e2e8f0;">
                    <a href="${safeResumeBuilderUrl}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:900;color:#2563eb;text-decoration:none;border-radius:14px;background:#f8fafc;">
                      Build Your CV
                    </a>
                  </td>
                </tr>
              </table>
                  `
        }

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
                <tr>
                  <td style="background:#ffffff;border:1px solid #dbeafe;border-radius:22px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#1d4ed8;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Jobs
                            </div>
                            <div style="margin-top:7px;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                              UAE job listings, walk-ins and hiring updates
                            </div>
                          </div>
                        </td>

                        <td width="50%" style="padding:8px;vertical-align:top;">
                          <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:16px;">
                            <div style="font-size:12px;line-height:18px;color:#15803d;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;">
                              Career tools
                            </div>
                            <div style="margin-top:7px;font-size:14px;line-height:22px;color:#0f172a;font-weight:800;">
                              Alerts, saved jobs, company pages and guides
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:26px 0 8px;font-size:14px;line-height:22px;color:#64748b;">
                If the button does not work, copy and paste this link into your browser:
              </p>

              <p style="margin:0;background:#f1f5f9;border-radius:12px;padding:12px 14px;font-size:13px;line-height:20px;color:#334155;word-break:break-all;">
                <a href="${isEmployer ? safeEmployerDashboardUrl : safeDashboardUrl}" target="_blank" style="color:#2563eb;text-decoration:none;">
                  ${isEmployer ? safeEmployerDashboardUrl : safeDashboardUrl}
                </a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:17px 18px;">
                    <p style="margin:0 0 7px;font-size:14px;line-height:22px;color:#9a3412;font-weight:900;">
                      Safety reminder
                    </p>
                    <p style="margin:0;font-size:14px;line-height:22px;color:#9a3412;">
                      Dubai Job Zone will never ask for your password, bank OTP, or improper payment by email, phone, WhatsApp, or social media.
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
                Automated Dubai Job Zone welcome email.
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
    welcomeEmailTemplate,
};
