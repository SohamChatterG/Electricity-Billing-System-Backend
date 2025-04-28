// src/controllers/bill.controller.ts
import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { sendNotification } from "../utils/sendNotification.js";
export const getBillById = async (req: Request, res: Response) => {
    const { billId } = req.params;
    try {
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { reading: true, customer: true, payment: true },
        });
        if (!bill) return res.status(404).json({ message: "Bill not found" });
        return res.json({ bill });
    } catch (err) {
        console.error("Bill fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch bill" });
    }
};

export const listBills = async (req: Request, res: Response) => {
    const { status, customerId } = req.query;          // e.g. ?status=unpaid
    try {
        const bills = await prisma.bill.findMany({
            where: {
                isPaid: status === "paid" ? true : status === "unpaid" ? false : undefined,
                customerId: customerId as string | undefined,
            },
            orderBy: { createdAt: "desc" },
            include: { reading: true, payment: true },
        });
        return res.json({ bills });
    } catch (err) {
        console.error("Bill list error:", err);
        return res.status(500).json({ message: "Failed to list bills" });
    }
};

export const getCustomerBills = async (req: Request, res: Response) => {
    const { status } = req.query; // e.g. ?status=unpaid
    const customerId = req.user.id; // From auth middleware

    try {
        const bills = await prisma.bill.findMany({
            where: {
                customerId,
                isPaid: status === "paid" ? true : status === "unpaid" ? false : undefined,
            },
            orderBy: { createdAt: "desc" },
            include: {
                reading: true,
                payment: true,
                customer: true
            },
        });
        return res.json({ bills });
    } catch (err) {
        console.error("Customer bills fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch customer bills" });
    }
};

export const sendBillNotification = async (req: Request, res: Response) => {
    const { billId } = req.params;
    const { message } = req.body;

    try {
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { customer: true }
        });

        if (!bill || !bill.customer) {
            return res.status(404).json({ message: "Bill or customer not found" });
        }

        await sendNotification({
            customerId: bill.customerId,
            title: `Reminder for Bill #${billId.slice(0, 8)}`,
            message: message || `This is a reminder that your bill of ₹${bill.amount} is due on ${new Date(bill.dueDate).toLocaleDateString()}.`,
            email: bill.customer.email
        });

        return res.json({ message: "Notification sent successfully" });
    } catch (err) {
        console.error("Notification error:", err);
        return res.status(500).json({ message: "Failed to send notification" });
    }
};


// Add this new function to your billController.ts
export const listBillsByMonth = async (req: Request, res: Response) => {
    const { month, year } = req.query;

    try {
        // Validate month and year
        const monthNum = parseInt(month as string);
        const yearNum = parseInt(year as string);

        if (isNaN(monthNum)) {
            return res.status(400).json({ message: "Invalid month parameter" });
        }
        if (isNaN(yearNum)) {
            return res.status(400).json({ message: "Invalid year parameter" });
        }

        // Calculate date range
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const bills = await prisma.bill.findMany({
            where: {
                dueDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { dueDate: "desc" },
            include: {
                reading: true,
                payment: true,
                customer: true
            },
        });

        return res.json({ bills });
    } catch (err) {
        console.error("Monthly bills fetch error:", err);
        return res.status(500).json({ message: "Failed to fetch monthly bills" });
    }
};