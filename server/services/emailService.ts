import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  signupLink: string;
  companyName?: string;
}

// Email template with NXTKonekt branding
const generateInvitationHTML = (data: InvitationEmailData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join NXTKonekt Partner Network</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        .title {
            color: #2563eb;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 10px 0 0 0;
        }
        .content {
            margin: 30px 0;
            font-size: 16px;
            line-height: 1.7;
        }
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 25px 0;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .benefits {
            background-color: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
        }
        .benefits h3 {
            color: #2563eb;
            margin-top: 0;
            font-size: 18px;
        }
        .benefits ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        .benefits li {
            margin: 8px 0;
            color: #4b5563;
        }
        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer-logo {
            max-width: 120px;
            height: auto;
            margin: 15px 0;
        }
        .contact-info {
            margin: 15px 0;
        }
        .signature {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 3px solid #2563eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Join the NXTKonekt Partner Network</h1>
            <p class="subtitle">Fixed Wireless & Fleet Management Solutions</p>
        </div>

        <div class="content">
            <div class="greeting">
                Hello${data.recipientName ? ' ' + data.recipientName : ''},
            </div>

            <p>You've been invited by <strong>${data.senderName}</strong> to join the NXTKonekt Partner Network - the premier platform for Fixed Wireless Access and Fleet Management installation assessments.</p>

            <div class="benefits">
                <h3>🚀 Partner Benefits</h3>
                <ul>
                    <li><strong>Professional Quote Generation:</strong> Create detailed, branded quotes instantly</li>
                    <li><strong>Mobile-Ready Assessment Tools:</strong> Conduct site assessments on any device</li>
                    <li><strong>Multiple Service Types:</strong> Fixed Wireless, Fleet Tracking, Fleet Camera installations</li>
                    <li><strong>CRM Integration:</strong> Automatic HubSpot sync for lead management</li>
                    <li><strong>PDF Documentation:</strong> Professional quotes with scope of work statements</li>
                    <li><strong>Admin Dashboard:</strong> Track assessments, quotes, and business analytics</li>
                </ul>
            </div>

            <p>Getting started is simple:</p>
            <ol>
                <li>Click the signup link below to authenticate with your account</li>
                <li>Create your organization profile with business details</li>
                <li>Start creating professional assessments and quotes immediately</li>
                <li>Access mobile-optimized tools for field work</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.signupLink}" class="cta-button">Join NXTKonekt Partner Network</a>
            </div>

            <div class="signature">
                <p><strong>Ready to streamline your installation business?</strong></p>
                <p>The NXTKonekt platform provides everything you need to conduct professional site assessments, generate accurate quotes, and manage your installation pipeline efficiently.</p>
            </div>

            <p>If you have any questions about the platform or need assistance getting started, don't hesitate to reach out to our support team.</p>

            <p>Welcome to the future of installation management!</p>
            
            <p>Best regards,<br>
            <strong>${data.senderName}</strong><br>
            NXTKonekt Administrator</p>
        </div>

        <div class="footer">
            <div class="contact-info">
                <p><strong>NXTKonekt Platform</strong></p>
                <p>Professional Installation Assessment & Quote Generation</p>
                <p>For support: <a href="mailto:support@nxtkonekt.com">support@nxtkonekt.com</a></p>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                This invitation was sent by ${data.senderName}. If you believe this was sent in error, please disregard this email.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    console.log("📧 Initializing EmailService...");
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if we have email credentials configured
    console.log("📧 Checking SMTP configuration...");
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST ? '✅ Set' : '❌ Not set'}`);
    console.log(`SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Not set'}`);
    console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'Using default 587'}`);
    console.log(`SMTP_SECURE: ${process.env.SMTP_SECURE || 'Using default false'}`);
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log("✅ Email transporter initialized successfully");
    } else {
      console.log("❌ Email credentials not found. Email features will be disabled.");
      console.log("Missing variables:", {
        SMTP_HOST: !process.env.SMTP_HOST,
        SMTP_USER: !process.env.SMTP_USER,
        SMTP_PASS: !process.env.SMTP_PASS
      });
    }
  }

  async sendPartnerInvitation(data: InvitationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email service not configured. Please set SMTP environment variables.',
      };
    }

    try {
      const htmlContent = generateInvitationHTML(data);
      
      const mailOptions = {
        from: `"NXTKonekt Platform" <${process.env.SMTP_USER}>`,
        to: data.recipientEmail,
        subject: `Invitation to Join NXTKonekt Partner Network`,
        html: htmlContent,
        text: `
Hello${data.recipientName ? ' ' + data.recipientName : ''},

You've been invited by ${data.senderName} to join the NXTKonekt Partner Network - the premier platform for Fixed Wireless Access and Fleet Management installation assessments.

Partner Benefits:
• Professional Quote Generation
• Mobile-Ready Assessment Tools  
• Multiple Service Types (Fixed Wireless, Fleet Tracking, Fleet Camera)
• CRM Integration with HubSpot
• PDF Documentation with Scope of Work
• Admin Dashboard & Analytics

Join here: ${data.signupLink}

Getting started:
1. Click the signup link to authenticate
2. Create your organization profile
3. Start creating professional assessments and quotes
4. Access mobile-optimized tools for field work

Welcome to the future of installation management!

Best regards,
${data.senderName}
NXTKonekt Administrator

For support: support@nxtkonekt.com
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  // Test email configuration
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

export const emailService = new EmailService();