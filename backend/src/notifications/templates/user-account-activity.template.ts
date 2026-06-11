import { compileBaseEmail } from './base-email.template';

export interface UserAccountActivityTemplateData {
  activityType: 'BLOCKED' | 'REMOVED' | 'ROLE_CHANGED' | 'RESTORED';
  recipientName: string;
  email: string;
  newRole?: string;
  reason?: string;
  backendUrl: string;
}

export function compileUserAccountActivityEmail(
  data: UserAccountActivityTemplateData,
  trackingPixelUrl?: string,
): string {
  let badgeText = '';
  let badgeColor = '';
  let title = '';
  let message = '';
  let detailRowsHtml = '';

  switch (data.activityType) {
    case 'BLOCKED':
      badgeText = 'Account Blocked';
      badgeColor = '#dc2626'; // red
      title = 'Your Account Has Been Blocked';
      message = `Hello ${data.recipientName}, we are writing to inform you that your ViewMax account (${data.email}) has been blocked by an administrator. You will no longer be able to log in or access your tickets.`;
      if (data.reason) {
        detailRowsHtml += `
          <tr>
            <td style="padding-bottom: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 14px; color: #64748b; width: 30%;">Reason</td>
                  <td style="font-size: 14px; font-weight: 600; color: #dc2626; text-align: right;">${data.reason}</td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }
      break;

    case 'REMOVED':
      badgeText = 'Account Removed';
      badgeColor = '#dc2626'; // red
      title = 'Your Account Has Been Removed';
      message = `Hello ${data.recipientName}, we are writing to inform you that your ViewMax account (${data.email}) has been deleted from our system. If you had pending bookings, they have been cancelled and any eligible refunds will be processed automatically.`;
      break;

    case 'ROLE_CHANGED':
      badgeText = 'Role Updated';
      badgeColor = '#10b981'; // emerald
      title = 'Your Account Role Was Updated';
      message = `Hello ${data.recipientName}, your account role has been updated by an administrator. Please log out and log back in to see the changes.`;
      if (data.newRole) {
        detailRowsHtml += `
          <tr>
            <td style="padding-bottom: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 14px; color: #64748b; width: 50%;">New Assigned Role</td>
                  <td style="font-size: 14px; font-weight: 700; color: #1e3a8a; text-align: right; text-transform: uppercase;">${data.newRole.replace('_', ' ')}</td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }
      break;

    case 'RESTORED':
      badgeText = 'Account Restored';
      badgeColor = '#10b981'; // emerald
      title = 'Your Account Has Been Restored';
      message = `Hello ${data.recipientName}, we are pleased to inform you that your ViewMax account (${data.email}) has been restored by an administrator. You can now log back in and continue using all of the platform's features.`;
      break;
  }

  const htmlContent = `
    <!-- Activity Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; color: ${badgeColor}; background-color: ${badgeColor}1a; border: 1px solid ${badgeColor}33; border-radius: 20px; text-transform: uppercase; letter-spacing: 1.5px;">
            ${badgeText}
          </span>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
      ${title}
    </h1>
    <p style="font-size: 15px; color: #64748b; line-height: 22px; margin: 0 0 28px 0;">
      ${message}
    </p>

    ${detailRowsHtml ? `
      <!-- Details Card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; margin-bottom: 28px;">
        <tr>
          <td style="padding: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${detailRowsHtml}
            </table>
          </td>
        </tr>
      </table>
    ` : ''}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="text-align: center;">
      <tr>
        <td>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0;">If you believe this was an error, please contact ViewMax support.</p>
          <a href="${data.backendUrl}" class="btn btn-secondary">
            Return to ViewMax
          </a>
        </td>
      </tr>
    </table>
  `;

  return compileBaseEmail(htmlContent, {
    title: `${badgeText}: ViewMax Account Activity`,
    preheader: message.substring(0, 150),
    trackingPixelUrl,
  });
}
