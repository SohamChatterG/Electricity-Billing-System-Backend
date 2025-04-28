import nodemailer from "nodemailer";
import prisma from "../config/db.config.js";

type NotificationParams = {
    customerId: string;
    title: string;
    message: string;
    email: string;
};

export const sendNotification = async ({
    customerId,
    title,
    message,
    email,
}: NotificationParams) => {
    try {
        // Save to DB
        await prisma.notification.create({
            data: {
                customerId,
                title,
                message,
            },
        });

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail", // or your email service
            auth: {
                user: process.env.EMAIL_USER, // from your .env
                pass: process.env.EMAIL_PASS, // from your .env
            },
        });

        // Send email
        await transporter.sendMail({
            from: `"Electricity Board" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: title,
            text: message,
        });

        console.log(`✅ Notification sent to ${email}`);
    } catch (error) {
        console.error("❌ Error sending notification:", error);
    }
};
