// src/controller/paymentController.ts
import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { sendNotification } from "../utils/sendNotification.js";

/**
 * Body:
 * {
 *   "billId":   "uuid-of-bill",
 *   "method":   "upi" | "cash" | "card",
 *   "amount":   750      // OPTIONAL – defaults to bill.amount
 * }
 *
 * Auth:
 *  req.user.id     – customer ID extracted in auth middleware
 *  req.user.role   – "customer" | "admin"
 */
export const makePayment = async (req: Request, res: Response) => {
    console.log("payment hit")
    const { billId, method, amount } = req.body;
    const userId = req.user.id;           // set by auth middleware
    const userRole = req.user.role;

    try {
        /* 1. Lookup the bill */
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { customer: true },
        });

        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        /* 2. Authorise:
              - Admins may pay any bill
              - Customers may pay only their own bill            */
        console.log("bill customerId", bill.customerId, "\nuserId", userId)
        if (userRole === "customer" && bill.customerId !== userId) {
            return res.status(403).json({ message: "You cannot pay another customer's bill" });
        }

        if (bill.isPaid) {
            return res.status(400).json({ message: "Bill is already paid" });
        }

        /* 3. Determine payable amount */
        const payAmount = amount ?? bill.amount;
        if (payAmount !== bill.amount) {
            return res
                .status(400)
                .json({ message: `Amount must equal outstanding bill amount ₹${bill.amount}` });
        }

        /* 4. Record payment & mark bill paid (wrap in transaction) */
        const [payment] = await prisma.$transaction([
            prisma.payment.create({
                data: {
                    customerId: bill.customerId,
                    billId: bill.id,
                    amount: payAmount,
                    method,
                },
            }),
            prisma.bill.update({
                where: { id: bill.id },
                data: { isPaid: true },
            }),
        ]);

        /* 5. Optional e‑mail/SMS notification */
        await sendNotification({
            customerId: bill.customer.id,
            email: bill.customer.email,
            title: "Payment received",
            message: `We received your payment of ₹${payAmount} for bill #${bill.id}. Thank you!`,
        });

        return res.status(201).json({
            message: "Payment successful",
            payment,
        });
    } catch (err) {
        console.error("Payment error:", err);
        return res.status(500).json({ message: "Payment failed" });
    }
};
