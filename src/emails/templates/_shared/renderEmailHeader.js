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
        shellBackground: "linear-gradient(135deg,#020617 0%,#0f172a 54%,#1e293b 100%)",
        panelBackground: "linear-gradient(180deg,rgba(255,255,255,0.24) 0%,rgba(255,255,255,0.12) 100%)",
        panelBorder: "rgba(255,255,255,0.26)",
        panelGlow: "0 18px 44px rgba(37,99,235,0.24), inset 0 1px 0 rgba(255,255,255,0.28)",
        subtitleColor: "#dbeafe",
        accentBackground: "linear-gradient(90deg,#2563eb 0%,#06b6d4 58%,#22c55e 100%)",
        accentText: "#eff6ff",
    },
    opportunity: {
        shellBackground: "linear-gradient(135deg,#082f49 0%,#0f172a 50%,#14532d 100%)",
        panelBackground: "linear-gradient(180deg,rgba(255,255,255,0.24) 0%,rgba(255,255,255,0.12) 100%)",
        panelBorder: "rgba(255,255,255,0.26)",
        panelGlow: "0 18px 44px rgba(34,197,94,0.18), inset 0 1px 0 rgba(255,255,255,0.28)",
        subtitleColor: "#dcfce7",
        accentBackground: "linear-gradient(90deg,#0ea5e9 0%,#22c55e 50%,#f59e0b 100%)",
        accentText: "#f0fdf4",
    },
    success: {
        shellBackground: "linear-gradient(135deg,#052e16 0%,#14532d 50%,#134e4a 100%)",
        panelBackground: "linear-gradient(180deg,rgba(255,255,255,0.24) 0%,rgba(255,255,255,0.12) 100%)",
        panelBorder: "rgba(255,255,255,0.24)",
        panelGlow: "0 18px 44px rgba(34,197,94,0.22), inset 0 1px 0 rgba(255,255,255,0.28)",
        subtitleColor: "#dcfce7",
        accentBackground: "linear-gradient(90deg,#16a34a 0%,#22c55e 56%,#06b6d4 100%)",
        accentText: "#f0fdf4",
    },
    security: {
        shellBackground: "linear-gradient(135deg,#111827 0%,#3f1d1d 58%,#451a03 100%)",
        panelBackground: "linear-gradient(180deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.11) 100%)",
        panelBorder: "rgba(255,255,255,0.24)",
        panelGlow: "0 18px 44px rgba(249,115,22,0.22), inset 0 1px 0 rgba(255,255,255,0.24)",
        subtitleColor: "#ffedd5",
        accentBackground: "linear-gradient(90deg,#f59e0b 0%,#f97316 52%,#ef4444 100%)",
        accentText: "#fff7ed",
    },
    digest: {
        shellBackground: "linear-gradient(135deg,#1e1b4b 0%,#1d4ed8 52%,#164e63 100%)",
        panelBackground: "linear-gradient(180deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.11) 100%)",
        panelBorder: "rgba(255,255,255,0.24)",
        panelGlow: "0 18px 44px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.26)",
        subtitleColor: "#e0e7ff",
        accentBackground: "linear-gradient(90deg,#7c3aed 0%,#2563eb 52%,#06b6d4 100%)",
        accentText: "#eef2ff",
    },
};

function renderEmailHeader({
    logoUrl = "",
    theme = "trust",
    subtitle = "",
    accentLabel = "",
    brandName = "Dubai Job Zone",
}) {
    const selectedTheme = HEADER_THEMES[theme] || HEADER_THEMES.trust;
    const safeLogoUrl = escapeHtml(logoUrl);
    const safeSubtitle = escapeHtml(subtitle);
    const safeAccentLabel = escapeHtml(accentLabel || "Trusted Dubai Job Zone update");
    const safeBrandName = escapeHtml(brandName);

    return `
          <tr>
            <td align="center" style="background:${selectedTheme.shellBackground};padding:28px 24px 0;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;">
                <tr>
                  <td align="center" style="padding:0 0 18px;">
                    <div style="font-size:11px;line-height:16px;letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,0.72);font-weight:800;">
                      Dubai Job Zone
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="background:${selectedTheme.panelBackground};border:1px solid ${selectedTheme.panelBorder};border-radius:30px;padding:26px 24px;box-shadow:${selectedTheme.panelGlow};backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);">
                    ${safeLogoUrl
            ? `<img src="${safeLogoUrl}" alt="${safeBrandName}" style="display:block;width:78%;max-width:430px;min-width:220px;height:auto;margin:0 auto;" />`
            : `<div style="font-size:28px;line-height:34px;font-weight:900;color:#ffffff;letter-spacing:-0.6px;text-align:center;">${safeBrandName}</div>`
        }
                  </td>
                </tr>
                ${safeSubtitle
            ? `
                <tr>
                  <td align="center" style="padding:16px 8px 0;">
                    <div style="font-size:14px;line-height:22px;color:${selectedTheme.subtitleColor};text-align:center;">
                      ${safeSubtitle}
                    </div>
                  </td>
                </tr>
                `
            : ""
        }
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:${selectedTheme.shellBackground};padding:18px 24px 34px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;">
                <tr>
                  <td style="background:${selectedTheme.accentBackground};border-radius:18px;padding:14px 18px;text-align:center;font-size:13px;line-height:20px;font-weight:800;color:${selectedTheme.accentText};letter-spacing:0.2px;">
                    ${safeAccentLabel}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
    `;
}

module.exports = {
    renderEmailHeader,
};
