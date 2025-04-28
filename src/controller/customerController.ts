import { Request, Response } from 'express';
import prisma from '../config/db.config.js';
import { Prisma } from '@prisma/client';
import { sendNotification } from '../utils/sendNotification.js';
// Get all customers (paginated)
export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        // Pagination parameters
        const { search = '' } = req.query;
        // const pageNumber = Number(page);
        // const limitNumber = Number(limit);
        // const skip = (pageNumber - 1) * limitNumber;

        // Build search filter
        const where: Prisma.CustomerWhereInput = search
            ? {
                OR: [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { email: { contains: String(search), mode: 'insensitive' } },
                    { phone: { contains: String(search), mode: 'insensitive' } },
                ],
            }
            : {};


        // Get total count for pagination metadata
        const totalCount = await prisma.customer.count({ where });

        // Get paginated customers
        const customers = await prisma.customer.findMany({
            // skip,
            // take: limitNumber,
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                createdAt: true,
                _count: {
                    select: {
                        connections: true,
                        bills: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate pagination metadata
        // const totalPages = Math.ceil(totalCount / limitNumber);
        // const hasNext = pageNumber < totalPages;
        // const hasPrevious = pageNumber > 1;

        res.json({
            success: true,
            data: customers,
            // pagination: {
            totalItems: totalCount,
            // totalPages,
            // currentPage: pageNumber,
            // itemsPerPage: limitNumber,
            // hasNext,
            // hasPrevious,
            // },
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
        });
    }
};


// Get single customer details
export const getCustomerDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                createdAt: true,
                connections: {
                    select: {
                        id: true,
                        meterNumber: true,
                        type: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
                bills: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    select: {
                        id: true,
                        amount: true,
                        dueDate: true,
                        isPaid: true,
                        createdAt: true,
                    },
                },
                payments: {
                    take: 5,
                    orderBy: {
                        paidAt: 'desc',
                    },
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        paidAt: true,
                    },
                },
            },
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer details',
        });
    }
};

export const sendnotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, message } = req.body;

        // Get customer details
        const customer = await prisma.customer.findUnique({
            where: { id },
            select: { id: true, email: true }
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Send notification
        await sendNotification({
            customerId: customer.id,
            title,
            message,
            email: customer.email
        });

        res.json({
            success: true,
            message: "Notification sent successfully"
        });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send notification"
        });
    }
}