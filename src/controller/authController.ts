
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import prisma from "../config/db.config.js"; // make sure this points to your prisma client
const JWT_SECRET = process.env.JWT_SECRET!;

export const signup = async (req: Request, res: Response) => {
    console.log("signup hit")
    const { name, email, password, phone, address, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === "admin") {
            const existing = await prisma.admin.findUnique({ where: { email } });
            if (existing) return res.status(400).json({ message: "Admin already exists" });

            const admin = await prisma.admin.create({
                data: { name, email, password: hashedPassword, phone, address }
            });

            const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, { expiresIn: "30d" });
            return res.status(201).json({ message: "Admin registered", token });

        } else if (role === "customer") {
            const existing = await prisma.customer.findUnique({ where: { email } });
            if (existing) return res.status(400).json({ message: "Customer already exists" });

            const customer = await prisma.customer.create({
                data: { name, email, password: hashedPassword, phone, address }
            });

            const token = jwt.sign({ id: customer.id, role: "customer" }, JWT_SECRET, { expiresIn: "30d" });
            return res.status(201).json({ message: "Customer registered", token });
        } else {
            return res.status(400).json({ message: "Invalid role" });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password, role } = req.body;

    try {
        if (role === "admin") {
            const admin = await prisma.admin.findUnique({ where: { email } });
            if (!admin) return res.status(404).json({ message: "Admin not found" });

            const match = await bcrypt.compare(password, admin.password);
            if (!match) return res.status(400).json({ message: "Invalid password" });

            const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, { expiresIn: "30d" });
            return res.json({ message: "Login successful", token });

        } else if (role === "customer") {
            const customer = await prisma.customer.findUnique({ where: { email } });
            if (!customer) return res.status(404).json({ message: "Customer not found" });

            const match = await bcrypt.compare(password, customer.password);
            if (!match) return res.status(400).json({ message: "Invalid password" });

            const token = jwt.sign({ id: customer.id, role: "customer" }, JWT_SECRET, { expiresIn: "30d" });
            return res.json({ message: "Login successful", token });

        } else {
            return res.status(400).json({ message: "Invalid role" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
const FRONTEND_URL = process.env.FRONTEND_URL!; // e.g. http://localhost:5173
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export const sendMagicLink = async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await prisma.customer.findUnique({ where: { email } }) ||
        await prisma.admin.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 mins

    await prisma.passwordResetToken.create({
        data: { email, token, expiresAt }
    });

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${email}`;

    await transporter.sendMail({
        from: `"Support" <${EMAIL_USER}>`,
        to: email,
        subject: "Your Magic Login Link",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 15 minutes.</p>`
    });

    return res.json({ message: "Magic link sent to email" });
};
