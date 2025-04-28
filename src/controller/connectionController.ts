import { Request, Response } from "express";
import prisma from "../config/db.config.js";
import { generateMeterNumber } from "../utils/meterUtils.js";

export const createConnection = async (req: Request, res: Response) => {
    const { customerId, connectionType } = req.body;

    // Validation
    if (!customerId || !connectionType) {
        return res.status(400).json({
            message: "Missing required fields: customerId and connectionType"
        });
    }

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const existingConnection = await prisma.connection.findFirst({
            where: { customerId }
        });

        if (existingConnection) {
            return res.status(400).json({
                message: "Customer already has an active connection",
                existingConnection: {
                    id: existingConnection.id,
                    meterNumber: existingConnection.meterNumber
                }
            });
        }

        const newConnection = await prisma.connection.create({
            data: {
                meterNumber: generateMeterNumber(),
                type: connectionType,
                customerId
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        await prisma.notification.create({
            data: {
                customerId,
                title: "New Electricity Connection",
                message: `Your new connection (Meter: ${newConnection.meterNumber}) has been activated. Connection type: ${connectionType}`
            }
        });

        res.status(201).json({
            message: "Connection created successfully",
            connection: {
                id: newConnection.id,
                meterNumber: newConnection.meterNumber,
                type: newConnection.type,
                customer: newConnection.customer,
                createdAt: newConnection.createdAt
            }
        });

    } catch (error) {
        console.error("Connection creation error:", error);
        res.status(500).json({
            message: "Failed to create connection",
            error: error.message
        });
    }
};

export const getCustomerConnections = async (req: Request, res: Response) => {
    const { customerId } = req.params;

    try {
        // 1. First verify the customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                connections: {
                    select: {
                        id: true,
                        meterNumber: true,
                        type: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // 2. Now fetch their connections
        const connections = await prisma.connection.findMany({
            where: { customerId },
            select: {
                id: true,
                meterNumber: true,
                type: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!connections.length) {
            return res.status(200).json({
                message: "No connections found for this customer",
                customerId,
                connections: []
            });
        }

        res.json({
            customerId,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                createdAt: customer.createdAt
            },
            connections
        });

    } catch (error) {
        console.error("Error fetching connections:", error);
        res.status(500).json({
            message: "Failed to fetch connections",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const updateConnection = async (req: Request, res: Response) => {
    console.log("update hit")
    const { connectionId } = req.params;
    const { type, status } = req.body;

    try {
        // Verify connection exists
        const existingConnection = await prisma.connection.findUnique({
            where: { id: connectionId },
            include: { customer: true }
        });

        if (!existingConnection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        // Prepare update data
        const updateData: { type?: string; isActive?: boolean } = {};
        if (type) updateData.type = type;
        if (status !== undefined) updateData.isActive = status === 'active';

        // Update connection
        const updatedConnection = await prisma.connection.update({
            where: { id: connectionId },
            data: updateData,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Send notification if status changed
        if (status !== undefined) {
            await prisma.notification.create({
                data: {
                    customerId: existingConnection.customerId,
                    title: "Connection Status Updated",
                    message: `Your meter ${existingConnection.meterNumber} has been ${status === 'active' ? 'activated' : 'deactivated'}`
                }
            });
        }

        res.json({
            message: "Connection updated successfully",
            connection: {
                id: updatedConnection.id,
                meterNumber: updatedConnection.meterNumber,
                type: updatedConnection.type,
                status: updatedConnection.isActive ? "active" : "inactive",
                customer: updatedConnection.customer,
                updatedAt: updatedConnection.updatedAt
            }
        });

    } catch (error) {
        console.error("Connection update error:", error);
        res.status(500).json({
            message: "Failed to update connection",
            error: error.message
        });
    }
};

export const deactivateConnection = async (req: Request, res: Response) => {
    const { id } = req.params; // Changed from connectionId to id

    try {
        // Verify connection exists
        const connection = await prisma.connection.findUnique({
            where: { id }, // Simplified this
            include: { customer: true }
        });

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        if (!connection.isActive) {
            return res.status(400).json({ message: "Connection is already inactive" });
        }

        // Check for pending bills
        const pendingBills = await prisma.bill.count({
            where: {
                customerId: connection.customerId,
                isPaid: false
            }
        });

        if (pendingBills > 0) {
            return res.status(400).json({
                message: "Cannot deactivate connection with pending bills",
                pendingBillsCount: pendingBills
            });
        }

        // Deactivate connection
        const deactivatedConnection = await prisma.connection.update({
            where: { id },
            data: { isActive: false },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Send notification
        await prisma.notification.create({
            data: {
                customerId: connection.customerId,
                title: "Connection Deactivated",
                message: `Your meter ${connection.meterNumber} has been deactivated`
            }
        });

        res.json({
            message: "Connection deactivated successfully",
            connection: {
                id: deactivatedConnection.id,
                meterNumber: deactivatedConnection.meterNumber,
                status: "inactive",
                customer: deactivatedConnection.customer,
                deactivatedAt: deactivatedConnection.updatedAt
            }
        });

    } catch (error) {
        console.error("Connection deactivation error:", error);
        res.status(500).json({
            message: "Failed to deactivate connection",
            error: error.message
        });
    }
};