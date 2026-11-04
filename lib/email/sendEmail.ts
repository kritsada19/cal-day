import nodemailer from "nodemailer";
import { env } from "../env";
import enMessages from "../../messages/en.json";
import thMessages from "../../messages/th.json";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});

const EMAIL_CONTENT = {
    en: enMessages.email,
    th: thMessages.email,
} as const;

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

type Locale = keyof typeof EMAIL_CONTENT;

type EmailLayout = {
    locale: Locale;
    preheader: string;
    iconHtml?: string;
    heading: string;
    paragraphs: readonly string[];
    buttonText: string;
    link: string;
    footerNote: string;
    fallbackText: string;
};

function renderTextWithLink(template: string, link: string) {
    return template.replaceAll("{{link}}", link);
}

/**
 * สร้าง HTML ของอีเมล (ใช้ table + inline style เพื่อให้แสดงผลได้ในไคลเอนต์อีเมลส่วนใหญ่)
 */
function renderEmailHtml({ locale, preheader, iconHtml = "", heading, paragraphs, buttonText, link, footerNote, fallbackText }: EmailLayout): string {
    const safeLink = escapeHtml(link);
    const body = paragraphs
        .map(
            (text) =>
                `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#4B6B73;">${text}</p>`
        )
        .join("");

    return `
<!DOCTYPE html>
<html lang="${locale}">
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
                            <div style="margin:8px 0 0;color:#B9DBE6;font-size:14px;font-family:${FONT_STACK};">${EMAIL_CONTENT[locale].brandTagline}</div>
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
                                ${fallbackText}
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
                                ${EMAIL_CONTENT[locale].footer}
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

export async function sendVerificationEmail(email: string, link: string, locale: "en" | "th" = "en") {
    const content = EMAIL_CONTENT[locale].verification;

    await transporter.sendMail({
        from: `"CalDay" <${env.EMAIL_USER}>`,
        to: email,
        subject: content.subject,
        text: renderTextWithLink(content.text, link),
        html: renderEmailHtml({
            locale,
            preheader: content.preheader,
            heading: content.heading,
            paragraphs: content.paragraphs,
            buttonText: content.buttonText,
            link,
            footerNote: content.footerNote,
            fallbackText: EMAIL_CONTENT[locale].fallbackText,
        }),
    });
}

export async function sendForgotPasswordEmail(email: string, link: string, locale: "en" | "th" = "en") {
    const content = EMAIL_CONTENT[locale].forgotPassword;

    await transporter.sendMail({
        from: `"CalDay" <${env.EMAIL_USER}>`,
        to: email,
        subject: content.subject,
        text: renderTextWithLink(content.text, link),
        html: renderEmailHtml({
            locale,
            preheader: content.preheader,
            iconHtml: emojiIconHtml("🔐"),
            heading: content.heading,
            paragraphs: content.paragraphs,
            buttonText: content.buttonText,
            link,
            footerNote: content.footerNote,
            fallbackText: EMAIL_CONTENT[locale].fallbackText,
        }),
    });
}