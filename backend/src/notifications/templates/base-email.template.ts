export interface BaseEmailOptions {
  title: string;
  preheader?: string;
  trackingPixelUrl?: string;
}

/**
 * Base email layout for ViewMax transactional emails.
 * Uses high-fidelity, luxury dark mode inline CSS matching the web application design system.
 */
export function compileBaseEmail(
  content: string,
  options: BaseEmailOptions,
): string {
  const preheaderHtml = options.preheader
    ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px;">${options.preheader}</div>`
    : '';

  const trackingPixel = options.trackingPixelUrl
    ? `<img src="${options.trackingPixelUrl}" width="1" height="1" style="display:none; max-height: 0px; max-width: 0px; overflow: hidden;" alt="" />`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f5f5f5; /* whitesmoke */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1e293b; /* dark slate */
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f5f5f5; /* whitesmoke */
      padding-bottom: 40px;
    }
    .main-table {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff; /* white card */
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }
    .content-padding {
      padding: 36px 32px;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background-color: #1e3a8a; /* Navy Blue */
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 8px;
      text-align: center;
      transition: background-color 0.2s;
    }
    .btn-gold {
      background-color: #3b82f6; /* Accent Blue */
      color: #ffffff !important;
    }
    .btn-secondary {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #1e293b !important;
    }
    .text-muted {
      color: #64748b;
    }
    .text-gold {
      color: #1e3a8a; /* Deep Navy Blue */
    }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 28px 0;
    }
    @media only screen and (max-width: 600px) {
      .main-table {
        border-radius: 0 !important;
        border: none !important;
      }
      .content-padding {
        padding: 28px 20px !important;
      }
    }
  </style>
</head>
<body>
  ${preheaderHtml}
  <center class="wrapper">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 40px 10px 24px 10px;">
          <!-- ViewMax Elegant Brand Header -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
            <tr>
              <td align="center">
                <span style="font-family: system-ui, -apple-system, sans-serif; font-size: 28px; font-weight: 800; letter-spacing: 3px; color: #0f172a;">
                  VIEW<span style="color: #3b82f6;">MAX</span>
                </span>
                <div style="font-size: 11px; font-weight: 600; letter-spacing: 4px; color: #64748b; text-transform: uppercase; margin-top: 4px;">
                  P R E M I U M &nbsp; C I N E M A
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 10px;">
          <table class="main-table" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="content-padding">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 24px 10px 40px 10px;">
          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; text-align: center;">
            <tr>
              <td style="font-size: 12px; color: #64748b; line-height: 20px;">
                This transactional communication was sent to you as part of your ViewMax membership experience.<br>
                To manage your notifications or update preferences, visit the app dashboard.<br><br>
                &copy; 2026 ViewMax Technologies Inc. All rights reserved.<br>
                Luxury Cinema, Reimagined.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
  ${trackingPixel}
</body>
</html>`;
}
