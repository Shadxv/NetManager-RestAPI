import nodemailer from 'nodemailer';
import Transport from 'nodemailer/lib/smtp-transport';

interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export const sendEmail = async (options: MailOptions): Promise<void> => {
    const user = process.env.GMAIL_MAIL;
    const pass = process.env.GMAIL_PASS;

    if (!user || !pass) {
        throw new Error('Error: GMAIL_MAIL or GMAIL_PASS not defined.');
    }

    const transportConfig: Transport.Options = {
        service: 'gmail',
        auth: {
            user: user,
            pass: pass,
        },
    };

    const transporter = nodemailer.createTransport(transportConfig);

    try {
        const info = await transporter.sendMail({
            from: `"noreply" <${user}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`SMTP Error: ${error.message}`);
        }
        throw error;
    }
};

interface BackgroundConfig {
    contentHtml: string;
}

interface InviteData {
    tempPass: string;
    expiryDate: string;
    panelUrl: string;
}

const COLORS = {
    secondaryGray: '#8e8ea8',
    primaryWhite: '#eeeeff',
    secondaryWhite: '#d1d1f0',
    primaryBlack: '#0a0a0f',
    secondaryBlack: '#12121a',
    primaryGray: '#1c1c2b',
    accent: '#4f46e5',
};

const generateEmailLayout = ({ contentHtml }: BackgroundConfig): string => {
    return `
    <div style="background-color: ${COLORS.primaryWhite}; font-family: 'Poppins', Arial, sans-serif; margin: 0; padding: 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="background: ${COLORS.primaryBlack} radial-gradient(circle at top right, ${COLORS.accent} 0%, ${COLORS.primaryBlack} 70%); padding: 80px 40px; text-align: center;">
             <div style="font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 24px; letter-spacing: -1px;">
               <span style="color: ${COLORS.primaryWhite};">NET</span><span style="color: ${COLORS.accent};">Manager</span>
             </div>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 0 16px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: ${COLORS.primaryWhite};">
              <tr>
                <td style="padding: 48px 0; text-align: left;">
                  ${contentHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td bgcolor="${COLORS.primaryBlack}" style="background-color: ${COLORS.primaryBlack}; padding: 80px 40px; text-align: center;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
              <tr>
                <td style="text-align: center;">
                  <div style="margin-bottom: 16px; font-weight: 700; font-size: 18px; letter-spacing: -0.5px;">
                    <span style="color: ${COLORS.primaryWhite};">NET</span><span style="color: ${COLORS.accent};">Manager</span>
                  </div>
                  <p style="margin: 0; color: ${COLORS.secondaryGray}; font-size: 13px; letter-spacing: 0.05em; line-height: 1.5;">
                    © 2026 NetManager — Professional Server Infrastructure<br/>
                    All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

export const generateInviteEmail = (data: InviteData): string => {
    const borderStyle = '1px solid ' + COLORS.secondaryWhite;

    const bodyContent = `
    <h1 style="color: ${COLORS.primaryBlack}; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.03em;">You have been invited</h1>
    <p style="color: ${COLORS.secondaryBlack}; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
      Welcome to the NetManager platform. Your account is ready for use. Please use the temporary credentials below to access your management dashboard.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px; border-bottom: ${borderStyle}; padding-bottom: 32px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${COLORS.secondaryGray}; letter-spacing: 0.1em;">Temporary Password</p>
          <div style="font-size: 28px; color: ${COLORS.accent}; font-weight: 700; font-family: 'Poppins', sans-serif;">
            ${data.tempPass}
          </div>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: ${COLORS.secondaryGray};">
            This password will expire on <span style="color: ${COLORS.primaryBlack}; font-weight: 600;">${data.expiryDate}</span>.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td>
          <a href="${data.panelUrl}" 
             style="display: inline-block; background-color: ${COLORS.accent}; color: #ffffff; padding: 8px 36px; text-decoration: none; border-radius: 16px; font-weight: 600; font-size: 16px; text-align: center;">
             Go to dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

    return generateEmailLayout({
        contentHtml: bodyContent,
    });
};

export const generateResetPasswordEmail = (data: InviteData): string => {
    const borderStyle = '1px solid ' + COLORS.secondaryWhite;

    const bodyContent = `
    <h1 style="color: ${COLORS.primaryBlack}; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.03em;">Password Reset</h1>
    <p style="color: ${COLORS.secondaryBlack}; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
      A password reset has been requested for your NetManager account. Please use the temporary credentials provided below to log in and set your new permanent password.
    </p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px; border-bottom: ${borderStyle}; padding-bottom: 32px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: ${COLORS.secondaryGray}; letter-spacing: 0.1em;">Temporary Password</p>
          <div style="font-size: 28px; color: ${COLORS.accent}; font-weight: 700; font-family: 'Poppins', sans-serif;">
            ${data.tempPass}
          </div>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: ${COLORS.secondaryGray};">
            For security reasons, this password will expire on <span style="color: ${COLORS.primaryBlack}; font-weight: 600;">${data.expiryDate}</span>.
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td>
          <a href="${data.panelUrl}" 
             style="display: inline-block; background-color: ${COLORS.accent}; color: #ffffff; padding: 8px 36px; text-decoration: none; border-radius: 16px; font-weight: 600; font-size: 16px; text-align: center;">
             Reset password
          </a>
        </td>
      </tr>
    </table>
  `;

    return generateEmailLayout({
        contentHtml: bodyContent,
    });
};
