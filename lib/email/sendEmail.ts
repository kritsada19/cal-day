import nodemailer from "nodemailer";
import { env } from "../env";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    }
})

/**
 * สีของอีเมลใช้ค่า HEX ตรง ๆ ตาม CalDay Design System (Light)
 * เพราะอีเมลไม่รองรับ CSS variables / Tailwind
 *   primary #36595F | ink #304852 | muted #4B6B73 | highlight #B9DBE6
 *   primary-tint #E6F1F5 | canvas #F6F9FA | line #DCE6E9
 */
const FONT_STACK = "'Plus Jakarta Sans','Noto Sans Thai',Arial,Helvetica,sans-serif";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const emojiIconHtml = (emoji: string) =>
    `<div style="width:64px;height:64px;line-height:64px;margin:0 auto 20px;border-radius:50%;background-color:#E6F1F5;font-size:30px;text-align:center;">${emoji}</div>`;

type EmailLayout = {
    preheader: string;
    iconHtml?: string; // ไม่ใส่ = ไม่แสดงไอคอน
    heading: string;
    paragraphs: string[];
    buttonText: string;
    link: string;
    footerNote: string;
};

/**
 * สร้าง HTML ของอีเมล (ใช้ table + inline style เพื่อให้แสดงผลได้ในไคลเอนต์อีเมลส่วนใหญ่)
 */
function renderEmailHtml({ preheader, iconHtml = "", heading, paragraphs, buttonText, link, footerNote }: EmailLayout): string {
    const safeLink = escapeHtml(link);
    const body = paragraphs
        .map(
            (text) =>
                `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#4B6B73;">${text}</p>`
        )
        .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background-color:#F6F9FA;font-family:${FONT_STACK};color:#304852;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F9FA;">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border:1px solid #DCE6E9;border-radius:16px;overflow:hidden;">

                    <tr>
                        <td align="center" style="background-color:#36595F;padding:28px 24px;">
                            <div style="margin:0;color:#FFFFFF;font-size:28px;font-weight:700;letter-spacing:-0.5px;font-family:${FONT_STACK};">CalDay</div>
                            <div style="margin:8px 0 0;color:#B9DBE6;font-size:14px;font-family:${FONT_STACK};">Small steps, healthier days.</div>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:32px 24px;font-family:${FONT_STACK};">
                            ${iconHtml}

                            <h2 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:700;color:#304852;">
                                ${heading}
                            </h2>

                            ${body}

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:12px auto 0;">
                                <tr>
                                    <td align="center" bgcolor="#36595F" style="border-radius:12px;">
                                        <a href="${safeLink}"
                                           style="display:inline-block;padding:15px 32px;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:12px;font-family:${FONT_STACK};">
                                            ${buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:28px 0 8px;font-size:14px;line-height:1.7;color:#4B6B73;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>

                            <a href="${safeLink}"
                               style="font-size:14px;line-height:1.6;color:#36595F;word-break:break-all;">
                                ${safeLink}
                            </a>

                            <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#4B6B73;">
                                ${footerNote}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color:#F6F9FA;padding:20px 24px;border-top:1px solid #DCE6E9;">
                            <p style="margin:0;font-size:13px;color:#4B6B73;font-family:${FONT_STACK};">
                                CalDay — Small steps, healthier days.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}


export async function sendVerificationEmail(email: string, link: string) {
    await transporter.sendMail({
        from: `"CalDay" <${env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email | CalDay",
        text: `
Welcome to CalDay!

Thank you for creating an account.

Please verify your email address using the link below:
${link}

If you didn't create a CalDay account, you can safely ignore this email.

CalDay — Small steps, healthier days.
        `.trim(),
        html: renderEmailHtml({
            preheader: "Verify your email address to activate your CalDay account.",
            heading: "Welcome to CalDay!",
            paragraphs: [
                "Thank you for taking the first step toward a healthier lifestyle.",
                "Please verify your email address to activate your account and start tracking your nutrition.",
            ],
            buttonText: "Verify My Email",
            link,
            footerNote: "If you didn't create a CalDay account, you can safely ignore this email.",
        }),
    });
}

export async function sendForgotPasswordEmail(email: string, link: string) {
    await transporter.sendMail({
        from: `"CalDay" <${env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password | CalDay",
        text: `
We received a request to reset your CalDay password.

Click the link below to create a new password:
${link}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

CalDay — Small steps, healthier days.
        `.trim(),
        html: renderEmailHtml({
            preheader: "Choose a new password to regain access to your CalDay account.",
            iconHtml: emojiIconHtml("🔐"),
            heading: "Reset Your Password",
            paragraphs: [
                "We received a request to reset your CalDay password.",
                "Click the button below to choose a new password and regain access to your account.",
            ],
            buttonText: "Reset My Password",
            link,
            footerNote: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
        }),
    });
}