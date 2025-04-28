// src/controllers/meterReading.controller.ts
import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { calculateConsumptionCharge } from "../utils/billingCalculator.js";
import { sendNotification } from "../utils/sendNotification.js";

export const submitMeterReading = async (req: Request, res: Response) => {
    const { meterNumber, month, currentUnit } = req.body;
    const adminId = req.user.id; // From auth middleware

    // Validation
    if (!meterNumber || !month || currentUnit === undefined) {
        return res.status(400).json({
            message: "Missing required fields: meterNumber, month, currentUnit"
        });
    }

    if (typeof currentUnit !== 'number' || currentUnit < 0) {
        return res.status(400).json({
            message: "Current unit must be a positive number"
        });
    }

    try {
        // Find the connection
        const connection = await prisma.connection.findUnique({
            where: { meterNumber },
            include: {
                customer: true,
                readings: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            },
        });

        if (!connection) {
            return res.status(404).json({ message: "Meter not found" });
        }

        // Get previous reading (either from included readings or fresh query)
        const previousReading = connection.readings[0] ||
            await prisma.reading.findFirst({
                where: { connectionId: connection.id },
                orderBy: { createdAt: "desc" },
            });

        const previousUnit = previousReading?.currentUnit || 0;

        if (currentUnit < previousUnit) {
            return res.status(400).json({
                message: "Current reading cannot be less than previous reading",
                previousUnit
            });
        }

        // Calculate consumption
        const unitsConsumed = currentUnit - previousUnit;

        // Create new reading
        const newReading = await prisma.reading.create({
            data: {
                connectionId: connection.id,
                month,
                previousUnit,
                currentUnit,
                unitsConsumed,
            },
        });

        // Generate bill
        const billAmount = calculateConsumptionCharge(unitsConsumed, connection.type);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // 15 days from now

        const bill = await prisma.bill.create({
            data: {
                customerId: connection.customer.id,
                readingId: newReading.id,
                amount: billAmount,
                dueDate,
            },
        });

        // Notify customer
        await sendNotification({
            customerId: connection.customer.id,
            email: connection.customer.email,
            title: "📊 Your Electricity Bill Statement",
            message: `
        Dear ${connection.customer.name},
        
        Your electricity consumption details for ${month}:
        
        🔹 Meter Number: ${meterNumber}
        🔹 Previous Reading: ${previousUnit} units
        🔹 Current Reading: ${currentUnit} units
        🔹 Units Consumed: ${unitsConsumed} units
        
        💰 Bill Calculation:
        - Consumption Charge (${connection.type}): ₹${calculateConsumptionCharge(unitsConsumed, connection.type).toFixed(2)}
        - Fixed Charges: ₹50.00
        - Taxes (5% GST): ₹${(billAmount * 0.05).toFixed(2)}
        
        💵 Total Amount Due: ₹${billAmount.toFixed(2)}
        📅 Due Date: ${dueDate.toLocaleDateString('en-IN')}
        
        Please pay before the due date to avoid late fees.
        Thank you for being a valued customer!
        
        Regards,
        Your Electricity Provider
    `.replace(/^[ \t]+/gm, ''),
        });

        res.status(201).json({
            message: "Meter reading recorded successfully",
            reading: newReading,
            bill,
        });

    } catch (error) {
        console.error("Meter reading error:", error);
        res.status(500).json({ message: "Failed to record meter reading" });
    }
};

// src/controllers/meterReading.controller.ts
export const getMeterReadings = async (req: Request, res: Response) => {
    console.log("gello")
    const { meterId } = req.params; // Get from URL parameter
    console.log("meterId", meterId)
    if (!meterId) {
        return res.status(400).json({
            message: "Meter ID is required in the URL",
            example: "GET /api/meter/meter-readings/MET123456"
        });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    try {
        const connection = await prisma.connection.findUnique({
            where: {
                meterNumber: meterId // Using the URL parameter
            },
            include: {
                customer: true
            }
        });

        if (!connection) {
            return res.status(404).json({
                message: "Meter not found",
                providedMeterNumber: meterId
            });
        }

        const totalReadings = await prisma.reading.count({
            where: { connectionId: connection.id },
        });

        const readings = await prisma.reading.findMany({
            where: { connectionId: connection.id },
            orderBy: { createdAt: "desc" },
            include: {
                bill: true,
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
        });

        res.json({
            readings,
            total: totalReadings,
            page: pageNumber,
            totalPages: Math.ceil(totalReadings / limitNumber),
            connectionDetails: {
                meterNumber: connection.meterNumber,
                type: connection.type,
                customerName: connection.customer.name,
                customerId: connection.customer.id
            }
        });
    } catch (error) {
        console.error("Error fetching readings:", error);
        res.status(500).json({
            message: "Failed to fetch meter readings",
            error: error.message
        });
    }
};