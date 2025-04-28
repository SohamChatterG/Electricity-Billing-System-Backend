// src/controllers/bill.controller.ts
import { Request, Response } from "express";
import prisma from "../config/db.config.js";

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
