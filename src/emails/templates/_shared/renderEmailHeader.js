"use strict";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const HEADER_THEMES = {
    trust: {
        strip: "linear-gradient(90deg,#2563eb 0%,#06b6d4 42%,#22c55e 100%)",
        background: "linear-gradient(135deg,#0f172a 0%,#172554 48%,#075985 100%)",
        subtitleColor: "#c7d2fe",
    },
    opportunity: {
        strip: "linear-gradient(90deg,#0ea5e9 0%,#22c55e 48%,#f59e0b 100%)",
        background: "linear-gradient(135deg,#0f766e 0%,#0f172a 44%,#1d4ed8 100%)",
        subtitleColor: "#d1fae5",
    },
    success: {
        strip: "linear-gradient(90deg,#16a34a 0%,#22c55e 46%,#06b6d4 100%)",
        background: "linear-gradient(135deg,#14532d 0%,#166534 42%,#0f766e 100%)",
        subtitleColor: "#dcfce7",
    },
    security: {
        strip: "linear-gradient(90deg,#f59e0b 0%,#f97316 46%,#ef4444 100%)",
        background: "linear-gradient(135deg,#431407 0%,#7c2d12 40%,#7f1d1d 100%)",
        subtitleColor: "#fed7aa",
    },
    digest: {
        strip: "linear-gradient(90deg,#7c3aed 0%,#2563eb 50%,#06b6d4 100%)",
        background: "linear-gradient(135deg,#312e81 0%,#1d4ed8 45%,#0f766e 100%)",
        subtitleColor: "#ddd6fe",
    },
};

function renderEmailHeader({
    logoUrl = "",
    theme = "trust",
    subtitle = "",
    brandName = "Dubai Job Zone",
}) {
    const selectedTheme = HEADER_THEMES[theme] || HEADER_THEMES.trust;
    const safeLogoUrl = escapeHtml(logoUrl);
    const safeSubtitle = escapeHtml(subtitle);
    const safeBrandName = escapeHtml(brandName);

    return `
          <tr>
            <td style="background:#0b1220;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="height:6px;background:${selectedTheme.strip};font-size:1px;line-height:1px;">
                    &nbsp;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:${selectedTheme.background};padding:38px 28px 34px;text-align:center;">
              ${safeLogoUrl
            ? `
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <img src="${safeLogoUrl}" alt="${safeBrandName}" style="display:block;width:75%;max-width:420px;min-width:220px;height:auto;margin:0 auto;" />
                  </td>
                </tr>
              </table>
              `
            : `<div style="font-size:25px;line-height:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;text-align:center;">${safeBrandName}</div>`
        }
              ${safeSubtitle
            ? `<div style="margin-top:12px;font-size:14px;line-height:22px;color:${selectedTheme.subtitleColor};text-align:center;">${safeSubtitle}</div>`
            : ""
        }
            </td>
          </tr>
    `;
}

module.exports = {
    renderEmailHeader,
};
