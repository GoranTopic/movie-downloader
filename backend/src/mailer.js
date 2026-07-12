import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
// load the environment variables
dotenv.config();

// the smtp server that delivers our mail (the mailserver container by default)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT) || 1025,
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER ? {
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    } : {}),
});

const MAIL_FROM = process.env.MAIL_FROM || 'Movie Downloader <no-reply@movie-downloader.local>';

// send the signup verification link to a new user
const send_verification_email = async (to, username, verifyLink) => {
    await transporter.sendMail({
        from: MAIL_FROM,
        to,
        subject: 'Verify your Movie Downloader account',
        text: `Hi ${username},\n\n`
            + `Someone (hopefully you) created a Movie Downloader account with this email address.\n`
            + `Click the link below to verify your account and start downloading:\n\n`
            + `${verifyLink}\n\n`
            + `If this wasn't you, just ignore this email.`,
        html: `<p>Hi <b>${username}</b>,</p>`
            + `<p>Someone (hopefully you) created a Movie Downloader account with this email address.</p>`
            + `<p><a href="${verifyLink}">Click here to verify your account</a> and start downloading.</p>`
            + `<p>If this wasn't you, just ignore this email.</p>`,
    });
}

export { send_verification_email };
