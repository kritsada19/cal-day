import nodemailer from "nodemailer";
import { env } from "../env";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    }
})


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
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;padding:40px 16px;">
        <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

            <div style="background:#15803d;padding:28px 24px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                    CalDay
                </h1>
                <p style="margin:8px 0 0;color:#dcfce7;font-size:14px;">
                    Small steps, healthier days.
                </p>
            </div>

            <div style="padding:32px 24px;text-align:center;">
                <div style="font-size:42px;margin-bottom:16px;">🌱</div>

                <h2 style="margin:0 0 16px;font-size:24px;color:#166534;">
                    Welcome to CalDay!
                </h2>

                <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#4b5563;">
                    Thank you for taking the first step toward a healthier lifestyle.
                </p>

                <p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#4b5563;">
                    Please verify your email address to activate your account
                    and start tracking your nutrition.
                </p>

                <a href="${link}"
                   style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 32px;border-radius:10px;">
                    Verify My Email
                </a>

                <p style="margin:28px 0 8px;font-size:13px;color:#6b7280;line-height:1.7;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>

                <a href="${link}"
                   style="font-size:13px;color:#15803d;word-break:break-all;">
                    ${link}
                </a>

                <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;line-height:1.7;">
                    If you didn't create a CalDay account, you can safely ignore this email.
                </p>
            </div>

            <div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                    CalDay — Small steps, healthier days.
                </p>
            </div>

        </div>
    </div>
</body>
</html>
        `,
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
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;padding:40px 16px;">
        <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

            <div style="background:#15803d;padding:28px 24px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                    CalDay
                </h1>
                <p style="margin:8px 0 0;color:#dcfce7;font-size:14px;">
                    Small steps, healthier days.
                </p>
            </div>

            <div style="padding:32px 24px;text-align:center;">
                <div style="font-size:42px;margin-bottom:16px;">🔐</div>

                <h2 style="margin:0 0 16px;font-size:24px;color:#166534;">
                    Reset Your Password
                </h2>

                <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#4b5563;">
                    We received a request to reset your CalDay password.
                </p>

                <p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#4b5563;">
                    Click the button below to choose a new password and regain access to your account.
                </p>

                <a href="${link}"
                   style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 32px;border-radius:10px;">
                    Reset My Password
                </a>

                <p style="margin:28px 0 8px;font-size:13px;color:#6b7280;line-height:1.7;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>

                <a href="${link}"
                   style="font-size:13px;color:#15803d;word-break:break-all;">
                    ${link}
                </a>

                <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;line-height:1.7;">
                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
            </div>

            <div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                    CalDay — Small steps, healthier days.
                </p>
            </div>

        </div>
    </div>
</body>
</html>
        `.trim(),
    });
}